import { ejectPromise } from '@livelybone/promise-wait';
import { singleton } from '@livelybone/singleton';

declare const MozWebSocket: typeof WebSocket;

declare global {
  // eslint-disable-next-line no-var
  var MozWebSocket: undefined | typeof WebSocket;
}

export const Ws = ((): typeof WebSocket => {
  if (typeof WebSocket !== 'undefined') {
    return WebSocket;
  }
  if (typeof MozWebSocket !== 'undefined') {
    return MozWebSocket;
  }
  if (typeof self !== 'undefined') {
    return self.WebSocket || self.MozWebSocket;
  }
  console.error(new Error('The browser do not support WebSocket!'));
  return class MockWs {} as unknown as typeof WebSocket;
})();

export function wsRetry(cb: () => Promise<unknown>, times = 3) {
  return [...Array(Math.max(0, times - 1))].reduce(
    (pre) => pre.catch(() => cb()),
    cb(),
  );
}

export function combineSubscribe(
  idPrefix: string,
  subscribe: (
    // time 时间内所有的订阅请求合并之后的对象（按照 method + topic 合并）
    topics: {
      topic: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handlers: ((data: any) => void)[];
      method: string;
    }[],
  ) => Promise<unknown>,
  time = 100,
) {
  const genCombineInfo = () => ({
    lastTime: Date.now(),
    timer: undefined as undefined | number,
    // 实现合并请求的定时器
    topics: [] as {
      topic: string;
      handler: (data: unknown) => void;
      method: string;
    }[],
  });
  const combineInfos: Record<string, ReturnType<typeof genCombineInfo>> = {};
  const combineInfo = (method: string) => {
    if (!combineInfos[method]) combineInfos[method] = genCombineInfo();
    return combineInfos[method];
  };

  /**
   * method 指 topic 需要使用的订阅方法，比如 deribit 订阅分为 public/subscribe、private/subscribe、public/unsubscribe、private/unsubscribe 等
   * */
  const getResult = (method: string) =>
    singleton(`${idPrefix}-${method}-${combineInfo(method).lastTime}`, () =>
      ejectPromise<unknown>(),
    );
  const call = (method: string) => {
    const result = getResult(method);
    const topics = combineInfo(method).topics.reduce(
      (pre, it) => {
        if (it.method !== method) return pre;
        if (!pre[it.topic])
          pre[it.topic] = { topic: it.topic, handlers: [], method: it.method };
        pre[it.topic].handlers.push(it.handler);
        return pre;
      },
      {} as Record<
        string,
        { topic: string; handlers: ((data: unknown) => void)[]; method: string }
      >,
    );
    combineInfo(method).lastTime = Date.now();
    combineInfo(method).topics.length = 0;
    subscribe(Object.values(topics))
      .then(result.value.resolve)
      .catch(result.value.reject)
      .finally(() => result.delete());
    return result.value;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (topic: string, handler: (data: any) => void, method: string) => {
    combineInfo(method).topics.push({ topic, handler, method });
    const shouldCall = Date.now() - combineInfo(method).lastTime > time;
    if (!shouldCall) {
      clearTimeout(combineInfo(method).timer);
      const result = getResult(method);
      if (time)
        combineInfo(method).timer = setTimeout(
          () => call(method),
          time,
        ) as unknown as number;
      else call(method);
      return result.value;
    }
    return call(method);
  };
}
