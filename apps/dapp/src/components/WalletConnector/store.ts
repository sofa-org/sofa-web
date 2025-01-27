import { useEffect } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import { AuthService } from '@sofa/services/auth';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { ChainMap, defaultChain } from '@sofa/services/chains';
import { t } from '@sofa/services/i18n';
import { WalletService } from '@sofa/services/wallet';
import { WalletConnect } from '@sofa/services/wallet-connect';
import { getErrorMsg } from '@sofa/utils/fns';
import { addHttpErrorHandler, AuthToken } from '@sofa/utils/http';
import { isEqual } from 'lodash-es';
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
    const { address } = useWalletStore.getState();
    if (
      address &&
      (!params?.enableServerAuth || AuthToken.get(address?.toLowerCase()))
    ) {
      set({ connectVisible: true });
      return;
    }
    (async () => {
      if (useWalletStore.getState().address) {
        await useWalletStore.disconnect();
      }
      if (params?.enableServerAuth) {
        await useWalletStore.serverAuth();
      }
      await useWalletStore.connect();
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
        if (AuthToken.get(useWalletStore.getState().address?.toLowerCase())) {
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
    isEqual,
  ),
  {
    disconnect: () => {
      const { address } = useWalletStore.getState();
      if (!address) return Promise.resolve(undefined);
      const finalDisconnect = () =>
        WalletService.disconnect().then(() => {
          useWalletStore.setState((pre) => ({
            ...pre,
            address: undefined,
            balance: undefined,
            name: undefined,
            icon: undefined,
          }));
        });
      if (AuthToken.get(address?.toLowerCase())) AuthService.logout();
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
      const { chainId } = useWalletStore.getState();
      const { signer } = await WalletService.connect(chainId);
      const nonce = await AuthService.getLoginNonce({ wallet: signer.address });
      if (!nonce || nonce.code || !nonce.value) {
        console.error('AuthService.getLoginNonce', nonce);
        throw new Error(nonce?.message || 'Cannot get nonce');
      }
      if (!signer) throw new Error('cannot get signer');
      const params = {
        hostname: 'sofa.org',
        uri: 'https://sofa.org',
        version: 1,
        chainId,
        nonce: nonce.value,
        account: signer.address,
        issuedAt: new Date().toISOString(),
        expiredAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        statement: 'wallet_sign_statement',
      };
      const message = `${params.hostname} wants you to sign in with your Ethereum account:\n${params.account}\n\n${params.statement}\nURI: ${params.uri}\nVersion: ${params.version}\nChain ID: ${params.chainId}\nNonce: ${params.nonce}\nIssued At: ${params.issuedAt}\nExpiration Time: ${params.expiredAt}`;

      const signature = await signer.signMessage(message);
      console.info('Login for', signer.address, { message, signature });

      await AuthService.login({ wallet: signer.address, message, signature });
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
    updateBalanceByAutomatorVault: (vault: AutomatorVaultInfo) => {
      const { address } = useWalletStore.getState();
      if (!address) return;
      return WalletService.getBalanceFromAutomatorVaultCollateral(
        vault,
        address,
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
      });
    },
  },
);

/**
 * 检查是否有服务端登入，且和当前wallet地址一致
 */
export function useCheckAuth() {
  const address = useWalletStore((state) => state.address);
  useEffect(() => {
    if (!address || AuthToken.get(address?.toLowerCase())) return;
    // mismatch, let's signout
    useWalletStore.disconnect();
    Toast.error(t({ enUS: 'Please login again', zhCN: '请重新登入' }));
  }, [address]);
}

setTimeout(() => {
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
}, 100);
