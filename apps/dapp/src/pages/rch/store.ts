import { defaultChain } from '@sofa/services/chains';
import { AirdropRecord, AirdropStatus, RCHService } from '@sofa/services/rch';
import { isTransactionConfirmationPendingError } from '@sofa/services/transaction-confirmation';
import { WalletService } from '@sofa/services/wallet';
import { simplePlus } from '@sofa/utils/object';
import { computed } from '@sofa/utils/zustand';
import { createWithEqualityFn } from 'zustand/traditional';

import { useWalletStore } from '@/components/WalletConnector/store';

const initialState = {
  myAirdropList: undefined as undefined | AirdropRecord[],
  selectedAirdropKeys: [] as AirdropRecord['timestamp'][],
};

export const useRCHState = Object.assign(
  createWithEqualityFn<
    typeof initialState & {
      claimableAmount: () => number | undefined;
      totalAmount: () => number | undefined;
      claimableList: () => AirdropRecord[] | undefined;
    }
  >((_, __, store) => ({
    ...initialState,
    claimableList: computed(
      store,
      (state) =>
        state.myAirdropList?.filter(
          ($it) => $it.status === AirdropStatus.Unclaimed,
        ) || [],
      ['myAirdropList'],
    ),
    claimableAmount: computed(
      store,
      (state) =>
        simplePlus(
          ...(state.myAirdropList?.map(($it) =>
            $it.status === AirdropStatus.Unclaimed ? $it.amount : 0,
          ) || []),
        ),
      ['myAirdropList'],
    ),
    totalAmount: computed(
      store,
      (state) =>
        simplePlus(...(state.myAirdropList?.map(($it) => $it.amount) || [])),
      ['myAirdropList'],
    ),
  })),
  {
    fetchAirdropHistory: async () => {
      const { signer } = await WalletService.connect(defaultChain.chainId);
      await useWalletStore.connect(defaultChain.chainId);
      return RCHService.listAirdrop(signer.address, signer).then((res) => {
        useRCHState.setState(() => ({ myAirdropList: res }));
        return res;
      });
    },
    updateSelectedAirdropKeys: (keys: number[]) => {
      useRCHState.setState((pre) => ({ ...pre, selectedAirdropKeys: keys }));
    },
    claimBatch: async (partial?: boolean) => {
      const state = useRCHState.getState();
      const $claimableList = state.claimableList();
      const claimableList = !partial
        ? $claimableList
        : $claimableList?.filter((it) =>
            state.selectedAirdropKeys.includes(it.timestamp),
          );
      if (!claimableList?.length) throw new Error('No RCH for claiming');
      const claimableKeys = new Set(claimableList.map((it) => it.timestamp));
      await WalletService.connect(defaultChain.chainId);
      await useWalletStore.connect(defaultChain.chainId);
      const currentClaimableList = useRCHState
        .getState()
        .claimableList()
        ?.filter((it) => claimableKeys.has(it.timestamp));
      if (!currentClaimableList?.length) throw new Error('No RCH for claiming');
      const submittedKeys = new Set(
        currentClaimableList.map((it) => it.timestamp),
      );
      useRCHState.setState((pre) => ({
        ...pre,
        myAirdropList: pre.myAirdropList?.map(($it) =>
          submittedKeys.has($it.timestamp) &&
          $it.status === AirdropStatus.Unclaimed
            ? { ...$it, status: AirdropStatus.Claiming }
            : $it,
        ),
      }));
      return RCHService.claimAirdrop(currentClaimableList).catch((err) => {
        if (isTransactionConfirmationPendingError(err)) throw err;
        useRCHState.setState((pre) => ({
          ...pre,
          myAirdropList: pre.myAirdropList?.map(($it) =>
            submittedKeys.has($it.timestamp) &&
            $it.status === AirdropStatus.Claiming
              ? { ...$it, status: AirdropStatus.Unclaimed }
              : $it,
          ),
        }));
        return Promise.reject(err);
      });
    },
  },
);
