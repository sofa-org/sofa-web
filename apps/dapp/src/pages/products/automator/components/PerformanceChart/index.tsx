import { useEffect, useMemo, useRef } from 'react';
import { Spin } from '@douyinfe/semi-ui';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { ContractsService } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import { amountFormatter } from '@sofa/utils/amount';
import { simplePlus } from '@sofa/utils/object';
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

import { formatTime } from '@/components/TimezoneSelector/store';

import { useAutomatorStore } from '../../store';

import styles from './index.module.scss';

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

export const AutomatorPerformanceChart = (
  props: BaseProps & {
    vault?: AutomatorVaultInfo;
  },
) => {
  const [t] = useTranslation('AutomatorProjectDesc');

  const isSpecial = useMemo(
    () =>
      ContractsService.AutomatorVaults.some(
        (it) =>
          it.chainId === props.vault?.chainId &&
          it.vault.toLowerCase() === props.vault?.vault.toLowerCase(),
      ),
    [props.vault],
  );

  const list = useAutomatorStore(
    (state) =>
      props.vault &&
      state.performances[
        `${props.vault.chainId}-${props.vault.vault.toLowerCase()}-`
      ],
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
        ?.map((it) => {
          const cvt = (v: number) => (!isSpecial || v >= 0 ? v : v / 10);
          return {
            tradingPnl: cvt(+it.incrTradingPnlByClientDepositCcy),
            interestPnl: cvt(+it.incrInterestPnlByClientDepositCcy),
            tradingAndInterestPnl: cvt(
              simplePlus(
                it.incrTradingPnlByClientDepositCcy,
                it.incrInterestPnlByClientDepositCcy,
              )!,
            ),
            rchPnl: cvt(+it.incrRchPnlByClientDepositCcy),
            timestamp: it.dateTime * 1000,
          };
        })
        .reverse(),
    [list, isSpecial],
  );

  const precision = useMemo(() => {
    if (!data?.length) return 0;
    const max = Math.max(
      ...data.flatMap((it) => [it.tradingPnl, it.interestPnl, it.rchPnl]),
    );
    return max > 1000 ? 0 : 2;
  }, [data]);

  useEffect(() => {
    if (!chartRef.current || !data) return;
    if (!myChart.current) myChart.current = echarts.init(chartRef.current);
    const option = {
      grid: {
        top: 80,
        left: isSpecial ? 40 : 100,
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
            result += `${amountFormatter(
              !isSpecial || item.value >= 0 ? item.value : item.value * 10,
              2,
            )} ${props.vault?.depositCcy}`;
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
          onZero: true,
          lineStyle: { color: '#0001', type: 'dashed' },
        },
      },
      yAxis: {
        show: !isSpecial,
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
          name: t({ enUS: 'PnL Of Trading & Interest', zhCN: '交易&利息盈亏' }),
          type: 'bar',
          stack: 'bar',
          data: data.map((it) => ({
            value: it.tradingAndInterestPnl,
            itemStyle: {
              color: it.tradingAndInterestPnl > 0 ? '#44C476' : '#EC5E88',
            },
          })),
        },
        // {
        //   name: `PnL Of Interest`,
        //   type: 'bar',
        //   stack: 'bar',
        //   data: data.map((it) => ({
        //     value: it.interestPnl,
        //     itemStyle: { color: '#27a0a0' },
        //   })),
        // },
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
  }, [
    t,
    data,
    props.vault?.depositCcy,
    precision,
    props.vault?.positionCcy,
    isSpecial,
  ]);

  if (!list?.length || list.length < 2) return <></>;

  return (
    <div
      className={classNames(
        styles['performance'],
        styles['section'],
        props.className,
      )}
    >
      <h2 className={styles['title']}>
        {/* <span className={styles['icon']}>︎︎✹︎</span> */}
        {t({ enUS: 'Vault Performance', zhCN: '历史表现' })}
      </h2>
      <Spin
        spinning={!list}
        wrapperClassName={classNames(styles['content'], 'content')}
      >
        <div className={styles['legend']}>
          <div className={styles['legend-item']}>
            <div
              className={styles['color']}
              style={{ background: '#44C476' }}
            />
            <div
              className={styles['color']}
              style={{ background: '#EC5E88' }}
            />
            {t({ enUS: 'PnL Of Trading & Interest', zhCN: '交易&利息盈亏' })}
          </div>
          {/* <div className={styles['legend-item']}>
            <div
              className={styles['color']}
              style={{ background: '#27a0a0' }}
            />
            {t({ enUS: 'PnL Of Interest', zhCN: '利息盈亏' })}
          </div> */}
          <div className={styles['legend-item']}>
            <div
              className={styles['color']}
              style={{ background: '#51acf1' }}
            />
            {t({ enUS: 'PnL Of RCH', zhCN: 'RCH盈亏' })}
          </div>
        </div>
        <div className={classNames(styles['chart'], 'chart')} ref={chartRef} />
      </Spin>
    </div>
  );
};
