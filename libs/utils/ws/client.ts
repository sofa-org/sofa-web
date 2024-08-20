import { ejectPromise, wait, waitUntil } from '@livelybone/promise-wait';
import { promiseOnPending } from '@livelybone/singleton';
import { nanoid } from 'nanoid';

import { asyncShare } from '../decorators';
import { jsonSafeParse, safeRun } from '../fns';
import { Logger } from '../logger';
import { dirtyArrayOmit } from '../object';

import { combineSubscribe, Ws, wsRetry } from './utils';

export interface WsClientResult<T = unknown> {
  id?: string;
  succ: boolean;
  method: string;
  data: T;
  args?: unknown;
  topic?: string;
  msg?: string;
}

export interface WsClientOptions {
  auth?: {
    method?: string; // default: 'auth'
    fn(ctx: WsClient): Promise<unknown>;
  };

  /***
   * @desc 请求串行发起的规则
   * - none 表示使用方调用时就直接向 websocket 目标服务发起请求
   * - all 表示使用方调用时要等待前面的所有请求回复后才能发起
   * - by-method 表示使用方调用时要等待前面所有的同种 method 的请求回复后才能发起
   *
   * @default 'none'
   * */
  serialRequest?: 'none' | 'all' | 'by-method';
  /**
   * @desc 是否支持合并 topic 订阅，如果支持，会将 100ms 内发起的订阅请求合并到一个, 合并的 topics 会按照字典序排序
   * @default true
   * */
  combineTopic?: boolean;
  /**
   * @default 5000ms
   * */
  pingInterval?: number;
  dataInterceptor?: {
    /**
     * @default (data?: { method: string, args: unknown, id: string }) => JSON.stringify(data)
     * */
    request?: (
      data: { method: string; args: unknown; id: string },
      ctx: WsClient,
    ) => string | ArrayBufferLike | Blob | ArrayBufferView;
    /**
     * @default ev => { const data = JSON.parse(ev.data); return { id: data.id, topic: data.topic, succ: !!data.succ, msg: data.msg, data: data } }
     * */
    response?: (ev: MessageEvent, ctx: WsClient) => WsClientResult;
  };
  /**
   * @desc 每个 websocket send 请求的重试次数
   * @default 3
   * */
  retryTimes?: number;

  /**
   * @default (method: string, args: unknown) => `${method}-${JSON.stringify(args)}`;
   * */
  requestId?(method: string, args: unknown): string;

  onopen?(ctx: WsClient): void;

  onclose?(ctx: WsClient): void;

  onerror?(err: unknown, ctx: WsClient): void;

  onmessage?(ev: MessageEvent, ctx: WsClient): void;

  ping(ctx: WsClient): Promise<unknown>;

  beforeCreateConnection?(ctx: WsClient): unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface WsRequestHandler<T = any> {
  id: string;
  parameters: readonly [string, unknown, number];
  handler: (data: T, err?: Error) => void;
}

export interface WsSubscribeHandler {
  topic: string;
  handlers: ((data: unknown) => void)[];
  method: string;
  sent?: boolean; // 是否已发送订阅请求（combineTopic 的操作会导致订阅请求可能会延迟 100ms 发送)
}

/**
 * @features
 *  - 支持断线重连
 *  - 支持合并订阅
 *  - 支持请求串行
 * */
export class WsClient {
  id = nanoid();
  url = '/';
  options!: WsClientOptions;

  /**
   * @desc websocket 连接成功或者关闭的总次数
   * */
  count = 0;
  connection!: WebSocket & { id: number; errorCount: number };
  destroyed = false;
  authorized?: boolean;
  pingTimer?: number;

  /**
   * @desc 正在进行的所有请求，parameters 用于重连的请求重发
   * */
  requestHandlers = new Map<WsRequestHandler['id'], WsRequestHandler>();

  /**
   * @desc 正在订阅的 topic 集合
   * */
  subscribeHandlers = new Map<
    WsSubscribeHandler['topic'],
    WsSubscribeHandler
  >();

  private readonly combineSubscribe: ReturnType<typeof combineSubscribe>;
  private readonly combineUnsubscribe: ReturnType<typeof combineSubscribe>;

  constructor(url: string, options: WsClientOptions) {
    this.url = url;
    this.options = options;
    this.init();
    this.ping();
    this.tryAuth();

    const subscribe = combineSubscribe(
      `ws-subscribe-${this.url}`,
      (topics) => {
        const method = topics[0]?.method || 'subscribe';
        const topicsNeedRequest = (() => {
          const items: WsSubscribeHandler[] = [];
          this.subscribeHandlers.forEach(
            (it) => !it.sent && it.method === method && items.push(it),
          );
          return items;
        })();
        topicsNeedRequest.forEach((it) => (it.sent = true));
        return topicsNeedRequest.length
          ? wsRetry(
              () =>
                this.request(
                  method,
                  topicsNeedRequest
                    .map((it) => it.topic)
                    .sort((a, b) => a.localeCompare(b)),
                ),
              this.options.retryTimes ?? 3,
            )
          : Promise.resolve();
      },
      this.options.combineTopic !== false ? 100 : 0,
    );

    this.combineSubscribe = (
      topic: string,
      handler: (data: unknown) => void,
      method: string,
    ) => {
      const item = this.subscribeHandlers.get(topic);
      if (!item) {
        this.subscribeHandlers.set(topic, {
          topic,
          handlers: [handler],
          method,
        });
      } else {
        item.handlers.push(handler);
        if (!item.method) item.method = method;
      }
      return subscribe(topic, handler, method);
    };

    this.combineUnsubscribe = combineSubscribe(
      `ws-unsubscribe-${this.url}`,
      (topics) => {
        const method = topics[0]?.method || 'unsubscribe';
        const topicsShouldRequest: string[] = [];

        topics.forEach((it) => {
          const subscriber = this.subscribeHandlers.get(it.topic);
          if (!subscriber) return;
          // 删除对应订阅句柄
          dirtyArrayOmit(subscriber.handlers, (handler) =>
            it.handlers.includes(handler),
          );
          if (subscriber.handlers.length) return;
          // 如果 topic 的订阅句柄被清空了，则说明需要真正向服务端发送取消订阅的请求，同时直接删除 subscribeHandlers 的 topic
          topicsShouldRequest.push(it.topic);
          this.subscribeHandlers.delete(it.topic);
        });
        topicsShouldRequest.sort((a, b) => a.localeCompare(b));

        return topicsShouldRequest.length
          ? wsRetry(
              () => this.request(method, topicsShouldRequest),
              this.options.retryTimes ?? 3,
            )
          : Promise.resolve();
      },
      this.options.combineTopic !== false ? 100 : 0,
    );
  }

  ping() {
    this.pingTimer = setInterval(() => {
      return this.options
        .ping(this)
        .catch((err) => console.error(err, { ...err }));
    }, this.options.pingInterval || 5000) as unknown as number;
    return this.pingTimer;
  }

  @asyncShare(100, (name, args, ctx) => `${name}-${ctx.url}`)
  async tryAuth() {
    return this.options.auth
      ?.fn(this)
      .then(() => (this.authorized = true))
      .catch((err) => {
        console.error(err);
        this.authorized = false;
      });
  }

  reconnect() {
    this.connection?.close();
  }

  destroy() {
    this.destroyed = true;
    this.connection?.close();
    clearInterval(this.pingTimer);
  }

  send(data: { method: string; args: unknown; id: string }) {
    const $data = this.options.dataInterceptor?.request
      ? this.options.dataInterceptor.request(data, this)
      : JSON.stringify(data);
    this.connection.send($data);
  }

  @asyncShare(
    undefined,
    (name, args, ctx) =>
      `ws-${ctx.id}-${name}-${args[0]}-${JSON.stringify(args[1])}`,
  )
  request<T = unknown>(method: string, args: unknown, timeout = 5000) {
    return waitUntil(() => {
      if (this.destroyed)
        return Promise.reject(
          new Error(`This websocket(${this.url}) instance has been closed!`),
        );
      const { auth } = this.options;
      const authMethod = auth?.method || 'auth';
      if (this.connection?.readyState !== 1) return false;
      // 以下情况通过，继续请求：
      // 1. 没有配置 auth 信息（不需要 auth） 的 client 的请求
      // 1. 已经成功 auth 的请求
      // 2. auth 请求
      if (!auth || this.authorized || authMethod === method) return true;

      // 如果上面情况都没通过，则说明是应该先得到授权信息才能继续的请求，判断 requestHandlers 中是否存在 pending 中的 auth 请求，如果不存在则 try auth
      const authRequest = (() => {
        for (const [, it] of this.requestHandlers) {
          if (it.parameters[0] === authMethod) return it;
        }
      })();
      if (!authRequest) this.tryAuth();

      // 最后返回 false（继续等待）
      return false;
    }).then(
      () => {
        const result = ejectPromise<T>();

        const send = () => {
          const id = this.genRequestId(method, args);
          const timer = wait(timeout);
          const item = {
            id,
            handler: (data: T, err?: Error) => {
              timer.stop();
              return err ? result.reject(err) : result.resolve(data);
            },
            parameters: [method, args, timeout] as const,
          };
          this.requestHandlers.set(item.id, item);

          timer.then(() => {
            if (this.requestHandlers.get(item.id)?.handler === item.handler) {
              this.requestHandlers.delete(item.id);
            }
            result.reject(
              new Error(`Request timeout(${timeout}ms): ${id}. ${this.url}`),
            );
          });

          result.catch(console.error);

          this.send({ method, args, id });
        };

        // send 和添加 handler 之前，先检查之前是否还有其他未响应的请求
        if (this.options.serialRequest === 'all') {
          waitUntil(() => this.requestHandlers.size < 1, {
            resolveTimeout: true,
          }).then(() => send());
        } else if (this.options.serialRequest === 'by-method') {
          waitUntil(
            () =>
              (() => {
                const handlers: WsRequestHandler[] = [];
                this.requestHandlers.forEach(
                  (it) => it.parameters[0] === method && handlers.push(it),
                );
                return handlers;
              })().length < 1,
            { resolveTimeout: true },
          ).then(() => send());
        } else {
          send();
        }

        return result;
      },
      (err: Error) => {
        return Promise.reject(
          Object.assign(err, { method, args, url: this.url }),
        );
      },
    );
  }

  /**
   * method 指 topic 需要使用的订阅方法，比如 deribit 订阅分为 public/subscribe、private/subscribe 等
   * 订阅请求会被处理成 { method: '{{method}}', args: ['{{topic}}'] }
   * */
  subscribe<T>(
    topic: string,
    handler: (data: T) => void,
    method?: string,
    unsubscribeMethod?: string,
  ) {
    return Object.assign(
      this.combineSubscribe(topic, handler, method || 'subscribe'),
      {
        unsubscribe: () => this.unsubscribe(topic, handler, unsubscribeMethod),
      },
    ) as Subscription;
  }

  /**
   * method 指 topic 需要使用的订阅方法，比如 deribit 订阅分为 public/unsubscribe、private/unsubscribe 等
   * 取消订阅请求会被处理成 { method: '{{method}}', args: ['{{topic}}'] }
   * 返回 Promise<'virtual'> 表示 topic 由于被多个 handle 处理导致未被真正取消 unsubscribe
   * */
  unsubscribe<T>(topic: string, handler: (data: T) => void, method?: string) {
    return this.combineUnsubscribe(
      topic,
      handler,
      method || 'unsubscribe',
    ).then(() => {
      if (this.subscribeHandlers.get(topic)) return 'virtual' as const;
      return Promise.resolve('truly' as const);
    });
  }

  private init() {
    const id = this.count;
    return promiseOnPending(
      async () => {
        await this.options.beforeCreateConnection?.(this);

        if (this.destroyed) return Promise.resolve();
        const promise = ejectPromise<void>();

        this.connection = Object.assign(new Ws(this.url), {
          id,
          errorCount: 0,
        });

        const resend = () => {
          const requestMap = {} as Record<
            string /* method */,
            { method: string; args: unknown }
          >;
          const $requestMap = {} as Record<
            string /* requestId */,
            { method: string; args: unknown }
          >;
          this.requestHandlers.forEach((it) => {
            const [method, args] = it.parameters;
            requestMap[method] = { method, args };
            const rId = this.genRequestId(method, args);
            $requestMap[rId] = { method, args };
            this.send({ method, args, id: rId });
          });
          const subscribes =
            this.options.combineTopic !== false
              ? (() => {
                  const pre = {} as Record<
                    string,
                    { method: string; topics: string[] }
                  >;
                  this.subscribeHandlers.forEach((it) => {
                    if (!pre[it.method])
                      pre[it.method] = { method: it.method, topics: [] };
                    const hasSubscribed = Boolean(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (requestMap[it.method]?.args as any[])?.includes?.(
                        it.topic,
                      ),
                    );
                    if (!hasSubscribed) pre[it.method].topics.push(it.topic);
                  });
                  return pre;
                })()
              : (() => {
                  const items: { method: string; topics: string[] }[] = [];
                  this.subscribeHandlers.forEach(
                    (it) =>
                      !$requestMap[this.genRequestId(it.method, [it.topic])] &&
                      items.push({ ...it, topics: [it.topic] }),
                  );
                  return items;
                })();
          Object.values(subscribes).forEach((it) => {
            if (it.topics.length) {
              this.send({
                method: it.method,
                args: it.topics,
                id: this.genRequestId(it.method, it.topics),
              });
            }
          });
        };

        this.connection.onopen = async () => {
          Logger.info('WebSocket connected!', this.url);
          promise.resolve();

          await this.tryAuth().catch(console.error);
          if (this.count > 0) resend();

          this.count += 1;
          this.options.onopen?.(this);
        };
        this.connection.onclose = (ev) => {
          Logger.error('WebSocket closed!', ev);

          this.authorized = false;
          promise.reject(new Error('WebSocket closed!'));
          if (!this.destroyed)
            setTimeout(() => this.init().then(() => promise.resolve()), 2000);
          this.options.onclose?.(this);
        };
        this.connection.onerror = (ev) => {
          Logger.error('WebSocket error:', ev);

          if (this.connection && [2, 3].includes(this.connection.readyState)) {
            this.connection.errorCount += 1;
            if (this.connection.errorCount > 3) this.reconnect();
          }
          promise.reject(ev);
          this.options.onerror?.(ev, this);
        };
        this.connection.onmessage = (ev) => {
          const data = this.options.dataInterceptor?.response
            ? this.options.dataInterceptor.response(ev, this)
            : (() => {
                const $data = jsonSafeParse(ev.data, ev.data);
                return {
                  method: $data.method,
                  args: $data.args,
                  topic: $data.topic,
                  succ: $data.succ,
                  msg: $data.msg,
                  data: $data,
                  id: $data.id || this.genRequestId($data.method, $data.args),
                };
              })();

          // 有 topic 说明为订阅数据
          if (data.topic) {
            if (data.succ) {
              const it = this.subscribeHandlers.get(data.topic);
              it?.handlers.forEach((handler) => safeRun(handler, data));
            }
          } else {
            const it = this.requestHandlers.get(data.id);
            const error =
              data.succ || !it
                ? undefined
                : new Error(
                    `${data.msg || `Request(${data.id}) Failed`}(${
                      this.url
                    }: ${JSON.stringify(it.parameters)})`,
                  );
            it?.handler(data.data, error);
            if (it) this.requestHandlers.delete(it.id);
          }
          this.options.onmessage?.(ev, this);
        };
        return promise;
      },
      { id: `${this.id}-${id}` },
    );
  }

  private genRequestId(method: string, args: unknown) {
    if (this.options.requestId) return this.options.requestId(method, args);
    return `${method}-${JSON.stringify(args)}`;
  }
}
