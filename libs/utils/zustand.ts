import { get } from 'lodash-es';
import { StoreApi } from 'zustand';

// export function computed<
//   State,
//   Props extends Record<
//     string,
//     { computer: (state: State) => unknown; depKeys: string[] }
//   >,
// >(
//   initializer: (
//     ...args: Parameters<Parameters<typeof create<State, []>>[0]>
//   ) => XPartial<State & Record<string, unknown>, keyof Props & keyof State>,
//   props: Props,
// ) {
//   return (...args: Parameters<Parameters<typeof create<State, []>>[0]>) => {
//     const state = initializer(...args);
//     const keyPriority: Record<string, number> = {};
//     const keys = Object.keys(props);
//     keys.forEach((k) => {
//       if (keyPriority[k] === undefined) keyPriority[k] = 0;
//       props[k].depKeys.forEach((k1) => {
//         keyPriority[k1] = keyPriority[k]! - 1;
//       });
//     });
//     const sortedKeys = keys.sort(
//       (a, b) => keyPriority[a] - keyPriority[b],
//     ) as unknown as (keyof Props)[];
//     sortedKeys.forEach((k) => {
//       const opt = props[k];
//       let value = opt.computer(state as State);
//       args[2].subscribe((state, preState) => {
//         const hasChanged = opt.depKeys.some(
//           (k) => get(state, k) !== get(preState, k),
//         );
//         if (hasChanged) value = opt.computer(state);
//       });
//       Object.defineProperty(state, k, {
//         get() {
//           return () => value;
//         },
//         set() {
//           console.warn(new Error(`The \`${String(k)}\` state is not mutable`));
//         },
//         enumerable: true,
//         configurable: true,
//       });
//     });
//     return state as State;
//   };
// }

export function computed<State, T, DepKeys extends string[]>(
  store: StoreApi<State>,
  computer: (state: State) => T,
  depKeys: DepKeys,
) {
  const value: { cache?: T } = {};
  store.subscribe((state, preState) => {
    const hasChanged = depKeys.some((k) => get(state, k) !== get(preState, k));
    if (hasChanged) value.cache = computer(state);
  });
  return () => {
    if (!('cache' in value)) {
      value.cache = computer(store.getState());
    }
    return value.cache as T;
  };
}
