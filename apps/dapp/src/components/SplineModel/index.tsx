import { RefObject, useRef, useState } from 'react';
import { MouseRotate3D } from '@sofa/effects/MouseRotate3D';
import { Env } from '@sofa/utils/env';
import Spline from '@splinetool/react-spline';
import classNames from 'classnames';

import videoAtom from './assets/atom.webm';
import videoBee from './assets/bee.webm';
import videoCloud from './assets/cloud.webm';
import videoDiscoball from './assets/discoball.webm';
import videoHammer from './assets/hammer.webm';
import imgAtom from './assets/img-atom.png';
import imgBee from './assets/img-bee.png';
import imgCalendar from './assets/img-calendar.png';
import imgCloud from './assets/img-cloud.png';
import imgDart from './assets/img-dart.png';
import imgFlower from './assets/img-flower.png';
import imgHammer from './assets/img-hammer.png';
import imgKey from './assets/img-key.png';
import imgPencil from './assets/img-pencil.png';
import imgPouch from './assets/img-pouch.png';
import imgRubik from './assets/img-rubik.png';
import imgSafe from './assets/img-safe.png';
import imgTelescope from './assets/img-telescope.png';
import imgTypewriter from './assets/img-typewriter.png';
import videoPlanet from './assets/planet.webm';
import videoRubik from './assets/rubik.webm';
import videoSafe from './assets/safe.webm';
import videoTypewritter from './assets/typewriter.webm';

import styles from './index.module.scss';

declare const px2rem: Global['px2rem'];

const models = {
  rch: {
    loading: '',
    // resource: 'https://prod.spline.design/MK0TOv9kOK27XZpk/scene.splinecode',
    resource: videoPlanet,
    size: [240, 240],
  },
  discoball: {
    loading: '',
    // resource: 'https://prod.spline.design/Gb2AZCcuJJT8FgXa/scene.splinecode',
    resource: videoDiscoball,
    size: [80, 80],
  },
  rubik: {
    loading: imgRubik,
    // resource: 'https://prod.spline.design/VWMU4GY6VzJcD8XW/scene.splinecode',
    resource: videoRubik,
    size: [240, 240],
  },
  pouch: {
    loading: imgPouch,
    // resource1: 'https://prod.spline.design/gVtX3RkScYLIa0Ni/scene.splinecode',
    resource: '',
    size: [66, 73],
  },
  typewriter: {
    loading: imgTypewriter,
    // resource: 'https://prod.spline.design/JvoVxa5cV1m7k2fk/scene.splinecode',
    resource: videoTypewritter,
    size: [240, 240],
  },
  cloudAndCoin: {
    loading: imgCloud,
    // resource: 'https://prod.spline.design/D14nCE4eTv4v3IZQ/scene.splinecode',
    resource: videoCloud,
    size: [240, 240],
  },
  atom: {
    loading: imgAtom,
    // resource: 'https://prod.spline.design/b2X0QbFaorobxYIN/scene.splinecode',
    resource: videoAtom,
    size: [240, 240],
  },
  hammer: {
    loading: imgHammer,
    // resource: 'https://prod.spline.design/7KL0mQV0mEEBrEIs/scene.splinecode',
    resource: videoHammer,
    size: [240, 240],
  },
  safe: {
    loading: imgSafe,
    // resource: 'https://prod.spline.design/L6zGgEQaAUe315om/scene.splinecode',
    resource: videoSafe,
    size: [240, 240],
  },
  calendar: {
    loading: imgCalendar,
    // resource1: 'https://prod.spline.design/a05lEerxBKjPxbCj/scene.splinecode',
    resource: '',
    size: [76, 81],
  },
  pencil: {
    loading: imgPencil,
    // resource1: 'https://prod.spline.design/7jPX-oGaDe-fG530/scene.splinecode',
    resource: '',
    size: [129, 93],
  },
  dart: {
    loading: imgDart,
    // resource1: 'https://prod.spline.design/yQKrbDPW7RR5UtDP/scene.splinecode',
    resource: '',
    size: [83, 84],
  },
  telescope: {
    loading: imgTelescope,
    resource: '',
    size: [200, 200],
  },
  key: {
    loading: imgKey,
    resource: '',
    size: [200, 200],
  },
  flower: {
    loading: imgFlower,
    // resource: 'https://prod.spline.design/yShDimQxggjcM5qE/scene.splinecode',
    resource: '',
    size: [116, 127],
  },
  bee: {
    loading: imgBee,
    // resource: 'https://prod.spline.design/S2FkyHpn2LBml-j1/scene.splinecode',
    resource: videoBee,
    size: [200, 200],
  },
};

const SplineModel = (
  props: BaseProps & {
    id: keyof typeof models;
    elRef?: RefObject<HTMLElement>;
    lazy?: boolean; // default: true
  },
) => {
  const ref = useRef<HTMLDivElement>(null);
  const model = models[props.id];

  const [loading, setLoading] = useState(() =>
    model.resource.endsWith('splinecode'),
  );

  const img = (isLoading?: boolean) => (
    <img
      className={classNames({ [styles['loading']]: isLoading })}
      ref={props.elRef as never}
      src={model.loading}
      alt=""
    />
  );

  const media = (() => {
    const enableTransparentVideo =
      ['Blink', 'Gecko'].includes(Env.ua.getEngine().name!) &&
      !/MicroMessenger/i.test(Env.ua.getUA());
    if (
      !enableTransparentVideo ||
      window.location.search.includes('force-img') ||
      !model.resource
    ) {
      if (Env.isMobile) return img();
      return <MouseRotate3D perspective={300}>{img()}</MouseRotate3D>;
    }
    if (model.resource.endsWith('splinecode')) {
      return (
        <>
          <Spline
            ref={props.elRef as never}
            scene={model.resource}
            style={{
              width: '111%',
              height: '111%',
              opacity: loading ? 0 : 1,
            }}
            renderOnDemand
            onLoad={(e) => setLoading(false)}
          />
          {loading && img(true)}
        </>
      );
    }
    return <video src={model.resource} autoPlay loop muted />;
  })();
  return (
    <div
      ref={ref}
      style={{
        background: 'transparent',
        ...props.style,
        width: px2rem(props.style?.width || model.size[0]),
        height: px2rem(props.style?.height || model.size[1]),
      }}
      className={classNames(
        styles['spline-model'],
        'spline-model',
        props.className,
      )}
    >
      {media}
    </div>
  );
};

export default SplineModel;
