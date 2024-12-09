import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { useTranslation } from '@sofa/services/i18n';
import { ProductType, RiskType, VaultInfo } from '@sofa/services/products';
import { amountFormatter, displayPercentage } from '@sofa/utils/amount';
import { simplePlus } from '@sofa/utils/object';
import { useSize } from 'ahooks';
import classNames from 'classnames';

import { addI18nResources } from '@/locales';

import ApyDesc from '../ApyDesc';
import { useIndexPrices } from '../IndexPrices/store';

import locale from './locale';
import { usePayoffStore } from './store';

import styles from './index.module.scss';

addI18nResources(locale, 'Payoff');

export interface PayoffChartProps extends BaseProps {
  depositCcy: VaultInfo['depositCcy'];
  productType: ProductType;
  atm?: number;
  anchorPrices: (string | number)[];
  protectedYield?: number;
  enhancedYield?: number;
  rchYield?: number;
  showYAxis?: boolean;
  showK1K2?: boolean;
  displayRchYield?: boolean;
  affectByOther?: boolean;
}

export interface PayoffProps extends PayoffChartProps {
  riskType?: RiskType;
  forCcy: CCY;
  depositCcy: VaultInfo['depositCcy'];
  depositAmount: number;
  positionAmount: number; // 对赌头寸，单位 {depositCcy}
  refMs: number; // 开始投资时间
  expMs: number; // 到期时间
}

export const PayoffChart = (props: PayoffChartProps) => {
  const [t] = useTranslation('Payoff');
  const ref = useRef<SVGSVGElement>(null);
  const $size = useSize(ref);
  const size = $size || ref.current?.getBoundingClientRect();

  const baseApy = useMemo(
    () => simplePlus(props.rchYield, props.protectedYield) || 0,
    [props.protectedYield, props.rchYield],
  );
  const maxApy = useMemo(
    () => simplePlus(baseApy, props.enhancedYield)!,
    [baseApy, props.enhancedYield],
  );

  useLayoutEffect(() => {
    if (!props.affectByOther) return;
    usePayoffStore.addMaxYield(props.depositCcy, props.productType, maxApy);
    usePayoffStore.addMinYield(props.depositCcy, props.productType, baseApy);
    return () => {
      usePayoffStore.removeMaxYield(
        props.depositCcy,
        props.productType,
        maxApy,
      );
      usePayoffStore.removeMinYield(
        props.depositCcy,
        props.productType,
        baseApy,
      );
    };
  }, [
    baseApy,
    maxApy,
    props.affectByOther,
    props.depositCcy,
    props.productType,
  ]);

  const apyList: [{ x: number; value: string | number }, number][] =
    useMemo(() => {
      if (props.productType === ProductType.BullSpread) {
        return [
          [{ x: 0, value: 0 }, baseApy],
          [{ x: 1 / 3, value: props.anchorPrices[0] }, baseApy],
          [{ x: 2 / 3, value: props.anchorPrices[1] }, maxApy],
          [{ x: 1, value: Infinity }, maxApy],
        ];
      }
      if (props.productType === ProductType.BearSpread) {
        return [
          [{ x: 0, value: 0 }, maxApy],
          [{ x: 1 / 3, value: props.anchorPrices[0] }, maxApy],
          [{ x: 2 / 3, value: props.anchorPrices[1] }, baseApy],
          [{ x: 1, value: Infinity }, baseApy],
        ];
      }
      return [
        [{ x: 0, value: 0 }, baseApy],
        [{ x: 1 / 3, value: props.anchorPrices[0] }, baseApy],
        [{ x: 1 / 3, value: props.anchorPrices[0] }, maxApy],
        [{ x: 2 / 3, value: props.anchorPrices[1] }, maxApy],
        [{ x: 2 / 3, value: props.anchorPrices[1] }, baseApy],
        [{ x: 1, value: Infinity }, baseApy],
      ];
    }, [baseApy, maxApy, props.anchorPrices, props.productType]);

  const maxYield = usePayoffStore(
    (state) =>
      (props.affectByOther &&
        state.computedMaxYield()[`${props.depositCcy}-${props.productType}`]) ||
      maxApy,
  );
  const minYield = usePayoffStore(
    (state) =>
      (props.affectByOther &&
        state.computedMinYield()[`${props.depositCcy}-${props.productType}`]) ||
      Math.min(props.rchYield || 0, props.protectedYield || 0),
  );
  const y = useCallback(
    (apy: number) => {
      const maxHeight = size!.height - 24 / window.winScale;
      const calc = (val: number) =>
        size!.height -
        ((minYield < 0 ? 12 : 4) / window.winScale +
          (val - minYield) * (maxHeight / ((maxYield || 1) - minYield)));
      if (props.affectByOther) {
        const { maxYields } = usePayoffStore.getState();
        const len =
          maxYields[`${props.depositCcy}-${props.productType}`]?.length;
        const index =
          maxYields[`${props.depositCcy}-${props.productType}`]?.findIndex(
            (it) => it === maxApy,
          ) ?? -1;
        if (len && index !== -1) {
          const minY =
            size!.height -
            (maxHeight / 4 + (((maxHeight * 3) / 4) * (index + 1)) / len);
          if (apy === maxApy) return minY;
          return Math.max(minY + 10, calc(apy));
        }
      }
      const minY = calc(maxYield);
      if (apy === maxYield) return minY;
      return Math.max(minY + 10, calc(apy));
    },
    [
      size,
      props.affectByOther,
      props.depositCcy,
      props.productType,
      maxYield,
      minYield,
      maxApy,
    ],
  );
  const [path, texts] = useMemo(() => {
    if (!size) return [];
    const p = `
      M 0 ${size.height}
      ${apyList
        .map((it) => `L ${it[0].x * size.width} ${y(it[1])}`)
        .join('\n\r')}
      L ${size.width} ${size.height}
      Z
    `;
    const t = (() => {
      if (props.showYAxis) return undefined;
      return [
        {
          x: (1 / 6) * size.width,
          y: y(apyList[0][1]) - 8 / window.winScale,
          txt: displayPercentage(apyList[0][1]),
        },
        ...(props.productType === ProductType.DNT
          ? [
              {
                x: (3 / 6) * size.width,
                y: y(maxApy) - 8 / window.winScale,
                txt: displayPercentage(maxApy),
              },
            ]
          : []),
        {
          x: (5 / 6) * size.width,
          y: y(apyList[apyList.length - 1][1]) - 8 / window.winScale,
          txt: displayPercentage(apyList[apyList.length - 1][1]),
        },
      ];
    })();
    return [p, t] as const;
  }, [apyList, maxApy, props.productType, props.showYAxis, size, y]);
  const [rchYieldPath, protectedYieldPath, maxYieldPath] = useMemo(() => {
    if (!props.displayRchYield || !size) return [];
    const protectedY = y(props.protectedYield || 0);
    const rchY = y(baseApy);
    const maxY = y(maxApy);
    return [
      `
        M 0 ${protectedY}
        L 0 ${rchY}
        L ${size.width} ${rchY}
        L ${size.width} ${protectedY}
        Z
      `,
      `
        M 0 ${size.height}
        L 0 ${protectedY}
        L ${size.width} ${protectedY}
        L ${size.width} ${size.height}
        Z
      `,
      `M 0 ${maxY} L ${size.width} ${maxY}`,
    ];
  }, [baseApy, maxApy, props.displayRchYield, props.protectedYield, size, y]);

  const yAxisLabelHeight = useMemo(() => {
    const protectedLabelHeight = !size
      ? undefined
      : Math.max(size.height - y(props.protectedYield || 0), 0);
    const rchLabelHeight = !size
      ? undefined
      : Math.max(
          size.height - y(baseApy),
          (protectedLabelHeight || 0) + 14 / window.winScale,
        );
    const enhancedLabelHeight = !size
      ? undefined
      : Math.max(
          size.height - y(maxApy),
          (10 * 2) / window.winScale,
          (rchLabelHeight || 0) + 14 / window.winScale,
        );
    return [protectedLabelHeight, rchLabelHeight, enhancedLabelHeight];
  }, [baseApy, maxApy, props.protectedYield, size, y]);

  return (
    <div
      className={classNames(styles['payoff-chart'], props.className, {
        [styles['show-axis']]: props.showYAxis,
      })}
      style={{ ...props.style }}
    >
      <svg
        ref={ref}
        width="100%"
        height="100%"
        viewBox={!size ? undefined : `0 0 ${size.width} ${size.height}`}
      >
        {/* <defs>
          <linearGradient id="fadeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop
              offset="0%"
              style={{ stopColor: '#50D113', stopOpacity: 1 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: '#50D113', stopOpacity: 0 }}
            />
          </linearGradient>
        </defs> */}
        {path && <path d={path} fill="#50D113" />}
        {protectedYieldPath && (
          <path
            d={protectedYieldPath}
            fill={props.protectedYield! < 0 ? '#B9B3BE' : '#94E270'}
          />
        )}
        {rchYieldPath && <path d={rchYieldPath} fill="var(--color-rch)" />}
        {maxYieldPath && props.showYAxis && (
          <path
            d={maxYieldPath}
            strokeWidth={0.4}
            strokeDasharray="3 2"
            stroke="rgba(0,0,0,0.3)"
          />
        )}
        {texts?.map((it) => (
          <text
            key={it.x}
            x={it.x}
            y={it.y}
            dominantBaseline="middle"
            textAnchor="middle"
            fill="#50D113"
            fontWeight={700}
            fontSize={12 / window.winScale}
          >
            {it.txt}
          </text>
        ))}
      </svg>
      {props.showYAxis && (
        <div className={classNames(styles['y-axis'], 'y-axis')}>
          {!!props.protectedYield && (
            <span
              className={classNames(styles['label'], 'label')}
              style={{ height: yAxisLabelHeight[0] }}
            >
              <span>{t('Base Yield')}</span>
              <span
                style={{
                  color: props.protectedYield! < 0 ? '#B9B3BE' : '#50D113',
                }}
              >
                {displayPercentage(props.protectedYield)}
              </span>
            </span>
          )}
          {!!baseApy && (
            <span
              className={classNames(styles['label'], 'label')}
              style={{ height: yAxisLabelHeight[1] }}
            >
              <span>
                {t('Base + RCH')}
                {/* <span>| {t('With RCH')}</span> */}
              </span>
              <span style={{ color: baseApy < 0 ? '#B9B3BE' : '#50D113' }}>
                {displayPercentage(baseApy)}
              </span>
            </span>
          )}
          <span
            className={classNames(styles['label'], 'label')}
            style={{ height: yAxisLabelHeight[2] }}
          >
            <span>{t('Potential Yield')}</span>
            <span style={{ color: maxApy < 0 ? '#B9B3BE' : '#50D113' }}>
              {displayPercentage(maxApy)}
            </span>
          </span>
        </div>
      )}
      <div className={classNames(styles['x-axis'], 'x-axis')}>
        {props.anchorPrices.map((it, i) => (
          <div
            className={classNames(styles['anchor-price'], 'anchor-price')}
            style={{ left: `${(100 * (i + 1)) / 3}%` }}
            key={it}
          >
            {props.showK1K2 && `K${i + 1}=`}
            {amountFormatter(it, 0)}
          </div>
        ))}
        {!!props.atm && (
          <div
            className={classNames(styles['atm-price'], 'atm-price')}
            style={{
              left: `${Math.max(
                3,
                Math.min(
                  97,
                  (100 / 3) *
                    (1 +
                      (props.atm - +props.anchorPrices[0]) /
                        (+props.anchorPrices[1] - +props.anchorPrices[0])),
                ),
              )}%`,
            }}
          >
            <span>{t('Now')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Payoff = (props: PayoffProps) => {
  const [t] = useTranslation('Payoff');

  const maxApy = useMemo(
    () =>
      simplePlus(props.rchYield, props.protectedYield, props.enhancedYield)!,
    [props.enhancedYield, props.protectedYield, props.rchYield],
  );
  const atm = useIndexPrices((state) => state.prices[props.forCcy]);

  return (
    <div className={classNames(styles['payoff'], 'payoff')}>
      <div className={classNames(styles['max-apy'], 'max-apy')}>
        <span>
          {displayPercentage(maxApy).replace('%', '')}
          <span>%</span>
          {props.riskType === RiskType.LEVERAGE && (
            <span className={styles['badge-leverage']}>Lev.</span>
          )}
        </span>
        <ApyDesc>{t('type')}</ApyDesc>
      </div>
      <PayoffChart atm={atm} {...props} affectByOther />
    </div>
  );
};
export default Payoff;
