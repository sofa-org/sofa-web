import { Fragment, useMemo, useRef, useState } from 'react';
import { Button, Spin, Toast } from '@douyinfe/semi-ui';
import { useTranslation } from '@sofa/services/i18n';
import { PositionInfo, PositionsService } from '@sofa/services/positions';
import {
  ProductsService,
  ProductType,
  RiskType,
} from '@sofa/services/products';
import { PositionStatus } from '@sofa/services/the-graph';
import { Env } from '@sofa/utils/env';
import { getErrorMsg } from '@sofa/utils/fns';
import { useLazyCallback } from '@sofa/utils/hooks';
import { useInfiniteScroll } from 'ahooks';
import { uniqBy } from 'lodash-es';

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
  } = useInfiniteScroll(
    async (d) => {
      if (!wallet.address) return { list: [], hasMore: false, limit: 300 };
      return PositionsService.history(
        {
          chainId: wallet.chainId,
          owner: wallet.address,
          claimed: false,
          riskType: props.riskType,
          productType: props.productType,
        },
        { limit: 300, cursor: d?.cursor },
      );
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
    const list = uniqBy($data?.list, (it) => it.id);
    console.info('Positions', list);
    return list as PositionInfo[];
  }, [$data]);

  const claimProgressRef = useRef<PositionClaimProgressRef>(null);

  const unClaimedList = useMemo(
    () =>
      data?.filter((it) => {
        if (
          judgeSettled(it.product.expiry) &&
          (it.claimParams.maker || it.amounts.redeemable)
        ) {
          return true;
        }
        if (
          Env.isPre &&
          it.product.vault.productType === ProductType.DNT &&
          it.triggerPrice
        ) {
          return true;
        }
        return false;
      }) || [],
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
        owner: it.owner,
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
      <Spin wrapperClassName={styles['list']} spinning={loading}>
        {data.map((it) =>
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
      {!!unClaimedList.length && (
        <div className={styles['btn-bottom-wrapper']}>
          <Button
            size="large"
            theme="solid"
            type="primary"
            className={styles['btn-bottom']}
            onClick={claimAll}
          >
            {t('CLAIM ALL')} ({unClaimedList.length})
          </Button>
        </div>
      )}
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
