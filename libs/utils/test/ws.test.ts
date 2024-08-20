/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';

vi.mock('../ws/utils', async () => {
  const utils = await import('../ws/utils');
  return {
    ...utils,
    Ws: class WebSocketMock {
      readyState = WebSocketMock.OPEN;
      onopen?(): void;
      onmessage?(data: any): void;
      onclose?(): void;
      onerror?(err: Error): void;
      send = vi.fn();

      constructor(public url: string) {}

      static get OPEN() {
        return 1;
      }

      static get CLOSED() {
        return 3;
      }

      close() {
        this.readyState = WebSocketMock.CLOSED;
        setTimeout(() => this.onclose?.());
      }

      // 用于测试中手动触发事件的辅助方法
      triggerMessage(data: any) {
        setTimeout(() => this.onmessage?.(data));
      }

      triggerError(error: Error) {
        setTimeout(() => this.onerror?.(error));
      }
    },
  };
});

import { WsClients } from '../ws';

describe('WsClient class', () => {
  const dataInterceptor = {
    request: vi.fn(),
    response: (data: any) => data,
  };
  const requestId = (method: string, args: unknown) =>
    `${method}-${JSON.stringify(args)}`;
  const ws = new WsClients('/', {
    //@ts-ignore
    ping: async (ctx) => ctx.connection.triggerMessage('ping'),
    dataInterceptor,
    requestId,
  });
  // @ts-ignore
  ws.addClient();

  it('request', async () => {
    setTimeout(
      () =>
        //@ts-ignore
        ws.clients[0].connection.triggerMessage({
          id: requestId('add', '1,2'),
          data: 3,
          succ: true,
        }),
      400,
    );
    const res = await ws.request('add', '1,2');
    expect(res).toBe(3);
  });

  it('subscribe', async () => {
    const timer = setInterval(
      () =>
        //@ts-ignore
        ws.clients[0].connection.triggerMessage({
          id: requestId('subscribe', ['ticker']),
          topic: 'ticker',
          data: 3,
          succ: true,
        }),
      400,
    );
    const cb = vi.fn();
    const subscription = ws.subscribe('ticker', cb);
    setTimeout(() => {
      subscription.unsubscribe();
      clearInterval(timer);
      expect(cb).toHaveBeenCalledTimes(2);
    }, 1000);
  });

  it('combine subscribe', async () => {
    const timer = setInterval(
      () =>
        //@ts-ignore
        ws.clients[0].connection.triggerMessage({
          id: requestId('subscribe', ['ticker1', 'ticker2']),
          topic: 'ticker1',
          data: 3,
          succ: true,
        }),
      400,
    );
    const cb = vi.fn();
    const subscription = ws.subscribe('ticker1', cb);
    const subscription1 = ws.subscribe('ticker2', cb);
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        subscription.unsubscribe();
        subscription1.unsubscribe();
        clearInterval(timer);
        resolve();
      }, 1000);
    });
    expect(cb).toHaveBeenCalledTimes(2);
  });
});
