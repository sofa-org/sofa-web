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
import { getErrorMsg, isNullLike } from '@sofa/utils/fns';
import { useLazyCallback } from '@sofa/utils/hooks';
import { useInfiniteScroll, useRequest } from 'ahooks';

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
    data: positions,
    loading,
    mutate,
  } = useRequest(
    async () =>
      !wallet.address
        ? undefined
        : PositionsService.query({
            chainId: wallet.chainId,
            owner: wallet.address,
            riskType: props.riskType,
            productType: props.productType,
          }),
    {
      refreshDeps: [
        wallet.chainId,
        wallet.address,
        props.riskType,
        props.productType,
      ],
      onSuccess: (list) => console.info('Positions', list),
    },
  );

  const claimProgressRef = useRef<PositionClaimProgressRef>(null);

  const unClaimedList = useMemo(
    () =>
      positions?.filter((it) => {
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
    [positions],
  );

  const [claimAllList, setClaimAllList] = useState(unClaimedList);
  const claimAll = useLazyCallback(() => {
    if (!wallet.address) return;
    setClaimAllList(unClaimedList);
    return PositionsService.claimBatch(
      (it) => claimProgressRef.current?.update(it),
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
          pre?.map((it) => (position.id === it.id ? { ...it, status } : it)),
      );
    },
  );

  const { data } = useInfiniteScroll(
    async (d) => {
      const limit = 20;
      const offset = isNullLike(d?.offset) ? 0 : d.offset + limit;
      const list = positions?.slice(offset, offset + limit) || [];
      return { list, offset, limit, isNoMore: list.length < limit };
    },
    {
      target: () => document.querySelector('#root'),
      isNoMore: (d) => d?.isNoMore,
      onError: (err) => Toast.error(getErrorMsg(err)),
      reloadDeps: [positions?.length],
    },
  );

  return (
    <>
      <Spin wrapperClassName={styles['list']} spinning={loading}>
        {data?.list.map((it) =>
          it.status === PositionStatus.CLAIMED ? (
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
        {!positions?.length && !loading && (
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
