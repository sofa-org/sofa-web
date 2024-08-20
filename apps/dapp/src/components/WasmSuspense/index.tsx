import type { ComponentType } from 'react';
import { memo, Suspense } from 'react';
import { createSuspenseResource } from '@sofa/utils/hooks';

export function WasmSuspenseHoc<P extends Record<string, unknown>>(
  Comp: ComponentType<P>,
  initialFns: (() => Promise<unknown>)[],
  Loading?: ComponentType<P>,
) {
  const source = createSuspenseResource(() =>
    Promise.all(initialFns.map((fn) => fn())),
  );
  const C = (props: P) => {
    source.read();
    return <Comp {...props} />;
  };
  return memo<P>((props) => (
    <Suspense fallback={Loading ? <Loading {...props} /> : <></>}>
      <C {...props} />
    </Suspense>
  ));
}
