import { RefObject, useMemo } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import { AutomatorUserService } from '@sofa/services/automator-user';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { amountFormatter, cvtAmountsInCcy } from '@sofa/utils/amount';
import { formatDurationToDay } from '@sofa/utils/time';
import { useCountDown } from 'ahooks';
import classNames from 'classnames';
import dayjs from 'dayjs';

import AsyncButton from '@/components/AsyncButton';
import { useIndexPrices } from '@/components/IndexPrices/store';
import { useWalletStore } from '@/components/WalletConnector/store';
import { ProgressRef } from '@/pages/products/components/InvestProgress';

import { useAutomatorStore } from '../../store';

import styles from './index.module.scss';

export const AutomatorClaim = (props: {
  vault?: AutomatorVaultInfo;
  progressRef: RefObject<ProgressRef>;
  claimableStartAt?: number;
  claimableEndAt?: number;
  onSuccess?: () => void;
}) => {
  const [t] = useTranslation('Automator');
  const vault = props.vault;

  const prices = useIndexPrices((s) => s.prices);

  const wallet = useWalletStore();

  const userInfo = useAutomatorStore(
    (state) =>
      vault &&
      state.userInfos[
        `${vault.chainId}-${vault.vault.toLowerCase()}-${wallet.address}`
      ],
  );
  const redemptionInfo = userInfo?.redemptionInfo;
  const decimals = userInfo?.shareInfo?.shareDecimals ?? 6;
  const pricePerShare = userInfo?.shareInfo?.pricePerShare || 1;
  const pendingShares =
    Number(redemptionInfo?.pendingSharesWithDecimals) / 10 ** decimals;

  const leftTime = useMemo(
    () => (!props.claimableEndAt ? 0 : props.claimableEndAt - Date.now()),
    [props.claimableEndAt],
  );
  const [time] = useCountDown({ leftTime });

  return (
    <>
      <div className={styles['content']}>
        <h5 className={styles['title']}>
          {t({ enUS: 'Claimable', zhCN: '可赎回' })}
        </h5>
        <div className={styles['shares']}>
          <span className={styles['value']}>
            {amountFormatter(pendingShares, 0)}
          </span>{' '}
          {vault?.positionCcy}
          <span className={styles['decorative']}>
            ≈
            {!vault
              ? '-'
              : amountFormatter(
                  cvtAmountsInCcy(
                    [[vault.vaultDepositCcy, pendingShares * pricePerShare]],
                    prices,
                    vault.depositCcy,
                  ),
                  2,
                )}{' '}
            {vault?.depositCcy}
          </span>
        </div>
      </div>
      <AsyncButton
        className={classNames(styles['button'], styles['btn-claim'])}
        onClick={async () => {
          if (!vault) return;
          return AutomatorUserService.claim(
            (it) => {
              props.progressRef.current?.update(it);
              if (it.status === 'Success') {
                props.onSuccess?.();
              }
            },
            vault,
            Toast,
          );
        }}
      >
        {t({ enUS: 'Claim', zhCN: '赎回' })}
        <span className={classNames('txt-gradient', styles['duration'])}>
          {t({ enUS: 'Remaining', zhCN: '剩余' })}: {formatDurationToDay(time)}
        </span>
      </AsyncButton>
      <div className={styles['tips']}>
        <p
          className={styles['tip']}
          dangerouslySetInnerHTML={{
            __html: t(
              {
                enUS: 'Please claim your redemption by <span class="highlight">{{endTime}}</span>. Otherwise, you will need to re-initiate the redemption request afterwards.',
                zhCN: '请在 <span class="highlight">{{endTime}}</span> 前完成赎回。否则，您之后需要重新发起赎回请求。',
              },
              {
                endTime: dayjs(props.claimableEndAt).format(
                  'MMM DD, YYYY HH:mm',
                ),
              },
            ),
          }}
        />
      </div>
    </>
  );
};
