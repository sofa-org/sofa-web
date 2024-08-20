import { RefObject, useMemo } from 'react';
import classNames from 'classnames';
import { nanoid } from 'nanoid';

import './index.scss';

export const RotateText = (
  props: BaseProps & {
    elRef?: RefObject<HTMLDivElement>;
    color?: string;
    fontSize: number;
    children: string;
    speed?: number;
    radius?: number; // 默认根据 fontSize 和文字数量计算得出
  },
) => {
  const id = useMemo(() => nanoid(), []);
  const radius = useMemo(
    () =>
      props.radius ||
      Math.ceil(((props.children.length + 3) * props.fontSize) / Math.PI / 2),
    [props.children.length, props.fontSize, props.radius],
  );
  const size = useMemo(
    () => radius * 2 + props.fontSize,
    [props.fontSize, radius],
  );
  const viewBox = useMemo(() => `0 0 ${size} ${size}`, [size]);
  return (
    <div
      ref={props.elRef}
      className={classNames('rotate-text', props.className)}
      style={{
        ...props.style,
        animation: `rotate ${props.speed || 50}s linear infinite`, // 直接用在 svg 上会导致 cpu 使用率大幅上升
      }}
      id={props.id}
    >
      <svg viewBox={viewBox}>
        <path
          id={`text-circle-${id}`}
          d={`
          M ${size / 2}, ${size / 2}
          m -${radius}, 0
          a ${radius},${radius} 0 1,1 ${radius * 2},0
          a ${radius},${radius} 0 1,1 ${-radius * 2},0
        `}
          fill="none"
        />
        <text
          fill={props.color || 'currentColor'}
          dominantBaseline="middle"
          fontSize={props.fontSize}
          textLength={Math.PI * 2 * radius}
        >
          <textPath
            href={`#text-circle-${id}`}
            textLength={Math.PI * 2 * radius}
          >
            {props.children}&nbsp;&nbsp;
          </textPath>
        </text>
      </svg>
    </div>
  );
};
