import { Toast } from '@douyinfe/semi-ui';
import { AuthApis } from '@sofa/services/auth';
import { ChainMap, defaultChain } from '@sofa/services/chains';
import { t } from '@sofa/services/i18n';
import { WalletService } from '@sofa/services/wallet';
import { WalletConnect } from '@sofa/services/wallet-connect';
import { Env } from '@sofa/utils/env';
import { getErrorMsg } from '@sofa/utils/fns';
import { addHttpErrorHandler } from '@sofa/utils/http';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

export interface WalletUIState {
  connectVisible: boolean;
  dismissConnect: () => void;
  bringUpConnect: (params?: { enableServerAuth?: boolean }) => void;
}

export const useWalletUIState = createWithEqualityFn<WalletUIState>((set) => ({
  connectVisible: false,
  dismissConnect: () => set({ connectVisible: false }),
  bringUpConnect: (params) => {
    if (useWalletStore.getState().address) {
      if (!params?.enableServerAuth || useWalletStore.getState().serverAuth) {
        set({ connectVisible: true });
        return;
      }
    }
    (async () => {
      if (useWalletStore.getState().address) {
        await useWalletStore.disconnect();
      }
      await useWalletStore.connect();
      if (params?.enableServerAuth) {
        await useWalletStore.serverAuth();
      }
    })()
      .then(() => {
        Toast.success(t('connect.succ', { ns: 'global' }));
      })
      .catch((err) => {
        console.error(
          'error while useWalletStore.disconnect/connect/serverAuth',
          err,
        );
        Toast.error(getErrorMsg(err));
        useWalletStore
          .disconnect()
          ?.catch((e) =>
            console.error(
              'error while useWalletStore.disconnect after previous error',
              e,
            ),
          );
      });
  },
}));

export interface WalletStoreState {
  chainId: number;
  chainName?: string;
  address?: string;
  name?: string;
  icon: string;
  balance?: PartialRecord<string, number>;
  serverAuthing?: boolean;
  serverAuth?: { uid: number; token: string; wallet: string };
}

addHttpErrorHandler(async (err) => {
  if (err && err.response && err.response.data && err.request) {
    if (
      [401, 403].includes(err.response.data.code) ||
      err.response.data.message?.toLowerCase() == 'invalid token'
    ) {
      console.warn('Received invalid token response', err.response.data);
      const urlStr = err.request.responseURL || err.request.url;
      if (!urlStr) return;
      const uri = new URL(urlStr);
      if (/(^|\.)sofa\.org$/i.test(uri.hostname)) {
        // signout
        const state = useWalletStore.getState();
        if (!state.serverAuthing && state.serverAuth) {
          Env.setAuth(undefined);
          useWalletStore.disconnect()?.catch((e) => {
            console.error(
              'error while useWalletStore.disconnect after token invalid',
              e,
            );
          });
        }
        return new Error(
          t({
            enUS: 'Session timeout, please login again',
            zhCN: '会话超时，请重新登入',
          }),
        );
      }
    }
  }
});

export const useWalletStore = Object.assign(
  createWithEqualityFn(
    persist(() => ({ chainId: defaultChain.chainId }) as WalletStoreState, {
      name: 'wallet-info',
      storage: createJSONStorage(() => localStorage),
    }),
  ),
  {
    disconnect: () => {
      const { address } = useWalletStore.getState();
      if (!address) return Promise.resolve(undefined);
      const finalDisconnect = () =>
        WalletService.disconnect().then(() => {
          useWalletStore.setState((pre) => ({
            ...pre,
            serverAuthing: false,
            serverAuth: undefined,
            address: undefined,
            balance: undefined,
            name: undefined,
            icon: undefined,
          }));
        });
      if (useWalletStore.getState().serverAuth && Env.getAuth()) {
        return AuthApis.logout()
          .catch((e) => console.log('error logout serverAuth', e))
          .then(() => finalDisconnect());
      }
      return finalDisconnect();
    },
    connect: (chainId?: number) => {
      const id = chainId ?? useWalletStore.getState().chainId;
      return WalletService.info(id).then((info) => {
        useWalletStore.setState((pre) => ({
          ...pre,
          ...info,
          chainId: id,
        }));
      });
    },
    serverAuth: async () => {
      const { address, chainId } = useWalletStore.getState();
      if (!address) {
        throw new Error('address is empty');
      }
      useWalletStore.setState({ serverAuthing: true, serverAuth: undefined });
      try {
        const nonce = await AuthApis.getLoginNonce({ wallet: address });
        if (!nonce || nonce.code || !nonce.value) {
          console.error('AuthApis.getLoginNonce', nonce);
          throw new Error(nonce?.message || 'Cannot get nonce');
        }

        const { signer } = await WalletService.connect(chainId);
        if (!signer) {
          throw new Error('cannot get signer');
        }
        const params = {
          hostname: 'sofa.org',
          uri: 'https://sofa.org',
          version: 1,
          chainId,
          nonce: nonce.value,
          account: address,
          issuedAt: new Date().toISOString(),
          expiratedAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          statement: 'wallet_sign_statement',
        };
        const msg = `${params.hostname} wants you to sign in with your Ethereum account:\n${params.account}\n\n${params.statement}\nURI: ${params.uri}\nVersion: ${params.version}\nChain ID: ${params.chainId}\nNonce: ${params.nonce}\nIssued At: ${params.issuedAt}\nExpiration Time: ${params.expiratedAt}`;

        const signed = await signer.signMessage(msg);
        console.log({ msg, signed });

        const res = await AuthApis.login({
          message: msg,
          signature: signed,
        });
        if (!res || res.code) {
          console.error('AuthApis.login', res);
          throw new Error(res?.message || 'Cannot login');
        }
        if (!res.value.wallet) {
          console.error('AuthApis.login', res);
          res.value.wallet = address;
        }
        Env.setAuth(res.value);
        useWalletStore.setState({
          serverAuth: res.value,
        });
      } finally {
        useWalletStore.setState({ serverAuthing: false });
      }
    },
    /**
     * 检查是否有服务端登入，且和当前wallet地址一致
     */
    checkServerAuth: () => {
      const { address, serverAuth } = useWalletStore.getState();
      if (serverAuth) {
        if (address?.toLowerCase() != serverAuth.wallet?.toLowerCase()) {
          // mismatch, let's signout
          useWalletStore.disconnect();
          Toast.error(
            t({
              enUS: 'Please login again',
              zhCN: '请重新登入',
            }),
          );
          return false;
        }
        return true;
      }
      return false;
    },
    setChain: async (chainId: number) => {
      await WalletService.switchNetwork(chainId);
      const preChainId = useWalletStore.getState().chainId;
      if (chainId === preChainId) return;
      useWalletStore.setState({
        chainId,
        chainName: ChainMap[chainId].name,
        balance: undefined,
      });
    },
    updateBalanceByVault: (vault: string) => {
      const { address, chainId } = useWalletStore.getState();
      if (!address) return;
      return WalletService.getBalanceFromVaultCollateral(
        vault,
        address,
        chainId,
      ).then((balance) => {
        useWalletStore.setState((pre) => ({
          balance: { ...pre.balance, ...balance },
        }));
      });
    },
    updateBalanceByTokenContract: async (
      contract: string,
      $chainId?: number,
    ) => {
      const { address, chainId } = useWalletStore.getState();
      if (!address) return;
      return WalletService.getBalanceByTokenContract(
        contract,
        address,
        $chainId ?? chainId,
      ).then((balance) => {
        useWalletStore.setState((pre) => ({
          balance: { ...pre.balance, ...balance },
        }));
      });
    },
    subscribeChainChange: async () => {
      return WalletConnect.subscribeNetworkChange((chainId) => {
        useWalletStore.setState({
          chainId,
          chainName: ChainMap[chainId]?.name,
        });
      });
    },
    subscribeAccountChange: async () => {
      return WalletConnect.subscribeAccountChange((address) => {
        const originState = useWalletStore.getState();
        if (originState.address) useWalletStore.setState({ address });
        if (
          originState.serverAuth &&
          originState.serverAuth.wallet?.toLowerCase() != address?.toLowerCase()
        ) {
          // Audrey Gray Shuyun 会商量一个更合适的 UI/文案，下面代码回头会启用
          // 目前暂时在有 serverAuth 时，切钱包就登出
          setTimeout(() => {
            useWalletStore.disconnect();
          }, 200);
          /*
          // 之前有服务端验证，这里需要重新验证
          useWalletStore.serverAuth().catch((e) => {
            useWalletStore.disconnect();
            console.error('error while switch wallet + serverAuth', e);
            Toast.error(t({
              enUS: 'Please sign the login request in your wallet',
              zhCN: '请在你的钱包里确认登入签名请求',
            }));
          });
          */
        }
      });
    },
  },
);

// 判断是否钱包是否还保持连接
(async () => {
  const state = useWalletStore.getState();
  const stillConnected = await (() => {
    if (!state.address) return false;
    return WalletService.isConnected(state.address);
  })();

  if (stillConnected) return;

  useWalletStore.disconnect();
})();

// 修正 chainId
(async () => {
  const state = useWalletStore.getState();
  if (ChainMap[state.chainId]) return;
  useWalletStore.setChain(defaultChain.chainId);
})();
