import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Spin } from '@douyinfe/semi-ui';
import { AutomatorVaultInfo, ProjectType } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { useTime } from '@sofa/utils/hooks';
import classNames from 'classnames';

import AmountDisplay from '@/components/AmountDisplay';
import { useWalletStore } from '@/components/WalletConnector/store';

import { useAutomatorStore } from '../../store';

import styles from './index.module.scss';

export interface AutomatorUserInfoProps {
  vault?: AutomatorVaultInfo;
}

export const AutomatorUserInfo = (props: AutomatorUserInfoProps) => {
  const [t] = useTranslation('AutomatorUserInfo');
  const address = useWalletStore((state) => state.address);
  const data = useAutomatorStore((state) =>
    props.vault && address
      ? state.userInfos[
          `${props.vault.chainId}-${props.vault.vault}-${address}`
        ]
      : undefined,
  );
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

  const [expand, setExpand] = useState(false);

  return (
    <Spin spinning={!data && !!address}>
      <div
        className={classNames(styles['user-info'], {
          [styles['expand']]: expand,
        })}
        onClick={() => setExpand((pre) => !pre)}
      >
        <div className={classNames(styles['item'], styles['position'])}>
          <div className={styles['title']}>
            {t({ enUS: 'My Position', zhCN: '我的持仓' })}
            <Link
              className={styles['transaction-history-link']}
              to={`/positions?project=${ProjectType.Automator}&vault=${
                props.vault?.vault || ''
              }`}
            >
              {t({ enUS: 'Transaction History', zhCN: '交易记录' })} &gt;
            </Link>
          </div>
          <div className={styles['value']}>
            <AmountDisplay amount={data?.shareInfo?.shares} />{' '}
            <span className={styles['unit']}>{props.vault?.balanceCcy}</span>
            <span className={styles['decorative']}>
              {' '}
              ≈ <AmountDisplay amount={data?.shareInfo?.amount} />{' '}
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
            {t({ enUS: 'Total PnL', zhCN: '总盈亏' })}
          </div>
          <div className={styles['value']}>
            <span className={styles['amount']}>
              <AmountDisplay amount={data?.server?.depositTotalPnl} />{' '}
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
