import { defaultChain } from '@sofa/services/chains';
import { AirdropRecord, AirdropStatus, RCHService } from '@sofa/services/rch';
import { WalletService } from '@sofa/services/wallet';
import { simplePlus } from '@sofa/utils/object';
import { computed } from '@sofa/utils/zustand';
import { createWithEqualityFn } from 'zustand/traditional';

import { useWalletStore } from '@/components/WalletConnector/store';

const initialState = {
  myAirdropList: undefined as undefined | AirdropRecord[],
  selectedAirdropKeys: [] as number[],
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
    claimBatch: async () => {
      const claimableList = useRCHState.getState().claimableList();
      if (!claimableList?.length) throw new Error('No RCH for claiming');
      await WalletService.connect(defaultChain.chainId);
      useWalletStore.connect(defaultChain.chainId);
      useRCHState.setState((pre) => ({
        ...pre,
        myAirdropList: pre.myAirdropList?.map(($it) =>
          $it.status === AirdropStatus.Unclaimed
            ? { ...$it, status: AirdropStatus.Claiming }
            : $it,
        ),
      }));
      return RCHService.claimAirdrop(claimableList).catch((err) => {
        useRCHState.setState((pre) => ({
          ...pre,
          myAirdropList: pre.myAirdropList?.map(($it) =>
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
