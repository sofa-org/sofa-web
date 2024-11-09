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
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSIxMDI0IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiBmaWxsPSJub25lIgogIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzk4NTVfNzI4MikiPgogICAgPG1hc2sgaWQ9Im1hc2swXzk4NTVfNzI4MiIgc3R5bGU9Im1hc2stdHlwZTpsdW1pbmFuY2UiIG1hc2tVbml0cz0idXNlclNwYWNlT25Vc2UiIHg9IjAiIHk9IjAiCiAgICAgIHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiPgogICAgICA8cGF0aAogICAgICAgIGQ9Ik03NjggMEgyNTZDMTE0LjYxNSAwIDAgMTE0LjYxNSAwIDI1NlY3NjhDMCA5MDkuMzg1IDExNC42MTUgMTAyNCAyNTYgMTAyNEg3NjhDOTA5LjM4NSAxMDI0IDEwMjQgOTA5LjM4NSAxMDI0IDc2OFYyNTZDMTAyNCAxMTQuNjE1IDkwOS4zODUgMCA3NjggMFoiCiAgICAgICAgZmlsbD0id2hpdGUiIC8+CiAgICA8L21hc2s+CiAgICA8ZyBtYXNrPSJ1cmwoI21hc2swXzk4NTVfNzI4MikiPgogICAgICA8cGF0aAogICAgICAgIGQ9Ik0xMDI0IDI1NkMxMDI0IDExNC42MTUgOTA5LjM4NSAwIDc2OCAwSDI1NkMxMTQuNjE1IDAgMCAxMTQuNjE1IDAgMjU2Vjc2OEMwIDkwOS4zODUgMTE0LjYxNSAxMDI0IDI1NiAxMDI0SDc2OEM5MDkuMzg1IDEwMjQgMTAyNCA5MDkuMzg1IDEwMjQgNzY4VjI1NloiCiAgICAgICAgZmlsbD0iI0ZGNzQwMCIgLz4KICAgICAgPHBhdGgKICAgICAgICBkPSJNMzAwLjA3IDM2Ni4yNEg3MjQuMzYyQzc2My4xOSAzNjYuMjQgNzk0LjY2NyAzOTcuNzE3IDc5NC42NjcgNDM2LjU0NVY3MTEuNzY4Qzc5NC42NjcgNzUwLjU5NyA3NjMuMTkgNzgyLjA3MyA3MjQuMzYyIDc4Mi4wNzNIMzAwLjA3MUMyNjEuMjQzIDc4Mi4wNzMgMjI5Ljc2NiA3NTAuNTk3IDIyOS43NjYgNzExLjc2OFY0MzYuNTQzQzIyOS43NjYgMzk3LjcxNiAyNjEuMjQyIDM2Ni4yNCAzMDAuMDcgMzY2LjI0WiIKICAgICAgICBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSI5LjUzMjg4IiAvPgogICAgICA8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIKICAgICAgICBkPSJNNjQyLjk3MSAyNzcuNjA5TDMwOS41MDkgMzE3LjE3MUMyODIuMjc0IDMyMC40MDIgMjYxLjA1NiAzNDIuMzIyIDI1OC43MTMgMzY5LjY0OEwyNTguMzI3IDM3NC4xNTVWMzc0LjE1NUMyNTguMzI3IDM4My40MjMgMjY1Ljg0IDM5MC45MzYgMjc1LjEwOCAzOTAuOTM2SDYwMi4xMjNDNjUwLjA1NCAzOTAuOTM2IDY4NS40MjggMzQ2LjIgNjc0LjM3NiAyOTkuNTZWMjk5LjU2QzY3MS4wMDQgMjg1LjMyNyA2NTcuNDk1IDI3NS44ODYgNjQyLjk3MSAyNzcuNjA5Wk03MDYuNjU3IDI5MS45MUM2OTkuMzk4IDI2MS4yNzggNjcwLjMyNCAyNDAuOTU2IDYzOS4wNjMgMjQ0LjY2NUwzMDUuNjAxIDI4NC4yMjdDMjYyLjczOCAyODkuMzEyIDIyOS4zNDYgMzIzLjgxIDIyNS42NiAzNjYuODE1TDIyNS4xNTIgMzcyLjczNlY0MDEuOTkzQzIyNS4xNTIgNDIyLjE0NiAyNDYuNTc4IDQzNS4wNzQgMjY0LjQwNyA0MjUuNjc4VjQyNS42NzhDMjY4LjI1NSA0MjMuNjUgMjcyLjU0IDQyMi41OSAyNzYuODg5IDQyMi41OUg2MDMuMzI1QzY3MS44NzMgNDIyLjU5IDcyMi40NjMgMzU4LjYxMiA3MDYuNjU3IDI5MS45MVYyOTEuOTFaIgogICAgICAgIGZpbGw9IndoaXRlIiAvPgogICAgICA8cGF0aAogICAgICAgIGQ9Ik01MjMuMDkyIDcyMS4zNTRINTgzLjI2M0M1OTYuMDY3IDcyMS4zNTQgNjAyLjk3OSA3MDYuMzM5IDU5NC42NTIgNjk2LjYxMkw1MDIuMjc0IDU4OC42OTZDNTAxLjUgNTg3Ljc5MiA1MDEuNTAzIDU4Ni40NTcgNTAyLjI4MiA1ODUuNTU3TDYyNS43MjcgNDQyLjc0QzYzNC4xMjMgNDMzLjAyOCA2MjcuMjIzIDQxNy45NDQgNjE0LjM4NSA0MTcuOTQ0SDU1NC4zMTRDNTQ5Ljk1NSA0MTcuOTQ0IDU0NS44MTIgNDE5Ljg0MSA1NDIuOTY0IDQyMy4xNEw0MDkuNzY5IDU3Ny40NjNDNDA0LjkyNyA1ODMuMDczIDQwNC45MTEgNTkxLjM4IDQwOS43MyA1OTcuMDA5TDUxMS43MDQgNzE2LjExMkM1MTQuNTUyIDcxOS40MzkgNTE4LjcxMyA3MjEuMzU0IDUyMy4wOTIgNzIxLjM1NFoiCiAgICAgICAgZmlsbD0iI0ZGNzQwMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxMi41ODUiIC8+CiAgICAgIDxwYXRoCiAgICAgICAgZD0iTTMyMi4zMzkgNzIxLjM1NkgzODIuNDYzQzM4Ni44MyA3MjEuMzU2IDM5MC45ODEgNzE5LjQ1MSAzOTMuODI5IDcxNi4xNEw0OTYuMzk4IDU5Ni44OTVDNTAxLjIzMyA1OTEuMjc0IDUwMS4yMzMgNTgyLjk2MyA0OTYuMzk5IDU3Ny4zNDJMMzkzLjgyOSA0NTguMDg0QzM5MC45ODEgNDU0Ljc3MiAzODYuODMgNDUyLjg2OCAzODIuNDYyIDQ1Mi44NjhIMzIyLjMzOEMzMDkuNTE4IDQ1Mi44NjggMzAyLjYxMiA0NjcuOTE2IDMxMC45NzIgNDc3LjYzNkw0MDMuNzgzIDU4NS41NDhDNDA0LjU1OSA1ODYuNDUxIDQwNC41NTkgNTg3Ljc4NSA0MDMuNzgzIDU4OC42ODhMMzEwLjk3MyA2OTYuNTg3QzMwMi42MTMgNzA2LjMwNyAzMDkuNTE4IDcyMS4zNTYgMzIyLjMzOSA3MjEuMzU2WiIKICAgICAgICBmaWxsPSIjRkY3NDAwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEyLjU4NSIgLz4KICAgICAgPHBhdGgKICAgICAgICBkPSJNNzMxLjYyNyA0ODdDNjg2LjgzNSA0ODcgNjUwLjUyMyA1MjMuMzExIDY1MC41MjMgNTY4LjEwM0M2NTAuNTIzIDYxMi44OTUgNjg2LjgzNSA2NDkuMjA3IDczMS42MjcgNjQ5LjIwN0g4MDguMDAyQzgzNS4yMTcgNjQ5LjIwNyA4NTcuMjc5IDYyNy4xNDUgODU3LjI3OSA1OTkuOTNWNTM2LjI3N0M4NTcuMjc5IDUwOS4wNjIgODM1LjIxNyA0ODcgODA4LjAwMiA0ODdINzMxLjYyN1oiCiAgICAgICAgZmlsbD0id2hpdGUiIC8+CiAgICAgIDxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIgogICAgICAgIGQ9Ik04MDguMDAyIDUxOC4yNzlINzMxLjYyN0M3MDQuMTEgNTE4LjI3OSA2ODEuODAyIDU0MC41ODYgNjgxLjgwMiA1NjguMTAzQzY4MS44MDIgNTk1LjYyIDcwNC4xMSA2MTcuOTI4IDczMS42MjcgNjE3LjkyOEg4MDguMDAyQzgxNy45NDIgNjE3LjkyOCA4MjYgNjA5Ljg3IDgyNiA1OTkuOTNWNTM2LjI3N0M4MjYgNTI2LjMzNyA4MTcuOTQyIDUxOC4yNzkgODA4LjAwMiA1MTguMjc5Wk03MzEuNjI3IDQ4N0M2ODYuODM1IDQ4NyA2NTAuNTIzIDUyMy4zMTEgNjUwLjUyMyA1NjguMTAzQzY1MC41MjMgNjEyLjg5NSA2ODYuODM1IDY0OS4yMDcgNzMxLjYyNyA2NDkuMjA3SDgwOC4wMDJDODM1LjIxNyA2NDkuMjA3IDg1Ny4yNzkgNjI3LjE0NSA4NTcuMjc5IDU5OS45M1Y1MzYuMjc3Qzg1Ny4yNzkgNTA5LjA2MiA4MzUuMjE3IDQ4NyA4MDguMDAyIDQ4N0g3MzEuNjI3WiIKICAgICAgICBmaWxsPSIjRkY3NDAwIiAvPgogICAgICA8cGF0aAogICAgICAgIGQ9Ik03MzUuMTI1IDU5NC44MUM3NDkuNDMyIDU5NC44MSA3NjEuMDMgNTgzLjIxMiA3NjEuMDMgNTY4LjkwNUM3NjEuMDMgNTU0LjU5OCA3NDkuNDMyIDU0MyA3MzUuMTI1IDU0M0M3MjAuODE4IDU0MyA3MDkuMjIgNTU0LjU5OCA3MDkuMjIgNTY4LjkwNUM3MDkuMjIgNTgzLjIxMiA3MjAuODE4IDU5NC44MSA3MzUuMTI1IDU5NC44MVoiCiAgICAgICAgZmlsbD0iI0ZGNzQwMCIgLz4KICAgIDwvZz4KICA8L2c+CiAgPGRlZnM+CiAgICA8Y2xpcFBhdGggaWQ9ImNsaXAwXzk4NTVfNzI4MiI+CiAgICAgIDxyZWN0IHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiIGZpbGw9IndoaXRlIiAvPgogICAgPC9jbGlwUGF0aD4KICA8L2RlZnM+Cjwvc3ZnPg==';
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
      rpcUrls: [...ChainMap[chainId].rpcUrlsForAddNetwork],
      nativeCurrency: ChainMap[chainId].nativeCurrency,
      blockExplorerUrls: [ChainMap[chainId].explorerUrl],
    };

    try {
      await provider.send('wallet_switchEthereumChain', [
        { chainId: networkData.chainId },
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (switchError: any) {
      if (switchError.code === 4902 || /4902/.test(getErrorMsg(switchError))) {
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
    const p = new JsonRpcProvider(ChainMap[chainId].rpcUrl, chainId);
    await p._detectNetwork();
    return p;
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
    chainId: number;
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
    if (WalletConnect._wallet && WalletConnect._wallet.chainId === chainId) {
      return WalletConnect._wallet;
    }
    checkChainId(chainId);
    const modal = await WalletConnect.getModal();

    if (Env.isMobile && !Env.isTelegram) {
      const validConnectors = await WalletConnect.getValidConnectors();
      if (validConnectors.length === 1) {
        const originProvider = validConnectors[0].originProvider;
        const provider = await (async () => {
          let p = new BrowserProvider(originProvider);
          if (switchNetwork) await WalletConnect.switchNetwork(p, chainId);
          p = new BrowserProvider(originProvider);
          await p._detectNetwork();
          return p;
        })();
        const signer = await provider.getSigner();
        modal.close();
        WalletConnect._wallet = {
          ...validConnectors[0],
          provider,
          signer,
          chainId,
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
        timeout: 5000,
        resolveTimeout: true,
      });
    }

    const originProvider =
      modal.getWalletProvider() ||
      (await (async () => {
        const providers = await getProviderByEip6963();
        if (providers?.length) {
          const index = (name: string) =>
            /metamask/i.test(name) ? 0 : /okx/i.test(name) ? 1 : 2;
          return providers.sort(
            (a, b) => index(a.info.name) - index(b.info.name),
          )[0].provider;
        }
        return window.ethereum as never;
      })());

    if (!originProvider) throw new Error('Connect failed: User rejected');

    // @ts-ignore
    const connectors = modal.getConnectors();
    const connector = connectors.find((it) => it.provider === originProvider)!;
    const provider = await (async () => {
      let p = new BrowserProvider(originProvider);
      if (switchNetwork) await WalletConnect.switchNetwork(p, chainId);
      p = new BrowserProvider(originProvider);
      await p._detectNetwork();
      return p;
    })();
    const signer = await provider.getSigner();
    modal.close();
    WalletConnect._wallet = {
      ...connector,
      imageUrl: connector?.imageUrl || iconWalletConnect,
      originProvider: originProvider,
      chainId,
      provider,
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
    let preNetwork = await new BrowserProvider(provider)._detectNetwork();
    cb(Number(preNetwork.chainId));
    const handler = (chain: string) => {
      cb(Number(chain));
    };
    if ('on' in provider) {
      // @ts-ignore
      provider.on('chainChanged', handler);
    }
    const timer = setInterval(async () => {
      const n = await new BrowserProvider(provider)._detectNetwork();
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
