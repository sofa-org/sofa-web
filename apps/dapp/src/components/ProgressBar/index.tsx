import {
  MouseEvent,
  ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import Draggable from 'react-draggable';
import { useLazyCallback } from '@sofa/utils/hooks';
import { useSize } from 'ahooks';
import classNames from 'classnames';

import styles from './index.module.scss';

export interface ProgressBarProps extends BaseProps {
  type?: '1' | '2' | '3';
  disabled?: boolean;
  percent: number;
  children?: ReactNode;
  minWidthPercentage?: number;
  onClick?(e: MouseEvent<HTMLDivElement>): void;
  onPercentChange?(percent: number): void;
}

const ProgressBar = (props: ProgressBarProps) => {
  const wrapper = useRef<HTMLDivElement>(null);
  const slider = useRef<HTMLDivElement>(null);

  const wrapperSize = useSize(wrapper);
  const sliderSize = useSize(slider);

  const [tempVal, setTempVal] = useState(() => Number(props.percent) || 0);
  useLayoutEffect(() => {
    setTempVal(props.percent);
  }, [props.percent]);
  const handleChange = useLazyCallback((x: number, temp?: boolean) => {
    if (props.disabled) return;
    const el = wrapper.current;
    if (!el) return;
    const width = el?.offsetWidth;
    const percent = Math.min(1, x / width);
    setTempVal(percent);
    if (!temp) props.onPercentChange?.(percent);
  });

  return (
    <div
      className={classNames(
        styles['progress'],
        'progress-wrapper',
        props.className,
        {
          [styles['type-2']]: props.type === '2',
          [styles['type-3']]: props.type === '3',
        },
      )}
      style={props.style}
      onClick={(e) => {
        props.onClick?.(e);
        handleChange(e.clientX - wrapper.current!.getBoundingClientRect().left);
      }}
      ref={wrapper}
    >
      {props.type === '2' &&
        [...Array(10)].map((_, i) => <div className={styles['dot']} key={i} />)}
      <div
        className={classNames(styles['progress-bar'], 'progress-bar')}
        style={{
          width: !tempVal
            ? 0
            : `${Math.max(tempVal * 100, props.minWidthPercentage || 0.1)}%`,
        }}
      />
      {props.type === '2' && !!wrapperSize?.width && (
        <Draggable
          axis="x"
          disabled={props.disabled}
          position={{
            x: tempVal * (wrapperSize.width - (sliderSize?.width || 20)),
            y: 0,
          }}
          onDrag={(_, d) => {
            handleChange(
              ((d.x || 0) * wrapperSize.width) /
                (wrapperSize.width - (sliderSize?.width || 20)),
              true,
            );
          }}
          onStop={(_, d) => {
            handleChange(
              ((d.x || 0) * wrapperSize.width) /
                (wrapperSize.width - (sliderSize?.width || 20)),
            );
          }}
          bounds={{
            left: 0,
            right: wrapperSize.width - (sliderSize?.width || 20),
          }}
        >
          <div className={styles['slider']} ref={slider} />
        </Draggable>
      )}
      {props.children}
    </div>
  );
};

export default ProgressBar;
