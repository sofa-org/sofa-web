import { CSSProperties, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';

import './index.scss';

export interface COverlayProps extends BaseProps {
  contentStyle?: CSSProperties;
  visible?: boolean;
  onVisibleChange?(visible: boolean): void;
}

export const COverlay = (props: COverlayProps) => {
  const ref = useRef(props.visible);
  if (props.visible) ref.current = true;

  useEffect(() => {
    const pageScroller = document.querySelector('#root') as HTMLDivElement;
    if (props.visible) {
      pageScroller.style.overflowY = 'hidden';
    } else {
      pageScroller.style.overflowY = 'auto';
    }
  }, [props.visible]);

  return ReactDOM.createPortal(
    <div
      className={classNames('c-overlay', props.className, {
        'c-overlay-visible': props.visible,
      })}
      style={props.style}
      onClick={() => props.onVisibleChange?.(false)}
    >
      {ref.current && (
        <div
          className="c-overlay-content"
          style={props.contentStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {props.children}
        </div>
      )}
    </div>,
    document.body,
  );
};
