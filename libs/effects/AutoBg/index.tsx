import { RefObject, useEffect, useMemo, useRef } from 'react';
import classNames from 'classnames';
import { nanoid } from 'nanoid';

import { MouseRotate3D } from '../MouseRotate3D';

import { Particles } from './particles';
import { Pipeline } from './pipeline';
import { Starry } from './starry';
import { Swirl } from './swirl';

import './index.scss';

const map = {
  starry: Starry,
  particle: Particles,
  swirl: Swirl,
  pipeline: Pipeline,
};

export const AutoBg = (
  props: BaseProps & {
    type: keyof typeof map;
    elRef?: RefObject<HTMLDivElement>;
  },
) => {
  const id = useMemo(() => nanoid(), []);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const Effect = map[props.type];
    if (!Effect) return;
    const instance = new Effect(ref.current!);
    return () => {
      instance.destroy();
    };
  }, [props.type]);

  return (
    <div
      className={classNames('auto-bg', props.className)}
      style={props.style}
      ref={props.elRef}
    >
      <div ref={ref} id={`bg-${id}`} />
      {/* <MouseRotate3D elRef={ref} id={`bg-${id}`} perspective={1500} /> */}
    </div>
  );
};
