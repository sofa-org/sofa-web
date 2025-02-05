import { useEffect, useMemo } from 'react';
import { Spin } from '@douyinfe/semi-ui';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { useTranslation } from '@sofa/services/i18n';
import { cvtAmountsInCcy } from '@sofa/utils/amount';
import { useTime } from '@sofa/utils/hooks';
import classNames from 'classnames';

import Address from '@/components/Address';
import AmountDisplay from '@/components/AmountDisplay';
import { useIndexPrices } from '@/components/IndexPrices/store';
import { MsgDisplay } from '@/components/MsgDisplay';
import { useWalletStore } from '@/components/WalletConnector/store';

import { useAutomatorStore } from '../../store';

import styles from './index.module.scss';

export interface AutomatorUserInfoProps {
  vault?: AutomatorVaultInfo;
}

export const AutomatorUserInfo = (props: AutomatorUserInfoProps) => {
  const [t] = useTranslation('AutomatorUserInfo');
  const prices = useIndexPrices((s) => s.prices);
  const address = useWalletStore((state) => state.address);
  const data = useAutomatorStore((state) =>
    props.vault && address
      ? state.userInfos[
          `${props.vault.chainId}-${props.vault.vault.toLowerCase()}-${address}`
        ]
      : undefined,
  );
  const desc = useAutomatorStore((state) => {
    const str =
      (props.vault &&
        address &&
        state.vaultOverviews[
          `${props.vault.chainId}-${props.vault.vault.toLowerCase()}-`
        ]?.vaultInfo.desc) ||
      props.vault?.desc;
    return str?.replace(/\n|\r/g, '<br/>');
  });
  useEffect(() => {
    if (props.vault && address)
      return useAutomatorStore.subscribeUserInfo(props.vault, address);
  }, [props.vault, address]);

  const time = useTime();
  const shareDecimals = data?.shareInfo?.shareDecimals ?? 6;
  const pendingSharesWithDecimals = useMemo(() => {
    const expiry =
      Number(data?.redemptionInfo?.createTime) +
      Number(props.vault?.redeemWaitPeriod);
    const isExpired = time > expiry;
    return isExpired
      ? 0
      : Number(data?.redemptionInfo?.pendingSharesWithDecimals) /
          10 ** shareDecimals;
  }, [data, props.vault, time, shareDecimals]);

  const depositCcyConfig = !props.vault?.depositCcy
    ? undefined
    : CCYService.ccyConfigs[props.vault.depositCcy];

  return (
    <Spin
      wrapperClassName={styles['user-info-wrapper']}
      spinning={!data && !!address}
    >
      <div className={styles['vault-info']}>
        <img src={depositCcyConfig?.icon} alt="" />
        <div className={styles['name']}>
          {props.vault?.name || props.vault?.depositCcy}
        </div>
        <Address address={props.vault?.vault || ''} simple linkBtn />
        <MsgDisplay className={styles['desc']}>
          <span
            dangerouslySetInnerHTML={{
              __html: desc || '...',
            }}
          />
        </MsgDisplay>
      </div>
      <div className={styles['user-info']}>
        <div className={classNames(styles['item'], styles['position'])}>
          <div className={styles['title']}>
            {t({ enUS: 'My Holding', zhCN: '我的持仓' })}
          </div>
          <div className={styles['value']}>
            <AmountDisplay amount={data?.shareInfo?.shares} />{' '}
            <span className={styles['unit']}>{props.vault?.positionCcy}</span>
            <span className={styles['decorative']}>
              {' '}
              ≈{' '}
              <AmountDisplay
                amount={
                  !props.vault
                    ? ''
                    : cvtAmountsInCcy(
                        [
                          [
                            props.vault.vaultDepositCcy,
                            data?.shareInfo?.amount,
                          ],
                        ],
                        prices,
                        props.vault.depositCcy,
                      )
                }
              />{' '}
              <span className={styles['unit']}>{props.vault?.depositCcy}</span>
            </span>
            {!!+pendingSharesWithDecimals && (
              <div
                className={classNames(styles['decorative'], styles['shares'])}
              >
                <span className={styles['amount']}>
                  <AmountDisplay amount={pendingSharesWithDecimals} />{' '}
                  {t({ enUS: 'In Redemption', zhCN: '赎回中' })}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className={classNames(styles['item'], styles['total-pnl'])}>
          <div className={styles['title']}>
            {t({ enUS: 'Cumulative PnL', zhCN: '累计盈亏' })}
          </div>
          <div className={styles['value']}>
            <span className={styles['amount']}>
              <AmountDisplay
                amount={
                  !props.vault
                    ? ''
                    : cvtAmountsInCcy(
                        [
                          [
                            props.vault.vaultDepositCcy,
                            data?.server?.totalPnlByClientDepositCcy,
                          ],
                        ],
                        prices,
                        props.vault.depositCcy,
                      )
                }
              />{' '}
              <span className={styles['unit']}>{props.vault?.depositCcy}</span>
            </span>
            <span className={styles['separator']}>+</span>
            <span className={classNames(styles['amount'], styles['rch'])}>
              <AmountDisplay amount={data?.server?.rchTotalPnl} />{' '}
              <span className={styles['unit']}>RCH</span>
            </span>
          </div>
        </div>
      </div>
    </Spin>
  );
};
