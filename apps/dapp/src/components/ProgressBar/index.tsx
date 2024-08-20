import { MouseEvent, ReactNode } from 'react';
import classNames from 'classnames';

import styles from './index.module.scss';

export interface ProgressBarProps extends BaseProps {
  percent: number;
  children?: ReactNode;
  onClick?(e: MouseEvent<HTMLDivElement>): void;
}

const ProgressBar = (props: ProgressBarProps) => {
  return (
    <div
      className={classNames(styles['progress'], props.className)}
      style={props.style}
      onClick={props.onClick}
    >
      <div
        className={styles['progress-bar']}
        style={{ width: `${Math.max(props.percent * 100, 0.3)}%` }}
      />
      {props.children}
    </div>
  );
};

export default ProgressBar;
