/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useRef } from 'react';

// @ts-ignore
import { Light, turbulentDistortionStill } from './light';

import './index.scss';

export const LightFlow = () => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const options = {
      // onSpeedUp: (ev) => {
      // },
      // onSlowDown: (ev) => {
      // },
      // mountainDistortion || LongRaceDistortion || xyDistortion || turbulentDistortion || turbulentDistortionStill || deepDistortionStill || deepDistortion
      distortion: turbulentDistortionStill,

      length: 400,
      roadWidth: 9,
      islandWidth: 2,
      lanesPerRoad: 3,

      fov: 90,
      fovSpeedUp: 150,
      speedUp: 2,
      carLightsFade: 0.4,

      totalSideLightSticks: 50,
      lightPairsPerRoadWay: 50,

      // Percentage of the lane's width
      shoulderLinesWidthPercentage: 0.05,
      brokenLinesWidthPercentage: 0.1,
      brokenLinesLengthPercentage: 0.5,

      /*** These ones have to be arrays of [min,max].  ***/
      lightStickWidth: [0.12, 0.5],
      lightStickHeight: [1.3, 1.7],

      movingAwaySpeed: [60, 80],
      movingCloserSpeed: [-120, -160],

      /****  Anything below can be either a number or an array of [min,max] ****/

      // Length of the lights. Best to be less than total length
      carLightsLength: [400 * 0.05, 400 * 0.15],
      // Radius of the tubes
      carLightsRadius: [0.05, 0.14],
      // Width is percentage of a lane. Numbers from 0 to 1
      carWidthPercentage: [0.3, 0.5],
      // How drunk the driver is.
      // carWidthPercentage's max + carShiftX's max -> Cannot go over 1.
      // Or cars start going into other lanes
      carShiftX: [-0.2, 0.2],
      // Self Explanatory
      carFloorSeparation: [0.05, 1],

      colors: {
        roadColor: 0xfff0,
        islandColor: 0xfff0,
        background: 0xfff0,
        shoulderLines: 0xfff0,
        brokenLines: 0xfff0,
        /***  Only these colors can be an array ***/
        leftCars: [0xd665a3, 0xe05e2b, 0xf8d748],
        rightCars: [0x36af73, 0x2d6fb9],
        sticks: 0xd665a3,
      },
    };

    const instance = new Light(ref.current, options);
    instance.loadAssets().then(instance.init);

    return () => {
      instance.destroy();
    };
  }, []);
  return <div className="light-flow" ref={ref} />;
};
