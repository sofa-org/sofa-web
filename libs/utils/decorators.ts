import { wait } from '@livelybone/promise-wait';
import { promiseOnPending, singleton } from '@livelybone/singleton';
import { LRUCache } from 'lru-cache';

import { calcVal, getErrorMsg, isNullLike, safeRun } from './fns';
import { dirtyArrayOmit } from './object';
import { sentry } from './sentry';

declare const storage: Global['storage'];
declare const asyncStorage: Global['asyncStorage'];

export interface CacheRequestOptions<T extends 'ASYNC' | 'SYNC' = 'SYNC'> {
  // @desc 是否保存在本地缓存，使用 localStorage，注意空间利用
  persist?: boolean;
  /**
   * @desc 一直使用缓存，直到 until 返回 true
   * @default (cacheValue: unknown, createdAt: number) => cacheValue === undefined
   * */
  until?: (
    cachedValue: unknown,
    createdAt: number | undefined,
    cacheKey: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx: any,
    args: unknown[],
  ) => T extends 'ASYNC' ? Promise<boolean> | boolean : boolean;

  /**
   * @desc 缓存 id。 ctx 为方法对应调用上下文
   * @default (methodName: string, args: unknown[]) => JSON.stringify({ method: methodName, args })
   * 返回值 undefined 表示不缓存，适用于条件缓存场景
   * */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  id?(methodName: string, args: unknown[], ctx: any): string | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DecoratorMemoryCache = new LRUCache<any, any, []>({ max: 1000 });

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.DecoratorMemoryCache = DecoratorMemoryCache;

export function cache(options?: CacheRequestOptions) {
  const getCacheValue = (
    id: string,
  ): { createdAt: number; value: unknown } | null | undefined => {
    if (options?.persist) return storage.get(id);
    return DecoratorMemoryCache.get(id);
  };
  const setCacheValue = (
    id: string,
    value: { createdAt: number; value: unknown },
  ) => {
    if (options?.persist)
      return storage.set(id, { value, createdAt: Date.now() });
    return DecoratorMemoryCache.set(id, { value, createdAt: Date.now() });
  };
  const until =
    options?.until || ((cacheValue: unknown) => isNullLike(cacheValue));
  const genId =
    options?.id ||
    ((methodName: string, args: unknown[]) =>
      JSON.stringify({ method: methodName, args }));
  return (_: unknown, name: string, descriptor: PropertyDescriptor) => {
    const oldRequest = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      const id = genId(name, args, this);
      if (!id) return oldRequest.apply(this, args);
      const cacheValue = getCacheValue(id);
      if (until(cacheValue?.value, cacheValue?.createdAt, id, this, args)) {
        const value = oldRequest.apply(this, args);
        setCacheValue(id, value);
        return value;
      }
      return cacheValue?.value;
    };
    return descriptor;
  };
}

/**
 * @desc 保证同一时间执行多个相同的异步工作时，共用一个结果(也共用一个执行过程)
 * holdTime 表示这个结果的共用会被延续多长时间
 * */
export function asyncShare(
  holdTime?: number,
  // ctx 为方法对应的调用上下文
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  genId = (methodName: string, args: unknown[], ctx: any) =>
    JSON.stringify({ method: methodName, args }),
) {
  return (_: unknown, name: string, descriptor: PropertyDescriptor) => {
    const oldRequest = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      const id = genId(name, args, this);
      return promiseOnPending(() => oldRequest.apply(this, args), {
        id,
        cacheTime: holdTime,
      });
    };
    return descriptor;
  };
}

export function asyncCache(options?: CacheRequestOptions<'ASYNC'>) {
  const getCacheValue = async (
    id: string,
  ): Promise<{ value: unknown; createdAt: number } | null | undefined> => {
    try {
      if (options?.persist && !DecoratorMemoryCache.has(id)) {
        const value = await asyncStorage.get(id);
        DecoratorMemoryCache.set(id, value);
      }
      return DecoratorMemoryCache.get(id);
    } catch (err) {
      console.error(err);
      return null;
    }
  };
  const setCacheValue = async (id: string, value: unknown) => {
    if (options?.persist) {
      asyncStorage.set(id, { value, createdAt: Date.now() });
    }
    DecoratorMemoryCache.set(id, { value, createdAt: Date.now() });
  };
  const until =
    options?.until || ((cacheValue: unknown) => isNullLike(cacheValue));
  const genId =
    options?.id ||
    ((methodName: string, args: unknown[]) =>
      JSON.stringify({ method: methodName, args }));
  return (_: unknown, name: string, descriptor: PropertyDescriptor) => {
    const oldRequest = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      const id = genId(name, args, this);
      if (!id) return oldRequest.apply(this, args);
      const cacheValue = await getCacheValue(id);
      if (until(cacheValue?.value, cacheValue?.createdAt, id, this, args)) {
        return promiseOnPending(
          async () => {
            const val = await oldRequest.apply(this, args);
            await setCacheValue(id, val);
            return val;
          },
          { id },
        );
      }
      return cacheValue?.value;
    };
    return descriptor;
  };
}

export function paramsCvt(cvt: (...args: unknown[]) => unknown[]) {
  return (_: unknown, name: string, descriptor: PropertyDescriptor) => {
    const oldRequest = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      return oldRequest.apply(this, cvt(...args));
    };
    return descriptor;
  };
}

export function paramsCvtNew(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cvt: (args: unknown[], ctx: any) => unknown[],
) {
  return (_: unknown, name: string, descriptor: PropertyDescriptor) => {
    const oldRequest = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      return oldRequest.apply(this, cvt(args, this));
    };
    return descriptor;
  };
}

/**
 * @desc 保证方法只会被调用一次
 * */
export function once(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  genId = (methodName: string, args: unknown[], ctx: any) =>
    JSON.stringify({ method: methodName, args }),
) {
  return (_: unknown, name: string, descriptor: PropertyDescriptor) => {
    const oldRequest = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      const id = genId(name, args, this);
      return singleton(id, () => oldRequest.apply(this, args)).value;
    };
    return descriptor;
  };
}

export function asyncQueue(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  genId = (methodName: string, args: unknown[], ctx: any) => methodName,
) {
  return (_: unknown, name: string, descriptor: PropertyDescriptor) => {
    const queue: Record<string, Promise<unknown>> = {};
    const oldRequest = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      const id = genId(name, args, this);
      const oldQuery = queue[id];
      const result = Promise.resolve()
        .then(() => oldQuery)
        .then(() => oldRequest(...args));
      queue[id] = result.catch(console.error);
      return result;
    };
    return descriptor;
  };
}

/**
 * @desc 用于捕获异步方法的错误，并上报到 sentry，不影响原函数结果
 * condition 用于更细粒度的控制是否上报，args 为目标方法执行时的入参
 * */
export function catchErrorAsync(
  condition: boolean | ((...args: unknown[]) => boolean) = true,
) {
  return (_: unknown, name: string, descriptor: PropertyDescriptor) => {
    const oldAsync = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      try {
        return await oldAsync(...args);
      } catch (e: unknown) {
        if (calcVal(condition, ...args)) {
          const error = new Error(getErrorMsg(e));
          Object.assign(error, { cause: e, args: JSON.stringify(args) });
          sentry.captureException(error);
        }
        return Promise.reject(e);
      }
    };
    return descriptor;
  };
}

/**
 * @desc 用于在方法调用开始之前或者结束之后做一些事情
 * */
export function beforeRunAsync(action: (...args: unknown[]) => unknown) {
  return (_: unknown, name: string, descriptor: PropertyDescriptor) => {
    const oldAsync = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      safeRun(action, ...args);
      return oldAsync(...args);
    };
    return descriptor;
  };
}

/**
 * @desc 用于在方法调用开始之前或者结束之后做一些事情
 * */
export function afterRunAsync(
  action: (result: unknown, ...args: unknown[]) => unknown,
) {
  return (_: unknown, name: string, descriptor: PropertyDescriptor) => {
    const oldAsync = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      const result = await oldAsync(...args);
      safeRun(action, result, ...args);
      return result;
    };
    return descriptor;
  };
}

const subscribeCache = new LRUCache<
  string,
  {
    id: string;
    subscription: Subscription;
    callbacks: ((d: unknown) => unknown)[];
    preData?: unknown;
  }
>({ max: 200 });

/*
 * 共享订阅
 * 对象方法的返回值一定得是 Subscription 类型
 */
export function shareSubscribe(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  genId: (methodName: string, args: unknown[], ctx: any) => string, // 这个订阅的唯一 id（需保证相同输入的输出是一致的）
  cbIndexInArgs = 1, // 订阅句柄函数在参数中的索引
) {
  return (_: unknown, name: string, descriptor: PropertyDescriptor) => {
    const oldRequest = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      const id = genId(name, args, this);
      const callback = args[cbIndexInArgs] as (d: unknown) => unknown;

      if (!subscribeCache.get(id)?.callbacks.length) {
        const subscription: Subscription = oldRequest.apply(
          this,
          args.map((it, i) =>
            i !== cbIndexInArgs
              ? it
              : (d: unknown) => {
                  const item = subscribeCache.get(id);
                  if (item) {
                    item.preData = d;
                    item.callbacks.forEach((cb) => safeRun(cb, d));
                  }
                },
          ),
        );
        subscribeCache.set(id, { id, subscription, callbacks: [] });
      }
      const item = subscribeCache.get(id)!;
      item.callbacks.push(callback);
      if (item.preData !== undefined) callback(item.preData); // 把上次的结果输出一下
      const oldUnsubscribe = item.subscription.unsubscribe;
      const subscription: Subscription = Object.assign(
        Promise.resolve().then(() => item.subscription), // 不能用 Promise.resolve(item.subscription)
        {
          unsubscribe: () =>
            Promise.resolve().then(() => {
              const callbacks = subscribeCache.get(id)?.callbacks;
              if (callbacks) dirtyArrayOmit(callbacks, (it) => it === callback);
              if (!callbacks?.length) return oldUnsubscribe();
            }),
        },
      );
      return subscription;
    };
    return descriptor;
  };
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockData: Record<string, (params?: any) => any>;
  }
}

/*
 * 应用 mock 数据，mock 数据应该被注入到 window.mockData 对象上
 */
export function applyMock(id: keyof Window['mockData']) {
  return (_: unknown, name: string, descriptor: PropertyDescriptor) => {
    if (!/apply-mock=1/.test(window.location.search)) return descriptor;
    const oldRequest = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      return Promise.resolve()
        .then(() => oldRequest(...args))
        .catch((err) => {
          if (window.mockData[id]) return window.mockData[id](...args);
          return Promise.reject(err);
        });
    };
    return descriptor;
  };
}

// 重试
export function asyncRetry(count = 3, delay = 400) {
  return (_: unknown, name: string, descriptor: PropertyDescriptor) => {
    const oldRequest = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      let $count = count;
      while ($count > 0) {
        try {
          const result = await oldRequest(...args);
          return result;
        } catch (err) {
          await wait(delay);
          console.warn('Retry:', { count: $count, name, args, err });
          $count--;
          if ($count <= 0) return Promise.reject(err);
        }
      }
    };
    return descriptor;
  };
}
