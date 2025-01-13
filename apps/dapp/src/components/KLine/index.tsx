import { CSSProperties, ReactNode, useEffect, useMemo, useRef } from 'react';
import { Spin } from '@douyinfe/semi-ui';
import { VaultInfo } from '@sofa/services/base-type';
import { MarketService } from '@sofa/services/market';
import { amountFormatter } from '@sofa/utils/amount';
import { MsIntervals, pre8h } from '@sofa/utils/expiry';
import { calcMinAndMax, calcVal } from '@sofa/utils/fns';
import { useRequest, useSize } from 'ahooks';
import classNames from 'classnames';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  TooltipComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

import { useIndexPrices } from '../IndexPrices/store';
import { formatTime, useTimezone } from '../TimezoneSelector/store';

import styles from './index.module.scss';

echarts.use([
  GridComponent,
  MarkLineComponent,
  MarkPointComponent,
  MarkAreaComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition,
  TooltipComponent,
]);

export interface KLineProps {
  id?: string;
  forCcy: VaultInfo['forCcy'];
  anchorPrices?: (string | number)[];
  children?: ReactNode;
  relateElPositions?: [
    // 关联元素的左上角相对于这个图表（右上角）的位置
    { left: number; top: number },
    // 关联元素的左下角相对于这个图表（右上角）的位置
    { left: number; top: number },
  ];
  style?: CSSProperties;
}

const KLine = (props: KLineProps) => {
  const timezone = useTimezone();
  const atm = useIndexPrices((state) => state.prices[props.forCcy]);

  const { data, loading } = useRequest(
    () =>
      MarketService.dailyCandles(
        props.forCcy,
        pre8h(undefined, 30),
        Date.now(),
      ).then((res) =>
        res.map((it) => [it.timestamp * 1000, it.close]).reverse(),
      ),
    {
      refreshDeps: [props.forCcy],
      pollingInterval: MsIntervals.min * 10,
    },
  );

  const ref = useRef<HTMLDivElement>(null);
  const { min, max } = useMemo(
    () =>
      !data
        ? { min: undefined, max: undefined }
        : calcMinAndMax(
            data.concat([
              ...(props.anchorPrices?.map((it) => [0, +it]) || []),
              ...(atm ? [[0, +atm]] : []),
            ]),
            '1',
            { min: 0 },
          ),
    [atm, data, props.anchorPrices],
  );
  const grid = useMemo(
    () => ({
      // 写死，用于给 anchorPrices 定位
      top: 0,
      bottom: 30,
      right: 70,
      left: 0,
    }),
    [],
  );
  const myChart = useRef<ReturnType<typeof echarts.init>>();
  useEffect(() => {
    if (!ref.current || !data?.length) return;
    if (!myChart.current) myChart.current = echarts.init(ref.current);
    const xMinAndMax = {
      min: data[0][0] - MsIntervals.day,
      max: data[data.length - 1][0] + MsIntervals.day,
    };
    const option = {
      grid,
      tooltip: {
        show: true,
        trigger: 'axis',
        formatter: (data: { data: [number, number]; marker: string }[]) => {
          const [x, y] = data[0].data;
          return `
          <div style="margin: 0px 0 0;line-height:1;">
            <div style="margin: 0px 0 0;line-height:1;">
              <div style="font-size:14px;color:#666;font-weight:400;line-height:1;">
              ${formatTime(x, 'MM-DD HH:mm')}
              </div>
              <div style="margin: 10px 0 0;line-height:1;">
                <div style="margin: 0px 0 0;line-height:1;">
                  <div style="margin: 0px 0 0;line-height:1;">
                    ${data[0].marker}
                    <span style="float:right;margin-left:10px;font-size:14px;color:#666;font-weight:900">${amountFormatter(
                      y,
                      2,
                    )}</span>
                    <div style="clear:both"></div>
                  </div>
                  <div style="clear:both"></div>
                </div>
                <div style="clear:both"></div>
              </div>
              <div style="clear:both"></div>
            </div>
            <div style="clear:both"></div>
          </div>
          `;
        },
      },
      xAxis: {
        type: 'value',
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
          },
        },
        ...xMinAndMax,
        splitNumber: 6,
        axisLabel: {
          formatter: (v: number) =>
            v === xMinAndMax.min || v === xMinAndMax.max
              ? ''
              : formatTime(v, 'MM-DD'),
          color: '#000',
        },
        axisTick: {
          lineStyle: { color: '#ddd' },
        },
        axisLine: {
          show: false,
          lineStyle: { color: '#ddd' },
        },
      },
      yAxis: {
        type: 'value',
        position: 'right',
        min,
        max,
        axisLine: {
          show: false,
          lineStyle: { color: '#ddd' },
        },
        splitLine: false,
        axisLabel: {
          formatter: (v: number) => (v === min || v === max ? '' : v),
          color: '#000',
        },
        axisTick: {
          show: true,
          lineStyle: { color: '#ddd' },
        },
      },
      series: [
        {
          type: 'line',
          data: data,
          showSymbol: false,
          lineStyle: { width: 0.5, color: '#000' },
          markLine: {
            silent: true,
            symbol: 'none',
            animation: false,
            data: [
              ...(atm
                ? [
                    {
                      yAxis: atm,
                      label: {
                        padding: 4,
                        width: 70,
                        color: '#fff',
                        backgroundColor: '#000',
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter: (v: any) => amountFormatter(v.data.yAxis, 2),
                      },
                    },
                  ]
                : []),
              ...(props.anchorPrices?.map((it) => ({
                yAxis: +it,
                lineStyle: {
                  color: '#44C476',
                },
                label: {
                  padding: 4,
                  width: 70,
                  color: '#000',
                  backgroundColor: '#44C476',
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter: (v: any) => amountFormatter(v.data.yAxis, 2),
                },
              })) || []),
            ],
          },
          markArea: props.anchorPrices
            ? {
                silent: true,
                data: [
                  props.anchorPrices.map((it, i) => ({
                    x: i === 0 ? 0 : '100%',
                    yAxis: +it,
                  })),
                ],
                itemStyle: {
                  color: '#44C4761e',
                },
              }
            : undefined,
        },
      ],
    };

    myChart.current.setOption(option);
  }, [atm, data, grid, max, min, props.anchorPrices, timezone]);

  const size = useSize(ref);
  const anchorPriceLinePositions = useMemo(() => {
    if (!size || !min || !props.anchorPrices) return undefined;
    const height = size.height - grid.top - grid.bottom;
    const k = (height - 0) / (min - max);
    return props.anchorPrices.map((it) => ({ left: 0, top: k * (+it - max) }));
  }, [size, min, props.anchorPrices, grid.top, grid.bottom, max]);
  const relativeLineStyle = useMemo(() => {
    if (!props.relateElPositions || !anchorPriceLinePositions) return undefined;
    const top =
      Math.min(
        ...props.relateElPositions.map((it) => it.top),
        ...anchorPriceLinePositions.map((it) => it.top),
      ) + grid.top;
    const width = Math.max(...props.relateElPositions.map((it) => it.left));
    const height =
      Math.max(
        ...props.relateElPositions.map((it) => it.top),
        ...anchorPriceLinePositions.map((it) => it.top),
      ) -
      top +
      grid.top;
    return { position: 'absolute' as const, left: '100%', top, width, height };
  }, [anchorPriceLinePositions, grid.top, props.relateElPositions]);
  const relativeLinePath = useMemo(() => {
    if (
      !props.relateElPositions ||
      !anchorPriceLinePositions ||
      !relativeLineStyle
    )
      return undefined;
    const points = [
      ...anchorPriceLinePositions.sort((a, b) => a.top - b.top),
      ...props.relateElPositions.sort((a, b) => b.top - a.top),
    ].map((it) => {
      // 转换成 svg 坐标, svg 的原点为 [0, relativeLineStyle.top];
      const x = it.left;
      const y = it.top - relativeLineStyle.top;
      return { x, y };
    });
    return (
      points.reduce((pre, it, i) => {
        if (i === 0) return pre + `M ${it.x} ${it.y} `;
        return pre + `L ${it.x} ${it.y} `;
      }, '') + 'Z'
    );
  }, [anchorPriceLinePositions, props.relateElPositions, relativeLineStyle]);

  useEffect(() => {
    myChart.current?.resize();
  }, [size]);

  return (
    <Spin
      wrapperClassName={classNames('k-line-wrapper', styles['k-line-wrapper'])}
      spinning={loading}
    >
      <div
        className={classNames('k-line', styles['k-line'])}
        style={props.style}
        ref={ref}
        id={props.id}
      />
      {relativeLinePath && (
        <svg
          className={classNames(
            'k-line-relative-line',
            styles['k-line-relative-line'],
          )}
          key={relativeLinePath}
          style={relativeLineStyle}
        >
          <path d={relativeLinePath} fill="#44C4761e" />
        </svg>
      )}
      <div
        className={classNames(
          'k-line-extra-content',
          styles['k-line-extra-content'],
        )}
      >
        {calcVal(props.children)}
      </div>
    </Spin>
  );
};

export default KLine;
