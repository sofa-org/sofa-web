/// <reference types="vite/client" />
/// <reference types="react-dom" />

declare module 'react-infinite-ticker';
declare module '*.svg' {
  export const Comp: React.FC<React.SVGProps<SVGElement>>;
  const url: string;
  export default url;
}
