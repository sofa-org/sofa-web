import { ReactNode, useMemo } from 'react';
import { CCYService } from '@sofa/services/ccy';
import { TFunction, useTranslation } from '@sofa/services/i18n';
import { updateQuery } from '@sofa/utils/history';
import { useQuery } from '@sofa/utils/hooks';
import { formatDuration } from '@sofa/utils/time';

import Address from '@/components/Address';
import { MsgDisplay } from '@/components/MsgDisplay';
import TopTabs from '@/components/TopTabs';

import { Comp as IconCalendar } from '../automator-mine/assets/icon-calendar.svg';
import { Comp as IconPeople } from '../automator-mine/assets/icon-people.svg';

import {
  CreatorAutomatorSelector,
  useCreatorAutomatorSelector,
} from './components/AutomatorSelector';
import AutomatorTrade from './components/Trade';

import styles from './index.module.scss';

const $options: {
  label(t: TFunction): ReactNode;
  value: string;
  content(): ReactNode;
}[] = [
  {
    label: (t) => t({ enUS: 'Performance', zhCN: '历史表现' }),
    value: 'performance',
    content: () => <></>,
  },
  {
    label: (t) => t({ enUS: 'Trade', zhCN: '交易' }),
    value: 'trade',
    content: () => (
      <>
        <AutomatorTrade />
      </>
    ),
  },
  {
    label: (t) => t({ enUS: 'Positions', zhCN: '头寸' }),
    value: 'positions',
    content: () => <></>,
  },
  {
    label: (t) => t({ enUS: 'Followers', zhCN: '参与钱包' }),
    value: 'followers',
    content: () => <></>,
  },
  {
    label: (t) => t({ enUS: 'Subscription History', zhCN: '交易记录' }),
    value: 'transactions',
    content: () => <></>,
  },
];

const Index = () => {
  const [t] = useTranslation('AutomatorOperate');
  const tab = useQuery(
    (q) => (q['automator-operate-tab'] || 'performance') as string,
  );
  const options = useMemo(
    () => $options.map((it) => ({ ...it, label: it.label(t) })),
    [t],
  );
  const item = useMemo(
    () => options.find((it) => it.value === tab) || options[0],
    [options, tab],
  );

  const { automator } = useCreatorAutomatorSelector();

  return (
    <TopTabs
      type="banner-expandable-tab"
      className={styles['container']}
      banner={
        <>
          <h1 className={styles['head-title']}>
            <CreatorAutomatorSelector className={styles['selector']} />
            <div className={styles['infos']}>
              <Address
                address={automator?.vaultInfo.vault.toLowerCase() || ''}
                simple
                linkBtn
              />
              <div className={styles['item']}>
                <span className={styles['label']}>
                  {t({ enUS: 'Deposit', zhCN: '投资币种' })}
                </span>
                {automator?.vaultInfo.depositCcy}
                {automator?.vaultInfo.depositCcy && (
                  <img
                    src={
                      CCYService.ccyConfigs[automator?.vaultInfo.depositCcy]
                        ?.icon
                    }
                    alt=""
                  />
                )}
              </div>
              <div className={styles['item']}>
                <span className={styles['label']}>
                  {t({ enUS: 'Fee', zhCN: '手续费' })}
                </span>
                {automator?.vaultInfo.createTime
                  ? formatDuration(
                      Date.now() - +automator?.vaultInfo.createTime,
                      1,
                      true,
                    )
                  : '-'}
              </div>
              <div className={styles['item']}>
                <IconCalendar className={styles['label']} />
                {automator?.vaultInfo.createTime
                  ? formatDuration(
                      Date.now() - +automator?.vaultInfo.createTime,
                      1,
                      true,
                    )
                  : '-'}
              </div>
              <div className={styles['item']}>
                <IconPeople className={styles['label']} />
                {automator?.participantNum || '-'}
              </div>
              <div className={styles['desc']}>
                <MsgDisplay>
                  <span
                    dangerouslySetInnerHTML={{
                      __html:
                        automator?.vaultInfo.desc ||
                        (!automator
                          ? ''
                          : t({
                              enUS: 'Our Automator strategies will perform automated execution of our SOFA platform products (eg. Bull Trend & Bear Trend) at model expiration dates and strikes to target an optimized risk-adjusted yield. The strategies are designed to operate systematically via data-driven algorithms, with our data learning models continuously being refined to enhance long term performance. Capital will be continuously deployed to maximize yield compounding benefits, allowing users to deploy volatility monetization strategies with zero hassle. Strategies could include both controlled buying or selling of option exposure to generate returns.',
                              zhCN: '我们的 Automator 策略将自动执行 SOFA 平台产品（如牛市趋势和熊市趋势），在模型指定的到期日和行权价下，旨在实现优化的风险调整收益。这些策略通过数据驱动的算法系统化运行，并通过数据学习模型的持续优化提升长期表现。资金将持续部署以最大化收益复利效应，让用户轻松实现波动率套利策略。策略可能包括受控买入或卖出期权敞口，以生成收益。',
                            })),
                    }}
                  />
                </MsgDisplay>
              </div>
            </div>
          </h1>
        </>
      }
      options={options}
      value={tab}
      onChange={(v) => updateQuery({ 'automator-operate-tab': v })}
    >
      <div className={styles['container']}>{item.content()}</div>
    </TopTabs>
  );
};

export default Index;
