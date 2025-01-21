import { useMemo, useState } from 'react';
import { Spin, Toast } from '@douyinfe/semi-ui';
import { calc_yield } from '@sofa/alg';
import { AutomatorCreatorService } from '@sofa/services/automator-creator';
import { InterestTypeRefs } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { cvtAmountsInCcy, displayPercentage } from '@sofa/utils/amount';
import { MsIntervals } from '@sofa/utils/expiry';
import { getErrorMsg } from '@sofa/utils/fns';
import { simplePlus } from '@sofa/utils/object';
import { useRequest } from 'ahooks';
import classNames from 'classnames';
import { uniqBy } from 'lodash-es';

import AmountDisplay from '@/components/AmountDisplay';
import AsyncButton from '@/components/AsyncButton';
import { CSelect } from '@/components/CSelect';
import { useIndexPrices } from '@/components/IndexPrices/store';
import { formatTime } from '@/components/TimezoneSelector/store';
import { AutomatorPerformanceChart } from '@/pages/products/automator/components/PerformanceChart';
import { useGlobalState } from '@/store';

import { useCreatorAutomatorSelector } from '../AutomatorSelector';

import styles from './index.module.scss';

const PoolSize = () => {
  const [t] = useTranslation('AutomatorPerformance');
  const prices = useIndexPrices((s) => s.prices);

  const { automator } = useCreatorAutomatorSelector();
  const apy = useGlobalState(
    (state) =>
      automator &&
      state.interestRate[automator.vaultInfo.chainId]?.[
        automator.vaultInfo.depositCcy
      ],
  );

  const estimatedYield = useMemo(() => {
    if (!apy?.apyUsed || !automator?.aumByVaultDepositCcy)
      return { byVaultDepositCcy: 0, byDepositCcy: 0 };
    const byDepositCcy = calc_yield(
      apy.apyUsed,
      +automator.aumByVaultDepositCcy,
      Date.now(),
      Date.now() + MsIntervals.day * 7,
    );
    const byVaultDepositCcy = (() => {
      if (!InterestTypeRefs[automator.vaultInfo.interestType!].isRebase) {
        return cvtAmountsInCcy(
          [[automator.vaultInfo.depositCcy, byDepositCcy]],
          prices,
          automator.vaultInfo.vaultDepositCcy,
        );
      }
      return byDepositCcy;
    })();
    return { byVaultDepositCcy, byDepositCcy };
  }, [
    apy?.apyUsed,
    automator?.aumByVaultDepositCcy,
    automator?.vaultInfo.depositCcy,
    automator?.vaultInfo.interestType,
    automator?.vaultInfo.vaultDepositCcy,
    prices,
  ]);

  const byCcyOptions = useMemo(
    () =>
      !automator
        ? []
        : uniqBy(
            (['depositCcy', 'vaultDepositCcy', 'positionCcy'] as const).map(
              (key) => ({
                label: automator.vaultInfo[key],
                value: key,
              }),
            ),
            (it) => it.value,
          ),
    [automator],
  );
  const [byCcy, setByCcy] = useState<
    'depositCcy' | 'vaultDepositCcy' | 'positionCcy'
  >('depositCcy');
  const items = useMemo(() => {
    const total = simplePlus(
      automator?.unExpiredAmountByVaultDepositCcy,
      automator?.redeemedAmountByVaultDepositCcy,
      automator?.unclaimedAmountByVaultDepositCcy,
      automator?.availableAmountByVaultDepositCcy,
    ) as number;
    return [
      {
        color: '#8C8C8C',
        label: t({ enUS: 'Active Position Locked', zhCN: '持仓锁定资金' }),
        value: cvtAmountsInCcy(
          [
            [
              String(automator?.vaultInfo.vaultDepositCcy),
              automator?.unExpiredAmountByVaultDepositCcy,
            ],
          ],
          prices,
          String(automator?.vaultInfo[byCcy]),
        ),
        percent: Number(automator?.unExpiredAmountByVaultDepositCcy) / total,
      },
      {
        color: '#77B6F0',
        label: t({ enUS: 'To Be Redeemed', zhCN: '待回收资金' }),
        value: cvtAmountsInCcy(
          [
            [
              String(automator?.vaultInfo.vaultDepositCcy),
              automator?.redeemedAmountByVaultDepositCcy,
            ],
          ],
          prices,
          String(automator?.vaultInfo[byCcy]),
        ),
        percent: Number(automator?.redeemedAmountByVaultDepositCcy) / total,
      },
      {
        color: '#D89614',
        label: t({ enUS: 'Unclaimed', zhCN: '待提现资金' }),
        value: cvtAmountsInCcy(
          [
            [
              String(automator?.vaultInfo.vaultDepositCcy),
              automator?.unclaimedAmountByVaultDepositCcy,
            ],
          ],
          prices,
          String(automator?.vaultInfo[byCcy]),
        ),
        percent: Number(automator?.unclaimedAmountByVaultDepositCcy) / total,
      },
      {
        color: '#46B8A6',
        label: t({ enUS: 'Available Balance', zhCN: '可交易资金' }),
        value: cvtAmountsInCcy(
          [
            [
              String(automator?.vaultInfo.vaultDepositCcy),
              automator?.availableAmountByVaultDepositCcy,
            ],
          ],
          prices,
          String(automator?.vaultInfo[byCcy]),
        ),
        percent: Number(automator?.availableAmountByVaultDepositCcy) / total,
      },
    ];
  }, [automator, byCcy, prices, t]);

  return (
    <div className={styles['section']}>
      <div className={styles['title']}>
        {t({ enUS: 'Pool Size', zhCN: '资金规模' })}
      </div>
      <div className={classNames(styles['item'], styles['border'])}>
        <div className={styles['value']}>
          <AmountDisplay
            amount={
              Number(automator?.aumByVaultDepositCcy) / Number(automator?.nav)
            }
            ccy={automator?.vaultInfo.positionCcy}
          />
          <span className={styles['unit']}>
            {automator?.vaultInfo.positionCcy}
          </span>
          <span className={styles['cvt']}>
            <span className={styles['separator']}>≈</span>
            <AmountDisplay
              amount={automator?.aumByVaultDepositCcy}
              ccy={automator?.vaultInfo.vaultDepositCcy}
            />
            <span className={styles['unit']}>
              {automator?.vaultInfo.vaultDepositCcy}
            </span>
            <span className={styles['separator']}>≈</span>
            <AmountDisplay
              amount={automator?.aumByClientDepositCcy}
              ccy={automator?.vaultInfo.depositCcy}
            />
            <span className={styles['unit']}>
              {automator?.vaultInfo.depositCcy}
            </span>
          </span>
        </div>
        {automator?.vaultInfo.interestType && (
          <div className={styles['tips']}>
            <span className={styles['arrow']} />
            <span className={styles['label-1']}>
              {t(
                {
                  enUS: 'Earning on {{interestType}}',
                  zhCN: '生息自 {{interestType}}',
                },
                { interestType: automator?.vaultInfo.interestType },
              )}
            </span>
            <div className={styles['item-1']}>
              <span className={styles['label']}>
                {t({ enUS: 'Estimated Yield(APY)', zhCN: '预估年化(APY)' })}
              </span>
              <span className={styles['value']}>
                {displayPercentage(apy?.apyUsed)}
              </span>
            </div>
            <div className={styles['item-1']}>
              <span className={styles['label']}>
                {t({
                  enUS: 'Estimated Return Next 7 Days',
                  zhCN: '未来七天的预估利息',
                })}
              </span>
              <span className={styles['value']}>
                <AmountDisplay
                  amount={estimatedYield.byVaultDepositCcy}
                  ccy={automator.vaultInfo.vaultDepositCcy}
                />
                <span className={styles['unit']}>
                  {automator.vaultInfo.vaultDepositCcy}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
      <div className={styles['pool-size-infos']}>
        <div className={styles['selector-wrapper']}>
          <CSelect
            className={styles['selector']}
            optionList={byCcyOptions}
            value={byCcy}
            onChange={(v) => setByCcy(v as never)}
          />
        </div>
        {items.map((it) => (
          <div className={styles['item']} key={it.color}>
            <span className={styles['dot']} style={{ color: it.color }} />
            <span className={styles['label']}>{it.label}</span>
            <span className={styles['value']}>
              <AmountDisplay
                amount={it.value}
                ccy={automator?.vaultInfo[byCcy]}
              />
              <span className={styles['unit']}>
                {automator?.vaultInfo[byCcy]}
              </span>
              <span className={styles['percent']}>
                {displayPercentage(it.percent)}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PnL = () => {
  const [t] = useTranslation('AutomatorPerformance');
  const { automator } = useCreatorAutomatorSelector();
  const prices = useIndexPrices((s) => s.prices);

  const { data: claimableProfits } = useRequest(
    async () =>
      automator &&
      AutomatorCreatorService.profitsCanBeHarvested(automator.vaultInfo),
    {
      refreshDeps: [automator?.vaultInfo],
      pollingInterval: MsIntervals.min,
    },
  );

  return (
    <div className={classNames(styles['section'], styles['pnl'])}>
      <div className={styles['title']}>{t({ enUS: 'PnL', zhCN: 'PnL' })}</div>
      <div className={styles['item']}>
        <span className={styles['label']}>
          {t({ enUS: '7D Yield', zhCN: '7天年化' })}
        </span>
        <span
          className={styles['value']}
          style={{
            color:
              Number(automator?.yieldPercentage) >= 0
                ? 'var(--color-rise)'
                : 'var(--color-fall)',
          }}
        >
          {displayPercentage(Number(automator?.yieldPercentage) / 100)}
        </span>
      </div>
      <div className={styles['item']}>
        <div className={styles['label']}>
          {t({ enUS: 'Historical Cumulative PnL', zhCN: '历史累计损益' })}
        </div>
        <div className={styles['value']}>
          <span
            style={{
              color:
                Number(automator?.totalPnlByClientDepositCcy) >= 0
                  ? 'var(--color-rise)'
                  : 'var(--color-fall)',
            }}
          >
            <AmountDisplay
              amount={automator?.totalPnlByClientDepositCcy}
              ccy={automator?.vaultInfo.depositCcy}
            />
            <span className={styles['unit']}>
              {automator?.vaultInfo.depositCcy}
            </span>
          </span>
          <span className={styles['separator']}>+</span>
          <span style={{ color: 'var(--color-rch)' }}>
            <AmountDisplay amount={automator?.totalRchAmount} ccy={'RCH'} />
            <span
              className={classNames(styles['unit'], styles['icon-airdrop'])}
            >
              RCH
            </span>
          </span>
          <span className={classNames(styles['cvt'], styles['weaken'])}>
            <span className={styles['separator']}>≈</span>
            <AmountDisplay
              amount={automator?.totalPnlWithRchByClientDepositCcy}
              ccy={automator?.vaultInfo.depositCcy}
            />
            <span className={styles['unit']}>
              {automator?.vaultInfo.depositCcy}
            </span>
          </span>
        </div>
      </div>
      <div className={styles['item']}>
        <div className={styles['label']}>
          {t({ enUS: 'Historical Cumulative PnL%', zhCN: '历史累计损益%' })}
        </div>
        <div
          className={styles['value']}
          style={{
            color:
              Number(automator?.pnlPercentage) >= 0
                ? 'var(--color-rise)'
                : 'var(--color-fall)',
          }}
        >
          {displayPercentage(Number(automator?.pnlPercentage) / 100, 2, true)}
        </div>
      </div>
      <div className={styles['footer']}>
        <AsyncButton
          disabled={
            !(Number(automator?.totalOptivisorProfitByVaultDepositCcy) > 0)
          }
          className={styles['btn-claim']}
          onClick={() =>
            automator &&
            AutomatorCreatorService.harvestProfits(
              () => {},
              automator.vaultInfo,
            )
              .then(() =>
                Toast.info(t({ enUS: 'Harvest successful', zhCN: '已收获' })),
              )
              .catch((err) => Toast.error(getErrorMsg(err)))
          }
        >
          {t({ enUS: 'Harvest', zhCN: '收获' })}
        </AsyncButton>
        <div className={styles['item']}>
          <div className={styles['label']}>
            {t(
              { enUS: 'Total Share Profits', zhCN: '总分润' },
              { time: formatTime(automator?.dateTime, 'MMM.DD') },
            )}
          </div>
          <div className={styles['value']}>
            <AmountDisplay
              amount={automator?.totalOptivisorProfitByVaultDepositCcy}
              ccy={automator?.vaultInfo.vaultDepositCcy}
            />
            <span className={styles['unit']}>
              {automator?.vaultInfo.vaultDepositCcy}
            </span>
            {automator && (
              <span className={styles['cvt']}>
                <span className={styles['separator']}>≈</span>
                <AmountDisplay
                  amount={cvtAmountsInCcy(
                    [
                      [
                        automator.vaultInfo.vaultDepositCcy,
                        automator.totalOptivisorProfitByVaultDepositCcy,
                      ],
                    ],
                    prices,
                    automator.vaultInfo.depositCcy,
                  )}
                  ccy={automator.vaultInfo.depositCcy}
                />
                <span className={styles['unit']}>
                  {automator.vaultInfo.depositCcy}
                </span>
              </span>
            )}
          </div>
        </div>
        <div className={styles['item']}>
          <div className={styles['label']}>
            {t(
              { enUS: 'Unclaimed Share Profit', zhCN: '未提取的分润' },
              { time: formatTime(automator?.dateTime, 'MMM.DD') },
            )}
          </div>
          <div className={styles['value']}>
            <AmountDisplay
              amount={claimableProfits}
              ccy={automator?.vaultInfo.vaultDepositCcy}
            />
            <span className={styles['unit']}>
              {automator?.vaultInfo.vaultDepositCcy}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AutomatorPerformance = () => {
  const { automator } = useCreatorAutomatorSelector();

  return (
    <Spin spinning={!automator}>
      <PoolSize />
      <PnL />
      <AutomatorPerformanceChart
        className={styles['chart-section']}
        vault={automator?.vaultInfo}
      />
    </Spin>
  );
};
