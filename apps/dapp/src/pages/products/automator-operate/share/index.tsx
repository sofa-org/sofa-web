import { useEffect, useMemo } from 'react';
import { Spin } from '@douyinfe/semi-ui';
import { AutomatorService } from '@sofa/services/automator';
import { CCYService } from '@sofa/services/ccy';
import { ChainMap } from '@sofa/services/chains';
import { ContractsService } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import { displayPercentage } from '@sofa/utils/amount';
import { useLazyCallback } from '@sofa/utils/hooks';
import { useRequest } from 'ahooks';
import classNames from 'classnames';
import { parse } from 'qs';

import AmountDisplay from '@/components/AmountDisplay';
import AsyncButton from '@/components/AsyncButton';
import { useIsMobileUI } from '@/components/MobileOnly';
import { MsgDisplay } from '@/components/MsgDisplay';
import { useWalletStore } from '@/components/WalletConnector/store';
import { EnvLinks } from '@/env-links';
import { addI18nResources } from '@/locales';

import { useAutomatorStore } from '../../automator/store';
import { AutomatorRiskExposureMap } from '../../automator-create/util';
import { useAutomatorMarketSelector } from '../../automator-market/hooks';
import { Comp as IconRisk } from '../../automator-mine/assets/icon-risk.svg';
import locale from '../locale';

import styles from './index.module.scss';
addI18nResources(locale, 'AutomatorOperate');

const Share = () => {
  const [t] = useTranslation('AutomatorOperate');
  const { chainId } = useWalletStore();

  const automatorVault = useMemo(
    () => String(parse(location.search, { ignoreQueryPrefix: true })['v']),
    [],
  );
  const automatorChainId = useMemo(
    () => Number(parse(location.search, { ignoreQueryPrefix: true })['c']),
    [],
  );
  useEffect(
    useLazyCallback(() => {
      if (automatorChainId) {
        if (automatorChainId != useWalletStore.getState().chainId) {
          useWalletStore.setChain(automatorChainId);
        }
      }
    }),
    [automatorChainId],
  );
  const { automator: automatorCurrent } = useAutomatorMarketSelector({
    queryName: 'v',
  });
  const automator = useMemo(
    () =>
      automatorCurrent &&
      automatorCurrent.vault.toLowerCase() == automatorVault?.toLowerCase()
        ? automatorCurrent
        : undefined,
    [automatorVault, automatorCurrent],
  );
  const automatorDetail = useAutomatorStore(
    (state) =>
      automator &&
      state.vaultDetails[
        `${automator.chainId}-${automator.vault.toLowerCase()}-`
      ],
  );
  const { data } = useRequest(
    () =>
      automatorDetail
        ? AutomatorService.topFollowers(automatorDetail?.vaultInfo)
        : Promise.resolve(undefined),
    {
      refreshDeps: [automatorDetail],
    },
  );
  const isMobileUI = useIsMobileUI();
  return (
    <div
      className={classNames(styles['automator-share-page'], {
        [styles['mobile-ui']]: isMobileUI,
      })}
    >
      <AsyncButton
        className={styles['btn-deposit']}
        onClick={() => {
          if (!automator) return;
          window.location.href =
            EnvLinks.config.VITE_AUTOMATOR_LINK +
            (EnvLinks.config.VITE_AUTOMATOR_LINK.includes('?') ? '&' : '?') +
            `automator-vault=${automator.vault}&automator-trade-tab=deposit`;
        }}
      >
        {t({ enUS: 'Mint Now', zhCN: '现在铸造' })}
      </AsyncButton>
      {automatorDetail ? (
        <>
          <div className={styles['header']}>
            <div className={styles['automator-name']}>
              {automatorDetail.vaultInfo.name}
            </div>

            <div className={styles['automator-infos']}>
              <div className={styles['automator-risk']}>
                <IconRisk className={styles['label']} />
                {(() => {
                  const ref =
                    AutomatorRiskExposureMap[
                      automatorDetail.vaultInfo.riskExposure!
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
                        : {displayPercentage(ref.value, 0)}
                      </span>
                    </>
                  ) : (
                    'R-'
                  );
                })()}
              </div>
              <div className={styles['automator-address']}>
                <a
                  className={styles['address']}
                  href={
                    ChainMap[chainId].explorerUrl +
                    '/address/' +
                    automatorDetail.vaultInfo.vault.toLowerCase()
                  }
                  target="_blank"
                >
                  {automatorDetail.vaultInfo.vault.toLowerCase() || ''}
                </a>
                <img
                  className={styles['logo']}
                  src={ChainMap[automatorDetail.vaultInfo.chainId].icon}
                  alt=""
                />
              </div>
            </div>

            <div className={styles['automator-desc']}>
              <MsgDisplay>
                <span
                  dangerouslySetInnerHTML={{
                    __html:
                      automatorDetail.vaultInfo.desc?.replace('\n', '<br />') ||
                      '...',
                  }}
                />
              </MsgDisplay>
            </div>

            <div className={styles['flex-gap']}>
              <div className={styles['automator-performance']}>
                <div>
                  <span className={styles['label']}>
                    {t({ enUS: '7 Day Target Yield', zhCN: '7天年化' })}
                  </span>
                  <span
                    className={styles['value']}
                    style={{
                      color:
                        Number(automatorDetail.yieldPercentage) >= 0
                          ? 'var(--color-rise)'
                          : 'var(--color-fall)',
                    }}
                  >
                    {displayPercentage(
                      Number(automatorDetail.yieldPercentage) / 100,
                      2,
                      true,
                    )}
                  </span>
                </div>
                <div className={styles['pool-size']}>
                  <div className={styles['label']}>
                    {t({ enUS: 'Pool Size', zhCN: '规模' })}
                  </div>
                  <div className={styles['value']}>
                    <img
                      className={styles['logo']}
                      src={
                        CCYService.ccyConfigs[
                          automatorDetail.vaultInfo.depositCcy
                        ]?.icon
                      }
                      alt=""
                    />
                    <AmountDisplay
                      amount={
                        +automatorDetail.aumBySharesToken ||
                        +automatorDetail.aumByVaultDepositCcy /
                          +automatorDetail.nav
                      }
                      ccy={automatorDetail.vaultInfo.depositCcy}
                    />
                    <span className={styles['unit']}>
                      {automatorDetail.vaultInfo.depositCcy}
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles['display-flex-column']}>
                <div className={styles['automator-size']}>
                  <div className={styles['optivisor-info']}>
                    <div className={styles['optivisor-funds']}>
                      <div className={styles['label']}>
                        {t({ enUS: `Optivisor's Funds`, zhCN: '主理人份额' })}
                      </div>
                      <div className={styles['value']}>
                        <AmountDisplay
                          amount={
                            automatorDetail.creatorAmountByClientDepositCcy || 0
                          }
                          ccy={automatorDetail.vaultInfo.depositCcy}
                        />
                        <span className={styles['unit']}>
                          {automatorDetail.vaultInfo.depositCcy}
                        </span>
                        <span className={styles['percent']}>
                          {displayPercentage(
                            Number(
                              automatorDetail?.creatorAmountByVaultDepositCcy,
                            ) / Number(automatorDetail?.aumByVaultDepositCcy),
                          )}
                        </span>
                      </div>
                    </div>
                    <div className={styles['deposit-ccy']}>
                      <div className={styles['label']}>
                        {t({ enUS: 'Followers', zhCN: '关注者' })}
                      </div>
                      <div className={styles['value']}>
                        {automatorDetail.participantNum || '-'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles['automator-follower']}>
                  <div className={styles['followers-pnl']}>
                    <div className={styles['label']}>
                      {t({ enUS: `Best performance`, zhCN: '最佳表现' })}
                    </div>
                    {!data ? (
                      <>
                        <div className={styles['empty-line']}>
                          <Spin />
                        </div>
                      </>
                    ) : (
                      (data?.length && (
                        <>
                          <div className={styles['first-line']}>
                            <span>{t({ enUS: 'Address', zhCN: '地址' })}</span>
                            <span>{t({ enUS: 'Days', zhCN: '持有时间' })}</span>
                            <span>
                              {t({ enUS: 'APY', zhCN: '年化收益率 (APY)' })}
                            </span>
                          </div>
                          <div className={styles['value']}>
                            {data.map((row) => (
                              <div className={styles['follower']}>
                                <span className={styles['wallet']}>
                                  {row.wallet.replace(
                                    /^(\w{8})\w+$/,
                                    (_, s) => `${s}...`,
                                  )}
                                </span>
                                <span className={styles['day']}>
                                  {row.followDay}{' '}
                                  {t({ enUS: 'days', zhCN: '天' })}
                                </span>
                                <span
                                  className={styles['percentage']}
                                  style={{
                                    color:
                                      Number(row.pnlPercentage) >= 0
                                        ? 'var(--color-rise)'
                                        : 'var(--color-fall)',
                                  }}
                                >
                                  {displayPercentage(
                                    Number(row.pnlPercentage) / 100,
                                    1,
                                    true,
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )) || (
                        <>
                          <div className={styles['empty-line']}>
                            <span>
                              {t({
                                enUS: `No followers yet`,
                                zhCN: '还没有参与者',
                              })}
                            </span>
                          </div>
                        </>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : undefined}
    </div>
  );
};

export default Share;
