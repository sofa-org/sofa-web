import { RefObject, useEffect, useRef, useState } from 'react';
import { useLazyCallback, useRefState } from '@sofa/utils/hooks';
import { useInViewport } from 'ahooks';
import classNames from 'classnames';

import './index.scss';

export const MouseRotate3D = (
  props: BaseProps & {
    elRef?: RefObject<HTMLDivElement>;
    perspective?: number;
    threshold?: number; // default: 2 (鼠标在内容区域周围两倍范围内的圆内移动时，触发效果)
  },
) => {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({ transform: 'none', transition: 'none' });
  const [inView = true] = useInViewport(props.elRef || ref);
  const inViewRef = useRefState(inView);

  const evRef = useRef<MouseEvent>();
  const handleLeave = useLazyCallback(() => {
    const el = props.elRef?.current || ref.current;
    if (!el) return;
    setStyle({ transform: 'none', transition: 'transform 0.5s' });
  });
  const run = useLazyCallback(() => {
    const el = props.elRef?.current || ref.current;
    if (!el || !inViewRef.current || !evRef.current) return;
    const rect = el.getBoundingClientRect();
    const { clientX, clientY } = evRef.current;
    const thresholdRadius =
      (Math.sqrt(rect.width ** 2 + rect.height ** 2) / 2) *
      (props.threshold || 2);
    const center = {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
    };
    const distanceToCenter = Math.sqrt(
      (clientX - center.x) ** 2 + (clientY - center.y) ** 2,
    );
    if (distanceToCenter > thresholdRadius) return handleLeave();
    setStyle({
      transform: `rotateY(${
        (clientX - center.x) / (rect.width / 10)
      }deg) rotateX(${-(clientY - center.y) / (rect.height / 10)}deg)`,
      transition: 'none',
    });
  });
  useEffect(() => {
    let stop = false;
    const loop = () => {
      run();
      requestAnimationFrame(() => {
        if (stop) return;
        loop();
      });
    };
    loop();
    return () => {
      stop = true;
    };
  }, [run]);
  useEffect(() => {
    const handleMove = (ev: MouseEvent) => {
      evRef.current = ev;
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseleave', handleLeave);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
    };
  }, [handleLeave, inViewRef, props.elRef]);

  return (
    <div
      className={'mouse-rotate-3d-wrapper'}
      style={{
        perspective: props.perspective || 500,
        WebkitPerspective: props.perspective || 500,
      }}
    >
      <div
        ref={props.elRef || ref}
        className={classNames('mouse-rotate-3d', props.className)}
        style={{ ...props.style, ...style }}
        id={props.id}
      >
        {props.children}
      </div>
    </div>
  );
};
