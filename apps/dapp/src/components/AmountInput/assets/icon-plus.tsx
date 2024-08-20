import { SVGProps, useMemo } from 'react';

export const IconPlus = (props: SVGProps<SVGSVGElement>) => {
  const id = useMemo(() => String(Math.random()).replace(/^0\./, ''), []);
  return (
    <svg
      {...props}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.41384 5.57129H13.4148V8.39921H8.41384V13.4002H5.58592V8.39921H0.584961V5.57129H5.58592V0.600098H8.41384V5.57129Z"
        fill="#fff"
      />
    </svg>
  );
};
