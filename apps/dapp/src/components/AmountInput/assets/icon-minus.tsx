import { SVGProps, useMemo } from 'react';

export const IconMinus = (props: SVGProps<SVGSVGElement>) => {
  const id = useMemo(() => String(Math.random()).replace(/^0\./, ''), []);
  return (
    <svg
      {...props}
      viewBox="0 0 12 4"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.3332 3.73497H0.666504V0.264648H11.3332V3.73497Z"
        fill="#fff"
      />
    </svg>
  );
};
