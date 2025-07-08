import { useEffect, useMemo, useRef } from 'react';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { useQuery } from '@sofa/utils/hooks';
import dayjs from 'dayjs';

import { useWalletStore } from '@/components/WalletConnector/store';
import { AutomatorProgress } from '@/pages/products/components/AutomatorProgress';
import { ProgressRef } from '@/pages/products/components/InvestProgress';

import { useAutomatorStore } from '../../store';
import { AutomatorClaim } from '../Claim';
import { AutomatorRedeemApply } from '../RedeemApply';
import { AutomatorRedeemAwait } from '../RedeemAwait';

import styles from './index.module.scss';

export interface AutomatorWithdrawProps {
  vault?: AutomatorVaultInfo;
  onSuccess?: () => void;
}

export const AutomatorWithdraw = (props: AutomatorWithdrawProps) => {
  const vault = props.vault;

  const { step } = useQuery();

  const wallet = useWalletStore();
  useEffect(() => {
    if (vault && wallet.address) {
      return useAutomatorStore.subscribeUserInfo(vault, wallet.address);
    }
  }, [vault, wallet.address]);

  const redemptionInfo = useAutomatorStore((state) =>
    vault && wallet.address
      ? state.userInfos[
          `${vault.chainId}-${vault.vault.toLowerCase()}-${wallet.address}`
        ]?.redemptionInfo
      : undefined,
  );
  const redeemInfo = useMemo(() => {
    const pendingShares = Number(redemptionInfo?.pendingSharesWithDecimals);
    if (!pendingShares || !vault)
      return {
        cancelable: false,
        claimable: false,
        claimableStartAt: undefined,
        claimableEndAt: undefined,
      };
    const claimableStartAt = dayjs(
      redemptionInfo!.createTime * 1000 + Number(vault.redeemWaitPeriod),
    ).valueOf();
    const claimableEndAt = dayjs(claimableStartAt)
      .add(Number(vault.claimPeriod))
      .valueOf();
    return {
      cancelable: Date.now() < claimableStartAt,
      claimable: Date.now() >= claimableStartAt && Date.now() < claimableEndAt,
      claimableStartAt,
      claimableEndAt,
    };
  }, [redemptionInfo, vault]);

  const progressRef = useRef<ProgressRef>(null);

  return (
    <div className={styles['withdraw']}>
      {redeemInfo.claimable ? (
        <AutomatorClaim
          vault={vault}
          progressRef={progressRef}
          claimableStartAt={redeemInfo.claimableStartAt}
          claimableEndAt={redeemInfo.claimableEndAt}
          onSuccess={props.onSuccess}
        />
      ) : redeemInfo.cancelable && step !== 'redeem-apply' ? (
        <AutomatorRedeemAwait
          vault={vault}
          progressRef={progressRef}
          claimableStartAt={redeemInfo.claimableStartAt}
          claimableEndAt={redeemInfo.claimableEndAt}
          onSuccess={props.onSuccess}
        />
      ) : (
        <AutomatorRedeemApply
          vault={vault}
          progressRef={progressRef}
          claimableStartAt={redeemInfo.claimableStartAt}
          pendingSharesWithDecimals={redemptionInfo?.pendingSharesWithDecimals}
          onSuccess={props.onSuccess}
        />
      )}
      <AutomatorProgress
        chainId={wallet.chainId}
        vault={vault?.vault || ''}
        ref={progressRef}
      />
    </div>
  );
};
