import { ejectPromise, wait } from '@livelybone/promise-wait';
import { Eip1193Provider } from 'ethers';

export interface EIP6963ProviderInfo {
  rdns: string;
  uuid: string;
  name: string;
  icon: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: Eip1193Provider;
}

export type EIP6963AnnounceProviderEvent = {
  detail: EIP6963ProviderDetail;
};

declare global {
  interface WindowEventMap {
    'eip6963:announceProvider': EIP6963AnnounceProviderEvent;
  }
}

let providers: ReturnType<typeof ejectPromise<EIP6963ProviderDetail[]>>;
export async function getProviderByEip6963() {
  if (providers) return providers;
  if (typeof window === 'undefined') return;
  providers = ejectPromise<EIP6963ProviderDetail[]>();
  const list: EIP6963ProviderDetail[] = [];
  const handler = (event: EIP6963AnnounceProviderEvent) => {
    if (event.detail?.provider) list.push(event.detail);
  };
  window.addEventListener('eip6963:announceProvider', handler);
  await wait(100);
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  await wait(100);
  providers.resolve(list);
  window.removeEventListener('eip6963:announceProvider', handler);
  return providers;
}
