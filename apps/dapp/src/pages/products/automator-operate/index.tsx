import { ReactNode, useMemo } from 'react';
import { ProjectType } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { TFunction, useTranslation } from '@sofa/services/i18n';
import { displayPercentage } from '@sofa/utils/amount';
import { updateQuery } from '@sofa/utils/history';
import { useIsPortrait, useQuery } from '@sofa/utils/hooks';
import { formatDuration } from '@sofa/utils/time';

import Address from '@/components/Address';
import { MsgDisplay } from '@/components/MsgDisplay';
import { ProjectTypeRefs } from '@/components/ProductSelector/enums';
import TopTabs from '@/components/TopTabs';
import { addI18nResources } from '@/locales';

import { useAutomatorStore } from '../automator/store';
import { AutomatorRiskExposureMap } from '../automator-create/util';
import { Comp as IconCalendar } from '../automator-mine/assets/icon-calendar.svg';
import { Comp as IconPeople } from '../automator-mine/assets/icon-people.svg';
import { Comp as IconRisk } from '../automator-mine/assets/icon-risk.svg';

import {
  CreatorAutomatorSelector,
  useCreatorAutomatorSelector,
} from './components/AutomatorSelector';
import { AutomatorFollowers } from './components/Followers';
import { AutomatorPerformance } from './components/Performance';
import { AutomatorPositions } from './components/Positions';
import AutomatorTrade from './components/Trade';
import { AutomatorTransactions } from './components/Transactions';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'AutomatorOperate');
const PositionTab = () => {
  const [t] = useTranslation('AutomatorOperate');
  const { automator } = useCreatorAutomatorSelector();
  return (
    <span>
      {t({ enUS: 'Positions', zhCN: '头寸' })}
      {!!automator?.positionSize && (
        <span className={styles['position-size']}>
          {automator?.positionSize || '1'}
        </span>
      )}
    </span>
  );
};

const $options: {
  label(t: TFunction): ReactNode;
  value: string;
  content(): ReactNode;
  hide?(data: { isPortrait?: boolean }): boolean;
}[] = [
  {
    label: (t) => t({ enUS: 'Performance', zhCN: '历史表现' }),
    value: 'performance',
    content: () => <AutomatorPerformance />,
  },
  {
    label: (t) => t({ enUS: 'Trade', zhCN: '交易' }),
    value: 'trade',
    content: () => <AutomatorTrade />,
    hide: (d) => !!d.isPortrait,
  },
  {
    label: (t) => <PositionTab />,
    value: 'positions',
    content: () => <AutomatorPositions />,
  },
  {
    label: (t) => t({ enUS: 'Followers', zhCN: '参与钱包' }),
    value: 'followers',
    content: () => <AutomatorFollowers />,
  },
  {
    label: (t) => t({ enUS: 'Subscription History', zhCN: '交易记录' }),
    value: 'transactions',
    content: () => <AutomatorTransactions />,
  },
];

const Index = () => {
  const [t] = useTranslation('AutomatorOperate');
  const isPortrait = useIsPortrait();
  const tab = useQuery(
    (q) => (q['automator-operate-tab'] || 'trade') as string,
  );
  const options = useMemo(
    () =>
      $options
        .map((it) => ({ ...it, label: it.label(t) }))
        .filter((it) => !it.hide?.({ isPortrait })),
    [isPortrait, t],
  );
  const item = useMemo(
    () => options.find((it) => it.value === tab) || options[0],
    [options, tab],
  );

  const { automator } = useCreatorAutomatorSelector();
  const automatorDetail = useAutomatorStore(
    (state) =>
      automator &&
      state.vaultDetails[
        `${
          automator.vaultInfo.chainId
        }-${automator.vaultInfo.vault.toLowerCase()}-`
      ],
  );

  return (
    <TopTabs
      type="banner-expandable-tab"
      className={styles['container']}
      banner={
        <>
          <h1 className={styles['head-title']}>
            <h2 className={styles['title']}>
              {ProjectTypeRefs[ProjectType.Automator].icon}
              {t({
                enUS: 'My Automator',
                zhCN: '我的 Automator',
              })}
            </h2>
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
                {automator?.vaultInfo.creatorFeeRate !== undefined
                  ? displayPercentage(automator.vaultInfo.creatorFeeRate, 0)
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
              <div className={styles['item']}>
                <IconRisk className={styles['label']} />
                {automator &&
                  (() => {
                    const ref =
                      AutomatorRiskExposureMap[
                        automator.vaultInfo.riskExposure!
                      ];
                    return ref ? (
                      <>
                        <span
                          style={{
                            color: ref?.color || 'inherit',
                          }}
                        >
                          {ref.label} - {ref.desc(t)}
                        </span>
                        <span className={styles['risk-desc']}>
                          {t({
                            enUS: 'Max Risk Exposure',
                            zhCN: '最大风险敞口',
                          })}
                          : {displayPercentage(ref.value)}
                        </span>
                      </>
                    ) : (
                      'R-'
                    );
                  })()}
              </div>
              <div className={styles['desc']}>
                <MsgDisplay>
                  {/* vaultInfo.desc is from user, better not to use dangerouslySetInnerHTML (prevent XSS attack) */}
                  {(automatorDetail?.vaultInfo.desc || '...')
                    .split('\n')
                    .map((line, idx) => (
                      <>
                        {idx > 0 ? <br key={`lb-${idx}`} /> : undefined}
                        {line}
                      </>
                    ))}
                </MsgDisplay>
              </div>
            </div>
          </h1>
        </>
      }
      options={options}
      value={tab}
      dark
      onChange={(v) => updateQuery({ 'automator-operate-tab': v })}
    >
      <div className={styles['container']}>{item.content()}</div>
    </TopTabs>
  );
};

export default Index;
