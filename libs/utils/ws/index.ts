/**
 * @features
 *  - 根据
 * */
import { WsClient, WsClientOptions } from './client';

export interface WsClientsOptions extends WsClientOptions {
  /**
   * @desc 每个 websocket 连接最多可支持的订阅数量，超过时会自动建立另一个连接，外部使用不用关系连接处理
   * @default 30
   * */
  maxRequestNum?: number;
}

export class WsClients {
  url: string;
  options: WsClientsOptions;
  clients: WsClient[] = [];

  constructor(url: string, options: WsClientsOptions) {
    this.url = url;
    this.options = options;
  }

  ping() {
    return Promise.all(this.clients.map((it) => it.ping()));
  }

  tryAuth() {
    return Promise.all(this.clients.map((it) => it.tryAuth()));
  }

  reconnect() {
    this.clients.forEach((it) => it.reconnect());
  }

  destroy() {
    this.clients.forEach((it) => it.destroy());
    this.clients = [];
  }

  send(data: { method: string; args: unknown; id: string }) {
    let lowRequestClient = this.clients.find(
      (it) => it.requestHandlers.size < 10,
    );
    if (!lowRequestClient) lowRequestClient = this.addClient();
    lowRequestClient.send(data);
  }

  request<T = unknown>(
    method: string,
    args: unknown,
    timeout = 5000,
  ): Promise<T> {
    const id = `${method}-${JSON.stringify(args)}`;
    let targetOrLowRequestClient =
      this.clients.find((it) => it.requestHandlers.get(id)) || this.clients[0];
    if (!targetOrLowRequestClient) {
      targetOrLowRequestClient = this.addClient();
    }
    return targetOrLowRequestClient.request(method, args, timeout);
  }

  subscribe<T>(
    topic: string,
    handler: (data: T) => void,
    method?: string,
  ): Promise<unknown> & { unsubscribe(): Promise<unknown> } {
    let targetOrLowSubscribeClient = this.clients.find(
      (it) =>
        it.subscribeHandlers.get(topic) ||
        it.subscribeHandlers.size < (this.options.maxRequestNum || 30),
    );
    if (!targetOrLowSubscribeClient) {
      targetOrLowSubscribeClient = this.addClient();
    }
    return targetOrLowSubscribeClient.subscribe(topic, handler, method);
  }

  async unsubscribe<T>(
    topic: string,
    handler: (data: T) => void,
    method?: string,
  ) {
    const client = this.clients.find((it) => it.subscribeHandlers.get(topic));
    return client?.unsubscribe(topic, handler, method);
  }

  private addClient() {
    const client = new WsClient(this.url, this.options);
    this.clients.push(client);
    return client;
  }
}
