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
          {t({ enUS: 'Suitable Scenario', zhCN: '适用场景' })}
        </h2>
        <div className={styles['content']}>
          {t({
            enUS: 'Our strategy involves automated execution of Bull Trend-selling and Bear Trend-selling at carefully selected expiration dates and strike prices.This approach is designed to take advantage of market trends while reducing the need for constant monitoring.By using data- driven insights, we optimize each trade to enhance performance.Additionally, all principal and profits are automatically reinvested, fostering continuous growth and compounding returns.This seamless process allows users to benefit from our expertise without the complexity of individual trade management.',
            zhCN: '我们的策略涉及自动执行牛市卖出和熊市卖出，在精心挑选的到期日和执行价格。这种方法旨在利用市场趋势，同时减少持续监控的需求。通过使用数据驱动的见解，我们优化每一笔交易以提高表现。此外，所有本金和利润都自动再投资，促进持续增长和复利回报。这一无缝过程使用户能够受益于我们的专业知识，而无需管理个人交易。',
          })}
        </div>
      </section>
      <Snapshot vault={props.vault} />
      <Performance vault={props.vault} />
      <section className={styles['section']}>
        <h2 className={styles['title']}>
          {/* <span className={styles['icon']}>︎︎✹︎</span> */}
          {t({ enUS: 'Deposit & Redeem', zhCN: '申购与赎回' })}
        </h2>
        <div className={styles['content']}>
          <div
            dangerouslySetInnerHTML={{
              __html: t(
                {
                  enUS: '	•	When you subscribe to an Automator, your deposit amount will be converted into atUSDT shares based on its current value.<br/>	•	To withdraw your deposit, you’ll redeem atUSDT shares.<br/>	•	Upon initiating a redemption request, there is a 7-day waiting period before your shares become claimable.<br/>	•	Once claimable, you must claim within 3 days. If not claimed within this period, the redemption will expire, and you will need to submit a new request.',
                  zhCN: '	•	当您订阅 Automator 时，您的存款金额将根据当前价值转换为 atUSDT 份额。<br/>•	要提取存款，您需要赎回 atUSDT 份额。<br/>•	发起赎回请求后，有 7 天的等待期，之后您的份额才可领取。<br/>•	在份额可领取后，您必须在 3 天内领取。如果未在此期间领取，赎回将过期，您需要重新提交请求。',
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
          {t({ enUS: 'Fee Structure', zhCN: '费用结构' })}
        </h2>
        <div className={styles['content']}>
          <div
            dangerouslySetInnerHTML={{
              __html: t({
                enUS: `The Automator charges a 15% performance fee, applied only to the profits generated. This fee supports platform operations and incentivizes high-performing Automator traders.`,
                zhCN: 'Automator 收取 15% 的绩效费用，仅针对所产生的利润收取。此费用用于支持平台运营并激励高绩效的 Automator 交易者。',
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
