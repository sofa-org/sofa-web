import {
  MutableRefObject,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { ejectPromise } from '@livelybone/promise-wait';
import {
  useDebounce,
  useMount,
  useSafeState,
  useSize,
  useThrottleFn,
} from 'ahooks';
import useEffectWithTarget from 'ahooks/es/utils/useEffectWithTarget';
import { isEqual } from 'lodash-es';
import { parse } from 'qs';

import { toArray } from './object';

export function useValChange(val: unknown, compareFn = isEqual) {
  const pre = useRef<typeof val>(NaN);
  const hasChanged = useMemo(
    () => !compareFn(val, pre.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [val],
  );
  pre.current = val;
  return hasChanged;
}

export function useRefState<T>(val: T) {
  const ref = useRef(val);
  ref.current = val;
  return ref;
}

export function useLazyCallback<T, Args extends unknown[]>(
  fn: (...args: Args) => T,
) {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback((...args: Args) => ref.current?.apply(null, args), []);
}

export function useOldValWhen<T>(
  val: T,
  when: (pre: T) => boolean,
  delay = 500,
) {
  const [oldVal, setOldVal] = useSafeState(val);
  useLayoutEffect(() => {
    const timer = setTimeout(() => setOldVal(val), delay);
    return () => clearTimeout(timer);
  }, [val, delay, setOldVal]);
  return when(oldVal) ? oldVal : val;
}

/**
 * @desc 如果值未发生改变，则尽可能使用旧值，用于性能优化
 * */
export function useOldValueWhenEqual<T>(state: T, equal = isEqual) {
  const stateRef = useRef(state);
  const equalRef = useRefState(equal);
  return useMemo(() => {
    stateRef.current = equalRef.current(state, stateRef.current)
      ? stateRef.current
      : state;
    return stateRef.current;
  }, [state, equalRef]);
}

export function useScrollXBehaviorForbidden() {
  useEffect(() => {
    const deltaStyle = 'overscroll-behavior-x:none;';
    const style = document.body.getAttribute('style') || '';
    document.body.setAttribute(
      'style',
      deltaStyle + style.replace(new RegExp(`${deltaStyle}?`, 'g'), ''),
    );
    return () => {
      const $style = document.body.getAttribute('style') || '';
      document.body.setAttribute(
        'style',
        $style.replace(new RegExp(`${deltaStyle}?`, 'g'), ''),
      );
    };
  }, []);
}

/**
 * 简易版
 * */
export function useDebounceWithReturnFn<Args extends unknown[], R>(
  fn: (...args: Args) => R,
  wait = 500,
) {
  const timer = useRef<number>();
  const preArgs = useRef<Args>();
  const result = useRef<ReturnType<typeof ejectPromise<R>>>();
  const run = useLazyCallback((...args: Args) => {
    if (!result.current) result.current = ejectPromise<R>();
    preArgs.current = args;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        const res = fn(...args);
        result.current?.resolve(res);
      } catch (e) {
        result.current?.reject(e);
      }
      result.current = undefined;
    }, wait) as unknown as number;
    return result.current;
  });
  return {
    run,
    flush: () => preArgs.current && fn(...preArgs.current),
    cancel: () => clearTimeout(timer.current),
  };
}

export function useAsyncFn<Args extends unknown[], R>(
  cb: (...args: Args) => R,
  options?: {
    loadingDelay?: number;
    callDebounce?: number;
    onError?(e: unknown): void;
  },
) {
  const [$loading, setLoading] = useState(false);
  const loading = useDebounce($loading, { wait: options?.loadingDelay ?? 300 });

  const run = useLazyCallback((...args: Args) => {
    setLoading(true);
    const res = cb(...args);
    const onError = options?.onError || console.error;
    Promise.resolve(res)
      .catch(onError)
      .finally(() => setLoading(false));
    return res;
  });
  const debounceRun = useDebounceWithReturnFn(
    async (...args: Args) => {
      try {
        return await run(...args);
      } catch (e) {
        console.warn(e);
      }
    },
    options?.callDebounce ?? 300,
  );

  const $run = useLazyCallback(async (...args: Args) => {
    setLoading(true);
    return debounceRun.run(...args);
  });

  return { loading, run, debounceRun: { ...debounceRun, run: $run } };
}

export function useDomChange(
  cb: (mutations: MutationRecord[], observer: MutationObserver) => void,
  ref: ArrOrItem<
    | RefObject<Element>
    | MutableRefObject<Element | null | undefined>
    | (() => Element | null | undefined)
  >,
  options?: MutationObserverInit & { interval?: number },
) {
  const getEls = useLazyCallback(() => {
    const getOne = (
      it:
        | RefObject<Element>
        | MutableRefObject<Element | null | undefined>
        | (() => Element | null | undefined),
    ) => {
      if (typeof it === 'function') return it();
      return it.current;
    };
    return toArray(ref).map(getOne);
  });
  const callback = useLazyCallback(() => {
    if (!MutationObserver) return undefined;
    const observer = new MutationObserver(cb);
    cb([], observer); // 初次渲染触发一次
    getEls().forEach(
      (el) =>
        el &&
        observer.observe(el, { subtree: true, childList: true, ...options }),
    );
    const timer = options?.interval
      ? setInterval(() => cb([], observer), options.interval)
      : null;
    return () => {
      observer.disconnect();
      clearInterval(timer!);
    };
  });

  const els = useOldValueWhenEqual(getEls());
  useEffectWithTarget(callback, [], els);
}

export function useDomSizeChange(
  cb: (
    d: { type: 'resize'; width: number; height: number; target: Element }[],
  ) => void,
  ref: ArrOrItem<
    | RefObject<Element>
    | MutableRefObject<Element | null | undefined>
    | (() => Element | null | undefined)
  >,
) {
  const getEls = useLazyCallback(() => {
    const getOne = (
      it:
        | RefObject<Element>
        | MutableRefObject<Element | null | undefined>
        | (() => Element | null | undefined),
    ) => {
      if (typeof it === 'function') return it();
      return it.current;
    };
    return toArray(ref).map(getOne);
  });
  const callback = useLazyCallback(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      cb(
        entries.map((it) => ({
          type: 'resize',
          width: it.target.clientWidth,
          height: it.target.clientHeight,
          target: it.target,
        })),
      );
    });
    getEls().forEach((el) => el && resizeObserver.observe(el));
    return () => resizeObserver.disconnect();
  });

  const els = useOldValueWhenEqual(getEls());
  useEffectWithTarget(callback, [], els);
}

export function useTime(options?: { interval?: number }) {
  const [time, setTime] = useState(() => Date.now());
  useMount(() => {
    setTime(Date.now());
  });
  useEffect(() => {
    const timer = setInterval(
      () => setTime(Date.now()),
      options?.interval || 1000,
    );
    return () => clearTimeout(timer);
  }, [options?.interval]);
  return time;
}

/**
 * @desc 和 useClickAway 做差不多的事情，不过使用 mouse down 来判断元素失焦
 * */
export function useDomAway(
  cb: () => void,
  elements: () => Element | Element[],
  type: 'all' | 'click' | 'mousedown' = 'all',
) {
  const callback = useLazyCallback(cb);
  const getElements = useLazyCallback(elements);
  useEffect(() => {
    const handleMousedown = (ev: MouseEvent) => {
      const isChild = ([] as Element[])
        .concat(getElements())
        .some((el) => el && el.contains(ev.target as Element));
      if (!isChild) callback();
    };
    const eventNames = (['mousedown', 'click'] as const).filter(
      (it) => type === 'all' || type === it,
    );
    eventNames.forEach((name) =>
      window.addEventListener(name, handleMousedown, true),
    );
    return () => {
      eventNames.forEach((name) =>
        window.removeEventListener(name, handleMousedown, true),
      );
    };
  }, [callback, getElements, type]);
}

export function useAsyncMemo<T>(
  getter: () => PromiseLike<T>,
  deps: unknown[],
): T | undefined {
  const [data, setData] = useState<T>();
  const fetch = useLazyCallback(() => getter().then(setData));
  useEffect(() => {
    Promise.resolve()
      .then(() => fetch())
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetch, ...deps]);
  return data;
}

export function useScroll(
  target: () => Element | undefined | null,
  cb: (p: {
    scrollTop: number;
    scrollLeft: number;
    reachBottom: boolean;
    reachTop: boolean;
    reachLeft: boolean;
    reachRight: boolean;
  }) => void,
  threshold = 10,
) {
  const els = useOldValueWhenEqual(target());
  const cbRef = useRefState(cb);
  useEffectWithTarget(
    () => {
      const el = target();
      if (!el) return;
      const callback = () => {
        const {
          scrollTop,
          scrollLeft,
          scrollWidth,
          clientWidth,
          scrollHeight,
          clientHeight,
        } = el;
        const maxScrollLeft = scrollWidth - clientWidth;
        const maxScrollTop = scrollHeight - clientHeight;
        cbRef.current({
          scrollLeft,
          scrollTop,
          reachBottom: scrollTop >= maxScrollTop - threshold,
          reachTop: scrollTop <= threshold,
          reachLeft: scrollLeft <= threshold,
          reachRight: scrollLeft >= maxScrollLeft - threshold,
        });
      };
      el.addEventListener('scroll', callback);
      return () => el.removeEventListener('scroll', callback);
    },
    [],
    els,
  );
}

export function useSubscribeNoState<T, Args extends unknown[] = []>(
  subscribe: (cb: (v: T) => void, ...args: Args) => Subscription | undefined,
  handlers:
    | ((v: T) => void)
    | {
        data(v: T): void;
        error?(err: Error): void;
        success?(): void;
        loading?(v: boolean): void;
      },
  options?: { throttleWait?: number },
  ...$args: Args
) {
  const subscribeRef = useRefState(subscribe);
  const $handlers =
    typeof handlers === 'function' ? { data: handlers } : handlers;
  const handleDataNormal = useLazyCallback($handlers.data);
  const handleDataThrottle = useThrottleFn($handlers.data, {
    wait: options?.throttleWait,
  });
  const handleData = options?.throttleWait
    ? handleDataThrottle.run
    : handleDataNormal;
  const handleSuccess = useLazyCallback($handlers.success!);
  const handleError = useLazyCallback($handlers.error!);
  const handleLoading = useLazyCallback($handlers.loading!);
  const args = useOldValueWhenEqual($args);
  useLayoutEffect(() => {
    handleLoading(true);
    const res = subscribeRef.current(handleData, ...args);
    Promise.resolve()
      .then(() => res)
      .then(() => handleSuccess())
      .catch((err) => handleError(err))
      .finally(() => handleLoading(false));
    return () => {
      Promise.resolve()
        .then(() => res)
        .finally(() => res?.unsubscribe());
    };
  }, [
    handleSuccess,
    args,
    handleData,
    handleError,
    handleLoading,
    subscribeRef,
  ]);
}

export function useSubscribe<T, Args extends unknown[] = []>(
  subscribe: (cb: (v: T) => void, ...args1: Args) => Subscription | undefined,
  options?: { throttleWait?: number },
  ...args: Args
) {
  const [data, setData] = useSafeState<T>();
  const [error, setError] = useSafeState<Error>();
  const [loading, setLoading] = useSafeState(true);
  useSubscribeNoState(
    subscribe,
    {
      data: setData,
      error: setError,
      loading: setLoading,
    },
    options,
    ...args,
  );
  return { data, error, loading };
}

export function createSuspenseResource<Args extends unknown[], R>(
  creator: (...args: Args) => Promise<R>,
) {
  const promise: {
    inst?: Promise<unknown>;
    args?: Args;
    status?: 'pending' | 'success' | 'error';
    val?: R;
  } = {};
  const equalArgs = (newArgs: Args) =>
    !(
      newArgs.length !== promise.args?.length ||
      newArgs.some((it, i) => it !== promise.args?.[i])
    );
  const genPromise = (newArgs: Args) => {
    const shouldNewOne = !promise.val || !equalArgs(newArgs);
    if (shouldNewOne) {
      promise.args = newArgs;
      promise.inst = creator(...newArgs).then(
        (r) => {
          if (equalArgs(newArgs)) {
            promise.val = r;
            promise.status = 'success';
          }
        },
        (e) => {
          if (equalArgs(newArgs)) {
            promise.status = 'error';
            promise.val = e;
          }
        },
      );
    }
    return promise;
  };
  return {
    read: (...args: Args): R => {
      const pro = genPromise(args);
      if (pro.status === 'success') return pro.val!;
      if (pro.status === 'error') throw pro.val;
      throw pro.inst;
    },
  };
}

export function useQuery() {
  const location = useLocation();
  return useMemo(
    () => parse(location.search, { ignoreQueryPrefix: true }),
    [location.search],
  );
}

export function useIsPortrait() {
  const size = useSize(document.body);
  return size && size.width < size.height;
}
