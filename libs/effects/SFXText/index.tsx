import { ReactNode, RefObject, useEffect, useMemo, useRef } from 'react';
import { Env } from '@sofa/utils/env';
import { useLazyCallback } from '@sofa/utils/hooks';
import { useSize } from 'ahooks';
import classNames from 'classnames';
import { nanoid } from 'nanoid';

import { autoAnimate, useScrub } from '../utils';

import './index.scss';

declare const winScale: Global['winScale'];

const defaultGradientColors = [
  { color: '#d665a3', opacity: 1 },
  { color: '#e05e2b', opacity: 1 },
  { color: '#f8d748', opacity: 1 },
  { color: '#36af73', opacity: 1 },
  { color: '#2d6fb9', opacity: 1 },
];

export const SFXText = (
  props: BaseProps & {
    children: ReactNode;
    gradientColors?: { color: string; opacity: number }[];
    elRef?: RefObject<HTMLDivElement>;
    infinite?: boolean;
  },
) => {
  const id = useMemo(() => nanoid(), []);
  const ref = useRef<SVGSVGElement>(null);
  const size = useSize(ref);
  const $setPosition = useLazyCallback((pos: { left: number; top: number }) => {
    const circle = document.querySelector<SVGCircleElement>(
      `#halo-${id} > circle`,
    );
    if (!circle) return;
    circle.cx.baseVal.value = pos.left;
    circle.cy.baseVal.value = pos.top;
  });
  const setPosition = useScrub(
    (pre, $pos: { left: number; top: number } | undefined) => {
      const rect = ref.current?.getBoundingClientRect();
      const circle = document.querySelector<SVGCircleElement>(
        `#halo-${id} > circle`,
      );
      if (!circle || !rect || !$pos) return;
      pre.current?.stop();
      const pos = $pos || {
        left: -circle.r.baseVal.value * 2,
        top: -circle.r.baseVal.value * 2,
      };
      const prePos = {
        left: circle.cx.baseVal.value,
        top: circle.cy.baseVal.value,
      };
      const offset = {
        left: pos.left - prePos.left,
        top: pos.top - prePos.top,
      };
      return autoAnimate(
        (x) =>
          $setPosition({
            left: prePos.left + offset.left * x,
            top: prePos.top + offset.top * x,
          }),
        0,
        1,
        Env.ua.getBrowser().name === 'Safari' ? 0.7 : 0.17,
      );
    },
  );
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      const rect = ref.current?.getBoundingClientRect();
      const extraRange = 100;
      const inRect =
        rect &&
        x >= rect.x - extraRange &&
        x <= rect.x + rect.width + extraRange &&
        y >= rect.y - extraRange &&
        y <= rect.y + rect.height + extraRange;
      if (inRect) {
        setPosition({ left: x - rect.x, top: y - rect.y });
      } else {
        setPosition(undefined);
      }
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [setPosition]);
  const gradientColors = props.gradientColors || defaultGradientColors;
  const parts = useMemo(() => 1, []);
  const dashLen = useMemo(() => Math.floor(100 / (parts + 1)), [parts]);
  return (
    <div
      className={classNames('sfx-text-wrapper', props.className)}
      style={props.style}
      ref={props.elRef}
    >
      <svg
        className={'sfx-text'}
        style={{
          width: props.style?.width || `100vw`,
          height: props.style?.height || '1em',
        }}
        xmlns="http://www.w3.org/2000/svg"
        ref={ref}
        viewBox={!size ? undefined : `0 0 ${size.width} ${size.height}`}
      >
        <defs>
          <linearGradient
            id={`gradient-${id}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            {gradientColors.map((it, i) => (
              <stop
                key={it.color}
                offset={`${(i / (gradientColors.length - 1)) * 100}%`}
                style={{ stopColor: it.color, stopOpacity: it.opacity }}
              />
            ))}
          </linearGradient>
          <radialGradient id={`circleGradient-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{ stopColor: '#fff', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#fff', stopOpacity: 0 }} />
          </radialGradient>
          <mask id={`halo-${id}`}>
            <circle
              cx="-1em"
              cy="-1em"
              r={`1em`}
              fill={`url(#circleGradient-${id})`}
            />
          </mask>
        </defs>
        {[...Array(parts)].map((__html, i) => (
          <text
            key={i}
            className="sfx-text-stroke"
            style={{
              animation: `stroke-offset-${parts} ${props.infinite ? 9 : 5}s ${
                props.infinite ? 'infinite' : ''
              } ease`,
            }}
            x="50%"
            y="50%"
            // dominantBaseline="middle"
            textAnchor="middle"
            fill="none"
            stroke={`url(#gradient-${id})`}
            strokeWidth={1 / winScale / 2}
            strokeDasharray={`${dashLen}% ${dashLen * (parts - 1)}%`}
            strokeDashoffset={`${dashLen * (i + 1)}%`}
          >
            {props.children}
          </text>
        ))}
        <text
          x="50%"
          y="51%"
          // dominantBaseline="middle"
          textAnchor="middle"
          fill={`url(#gradient-${id})`}
          mask={`url(#halo-${id})`}
          strokeWidth={1 / winScale / 2}
        >
          {props.children}
        </text>
      </svg>
      <style>
        {`
          @keyframes stroke-offset-${parts} {
            ${props.infinite ? '50' : '0'}% {
              stroke-dashoffset: ${dashLen * parts}%;
              stroke-dasharray: 0 85%;
            }
          }
        `}
      </style>
    </div>
  );
};
