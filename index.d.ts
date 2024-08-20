declare type Subscription = Promise<unknown> & {
  unsubscribe(): Promise<unknown>;
};

declare interface HttpResponse<T = unknown> {
  // 0 表示成功，其它表示异常
  code: number;
  value: T;
  message?: string;
}

declare type CCY = 'BTC' | 'ETH' | 'RCH' | 'WBTC' | 'WETH' | 'stETH';
declare type USDS = 'USD' | 'USDC' | 'USDT';

declare type PRecord<K, V> = Partial<Record<K, V>>;

declare type PartialRecord<Keys, Value> = Partial<Record<Keys, Value>>;

declare type PartialRequired<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Record<string, any>,
  Keys extends keyof T,
> = Partial<T> & Required<Pick<T, Keys>>;

declare type XPartial<
  T extends Record<string, unknown>,
  Keys extends keyof T,
> = Omit<T, Keys> & Partial<Pick<T, Keys>>;

declare type XRequired<
  T extends Record<string, unknown>,
  Keys extends keyof T,
> = Omit<T, Keys> & Required<Pick<T, Keys>>;

declare type PromiseVal<T> = T extends Promise<infer E> ? E : unknown;

declare type EmptyObj = Record<string | number, unknown>;

declare interface BaseProps {
  id?: string;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style?: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children?: any;
}

declare interface BaseInputProps<
  T,
  ChangeValType extends 'value' | 'fn' = 'value',
> extends BaseProps {
  disabled?: boolean;
  value?: T;

  onChange?(
    val?: ChangeValType extends 'value' ? T : T | ((pre?: T) => T),
  ): void;
}

declare type ArrOrItem<ArrType> = ArrType | ArrType[];

declare type PageParams<
  K extends 'offset' | 'cursor' = 'offset',
  By extends string = string,
> = {
  offset?: K extends 'offset' ? number : never;
  cursor?: K extends 'cursor' ? string | number : never;
  limit?: number;
  orderBy?: By;
  orderDirection?: 'desc' | 'asc';
} & (K extends 'offset' ? { offset?: number } : { cursor?: string | number });

declare type PageResult<
  T,
  Extra extends Record<string, unknown> = unknown,
  K extends 'offset' | 'cursor' = 'offset',
> = {
  limit: number;
  orderBy?: string;
  orderDirection?: 'desc' | 'asc';
  total?: number;
  hasMore?: boolean;
  list?: T[];
} & (K extends 'offset' ? { offset: number } : { cursor?: string | number }) &
  Extra;

declare interface GlobalVal {
  storage: {
    get<T>(k: string): T | null | undefined;
    set<T>(k: string, v: T): void;
    remove(k: string): void;
  };
  asyncStorage: {
    get<T>(k: string): Promise<T | null | undefined>;
    set<T>(k: string, v: T): Promise<void>;
    remove(k: string): Promise<void>;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ethereum?: any; // 由 metamask 向全局注入
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  okxwallet?: any; // 由 okx wallet 向全局注入
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  web3?: { currentProvider: any }; // 由 metamask 向全局注入（不再推荐，但是移动端可能会用到）
  getInterestRate(
    chainId: number,
    ccy: string,
  ): Promise<
    { current: number; avgWeekly: number; apyUsed: number } | undefined
  >;
  winScale: number;
  px2rem(val: string | number): string;
}

interface Window extends GlobalVal {}
interface Global extends GlobalVal {}
