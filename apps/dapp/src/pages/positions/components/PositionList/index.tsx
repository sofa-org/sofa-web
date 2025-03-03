import { Fragment, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Spin, Toast } from '@douyinfe/semi-ui';
import { AutomatorCreatorService } from '@sofa/services/automator-creator';
import { AutomatorVaultInfo, VaultInfo } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { useTranslation } from '@sofa/services/i18n';
import {
  PositionInfo,
  PositionsService,
  TransactionProgress,
} from '@sofa/services/positions';
import {
  ProductsService,
  ProductType,
  RiskType,
} from '@sofa/services/products';
import { PositionStatus } from '@sofa/services/the-graph';
import { getErrorMsg } from '@sofa/utils/fns';
import { useLazyCallback } from '@sofa/utils/hooks';
import { joinUrl } from '@sofa/utils/url';
import { useInfiniteScroll } from 'ahooks';
import classNames from 'classnames';
import { uniqBy } from 'lodash-es';

import AsyncButton from '@/components/AsyncButton';
import CEmpty from '@/components/Empty';
import { useProjectChange, useRiskSelect } from '@/components/ProductSelector';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';

import {
  PositionClaimProgress,
  PositionClaimProgressRef,
} from '../ClaimProgress';
import PositionCard, { judgeSettled } from '../PositionCard';
import PositionDetailsModal from '../PositionDetails';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'PositionList');

const List = (props: {
  riskType?: RiskType;
  productType?: ProductType;
  automator?: AutomatorVaultInfo;
}) => {
  const [t] = useTranslation('PositionList');
  const navigate = useNavigate();
  const wallet = useWalletStore();
  const address = props.automator?.vault || wallet.address;

  const {
    data: $data,
    loading,
    mutate,
    reload: refresh,
  } = useInfiniteScroll(
    async (d) => {
      if (!address) return { list: [], hasMore: false, limit: 300 };
      return PositionsService.history(
        {
          chainId: wallet.chainId,
          owner: address,
          claimed: false,
          concealed: props.automator ? undefined : false,
          riskType: props.automator ? undefined : props.riskType,
          productType: props.automator ? undefined : props.productType,
        },
        { limit: 300, cursor: d?.cursor },
      ).then((res) => ({
        ...res,
        chainId: wallet.chainId,
        owner: address,
      }));
    },
    {
      target: () => document.querySelector('#root'),
      isNoMore: (d) => !d?.hasMore,
      onError: (err) => Toast.error(getErrorMsg(err)),
      reloadDeps: [wallet.chainId, address, props.riskType, props.productType],
    },
  );

  const data = useMemo(() => {
    if (!$data) return undefined;
    if ($data?.chainId !== wallet.chainId) return undefined;
    if ($data?.owner !== address) return undefined;
    const list = uniqBy(
      $data?.list,
      (it: PositionInfo) =>
        `${it.id}-${it.product.vault.vault.toLowerCase()}-${it.createdAt}`,
    );
    console.info('Positions', list);
    return list as (PositionInfo & { vault: VaultInfo })[];
  }, [$data, wallet.chainId, address]);

  const claimProgressRef = useRef<PositionClaimProgressRef>(null);

  const unClaimedList = useMemo(
    () =>
      data?.filter((it) => {
        if ((!props.automator && !Number(it.amounts.redeemable)) || it.claimed)
          return false;
        if (judgeSettled(it)) return true;
        if (it.claimParams.maker && it.triggerPrice) return true;
        return false;
      }) || [],
    [data, props.automator],
  );

  const loseList = useMemo(
    () =>
      data?.filter(
        (it) => judgeSettled(it) && !Number(it.amounts.redeemable),
      ) || [],
    [data],
  );

  const [claimAllList, setClaimAllList] = useState(unClaimedList);
  const claimAll = useLazyCallback(() => {
    if (!address) return;
    setClaimAllList(unClaimedList);
    const data = unClaimedList.map((it) => ({
      positionId: it.id,
      vault: it.product.vault.vault,
      productType: it.product.vault.productType,
      chainId: it.product.vault.chainId,
      owner: it.wallet,
      term: it.claimParams.term,
      expiry: it.product.expiry,
      anchorPrices: it.claimParams.anchorPrices,
      collateralAtRiskPercentage: it.claimParams.collateralAtRiskPercentage,
      isMaker: it.claimParams.maker,
      redeemableAmount: it.amounts.redeemable || 0,
    }));
    const cb = (it: TransactionProgress) => {
      claimProgressRef.current?.update(it);
      if (['Success', 'Partial Failed'].includes(it.status)) {
        const successIds = it.details?.flatMap((d) => {
          if (d[1].status === PositionStatus.CLAIMED) return d[1].ids;
          return [];
        });
        if (successIds) {
          mutate(
            (pre) =>
              pre && {
                ...pre,
                list: pre?.list.map((it) =>
                  successIds.includes(it.id) ? { ...it, claimed: true } : it,
                ),
              },
          );
        }
      }
    };
    if (props.automator)
      return AutomatorCreatorService.claimPositions(cb, props.automator, data);
    return PositionsService.claimBatch(cb, data);
  });

  const [selectedPosition, setSelectedPosition] = useState<
    PositionInfo & { vault: VaultInfo }
  >();

  const handleStatusChange = useLazyCallback(
    (status: PositionStatus, $position?: PositionInfo) => {
      const position = $position || selectedPosition;
      if (!position) return;
      setSelectedPosition((pre) => pre && { ...pre, status });
      mutate(
        (pre) =>
          pre && {
            ...pre,
            list: pre?.list.map((it) =>
              position.id === it.id
                ? { ...it, claimed: status === PositionStatus.CLAIMED }
                : it,
            ),
          },
      );
    },
  );
  const dataGroupByDepositCcy = useMemo(
    () =>
      data?.reduce(
        (prev, it) => {
          if (!prev[it.product.vault.depositCcy]) {
            prev[it.product.vault.depositCcy] = [];
          }
          prev[it.product.vault.depositCcy].push(it);
          return prev;
        },
        {} as Record<
          VaultInfo['depositCcy'],
          (PositionInfo & { vault: VaultInfo })[]
        >,
      ) || {},
    [data],
  );
  return (
    <>
      <Spin
        wrapperClassName={styles['list']}
        spinning={loading || (!data && !!address)}
      >
        {Object.entries(dataGroupByDepositCcy).map((e) => (
          <>
            <div
              key={`${e[0]}-title`}
              className={classNames(
                styles['deposit-ccy-section'],
                e[0].toLowerCase(),
              )}
            >
              <img
                className={styles['logo']}
                src={CCYService.ccyConfigs[e[0]]?.icon}
                alt=""
              />
              <span>{CCYService.ccyConfigs[e[0]]?.name || e[0]}</span>
            </div>
            <div
              key={`${e[0]}-container`}
              className={styles['deposit-ccy-group']}
            >
              {e[1]?.map((it) =>
                it.claimed ? (
                  <Fragment key={it.id} />
                ) : (
                  <PositionCard
                    position={it}
                    onStatusChange={(status) => handleStatusChange(status, it)}
                    onClick={() => setSelectedPosition(it)}
                    isAutomator={!!props.automator}
                    key={`${it.id}-${ProductsService.productKey(it.product)}`}
                  />
                ),
              )}
            </div>
          </>
        ))}

        {!data?.length && !loading && (
          <CEmpty
            className={styles['empty']}
            style={{ margin: '100px auto 0' }}
          />
        )}
        <PositionDetailsModal
          position={selectedPosition}
          visible={!!selectedPosition}
          onHide={() => setSelectedPosition(undefined)}
          onStatusChange={handleStatusChange}
        />
      </Spin>
      <div className={styles['btn-bottom-wrapper']}>
        {!!loseList.length && !props.automator && (
          <AsyncButton
            size="large"
            theme="solid"
            type="primary"
            className={classNames(styles['btn-bottom'], styles['btn-txt'])}
            onClick={() =>
              new Promise((res, rej) =>
                Modal.confirm({
                  icon: null,
                  centered: true,
                  title: t({
                    enUS: 'Hide Lose Positions',
                    zhCN: '隐藏输了的头寸',
                  }),
                  content: t({
                    enUS: 'To hide such positions, please click confirm. You can still view them in the history.',
                    zhCN: '隐藏此类头寸，请点击确定。您仍可以从历史记录查看',
                  }),
                  okText: t({ enUS: 'Confirm', zhCN: '确定' }),
                  cancelText: t({ enUS: 'Cancel', zhCN: '取消' }),
                  onOk: res,
                  onCancel: rej,
                }),
              )
                .then(() =>
                  PositionsService.conceal({
                    chainId: wallet.chainId,
                    positionIds: loseList.map((it) => it.positionId),
                  }),
                )
                .then(() => {
                  refresh();
                  Toast.info(
                    t({ enUS: 'Hidden successfully', zhCN: '隐藏成功' }),
                  );
                })
            }
          >
            {t({ enUS: 'Hide Lose', zhCN: '隐藏输了的头寸' })} (
            {loseList?.length})
          </AsyncButton>
        )}
        <Button
          size="large"
          theme="solid"
          type="primary"
          className={classNames(styles['btn-bottom'], styles['btn-txt'])}
          onClick={() => {
            const link = joinUrl(
              '/positions/orders',
              window.location.search,
              `?automator-vault=${!props.automator?.vault ? '' : address}`,
            );
            navigate(link);
          }}
        >
          {t({ enUS: 'All History', zhCN: '全部历史' })}
        </Button>
        {!!unClaimedList.length && (
          <Button
            size="large"
            theme="solid"
            type="primary"
            className={classNames(styles['btn-bottom'], styles['btn-claim'])}
            onClick={claimAll}
          >
            {t('Claim All')} ({unClaimedList.length})
          </Button>
        )}
      </div>
      <PositionClaimProgress
        ref={claimProgressRef}
        chainId={wallet.chainId}
        riskType={props.riskType || RiskType.PROTECTED}
        positions={claimAllList}
      />
    </>
  );
};

const PositionList = (props: { automator?: AutomatorVaultInfo }) => {
  const [project] = useProjectChange();
  const [riskType] = useRiskSelect(project);
  return (
    <div className={styles['position-list']}>
      <List riskType={riskType} {...props} />
    </div>
  );
};

export default PositionList;
