import { useEffect, useMemo, useRef } from 'react';
import { Spin } from '@douyinfe/semi-ui';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { amountFormatter } from '@sofa/utils/amount';
import { displayExpiry } from '@sofa/utils/expiry';
import { formatDuration } from '@sofa/utils/time';
import classNames from 'classnames';
import { BarChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

import Address from '@/components/Address';
import { formatTime } from '@/components/TimezoneSelector/store';

import { useAutomatorStore } from '../../store';

import styles from './index.module.scss';

const Snapshot = (props: { vault?: AutomatorVaultInfo }) => {
  const [t] = useTranslation('AutomatorProjectDesc');
  const list = useAutomatorStore(
    (state) =>
      props.vault &&
      state.snapshots[`${props.vault.chainId}-${props.vault.vault}-`],
  );
  useEffect(() => {
    if (props.vault) {
      useAutomatorStore.subscribeSnapshots(props.vault);
    }
  }, [props.vault]);
  if (!list?.length) return <></>;
  return (
    <div className={classNames(styles['snapshot'], styles['section'])}>
      <h2 className={styles['title']}>
        {/* <span className={styles['icon']}>︎︎✹︎</span> */}
        {t({ enUS: 'Strategy Snapshot', zhCN: '策略快照' })}
      </h2>
      <Spin spinning={!list} wrapperClassName={styles['content']}>
        {list?.map((it, i) => (
          <div className={styles['it-item']} key={i}>
            <div className={styles['left']}>
              <div
                className={classNames(
                  styles['direction'],
                  it.side.toLowerCase(),
                )}
              >
                {it.side}
              </div>
              <div className={styles['product']}>
                {it.forCcy}{' '}
                {{ BULLISH: 'Bull Trend', BEARISH: 'Bear trend' }[it.direction]}{' '}
                {displayExpiry(it.expiry * 1000)} {it.lowerStrike}-
                {it.upperStrike}
              </div>
            </div>
            <div className={styles['deposit-percentage']}>
              {it.depositPercentage}%
            </div>
          </div>
        ))}
      </Spin>
    </div>
  );
};

echarts.use([
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  BarChart,
  CanvasRenderer,
  UniversalTransition,
]);

const Performance = (props: { vault?: AutomatorVaultInfo }) => {
  const [t] = useTranslation('AutomatorProjectDesc');
  const list = useAutomatorStore(
    (state) =>
      props.vault &&
      state.performances[`${props.vault.chainId}-${props.vault.vault}-`],
  );
  useEffect(() => {
    if (props.vault) {
      useAutomatorStore.subscribePerformances(props.vault);
    }
  }, [props.vault]);

  const chartRef = useRef<HTMLDivElement>(null);
  const myChart = useRef<ReturnType<typeof echarts.init>>();

  const data = useMemo(
    () =>
      list
        ?.slice(0, -1)
        .map((it, i) => ({
          sharePnl:
            +it.totalDepositCcyPnlForShare -
            +list[i + 1].totalDepositCcyPnlForShare,
          rchPnl: +it.rch * +it.rchPrice,
          timestamp: it.dateTime * 1000,
        }))
        .reverse(),
    [list],
  );

  const precision = useMemo(() => {
    if (!data?.length) return 0;
    const max = Math.max(...data.flatMap((it) => [it.sharePnl, it.rchPnl]));
    return max > 1000 ? 0 : 2;
  }, [data]);

  useEffect(() => {
    if (!chartRef.current || !data) return;
    if (!myChart.current) myChart.current = echarts.init(chartRef.current);
    const option = {
      grid: {
        top: 80,
        left: 100,
        right: 40,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#272727',
        borderWidth: 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any[]) => {
          const date = params[0].name; // 假设 name 是日期或类似的分类标签
          let result =
            '<div style="color: #fff">' +
            formatTime(+date, 'YYYY-MM-DD') +
            '</div>'; // 开始构建自定义的内容字符串
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          params.forEach((item: any) => {
            console.log(1111, item);
            // 对每个系列数据进行循环，构建数据显示
            result +=
              '<div style="display: flex;justify-content: space-between; gap: 20px;font-size: 12px; color: #fff">';
            result += '<span>';
            result +=
              '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:' +
              item.color +
              ';"></span>';
            result += item.seriesName;
            result += '</span>';
            result += `${amountFormatter(item.value, 2)} ${props.vault
              ?.depositCcy}`;
            result += '</div>';
          });
          return result; // 返回最终的内容字符串
        },
      },
      legend: false,
      xAxis: {
        type: 'category',
        data: data.map((it) => it.timestamp),
        splitLine: false,
        axisLabel: {
          formatter: (v: number) => formatTime(+v, 'MMM. DD'),
          color: '#0008',
        },
        axisTick: {
          show: false,
          lineStyle: { color: '#0001' },
        },
        axisLine: {
          show: true,
          onZero: false,
          lineStyle: { color: '#0001' },
        },
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: true,
          lineStyle: { color: '#0001' },
        },
        splitLine: false,
        axisLabel: {
          formatter: (v: number) => amountFormatter(v, precision),
          color: '#0008',
        },
        axisTick: {
          show: false,
          lineStyle: { color: '#0001' },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        min: (v: any) => v.min - (v.max - v.min) * 0.1,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        max: (v: any) => v.max + (v.max - v.min) * 0.1,
      },
      series: [
        {
          name: 'PnL Of Share',
          type: 'bar',
          stack: 'bar',
          data: data.map((it) => ({
            value: it.sharePnl,
            itemStyle: { color: it.sharePnl > 0 ? '#50D113' : '#EC5E88' },
          })),
        },
        {
          name: 'PnL Of RCH',
          type: 'bar',
          stack: 'bar',
          data: data.map((it) => ({
            value: it.rchPnl,
            itemStyle: { color: '#51acf1' },
          })),
        },
      ],
    };

    myChart.current.setOption(option);
  }, [data, props.vault?.depositCcy, precision]);

  if (!list?.length || list.length < 2) return <></>;

  return (
    <div className={classNames(styles['performance'], styles['section'])}>
      <h2 className={styles['title']}>
        {/* <span className={styles['icon']}>︎︎✹︎</span> */}
        {t({ enUS: 'Vault Performance', zhCN: '历史表现' })}
      </h2>
      <Spin spinning={!list} wrapperClassName={styles['content']}>
        <div className={styles['legend']}>
          <div className={styles['legend-item']}>
            <div
              className={styles['color']}
              style={{ background: '#50D113' }}
            />
            <div
              className={styles['color']}
              style={{ background: '#EC5E88' }}
            />
            {t({ enUS: 'PnL Of Share' })}
          </div>
          <div className={styles['legend-item']}>
            <div
              className={styles['color']}
              style={{ background: '#51acf1' }}
            />
            {t({ enUS: 'PnL Of RCH' })}
          </div>
        </div>
        <div className={styles['chart']} ref={chartRef} />
      </Spin>
    </div>
  );
};

export const AutomatorProjectDesc = (props: { vault?: AutomatorVaultInfo }) => {
  const [t] = useTranslation('AutomatorProjectDesc');
  return (
    <div className={styles['project-desc']}>
      <section className={styles['section']}>
        <h2 className={styles['title']}>
          {/* <span className={styles['icon']}>︎︎✹︎</span> */}
          {t({ enUS: 'Suitability', zhCN: '适用场景' })}
        </h2>
        <div className={styles['content']}>
          {t({
            enUS: 'Our Automator strategies will perform automated execution of our SOFA platform products (eg. Bull Trend & Bear Trend) at model expiration dates and strikes to target an optimized risk-adjusted yield. The strategies are designed to operate systematically via data-driven algorithms, with our data learning models continuously being refined to enhance long term performance. Capital will be continuously deployed to maximize yield compounding benefits, allowing users to deploy volatility monetization strategies with zero hassle. Strategies could include both controlled buying or selling of option exposure to generate returns.',
            zhCN: '我们的 AutoMator 策略将自动执行 SOFA 平台产品（如牛市趋势和熊市趋势），在模型指定的到期日和行权价下，旨在实现优化的风险调整收益。这些策略通过数据驱动的算法系统化运行，并通过数据学习模型的持续优化提升长期表现。资金将持续部署以最大化收益复利效应，让用户轻松实现波动率套利策略。策略可能包括受控买入或卖出期权敞口，以生成收益。',
          })}
        </div>
      </section>
      <Snapshot vault={props.vault} />
      <Performance vault={props.vault} />
      <section className={styles['section']}>
        <h2 className={styles['title']}>
          {/* <span className={styles['icon']}>︎︎✹︎</span> */}
          {t({ enUS: 'Mint & Redemption Procedures', zhCN: '铸造与赎回' })}
        </h2>
        <div className={styles['content']}>
          <div
            dangerouslySetInnerHTML={{
              __html: t(
                {
                  enUS: '	•	When subscribing, users mint atUSDT by converting USDT at the current atUSDT price. Minting allocates shares proportionally to the size of the current pool.<br/> •	To redeem, users return atUSDT.  Redemption requests require a 7-day waiting period before becoming claimable.<br />	•	Once claimable, you have 3 days to complete the claim. If not claimed within this time, the request will expire, and you’ll need to submit a new redemption request.',
                  zhCN: '	•	订阅时，用户通过当前 atUSDT 价格将 USDT 转换为 atUSDT，从而铸造 atUSDT 份额。铸造的份额将按当前资金池的规模比例分配。<br/>•	要赎回，用户需返还 atUSDT。赎回请求需经过 7 天的等待期后方可领取。<br/>•	在可领取状态下，您有 3 天的时间完成领取。如果未在规定时间内领取，赎回请求将过期，您需要重新提交新的赎回请求。',
                },
                {
                  duration:
                    props.vault?.redeemWaitPeriod &&
                    formatDuration(props.vault?.redeemWaitPeriod, 1),
                },
              ),
            }}
          />
        </div>
      </section>
      <section className={styles['section']}>
        <h2 className={styles['title']}>
          {/* <span className={styles['icon']}>︎︎✹︎</span> */}
          {t({ enUS: 'Fees', zhCN: '费用' })}
        </h2>
        <div className={styles['content']}>
          <div
            dangerouslySetInnerHTML={{
              __html: t({
                enUS: `Automator strategies do not charge any fees on execution, while a performance fee of 15% will only be booked against actual & realized profits.`,
                zhCN: '全程 0 手续费，仅收取利润部分的 15%。此费用将被用于 $RCH 的销毁，为 SOFA.org 的可持续发展贡献力量。',
              }),
            }}
          />
        </div>
      </section>
      <section className={styles['section']}>
        <h2 className={styles['title']}>
          {/* <span className={styles['icon']}>︎︎︎♥</span> */}
          {t('Vault')}
        </h2>
        <div className={styles['content']}>
          <div className={styles['address']}>
            {props.vault && (
              <Address
                address={props.vault.vault}
                prefix={t('CONTRACT: ')}
                link
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
