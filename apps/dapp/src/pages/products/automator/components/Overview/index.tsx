import { useEffect } from 'react';
import { Spin, Tooltip } from '@douyinfe/semi-ui';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { amountFormatter, displayPercentage } from '@sofa/utils/amount';

import AmountDisplay from '@/components/AmountDisplay';
import { Time } from '@/components/TimezoneSelector';

import { useAutomatorStore } from '../../store';

import styles from './index.module.scss';

export interface AutomatorOverviewProps {
  vault?: AutomatorVaultInfo;
}

export const AutomatorOverview = (props: AutomatorOverviewProps) => {
  const [t] = useTranslation('AutomatorOverview');
  const data = useAutomatorStore(
    (state) =>
      props.vault &&
      state.vaultOverviews[`${props.vault.chainId}-${props.vault.vault}-`],
  );
  useEffect(() => {
    if (props.vault) return useAutomatorStore.subscribeOverview(props.vault);
  }, [props.vault]);
  return (
    <Spin wrapperClassName={styles['overview']} spinning={!data}>
      <div className={styles['yield']}>
        <div className={styles['title']}>
          {t({ enUS: '7D Yield', zhCN: '7日年化收益率' })}
        </div>
        <div className={styles['value']}>
          {displayPercentage(Number(data?.yieldPercentage) / 100)}
          <span className={styles['footnote']}>
            {t({ enUS: 'Est.', zhCN: '估算' })}
          </span>
        </div>
        <div className={styles['desc']}>
          {t({
            enUS: 'USDT Return + RCH Reward',
            zhCN: 'USDT 收益 + RCH 奖励',
          })}
        </div>
      </div>
      <div className={styles['aum']}>
        <div className={styles['title']}>
          <Tooltip
            content={t({
              enUS: 'Assets Under Management',
              zhCN: '资产管理规模',
            })}
          >
            {t({ enUS: 'AUM', zhCN: '总资产' })}
          </Tooltip>
        </div>
        <div className={styles['value']}>
          <AmountDisplay amount={data?.amount} />
          <span className={styles['unit']}>{props.vault?.depositCcy}</span>
        </div>
      </div>
      <div className={styles['nav']}>
        <div className={styles['title']}>
          <Tooltip
            content={t({
              enUS: 'Multiple on Invested Capital',
              zhCN: '投资资本倍数',
            })}
          >
            {t({ enUS: 'MOIC', zhCN: '净值' })}
          </Tooltip>
          (<Time time={Number(data?.dateTime) * 1000} format="MMM. DD" />)
        </div>
        <div className={styles['value']}>{amountFormatter(data?.nav, 4)}x</div>
      </div>
    </Spin>
  );
};
