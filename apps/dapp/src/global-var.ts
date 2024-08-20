import { MarketService } from '@sofa/services/market';
import { Env } from '@sofa/utils/env';
import { jsonSafeParse } from '@sofa/utils/fns';
import localforage from 'localforage';
import { noop } from 'lodash-es';

import { useGlobalState } from './store';

window.storage = {
  get<T>(k: string) {
    const str = localStorage.getItem(k);
    return jsonSafeParse(str, null) as T | null | undefined;
  },
  set<T>(k: string, v: T) {
    const str = JSON.stringify(v);
    localStorage.setItem(k, str);
  },
  remove(k: string) {
    localStorage.removeItem(k);
  },
};

const asyncStorage = localforage.createInstance({
  driver: localforage.INDEXEDDB,
  name: 'user_storage',
  storeName: Env.isDaily ? 'key_value_pairs_test' : 'key_value_pairs',
  version: 1,
});

window.asyncStorage = {
  get<T>(k: string) {
    return asyncStorage.getItem<T>(k);
  },
  set<T>(k: string, v: T) {
    return asyncStorage.setItem(k, v).then(noop);
  },
  remove(k: string) {
    return asyncStorage.removeItem(k);
  },
};

window.getInterestRate = async (chainId: number, ccy: string) => {
  const value = useGlobalState.getState().interestRate[chainId]?.[ccy];
  if (value) return value;
  const IR = await MarketService.interestRate(chainId);
  return IR[ccy as never];
};
