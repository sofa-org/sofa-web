/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  forwardRef,
  ReactNode,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { isNullLike } from '@sofa/utils/fns';
import { useLazyCallback, useRefState } from '@sofa/utils/hooks';
import { useInViewport } from 'ahooks';
import useEffectWithTarget from 'ahooks/es/utils/useEffectWithTarget';
import classNames from 'classnames';
import { nanoid } from 'nanoid';

import { autoAnimate, lerp1, useScrub } from '../utils';

// @ts-ignore
import { flattenPathFac } from './utils';

import './index.scss';

interface FilterRefProps {
  distance: number;
  setDistance(distance: number): void;
}
const filters = {
  Blur: forwardRef<FilterRefProps, { id: string }>((props, ref) => {
    const distanceRef = useRef(0);
    useImperativeHandle(ref, () => ({
      distance: distanceRef.current,
      setDistance: (distance: number) => {
        const stdDeviation = lerp1(distance, [0, 0], [400, 30]);
        const el = document.querySelector<SVGFEGaussianBlurElement>(
          `#blur-${props.id} > feGaussianBlur`,
        );
        if (!el) return;
        el.stdDeviationX.baseVal = stdDeviation;
        el.stdDeviationY.baseVal = stdDeviation;
      },
    }));
    return (
      <filter
        id={`blur-${props.id}`}
        x="-30%"
        y="-30%"
        width="160%"
        height="160%"
      >
        <feGaussianBlur in="SourceAlpha" result="glow" />
        <feColorMatrix
          result="bluralpha"
          type="matrix"
          values="0 -1 0 0 0 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1.8 0 "
        />
        <feOffset
          in="bluralpha"
          dx="0.000000"
          dy="0.000000"
          result="offsetBlur"
        />
        <feMerge>
          <feMergeNode in="offsetBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    );
  }),
  Distortion: forwardRef<FilterRefProps, { id: string }>((props, ref) => {
    const distanceRef = useRef(0);
    useImperativeHandle(ref, () => ({
      distance: distanceRef.current,
      setDistance: (distance: number) => {
        const scale = lerp1(distance, [0, 0], [400, 30]);
        const el = document.querySelector<SVGFEDisplacementMapElement>(
          `#distortion-${props.id} > feDisplacementMap`,
        );
        if (!el) return;
        el.scale.baseVal = scale;
      },
    }));
    return (
      <filter id={`distortion-${props.id}`}>
        <feGaussianBlur stdDeviation="1" result="glow" />
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0 0.1"
          numOctaves="2"
          seed="2"
          stitchTiles="noStitch"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
          result="noise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          xChannelSelector="R"
          yChannelSelector="B"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
          filterUnits="userSpaceOnUse"
          result="displacement"
        />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="displacement" />
        </feMerge>
      </filter>
    );
  }),
};

function calcBoundaryStartOffset(
  svg: SVGSVGElement,
  pathLenInViewBox: number, // startOffset 的值最终需要等比缩放到 viewBox 容器中
  boundaryEl?: Element | null,
  direction?: 'left' | 'right',
) {
  // 计算边界处的 startOffset
  const pathRect = svg.querySelector('path')!.getBoundingClientRect();
  const pathLen = pathRect.width;
  const scale = pathLenInViewBox / pathLen;
  const textRect = svg.querySelector('text')!.getBoundingClientRect();
  const textLen = svg.querySelector('text')!.getComputedTextLength();
  const boundaryRect = boundaryEl?.getBoundingClientRect();
  const boundaryStartOffset = (() => {
    if (!boundaryRect) return undefined;
    if (direction === 'right') {
      if (pathRect.right < boundaryRect.right) return undefined;
      return (
        (pathLen - (pathRect.right - boundaryRect.right + textLen / scale)) *
        scale
      );
    }
    if (boundaryRect.left < pathRect.left) return undefined;
    return (boundaryRect.left - pathRect.left) * scale;
  })();
  return {
    scale,
    pathLen,
    pathRect,
    textLen,
    textRect,
    boundaryRect,
    boundaryStartOffset,
  };
}

function calc(
  svg: SVGSVGElement,
  pathLenInViewBox: number,
  boundaryEl?: Element | null,
  direction?: 'left' | 'right',
) {
  const {
    scale,
    pathLen,
    pathRect,
    textLen,
    textRect,
    boundaryRect,
    boundaryStartOffset,
  } = calcBoundaryStartOffset(svg, pathLenInViewBox, boundaryEl, direction);
  const preStartOffset =
    svg.querySelector('textPath')!.startOffset.baseVal.value;
  const distanceToBoundary = (() => {
    if (!boundaryStartOffset) return Infinity;
    return direction === 'right'
      ? boundaryStartOffset - preStartOffset
      : preStartOffset - boundaryStartOffset;
  })();
  return {
    scale,
    pathLen,
    pathRect,
    textRect,
    boundaryRect,
    preStartOffset,
    distanceToBoundary,
    boundaryStartOffset,
    textLen,
  };
}

export interface FloatingTextProps extends BaseProps {
  children: ReactNode;
  dStartOffset?: number; // 定义 textPath 的固定偏移量，用于校正位置
  viewBox?: string;
  path?: string | number; // 为数字时，表示选择默认路径列表的的第 Math.floor(n) % paths.length 条路径
  color?: string;
  filterType?: 'blur' | 'distortion';
  direction?: 'left' | 'right'; // left - 向左浮动；right - 向右浮动
  // 文字对应的左边界或者右边界参考物，定义文字浮动到多少不再浮动（固定位置）（与 direction 相关）
  alignBoundaryEl?(): HTMLElement | null;
  fixAtBoundary?: boolean; // 控制是否阻止文字超出边界, default: false
  boundaryClientY?: number; // 控制滚动到视窗多少达到边界，default: window.innerHeight / 2
  defs?: ReactNode; // 定义 svg 渐变等
  scrollParent?(): HTMLElement | null; // default: document.querySelector('#root')
}

function useFilter(props: FloatingTextProps & { id: string }) {
  const Filter =
    props.filterType &&
    filters[props.filterType === 'blur' ? 'Blur' : 'Distortion'];
  const ref = useRef<FilterRefProps>(null);

  return { el: Filter ? <Filter id={props.id} ref={ref} /> : <></>, ref };
}

export const FloatingText = (props: FloatingTextProps) => {
  const ref = useRef<SVGSVGElement>(null);
  const id = useMemo(() => nanoid(), []);

  const path = useMemo(() => {
    if (typeof props.path === 'string')
      return {
        path: props.path,
        viewBox: props.viewBox || '0 0 1000 300',
        flatten: flattenPathFac(props.path),
      };
    const paths = [
      {
        p: 'M 0 50 Q 100 0 200 100 Q 300 200 650 50 C 750 0 750 150 1000 50',
        viewBox: '0 0 1000 250',
      },
      {
        p: 'M 0 200 Q 150 300 300 200 Q 700 0 1000 150',
        viewBox: '0 0 1000 300',
      },
      {
        p: 'M 0 100 Q 250 200 500 100 Q 750 0 1000 100',
        viewBox: '0 0 1000 200',
      },
      {
        p: 'M 0 150 Q 200 50 500 50 Q 800 50 1000 150',
        viewBox: '0 0 1000 200',
      },
      {
        p: 'M 0 0 Q 200 150 500 150 Q 850 150 1000 0',
        viewBox: '0 0 1000 200',
      },
    ];
    const p =
      paths[
        props.path
          ? Math.floor(props.path) % paths.length
          : Math.floor(Math.random() * paths.length)
      ];
    return { path: p.p, viewBox: p.viewBox, flatten: flattenPathFac(p.p) };
  }, [props.path, props.viewBox]);

  const $setStartOffset = useLazyCallback((startOffset: number) => {
    const el = ref.current?.querySelector<SVGTextPathElement>('textPath');
    if (!el) return;
    const sOffset = (() => {
      if (!startOffset) {
        const pathLen = ref
          .current!.querySelector('path')!
          .getBoundingClientRect().width;
        return props.direction === 'right' ? -pathLen : pathLen;
      }
      return startOffset + (props.dStartOffset || 0);
    })();
    el.startOffset.baseVal.value = sOffset;
  });
  const setStartOffset = useScrub((pre, startOffset: number) => {
    const start =
      ref.current?.querySelector<SVGTextPathElement>('textPath')?.startOffset
        .baseVal.value;
    if (isNullLike(start)) return;
    pre.current?.stop();
    return autoAnimate((x) => $setStartOffset(x), start, startOffset, 0.05);
  });
  const [flattenRate, setFlattenRate] = useState(0);
  const scrollTop = useRef<number>();
  const filter = useFilter({ ...props, id });
  const filterFlow = useScrub((pre, filterScroll?: number) => {
    // 高级滤镜的变化
    if (!filterScroll || !scrollTop.current || !filter.ref.current) return;
    pre.current?.stop();
    const end = scrollTop.current;
    return autoAnimate(
      (x) => filter.ref.current?.setDistance(x),
      Math.abs(filterScroll - end) * 5,
      0,
      0.01,
    );
  });
  const [inView] = useInViewport(() => ref.current);
  const inViewRef = useRefState(inView);
  const renderCountRef = useRef(0);
  useEffectWithTarget(
    () => {
      if (!ref.current) return;
      const parent = props.scrollParent?.() || document.querySelector('#root')!;
      const boundaryEl = props.alignBoundaryEl?.();
      const $handler = () => {
        const init = renderCountRef.current === 0;
        renderCountRef.current += 1;
        if (!ref.current || !inViewRef.current) return;
        const {
          pathLen,
          preStartOffset,
          distanceToBoundary,
          boundaryStartOffset,
        } = calc(ref.current, path.flatten.width, boundaryEl, props.direction);
        const svgRect = ref.current.getBoundingClientRect();

        const hasIntersect = distanceToBoundary < 4;
        const isUproll = (() => {
          const bool =
            scrollTop.current && parent.scrollTop < scrollTop.current;
          const oldScrollTop = scrollTop.current;
          scrollTop.current = parent.scrollTop;
          filterFlow(oldScrollTop);
          return bool;
        })();

        const x = (svgRect.top + svgRect.bottom) / 2;

        // 以下三种情况移动文字：
        // 1. 向下滚动的时候，还未触及边界或者 fixAtBoundary 不为 true
        // 2. 向上滚动的时候;
        // 3. 初始化
        if (
          init ||
          (!isUproll ? !props.fixAtBoundary || !hasIntersect : true)
        ) {
          const points = (() => {
            const flag = props.direction === 'right' ? -1 : 1;
            const list: [[number, number], [number, number]] = [
              [0, -pathLen * flag],
              [window.innerHeight, pathLen * flag],
            ];
            if (boundaryStartOffset) {
              list[0] = [
                props.boundaryClientY ?? window.innerHeight / 2,
                boundaryStartOffset - (props.dStartOffset || 0),
              ];
            }
            return list;
          })();

          // 线性差值
          const val = lerp1(
            boundaryStartOffset && props.fixAtBoundary
              ? Math.max(points[0][0], x)
              : x,
            ...points,
          );
          if (init)
            autoAnimate(
              (x) => renderCountRef.current <= 1 && setStartOffset(x),
              preStartOffset,
              val,
              0.02,
              (d) => {
                if (renderCountRef.current > 1) return true;
                if (d < 1) return true;
                if (!ref.current) return true;
                const { distanceToBoundary } = calc(
                  ref.current,
                  path.flatten.width,
                  boundaryEl,
                  props.direction,
                );
                return distanceToBoundary < 1;
              },
            );
          else setStartOffset(val);
        }
        // // 当文字从 4/7 屏幕高度到屏幕中间，将文字抚平，反过来则恢复路劲曲线
        // // 如果存在边界，则在边界处抚平文字
        // if (
        //   x >= (window.innerHeight * 3) / 7 &&
        //   x <= (window.innerHeight * 4) / 7
        // ) {
        //   const points: [[number, number], [number, number]] = [
        //     [window.innerHeight / 2, 1],
        //     [(window.innerHeight * 4) / 7, 0],
        //   ];
        //   const r = (() => {
        //     const v = lerp1(x, ...points);
        //     return boundaryEl && props.fixAtBoundary ? Math.min(1, v) : v;
        //   })();
        //   if (init) {
        //     autoAnimate(
        //       (x) => renderCountRef.current <= 1 && setFlattenRate(x),
        //       0,
        //       r,
        //       boundaryEl && props.fixAtBoundary ? 0.02 : 0.1,
        //       (d) => d < 0.001,
        //     );
        //   } else setFlattenRate(r);
        // }
      };
      const handler = () => requestAnimationFrame(() => $handler());
      parent.addEventListener('scroll', handler);
      $handler();
      return () => {
        parent.removeEventListener('scroll', handler);
      };
    },
    [
      props.direction,
      props.dStartOffset,
      path.flatten.width,
      props.fixAtBoundary,
      props.boundaryClientY,
    ],
    () =>
      [props.scrollParent?.(), props.alignBoundaryEl?.()]
        .flatMap((it) => [it?.classList, it?.id])
        .join(':::'),
  );

  const textPath = useMemo(
    () => path.flatten(flattenRate),
    [path, flattenRate],
  );

  const [adjustedFontSize, setAdjustedFontSize] = useState<number>();
  useEffectWithTarget(
    () => {
      if (!ref.current) return;
      const pathRect = ref.current
        .querySelector('path')!
        .getBoundingClientRect();
      const pathLen = pathRect.width;
      const scale = pathLen / path.flatten.width;
      const fontSize = parseInt(window.getComputedStyle(ref.current).fontSize);
      setAdjustedFontSize(fontSize / scale);
    },
    [path.flatten.width],
    () => ref.current,
  );

  return (
    <svg
      ref={ref}
      className={classNames('floating-text', props.className)}
      style={props.style}
      data-filter-type={props.filterType}
      viewBox={path.viewBox}
    >
      <defs>
        {filter.el}
        {props.defs}
      </defs>
      <path id={`text-curve-${id}`} d={textPath} fill="none" />
      <text
        filter={props.filterType && `url(#${props.filterType}-${id})`}
        fill={props.color || 'currentColor'}
        dominantBaseline="middle"
        fontSize={adjustedFontSize}
      >
        <textPath
          href={`#text-curve-${id}`}
          startOffset={props.direction === 'right' ? '-100%' : '100%'}
          dominantBaseline="middle"
        >
          {props.children}
        </textPath>
      </text>
    </svg>
  );
};
