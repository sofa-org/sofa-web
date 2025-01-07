import { useMemo, useState } from 'react';
import { Spin, Toast } from '@douyinfe/semi-ui';
import { calc_yield } from '@sofa/alg';
import { AutomatorCreatorService } from '@sofa/services/automator-creator';
import { useTranslation } from '@sofa/services/i18n';
import { cvtAmountsInCcy, displayPercentage } from '@sofa/utils/amount';
import { next8h } from '@sofa/utils/expiry';
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
        automator.vaultInfo.vaultDepositCcy
      ],
  );
  const estimatedYield = useMemo(
    () =>
      apy &&
      automator &&
      automator.vaultInfo.interestType &&
      calc_yield(
        apy.apyUsed,
        +automator.aumByVaultDepositCcy,
        Date.now(),
        next8h(undefined, 8),
      ),
    [apy, automator],
  );

  const byCcyOptions = useMemo(
    () =>
      !automator
        ? []
        : uniqBy(
            (['depositCcy', 'vaultDepositCcy', 'positionCcy'] as const).map(
              (key) => ({
                label: automator.vaultInfo[key],
                value: automator.vaultInfo[key],
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
      automator?.positionLockedAmount,
      automator?.redeemedAmount,
      automator?.unclaimedAmount,
      automator?.availableAmount,
    ) as number;
    return [
      {
        color: '#8C8C8C',
        label: t({ enUS: 'Active Position Locked', zhCN: '持仓锁定资金' }),
        value: cvtAmountsInCcy(
          [
            [
              String(automator?.vaultInfo.vaultDepositCcy),
              automator?.positionLockedAmount,
            ],
          ],
          prices,
          String(automator?.vaultInfo[byCcy]),
        ),
        percent: Number(automator?.positionLockedAmount) / total,
      },
      {
        color: '#77B6F0',
        label: t({ enUS: 'To Be Redeemed', zhCN: '待回收资金' }),
        value: cvtAmountsInCcy(
          [
            [
              String(automator?.vaultInfo.vaultDepositCcy),
              automator?.redeemedAmount,
            ],
          ],
          prices,
          String(automator?.vaultInfo[byCcy]),
        ),
        percent: Number(automator?.redeemedAmount) / total,
      },
      {
        color: '#D89614',
        label: t({ enUS: 'Unclaimed', zhCN: '待提现资金' }),
        value: cvtAmountsInCcy(
          [
            [
              String(automator?.vaultInfo.vaultDepositCcy),
              automator?.unclaimedAmount,
            ],
          ],
          prices,
          String(automator?.vaultInfo[byCcy]),
        ),
        percent: Number(automator?.unclaimedAmount) / total,
      },
      {
        color: '#46B8A6',
        label: t({ enUS: 'Available Balance', zhCN: '可交易资金' }),
        value: cvtAmountsInCcy(
          [
            [
              String(automator?.vaultInfo.vaultDepositCcy),
              automator?.availableAmount,
            ],
          ],
          prices,
          String(automator?.vaultInfo[byCcy]),
        ),
        percent: Number(automator?.availableAmount) / total,
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
            ccy={automator?.vaultInfo.depositCcy}
          />
          <span className={styles['unit']}>
            {automator?.vaultInfo.positionCcy}
          </span>
          <span className={styles['separator']}>≈</span>
          <AmountDisplay
            amount={automator?.aumByVaultDepositCcy}
            ccy={automator?.vaultInfo.vaultDepositCcy}
          />
          <span className={styles['unit']}>
            {automator?.vaultInfo.depositCcy}
          </span>
          <span className={styles['separator']}>≈</span>
          <AmountDisplay
            amount={automator?.aumByClientDepositCcy}
            ccy={automator?.vaultInfo.depositCcy}
          />
          <span className={styles['unit']}>
            {automator?.vaultInfo.depositCcy}
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
                  amount={estimatedYield}
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
            value={automator?.vaultInfo[byCcy]}
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

  const { data: claimableProfits } = useRequest(
    async () =>
      automator &&
      AutomatorCreatorService.profitsCanBeHarvested(automator.vaultInfo),
    {
      refreshDeps: [automator?.vaultInfo],
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
          {displayPercentage(automator?.yieldPercentage)}
        </span>
      </div>
      <div className={styles['item']}>
        <div className={styles['label']}>
          {t(
            { enUS: 'PnL({{time}})', zhCN: 'PnL({{time}})' },
            { time: formatTime(automator?.dateTime, 'MMM.DD') },
          )}
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
            <span className={styles['unit']}>RCH</span>
          </span>
          <span className={styles['separator']}>≈</span>
          <AmountDisplay
            amount={automator?.totalPnlWithRchByClientDepositCcy}
            ccy={automator?.vaultInfo.depositCcy}
          />
          <span className={styles['unit']}>
            {automator?.vaultInfo.depositCcy}
          </span>
        </div>
      </div>
      <div className={styles['item']}>
        <div className={styles['label']}>
          {t(
            { enUS: 'PnL%({{time}})', zhCN: 'PnL%({{time}})' },
            { time: formatTime(automator?.dateTime, 'MMM.DD') },
          )}
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
          {displayPercentage(automator?.pnlPercentage, 2, true)}
        </div>
      </div>
      <div className={styles['footer']}>
        <AsyncButton
          disabled={!automator}
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
              { enUS: 'Total Share Profits', zhCN: '你的收益' },
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
        <div className={styles['item']}>
          <div className={styles['label']}>
            {t(
              { enUS: 'Unclaimed Share Profit', zhCN: '你的收益' },
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
