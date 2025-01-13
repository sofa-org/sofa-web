import { useMemo } from 'react';
import { MouseEvent } from 'react';
import { nanoid } from 'nanoid';

// 直接用 svg 的话，safari 上页面切换几次之后图标颜色就没了
export const Comp = (
  props: BaseProps & { onClick?(e: MouseEvent<SVGSVGElement>): void },
) => {
  const id = useMemo(() => nanoid(), []);
  return (
    <svg
      viewBox="0 0 600 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient
          id={`logo-${id}`}
          x1="1.02273"
          y1="2.56254"
          x2="521.898"
          y2="276.172"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#44C476" />
          <stop offset="1" stopColor="#FFE600" />
        </linearGradient>
      </defs>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.7034 90.002C22.997 92.1635 28.9849 93.2442 35.6671 93.2442C42.5228 93.2442 48.4673 91.9905 53.5006 89.4833C58.534 86.976 62.3523 83.6042 64.9558 79.3678C67.646 75.1314 68.9911 70.4195 68.9911 65.232C68.9911 59.7852 67.646 55.3327 64.9558 51.8744C62.2656 48.4161 59.0547 45.7791 55.3231 43.9635C51.6782 42.1479 46.9053 40.2459 41.0041 38.2573C35.103 36.3553 30.764 34.5829 27.987 32.9402C25.21 31.2975 23.8215 29.0064 23.8215 26.0669C23.8215 23.3867 24.6459 21.3549 26.2947 19.9716C27.9436 18.5019 30.1131 17.767 32.8033 17.767C35.9274 17.767 38.4875 18.6315 40.4835 20.3607C42.4794 22.0034 43.5642 24.2945 43.7378 27.234H67.8196C67.3857 18.6748 64.088 12.0176 57.9265 7.26241C51.765 2.4208 43.651 0 33.5843 0C23.6913 0 15.664 2.4208 9.50255 7.26241C3.34108 12.0176 0.260344 18.6315 0.260344 27.1044C0.260344 32.8105 1.60545 37.436 4.29567 40.9807C6.98589 44.5255 10.1968 47.2057 13.9284 49.0213C17.66 50.8369 22.4763 52.6525 28.3775 54.4681C32.4562 55.6785 35.5803 56.7592 37.7499 57.7102C40.0062 58.6613 41.872 59.8717 43.3472 61.3414C44.9093 62.8112 45.6903 64.67 45.6903 66.9179C45.6903 69.5981 44.7357 71.7163 42.8266 73.2725C40.9174 74.7423 38.3139 75.4772 35.0162 75.4772C31.8053 75.4772 29.2019 74.6126 27.2059 72.8835C25.21 71.0679 24.0384 68.4742 23.6913 65.1023H0C0.173563 71.0679 1.82241 76.1689 4.94653 80.4053C8.15744 84.6417 12.4097 87.8406 17.7034 90.002ZM102.215 87.2786C109.418 91.2557 117.315 93.2442 125.907 93.2442C134.498 93.2442 142.352 91.2557 149.468 87.2786C156.584 83.3016 162.225 77.7683 166.39 70.6788C170.556 63.5029 172.638 55.4623 172.638 46.5572C172.638 37.6521 170.556 29.6548 166.39 22.5653C162.311 15.4759 156.671 9.94259 149.468 5.96555C142.352 1.98852 134.498 0 125.907 0C117.315 0 109.418 1.98852 102.215 5.96555C95.0994 9.94259 89.4152 15.4759 85.1629 22.5653C80.9974 29.6548 78.9147 37.6521 78.9147 46.5572C78.9147 55.4623 80.9974 63.5029 85.1629 70.6788C89.4152 77.7683 95.0994 83.3016 102.215 87.2786ZM244.511 1.29686V19.0638H207.281V38.2573H235.138V55.5056H207.281V92.3364H185.022V1.29686H244.511ZM273.523 92.3364L278.99 76.2553H313.095L318.562 92.3364H342.123L309.06 1.29686H283.286L250.222 92.3364H273.523ZM296.042 25.8075L307.367 59.1368H284.848L296.042 25.8075ZM362.6 93.3739C358.695 93.3739 355.484 92.2499 352.967 90.002C350.537 87.6677 349.322 84.8146 349.322 81.4428C349.322 77.9845 350.537 75.0881 352.967 72.7538C355.484 70.4195 358.695 69.2523 362.6 69.2523C366.418 69.2523 369.542 70.4195 371.972 72.7538C374.489 75.0881 375.747 77.9845 375.747 81.4428C375.747 84.8146 374.489 87.6677 371.972 90.002C369.542 92.2499 366.418 93.3739 362.6 93.3739ZM402.722 88.8349C408.45 91.8609 414.872 93.3739 421.988 93.3739C429.104 93.3739 435.526 91.8609 441.253 88.8349C447.068 85.8088 451.624 81.486 454.921 75.8663C458.306 70.1601 459.998 63.5893 459.998 56.154C459.998 48.7187 458.349 42.1912 455.051 36.5714C451.754 30.8652 447.241 26.4992 441.514 23.4732C435.786 20.4471 429.364 18.9341 422.248 18.9341C415.132 18.9341 408.71 20.4471 402.983 23.4732C397.255 26.4992 392.742 30.8652 389.445 36.5714C386.147 42.1912 384.498 48.7187 384.498 56.154C384.498 63.6758 386.104 70.2465 389.315 75.8663C392.612 81.486 397.082 85.8088 402.722 88.8349ZM432.792 69.5117C429.841 72.6241 426.24 74.1803 421.988 74.1803C417.735 74.1803 414.177 72.6241 411.314 69.5117C408.537 66.3992 407.148 61.9466 407.148 56.154C407.148 50.2749 408.58 45.8224 411.444 42.7963C414.308 39.6839 417.909 38.1277 422.248 38.1277C426.5 38.1277 430.058 39.6839 432.922 42.7963C435.873 45.9088 437.348 50.3614 437.348 56.154C437.348 61.9466 435.829 66.3992 432.792 69.5117ZM494.066 32.0324C496.67 28.0554 499.924 24.9429 503.829 22.695C507.734 20.3607 512.073 19.1935 516.846 19.1935V42.6667H510.728C505.174 42.6667 501.009 43.8771 498.232 46.2979C495.455 48.6322 494.066 52.7822 494.066 58.7477V92.3364H471.807V19.9716H494.066V32.0324ZM568.49 22.0466C564.672 19.9716 560.203 18.9341 555.082 18.9341C549.095 18.9341 543.671 20.4471 538.811 23.4732C533.951 26.4992 530.089 30.822 527.226 36.4417C524.449 42.0615 523.06 48.589 523.06 56.0243C523.06 63.4596 524.449 70.0304 527.226 75.7366C530.089 81.3563 533.951 85.7224 538.811 88.8349C543.671 91.8609 549.095 93.3739 555.082 93.3739C560.203 93.3739 564.672 92.3364 568.49 90.2614C572.308 88.1 575.302 85.3333 577.472 81.9615V92.2067C577.472 97.9993 576.083 102.193 573.306 104.786C570.616 107.466 566.971 108.806 562.372 108.806C558.554 108.806 555.343 107.985 552.739 106.342C550.136 104.786 548.487 102.625 547.793 99.8582H525.794C526.748 108.504 530.567 115.334 537.249 120.349C543.931 125.45 552.653 128 563.413 128C571.484 128 578.21 126.401 583.59 123.202C589.057 120.003 593.093 115.68 595.696 110.233C598.386 104.873 599.731 98.8639 599.731 92.2067V19.9716H577.472V30.2168C575.389 26.845 572.395 24.1216 568.49 22.0466ZM572.786 43.0557C575.91 46.2546 577.472 50.6207 577.472 56.154C577.472 61.6873 575.91 66.0534 572.786 69.2523C569.748 72.4512 566.017 74.0507 561.591 74.0507C557.165 74.0507 553.39 72.4512 550.266 69.2523C547.229 65.9669 545.71 61.5576 545.71 56.0243C545.71 50.4911 547.229 46.1682 550.266 43.0557C553.39 39.8568 557.165 38.2573 561.591 38.2573C566.017 38.2573 569.748 39.8568 572.786 43.0557ZM131.38 23.1015C129.589 17.5889 121.79 17.5889 119.999 23.1015L117.629 30.3944C116.828 32.8597 114.531 34.5288 111.939 34.5288H104.271C98.4743 34.5288 96.0643 41.9459 100.754 45.3529L106.957 49.8601C109.054 51.3838 109.932 54.0845 109.131 56.5498L106.761 63.8427C104.97 69.3553 111.28 73.9393 115.969 70.5323L122.172 66.0251C124.27 64.5014 127.109 64.5014 129.206 66.0251L135.41 70.5323C140.099 73.9393 146.409 69.3553 144.618 63.8427L142.248 56.5498C141.447 54.0845 142.325 51.3838 144.422 49.8601L150.625 45.3529C155.315 41.9459 152.905 34.5288 147.108 34.5288H139.44C136.848 34.5288 134.551 32.8597 133.75 30.3944L131.38 23.1015Z"
        fill={`url(#logo-${id})`}
      />
    </svg>
  );
};
