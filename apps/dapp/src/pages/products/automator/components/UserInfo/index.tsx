import { useEffect, useMemo } from 'react';
import { Spin } from '@douyinfe/semi-ui';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { useTranslation } from '@sofa/services/i18n';
import { cvtAmountsInCcy } from '@sofa/utils/amount';
import { ellipsis } from '@sofa/utils/fns';
import { useTime } from '@sofa/utils/hooks';
import classNames from 'classnames';

import Address from '@/components/Address';
import AmountDisplay from '@/components/AmountDisplay';
import { useIndexPrices } from '@/components/IndexPrices/store';
import { useWalletStore } from '@/components/WalletConnector/store';

import { useAutomatorStore } from '../../store';

import styles from './index.module.scss';

export interface AutomatorUserInfoProps {
  vault?: AutomatorVaultInfo;
}

export const AutomatorUserInfo = (props: AutomatorUserInfoProps) => {
  const [t, i18n] = useTranslation('AutomatorUserInfo');
  const prices = useIndexPrices((s) => s.prices);
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

        <div
          className={styles['desc']}
          dangerouslySetInnerHTML={{
            __html: ellipsis(
              props.vault?.desc ||
                t({
                  enUS: 'Our Automator strategies will perform automated execution of our SOFA platform products (eg. Bull Trend & Bear Trend) at model expiration dates and strikes to target an optimized risk-adjusted yield. The strategies are designed to operate systematically via data-driven algorithms, with our data learning models continuously being refined to enhance long term performance. Capital will be continuously deployed to maximize yield compounding benefits, allowing users to deploy volatility monetization strategies with zero hassle. Strategies could include both controlled buying or selling of option exposure to generate returns.',
                  zhCN: '我们的 Automator 策略将自动执行 SOFA 平台产品（如牛市趋势和熊市趋势），在模型指定的到期日和行权价下，旨在实现优化的风险调整收益。这些策略通过数据驱动的算法系统化运行，并通过数据学习模型的持续优化提升长期表现。资金将持续部署以最大化收益复利效应，让用户轻松实现波动率套利策略。策略可能包括受控买入或卖出期权敞口，以生成收益。',
                }),
              !i18n.language || i18n.language === 'en-US' ? 200 : 100,
            )!,
          }}
        />
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
                            data?.server?.depositTotalPnl,
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
