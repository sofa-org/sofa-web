import { AutomatorService } from '@sofa/services/automator';
import { CCYService } from '@sofa/services/ccy';
import { ChainMap } from '@sofa/services/chains';
import { useTranslation } from '@sofa/services/i18n';
import { displayPercentage } from '@sofa/utils/amount';
import { useRequest } from 'ahooks';

import AmountDisplay from '@/components/AmountDisplay';
import AsyncButton from '@/components/AsyncButton';
import { MsgDisplay } from '@/components/MsgDisplay';
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
  const { automator } = useAutomatorMarketSelector({
    queryName: 'v',
  });
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
  return (
    <div className={styles['automator-share-page']}>
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
                        : {displayPercentage(ref.value)}
                      </span>
                    </>
                  ) : (
                    'R-'
                  );
                })()}
              </div>
              <div className={styles['automator-address']}>
                <span>
                  {automatorDetail.vaultInfo.vault.toLowerCase() || ''}
                </span>
                <img
                  className={styles['logo']}
                  src={ChainMap[automatorDetail.vaultInfo.chainId].icon}
                  alt=""
                />
              </div>
            </div>

            <div className={styles['automator-desc']}>
              <MsgDisplay>
                {/* vaultInfo.desc is from user, better not to use dangerouslySetInnerHTML (prevent XSS attack) */}
                {(automatorDetail.vaultInfo.desc || '...')
                  .split('\n')
                  .map((line, idx) => (
                    <>
                      {idx > 0 ? <br key={`lb-${idx}`} /> : undefined}
                      {line}
                    </>
                  ))}
              </MsgDisplay>
            </div>

            <div className={styles['display-flex']}>
              <div className={styles['automator-performance']}>
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
                  )}
                </span>
              </div>
              <div className={styles['display-flex-column']}>
                <div className={styles['automator-size']}>
                  <div className={styles['display-flex']}>
                    <div className={styles['pool-size']}>
                      <div className={styles['label']}>
                        {t({ enUS: 'Pool Size', zhCN: '规模' })}
                      </div>
                      <div className={styles['value']}>
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

                    <div className={styles['optivisor-funds']}>
                      <div className={styles['label']}>
                        {t({ enUS: `Optivisor's Funds`, zhCN: '主理人份额' })}
                      </div>
                      <div className={styles['value']}>
                        <span className={styles['percent']}>
                          {displayPercentage(
                            Number(
                              automatorDetail?.creatorAmountByVaultDepositCcy,
                            ) / Number(automatorDetail?.aumByVaultDepositCcy),
                          )}
                        </span>
                        <AmountDisplay
                          amount={
                            automatorDetail.creatorAmountByClientDepositCcy || 0
                          }
                          ccy={automatorDetail.vaultInfo.depositCcy}
                        />
                        <span className={styles['unit']}>
                          {automatorDetail.vaultInfo.depositCcy}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles['bar-bg']}>
                    <div
                      className={styles['bar']}
                      style={{
                        width: `${
                          automatorDetail?.creatorAmountByVaultDepositCcy ===
                            undefined || !automatorDetail?.aumByVaultDepositCcy
                            ? 0
                            : (Number(
                                automatorDetail?.creatorAmountByVaultDepositCcy,
                              ) /
                                Number(automatorDetail?.aumByVaultDepositCcy)) *
                              100
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div className={styles['automator-follower']}>
                  <div className={styles['deposit-ccy']}>
                    <div className={styles['label']}>
                      {t({ enUS: 'Deposit', zhCN: '存入' })}
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
                    </div>
                  </div>
                  <div className={styles['line']} />
                  <div className={styles['deposit-ccy']}>
                    <div className={styles['label']}>
                      {t({
                        enUS: 'Participating Investor',
                        zhCN: '参与钱包数',
                      })}
                    </div>
                    <div className={styles['value']}>
                      {automatorDetail.participantNum || '-'}
                    </div>
                  </div>

                  {data && (
                    <>
                      <div className={styles['line']} />

                      <div className={styles['followers-pnl']}>
                        <div className={styles['label']}>
                          {t({ enUS: `Followers' PnL`, zhCN: '参与者 PnL' })}
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
                                {row.followDay}
                              </span>
                              <span className={styles['percentage']}>
                                {displayPercentage(
                                  Number(row.pnlPercentage) / 100,
                                  1,
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
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
