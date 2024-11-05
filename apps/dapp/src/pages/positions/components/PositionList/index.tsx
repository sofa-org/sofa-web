import { Fragment, useMemo, useRef, useState } from 'react';
import { Button, Modal, Spin, Toast } from '@douyinfe/semi-ui';
import { useTranslation } from '@sofa/services/i18n';
import { PositionInfo, PositionsService } from '@sofa/services/positions';
import {
  ProductsService,
  ProductType,
  RiskType,
} from '@sofa/services/products';
import { PositionStatus } from '@sofa/services/the-graph';
import { getErrorMsg } from '@sofa/utils/fns';
import { useLazyCallback } from '@sofa/utils/hooks';
import { useInfiniteScroll } from 'ahooks';
import { uniqBy } from 'lodash-es';

import AsyncButton from '@/components/AsyncButton';
import CEmpty from '@/components/Empty';
import { useProjectChange } from '@/components/ProductSelector';
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

const List = (props: { riskType?: RiskType; productType?: ProductType }) => {
  const [t] = useTranslation('PositionList');
  const wallet = useWalletStore();

  const {
    data: $data,
    loading,
    mutate,
    reload: refresh,
  } = useInfiniteScroll(
    async (d) => {
      if (!wallet.address) return { list: [], hasMore: false, limit: 300 };
      return PositionsService.history(
        {
          chainId: wallet.chainId,
          owner: wallet.address,
          claimed: false,
          concealed: false,
          riskType: props.riskType,
          productType: props.productType,
        },
        { limit: 300, cursor: d?.cursor },
      ).then((res) => ({
        ...res,
        chainId: wallet.chainId,
        owner: wallet.address,
      }));
    },
    {
      target: () => document.querySelector('#root'),
      isNoMore: (d) => !d?.hasMore,
      onError: (err) => Toast.error(getErrorMsg(err)),
      reloadDeps: [
        wallet.chainId,
        wallet.address,
        props.riskType,
        props.productType,
      ],
    },
  );

  const data = useMemo(() => {
    if (!$data) return undefined;
    if ($data?.chainId !== wallet.chainId) return undefined;
    if ($data?.owner !== wallet.address) return undefined;
    const list = uniqBy(
      $data?.list,
      (it: PositionInfo) =>
        `${it.id}-${it.product.vault.vault}-${it.createdAt}`,
    );
    console.info('Positions', list);
    return list as PositionInfo[];
  }, [$data, wallet.chainId, wallet.address]);

  const claimProgressRef = useRef<PositionClaimProgressRef>(null);

  const unClaimedList = useMemo(
    () =>
      data?.filter((it) => {
        if (!Number(it.amounts.redeemable) || it.claimed) return false;
        if (judgeSettled(it.product.expiry)) return true;
        if (it.claimParams.maker && it.triggerPrice) return true;
        return false;
      }) || [],
    [data],
  );

  const loseList = useMemo(
    () =>
      data?.filter(
        (it) =>
          judgeSettled(it.product.expiry) && !Number(it.amounts.redeemable),
      ) || [],
    [data],
  );

  const [claimAllList, setClaimAllList] = useState(unClaimedList);
  const claimAll = useLazyCallback(() => {
    if (!wallet.address) return;
    setClaimAllList(unClaimedList);
    return PositionsService.claimBatch(
      (it) => {
        claimProgressRef.current?.update(it);
        if (['Success', 'Partial Failed'].includes(it.status)) {
          const successIds = it.details?.flatMap((d) => {
            if (d[1].status === PositionStatus.CLAIMED) return d[1].positionIds;
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
      },
      unClaimedList.map((it) => ({
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
      })),
    );
  });

  const [selectedPosition, setSelectedPosition] = useState<PositionInfo>();

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

  return (
    <>
      <Spin wrapperClassName={styles['list']} spinning={loading || !data}>
        {data?.map((it) =>
          it.claimed ? (
            <Fragment key={it.id} />
          ) : (
            <PositionCard
              position={it}
              onStatusChange={(status) => handleStatusChange(status, it)}
              onClick={() => setSelectedPosition(it)}
              key={`${it.id}-${ProductsService.productKey(it.product)}`}
            />
          ),
        )}
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
        {!!unClaimedList.length && (
          <Button
            size="large"
            theme="solid"
            type="primary"
            className={styles['btn-bottom']}
            onClick={claimAll}
          >
            {t('CLAIM ALL')} ({unClaimedList.length})
          </Button>
        )}
        {!!loseList.length && (
          <AsyncButton
            size="large"
            theme="solid"
            type="primary"
            className={styles['btn-bottom']}
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
          className={styles['btn-bottom']}
          onClick={() => {
            const link = `/positions/orders${window.location.search}`;
            window.location.href = link;
          }}
        >
          {t({ enUS: 'ALL HISTORY', zhCN: '全部历史' })}
        </Button>
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

const PositionList = () => {
  const [riskType] = useProjectChange();
  return (
    <div className={styles['position-list']}>
      <List riskType={riskType} />
    </div>
  );
};

export default PositionList;
