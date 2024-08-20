import { useMemo } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { nanoid } from 'nanoid';

import './index.scss';

const colors = ['#d665a3', '#e05e2b', '#f8d748', '#36af73', '#2d6fb9'];

export const FloatingBorder = (
  props: BaseProps & {
    borderWidth: number;
    borderRadius?: number; // default 0
    borderColor?: string;
    padding?: number | string;
  },
) => {
  const id = useMemo(() => nanoid(), []);
  const borderColor = useMemo(
    () =>
      props.borderColor ||
      `conic-gradient(
    from 45deg,
    transparent 15%,
    ${[...colors]
      .reverse()
      .map(
        (it, i) =>
          `${it}${(((i + 1) * 255) / colors.length).toString(16)} ${
            15 + (i + 1) * (10 / colors.length)
          }%`,
      )
      .join(',')},
    ${colors
      .map(
        (it, i) =>
          `${it}${(((colors.length - i) * 255) / colors.length).toString(16)} ${
            25 + i * (10 / colors.length)
          }%`,
      )
      .join(',')},
    transparent 35%,
    transparent 65%,
    ${[...colors]
      .reverse()
      .map(
        (it, i) =>
          `${it}${(((i + 1) * 255) / colors.length).toString(16)} ${
            65 + (i + 1) * (10 / colors.length)
          }%`,
      )
      .join(',')},
    ${colors
      .map(
        (it, i) =>
          `${it}${(((colors.length - i) * 255) / colors.length).toString(16)} ${
            75 + i * (10 / colors.length)
          }%`,
      )
      .join(',')},
    transparent 85%
  )`,
    [props.borderColor],
  );
  return (
    <>
      {ReactDOM.createPortal(
        <style>{`
      .floating-border-${id}:after { 
        left: ${props.borderWidth}px;
        top: ${props.borderWidth}px;
        width: calc(100% - ${props.borderWidth * 2}px);
        height: calc(100% - ${props.borderWidth * 2}px);
        border-radius: ${
          props.borderRadius ? props.borderRadius - props.borderWidth : 0
        }px;
      }
      .floating-border-${id} .floating-border-content {
        border-radius: ${
          props.borderRadius ? props.borderRadius - props.borderWidth : 0
        }px;
      }
    `}</style>,
        document.head,
      )}
      <div
        className={classNames(
          'floating-border',
          `floating-border-${id}`,
          props.className,
        )}
        style={{
          ...props.style,
          padding: props.borderWidth,
          borderRadius: props.borderRadius || 0,
          '--floating-border-color': borderColor,
        }}
      >
        <div
          className="floating-border-content"
          style={{ padding: props.padding }}
        >
          {props.children}
        </div>
      </div>
    </>
  );
};
