/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ejectPromise, wait, waitUntil } from '@livelybone/promise-wait';
import { asyncCache, asyncShare } from '@sofa/utils/decorators';
import { Env } from '@sofa/utils/env';
import { getErrorMsg } from '@sofa/utils/fns';
import { reMsgError } from '@sofa/utils/object';
import {
  EIP6963ProviderDetail,
  getProviderByEip6963,
} from '@sofa/utils/wallet/eip-6963';
import { WalletTgSdk } from '@uxuycom/web3-tg-sdk';
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers';
import {
  BrowserProvider,
  Eip1193Provider,
  JsonRpcProvider,
  JsonRpcSigner,
} from 'ethers';
import { nanoid } from 'nanoid';

import iconWalletConnect from './assets/icon-walletconnect.svg?url';
import { ChainMap } from './chains';

export type Connector = {
  id: string;
  type: string;
  name?: string;
  imageId?: string;
  explorerId?: string;
  imageUrl?: string;
  info?: { rdns?: string };
  originProvider?: Eip1193Provider;
  provider?: JsonRpcProvider | BrowserProvider;
  signer?: JsonRpcSigner;
};

function checkChainId(chainId?: number) {
  if (chainId !== undefined && !ChainMap[chainId])
    throw new Error(`Do not support this chain(${chainId})`);
}

let web3modal: Promise<ReturnType<typeof createWeb3Modal>> & {
  resolve(m: ReturnType<typeof createWeb3Modal>): void;
};

// 依赖 wallet connect
export class WalletConnect {
  static async getModal() {
    const providers = await getProviderByEip6963();
    if (web3modal) return web3modal;
    // 1. Get projectId at https://cloud.walletconnect.com
    const projectId = 'fd395d0f6ef482bec990ddba78ed9875'; // from @Justyn Liu

    // // 2. Set chains
    // const chain = ChainMap[chainId];

    // 3. Create modal
    const metadata = {
      name: 'SOFA',
      description: `SOFA.org is a decentralized, non-profit, open-source technology organization for handling all financial assets on-chain. Earn $RCH via protocol use, liquidity provision, or governance. $SOFA lets holders vote on proposals shaping SOFA.org's future.`,
      url: 'https://sofa.org',
      icons: ['https://sofa.org'],
    };

    const modal = createWeb3Modal({
      ethersConfig: defaultConfig({ metadata }),
      chains: Object.values(ChainMap).filter((it) =>
        Env.isDaily ? it.isTest : !it.isTest,
      ),
      projectId,
      themeMode: 'light',
      customWallets: Env.isTelegram
        ? []
        : [
            ...(providers?.some((it) => /okx\s*wallet/i.test(it.info.name))
              ? []
              : [
                  {
                    id: 'okx-wallet',
                    name: 'OKX Wallet',
                    homepage: 'https://www.okx.com/web3', // Optional
                    image_url:
                      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJDSURBVHgB7Zq9jtpAEMfHlhEgQLiioXEkoAGECwoKxMcTRHmC5E3IoyRPkPAEkI7unJYmTgEFTYwA8a3NTKScLnCHN6c9r1e3P2llWQy7M/s1Gv1twCP0ej37dDq9x+Zut1t3t9vZjDEHIiSRSPg4ZpDL5fxkMvn1cDh8m0wmfugfO53OoFQq/crn8wxfY9EymQyrVCqMfHvScZx1p9ls3pFxXBy/bKlUipGPrVbLuQqAfsCliq3zl0H84zwtjQrOw4Mt1W63P5LvBm2d+Xz+YzqdgkqUy+WgWCy+Mc/nc282m4FqLBYL+3g8fjDxenq72WxANZbLJeA13zDX67UDioL5ybXwafMYu64Ltn3bdDweQ5R97fd7GyhBQMipx4POeEDHIu2LfDdBIGGz+hJ9CQ1ABjoA2egAZPM6AgiCAEQhsi/C4jHyPA/6/f5NG3Ks2+3CYDC4aTccDrn6ojG54MnEvG00GoVmWLIRNZ7wTCwDHYBsdACy0QHIhiuRETxlICWpMMhGZHmqS8qH6JLyGegAZKMDkI0uKf8X4SWlaZo+Pp1bRrwlJU8ZKLIvUjKh0WiQ3sRUbNVq9c5Ebew7KEo2m/1p4jJ4qAmDaqDQBzj5XyiAT4VCQezJigAU+IDU+z8vJFnGWeC+bKQV/5VZ71FV6L7PA3gg3tXrdQ+DgLhC+75Wq3no69P3MC0NFQpx2lL04Ql9gHK1bRDjsSBIvScBnDTk1WrlGIZBorIDEYJj+rhdgnQ67VmWRe0zlplXl81vcyEt0rSoYDUAAAAASUVORK5CYII=', // Optional
                    desktop_link:
                      'https://chrome.google.com/webstore/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge', // Optional - Deeplink
                    app_store:
                      'https://apps.apple.com/us/app/okx-buy-bitcoin-btc-crypto/id1327268470', // Optional
                    play_store:
                      'https://play.google.com/store/apps/details?id=com.okinc.okex.gp', // Optional
                    mobile_link: `https://www.okx.com/download?deeplink=${encodeURIComponent(
                      `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(
                        window.location.href,
                      )}`,
                    )}`,
                  },
                ]),
            ...(providers?.some((it) => /metamask/i.test(it.info.name))
              ? []
              : [
                  {
                    id: 'metamask',
                    name: 'MetaMask',
                    homepage: 'https://metamask.io/', // Optional
                    image_url:
                      'data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjMzIiB2aWV3Qm94PSIwIDAgMzUgMzMiIHdpZHRoPSIzNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iLjI1Ij48cGF0aCBkPSJtMzIuOTU4MiAxLTEzLjEzNDEgOS43MTgzIDIuNDQyNC01LjcyNzMxeiIgZmlsbD0iI2UxNzcyNiIgc3Ryb2tlPSIjZTE3NzI2Ii8+PGcgZmlsbD0iI2UyNzYyNSIgc3Ryb2tlPSIjZTI3NjI1Ij48cGF0aCBkPSJtMi42NjI5NiAxIDEzLjAxNzE0IDkuODA5LTIuMzI1NC01LjgxODAyeiIvPjxwYXRoIGQ9Im0yOC4yMjk1IDIzLjUzMzUtMy40OTQ3IDUuMzM4NiA3LjQ4MjkgMi4wNjAzIDIuMTQzNi03LjI4MjN6Ii8+PHBhdGggZD0ibTEuMjcyODEgMjMuNjUwMSAyLjEzMDU1IDcuMjgyMyA3LjQ2OTk0LTIuMDYwMy0zLjQ4MTY2LTUuMzM4NnoiLz48cGF0aCBkPSJtMTAuNDcwNiAxNC41MTQ5LTIuMDc4NiAzLjEzNTggNy40MDUuMzM2OS0uMjQ2OS03Ljk2OXoiLz48cGF0aCBkPSJtMjUuMTUwNSAxNC41MTQ5LTUuMTU3NS00LjU4NzA0LS4xNjg4IDguMDU5NzQgNy40MDQ5LS4zMzY5eiIvPjxwYXRoIGQ9Im0xMC44NzMzIDI4Ljg3MjEgNC40ODE5LTIuMTYzOS0zLjg1ODMtMy4wMDYyeiIvPjxwYXRoIGQ9Im0yMC4yNjU5IDI2LjcwODIgNC40Njg5IDIuMTYzOS0uNjEwNS01LjE3MDF6Ii8+PC9nPjxwYXRoIGQ9Im0yNC43MzQ4IDI4Ljg3MjEtNC40NjktMi4xNjM5LjM2MzggMi45MDI1LS4wMzkgMS4yMzF6IiBmaWxsPSIjZDViZmIyIiBzdHJva2U9IiNkNWJmYjIiLz48cGF0aCBkPSJtMTAuODczMiAyOC44NzIxIDQuMTU3MiAxLjk2OTYtLjAyNi0xLjIzMS4zNTA4LTIuOTAyNXoiIGZpbGw9IiNkNWJmYjIiIHN0cm9rZT0iI2Q1YmZiMiIvPjxwYXRoIGQ9Im0xNS4xMDg0IDIxLjc4NDItMy43MTU1LTEuMDg4NCAyLjYyNDMtMS4yMDUxeiIgZmlsbD0iIzIzMzQ0NyIgc3Ryb2tlPSIjMjMzNDQ3Ii8+PHBhdGggZD0ibTIwLjUxMjYgMjEuNzg0MiAxLjA5MTMtMi4yOTM1IDIuNjM3MiAxLjIwNTF6IiBmaWxsPSIjMjMzNDQ3IiBzdHJva2U9IiMyMzM0NDciLz48cGF0aCBkPSJtMTAuODczMyAyOC44NzIxLjY0OTUtNS4zMzg2LTQuMTMxMTcuMTE2N3oiIGZpbGw9IiNjYzYyMjgiIHN0cm9rZT0iI2NjNjIyOCIvPjxwYXRoIGQ9Im0yNC4wOTgyIDIzLjUzMzUuNjM2NiA1LjMzODYgMy40OTQ2LTUuMjIxOXoiIGZpbGw9IiNjYzYyMjgiIHN0cm9rZT0iI2NjNjIyOCIvPjxwYXRoIGQ9Im0yNy4yMjkxIDE3LjY1MDctNy40MDUuMzM2OS42ODg1IDMuNzk2NiAxLjA5MTMtMi4yOTM1IDIuNjM3MiAxLjIwNTF6IiBmaWxsPSIjY2M2MjI4IiBzdHJva2U9IiNjYzYyMjgiLz48cGF0aCBkPSJtMTEuMzkyOSAyMC42OTU4IDIuNjI0Mi0xLjIwNTEgMS4wOTEzIDIuMjkzNS42ODg1LTMuNzk2Ni03LjQwNDk1LS4zMzY5eiIgZmlsbD0iI2NjNjIyOCIgc3Ryb2tlPSIjY2M2MjI4Ii8+PHBhdGggZD0ibTguMzkyIDE3LjY1MDcgMy4xMDQ5IDYuMDUxMy0uMTAzOS0zLjAwNjJ6IiBmaWxsPSIjZTI3NTI1IiBzdHJva2U9IiNlMjc1MjUiLz48cGF0aCBkPSJtMjQuMjQxMiAyMC42OTU4LS4xMTY5IDMuMDA2MiAzLjEwNDktNi4wNTEzeiIgZmlsbD0iI2UyNzUyNSIgc3Ryb2tlPSIjZTI3NTI1Ii8+PHBhdGggZD0ibTE1Ljc5NyAxNy45ODc2LS42ODg2IDMuNzk2Ny44NzA0IDQuNDgzMy4xOTQ5LTUuOTA4N3oiIGZpbGw9IiNlMjc1MjUiIHN0cm9rZT0iI2UyNzUyNSIvPjxwYXRoIGQ9Im0xOS44MjQyIDE3Ljk4NzYtLjM2MzggMi4zNTg0LjE4MTkgNS45MjE2Ljg3MDQtNC40ODMzeiIgZmlsbD0iI2UyNzUyNSIgc3Ryb2tlPSIjZTI3NTI1Ii8+PHBhdGggZD0ibTIwLjUxMjcgMjEuNzg0Mi0uODcwNCA0LjQ4MzQuNjIzNi40NDA2IDMuODU4NC0zLjAwNjIuMTE2OS0zLjAwNjJ6IiBmaWxsPSIjZjU4NDFmIiBzdHJva2U9IiNmNTg0MWYiLz48cGF0aCBkPSJtMTEuMzkyOSAyMC42OTU4LjEwNCAzLjAwNjIgMy44NTgzIDMuMDA2Mi42MjM2LS40NDA2LS44NzA0LTQuNDgzNHoiIGZpbGw9IiNmNTg0MWYiIHN0cm9rZT0iI2Y1ODQxZiIvPjxwYXRoIGQ9Im0yMC41OTA2IDMwLjg0MTcuMDM5LTEuMjMxLS4zMzc4LS4yODUxaC00Ljk2MjZsLS4zMjQ4LjI4NTEuMDI2IDEuMjMxLTQuMTU3Mi0xLjk2OTYgMS40NTUxIDEuMTkyMSAyLjk0ODkgMi4wMzQ0aDUuMDUzNmwyLjk2Mi0yLjAzNDQgMS40NDItMS4xOTIxeiIgZmlsbD0iI2MwYWM5ZCIgc3Ryb2tlPSIjYzBhYzlkIi8+PHBhdGggZD0ibTIwLjI2NTkgMjYuNzA4Mi0uNjIzNi0uNDQwNmgtMy42NjM1bC0uNjIzNi40NDA2LS4zNTA4IDIuOTAyNS4zMjQ4LS4yODUxaDQuOTYyNmwuMzM3OC4yODUxeiIgZmlsbD0iIzE2MTYxNiIgc3Ryb2tlPSIjMTYxNjE2Ii8+PHBhdGggZD0ibTMzLjUxNjggMTEuMzUzMiAxLjEwNDMtNS4zNjQ0Ny0xLjY2MjktNC45ODg3My0xMi42OTIzIDkuMzk0NCA0Ljg4NDYgNC4xMjA1IDYuODk4MyAyLjAwODUgMS41Mi0xLjc3NTItLjY2MjYtLjQ3OTUgMS4wNTIzLS45NTg4LS44MDU0LS42MjIgMS4wNTIzLS44MDM0eiIgZmlsbD0iIzc2M2UxYSIgc3Ryb2tlPSIjNzYzZTFhIi8+PHBhdGggZD0ibTEgNS45ODg3MyAxLjExNzI0IDUuMzY0NDctLjcxNDUxLjUzMTMgMS4wNjUyNy44MDM0LS44MDU0NS42MjIgMS4wNTIyOC45NTg4LS42NjI1NS40Nzk1IDEuNTE5OTcgMS43NzUyIDYuODk4MzUtMi4wMDg1IDQuODg0Ni00LjEyMDUtMTIuNjkyMzMtOS4zOTQ0eiIgZmlsbD0iIzc2M2UxYSIgc3Ryb2tlPSIjNzYzZTFhIi8+PHBhdGggZD0ibTMyLjA0ODkgMTYuNTIzNC02Ljg5ODMtMi4wMDg1IDIuMDc4NiAzLjEzNTgtMy4xMDQ5IDYuMDUxMyA0LjEwNTItLjA1MTloNi4xMzE4eiIgZmlsbD0iI2Y1ODQxZiIgc3Ryb2tlPSIjZjU4NDFmIi8+PHBhdGggZD0ibTEwLjQ3MDUgMTQuNTE0OS02Ljg5ODI4IDIuMDA4NS0yLjI5OTQ0IDcuMTI2N2g2LjExODgzbDQuMTA1MTkuMDUxOS0zLjEwNDg3LTYuMDUxM3oiIGZpbGw9IiNmNTg0MWYiIHN0cm9rZT0iI2Y1ODQxZiIvPjxwYXRoIGQ9Im0xOS44MjQxIDE3Ljk4NzYuNDQxNy03LjU5MzIgMi4wMDA3LTUuNDAzNGgtOC45MTE5bDIuMDAwNiA1LjQwMzQuNDQxNyA3LjU5MzIuMTY4OSAyLjM4NDIuMDEzIDUuODk1OGgzLjY2MzVsLjAxMy01Ljg5NTh6IiBmaWxsPSIjZjU4NDFmIiBzdHJva2U9IiNmNTg0MWYiLz48L2c+PC9zdmc+', // Optional
                    desktop_link:
                      'https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn', // Optional - Deeplink
                    app_store:
                      'https://apps.apple.com/us/app/metamask-blockchain-wallet/id1438144202', // Optional
                    play_store:
                      'https://play.google.com/store/apps/details?id=io.metamask', // Optional
                    mobile_link: `https://metamask.app.link/dapp/${window.location.href.replace(
                      /^https?:\/\//,
                      '',
                    )}`,
                  },
                ]),
          ],
    });

    web3modal = ejectPromise<ReturnType<typeof createWeb3Modal>>();
    // @ts-ignore
    await modal.initPromise;
    // @ts-ignore
    await modal.walletConnectProviderInitPromise;
    await wait(100);
    web3modal.resolve(modal);

    if (Env.isTelegram) {
      window.tgSdk = new WalletTgSdk({ injected: true });
      const imageUrl =
        'data:image/x-icon;base64,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';
      //@ts-ignore
      modal.addConnector({
        id: 'eip6963',
        type: 'INJECTED',
        name: 'UXUY Wallet',
        imageUrl,
        info: {
          uuid: nanoid(),
          name: 'UXUY Wallet',
          icon: imageUrl,
          rdns: 'com.uxuy',
        },
        provider: window.ethereum,
      });
    }

    return web3modal;
  }

  @asyncShare()
  static async switchNetwork(
    provider: JsonRpcProvider | BrowserProvider,
    chainId: number,
  ) {
    const currNetwork = await provider._detectNetwork();
    if (Number(currNetwork.chainId) === chainId) return;

    const networkData = {
      chainId: `0x${ChainMap[chainId].chainId.toString(16)}`,
      chainName: ChainMap[chainId].name,
      rpcUrls: [ChainMap[chainId].rpcUrl],
      nativeCurrency: ChainMap[chainId].nativeCurrency,
      blockExplorerUrls: [ChainMap[chainId].explorerUrl],
    };

    try {
      await provider.send('wallet_switchEthereumChain', [
        { chainId: networkData.chainId },
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (switchError: any) {
      if (
        !Env.isProd &&
        (switchError.code === 4902 || /4902/.test(getErrorMsg(switchError)))
      ) {
        try {
          await provider.send('wallet_addEthereumChain', [networkData]);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (addError: any) {
          throw reMsgError(
            addError.error || addError,
            (m) =>
              `Failed to add network - ${ChainMap[chainId].name}(${chainId}): ${m}`,
          );
        }
      } else {
        throw reMsgError(
          switchError.error || switchError,
          (m) =>
            `Failed to switch to network - ${ChainMap[chainId].name}(${chainId}): ${m}`,
        );
      }
    }
  }

  static async getValidConnectors(): Promise<
    XRequired<Connector, 'originProvider'>[]
  > {
    const modal = await WalletConnect.getModal();
    // @ts-ignore
    const connectors = modal.getConnectors();
    return Promise.all(
      connectors
        .filter((it) => it.provider)
        .map(async (it) => {
          const originProvider = it.provider! as Eip1193Provider;
          return { ...it, originProvider, provider: undefined };
        }),
    );
  }

  @asyncCache({
    until: async (pre, t, _, __, [chainId]) => {
      if (!pre || !t) return true;
      const network = await (pre as JsonRpcProvider)._detectNetwork();
      return Number(network.chainId) !== chainId;
    },
  })
  static async getProvider(chainId: number) {
    const modal = await WalletConnect.getModal();
    const modalProvider = modal.getWalletProvider();
    // @ts-ignore
    const providers: EIP6963ProviderDetail[] = modal.EIP6963Providers;
    if (
      modalProvider &&
      providers.every((it) => it.provider !== modalProvider)
    ) {
      providers.push({
        info: {
          name: 'walletConnect',
          icon: '',
          rdns: '',
          uuid: nanoid(),
        },
        provider: modalProvider,
      });
    }
    let provider: BrowserProvider | undefined;
    for (let i = 0; i < (providers?.length || 0); i += 1) {
      const p = new BrowserProvider(providers![i].provider);
      const network = await p._detectNetwork();
      if (Number(network.chainId) === chainId) {
        provider = p;
        break;
      }
    }
    console.info('Get Read Only Provider', {
      chainId,
      provider,
      providers,
      modal,
    });
    if (provider) return provider;
    return new JsonRpcProvider(ChainMap[chainId].rpcUrl, chainId);
  }

  @asyncShare()
  static async $getModalProvider() {
    if (Env.isMobile) {
      const validConnectors = await WalletConnect.getValidConnectors();
      if (validConnectors.length === 1) {
        const originProvider = validConnectors[0].originProvider;
        console.info('Get Modal Provider on mobile', {
          provider: originProvider,
          validConnectors,
        });
        return originProvider;
      }
    }

    const modal = await WalletConnect.getModal();
    const provider = modal.getWalletProvider();

    console.info('Get Modal Provider', { provider });
    if (provider) return provider;

    return undefined;
  }

  @asyncShare()
  static async getModalProvider() {
    const provider = await WalletConnect.$getModalProvider();

    if (provider) return new BrowserProvider(provider);

    return undefined;
  }

  static _wallet?: XRequired<
    Connector,
    'originProvider' | 'provider' | 'signer'
  > & {
    disconnect(): void;
  };
  static async connect(
    chainId: number,
    switchNetwork = true,
  ): Promise<
    XRequired<Connector, 'originProvider' | 'provider' | 'signer'> & {
      disconnect(): void;
    }
  > {
    if (WalletConnect._wallet) return WalletConnect._wallet;
    checkChainId(chainId);
    const modal = await WalletConnect.getModal();

    if (Env.isMobile && !Env.isTelegram) {
      const validConnectors = await WalletConnect.getValidConnectors();
      if (validConnectors.length === 1) {
        const originProvider = validConnectors[0].originProvider;
        const provider = new BrowserProvider(originProvider);
        if (switchNetwork) await WalletConnect.switchNetwork(provider, chainId);
        const signer = await provider.getSigner();
        modal.close();
        WalletConnect._wallet = {
          ...validConnectors[0],
          provider: new BrowserProvider(originProvider),
          signer,
          disconnect: () => modal.disconnect(),
        };
        return WalletConnect._wallet;
      }
    }

    if (!modal.getWalletProvider()) {
      await modal.open({ view: 'Connect' });

      const connection = ejectPromise<void>();
      const unsubscribe = modal.subscribeState((newState) => {
        if (newState.open) return;
        connection.resolve();
        unsubscribe();
      });
      await connection;

      await waitUntil(() => modal.getWalletProvider(), {
        timeout: 1000,
        resolveTimeout: true,
      });
    }

    const originProvider = modal.getWalletProvider();

    if (!originProvider) throw new Error('Connect failed: User rejected');

    // @ts-ignore
    const connectors = modal.getConnectors();
    const connector = connectors.find((it) => it.provider === originProvider)!;
    const provider = new BrowserProvider(originProvider);
    if (switchNetwork) await WalletConnect.switchNetwork(provider, chainId);
    const signer = await provider.getSigner();
    modal.close();
    WalletConnect._wallet = {
      ...connector,
      imageUrl: connector?.imageUrl || iconWalletConnect,
      originProvider: originProvider,
      provider: new BrowserProvider(originProvider),
      signer,
      disconnect: () => modal.disconnect(),
    };
    return WalletConnect._wallet;
  }

  static async disconnect() {
    const modal = await WalletConnect.getModal();
    await modal.disconnect();
    WalletConnect._wallet = undefined;
  }

  static async subscribeNetworkChange(cb: (chainId: number) => void) {
    const provider = await WalletConnect.$getModalProvider();
    if (!provider) return () => {};
    const p = new BrowserProvider(provider);
    let preNetwork = await p._detectNetwork();
    cb(Number(preNetwork.chainId));
    const handler = (chain: string) => {
      cb(Number(chain));
    };
    if ('on' in provider) {
      // @ts-ignore
      provider.on('chainChanged', handler);
    }
    const timer = setInterval(async () => {
      const n = await p._detectNetwork();
      if (n.chainId !== preNetwork.chainId) cb(Number(n.chainId));
      preNetwork = n;
    }, 3000);
    return () => {
      clearTimeout(timer);
      // @ts-ignore
      if ('off' in provider) provider.off('chainChanged', handler);
    };
  }

  static async subscribeAccountChange(cb: (address?: string) => void) {
    const provider = await WalletConnect.$getModalProvider();
    if (!provider) return () => {};
    const p = new BrowserProvider(provider);
    const getAddress = async () => {
      const result = await p.send('eth_accounts', []);
      const accounts: string[] = result.result || result || [];
      return accounts[0];
    };
    let address = await getAddress();
    const handler = (accounts: string[]) => {
      WalletConnect._wallet = undefined;
      cb(accounts[0]?.toLowerCase());
    };
    handler([address]);
    if ('on' in provider) {
      // @ts-ignore
      provider.on('accountsChanged', handler);
    }
    const timer = setInterval(async () => {
      const $address = await getAddress();
      if ($address?.toLowerCase() !== address?.toLowerCase())
        handler([$address]);
      address = $address;
    }, 3000);
    return () => {
      clearTimeout(timer);
      // @ts-ignore
      if ('off' in provider) provider.off('accountsChanged', handler);
    };
  }
}
