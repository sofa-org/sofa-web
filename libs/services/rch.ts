import { asyncCache, asyncRetry } from '@sofa/utils/decorators';
import { MsIntervals, next8h } from '@sofa/utils/expiry';
import { http, pollingUntil } from '@sofa/utils/http';
import { UserStorage } from '@sofa/utils/storage';
import dayjs from 'dayjs';
import { ethers } from 'ethers';
import { omit } from 'lodash-es';

import { defaultChain } from './chains';
import { ContractsService, TransactionStatus } from './contracts';
import { TFunction } from './i18n';
import { WalletService } from './wallet';

export enum AirdropStatus {
  Unclaimed,
  Claiming,
  Claimed,
}

export const AirdropStatusRefs = {
  [AirdropStatus.Unclaimed]: {
    label: (t: TFunction) => t('Unclaimed'),
    color: '#50D113',
  },
  [AirdropStatus.Claiming]: {
    label: (t: TFunction) => t('Claiming'),
    color: '#EBFF00',
  },
  [AirdropStatus.Claimed]: {
    label: (t: TFunction) => t('Claimed'),
    color: '#666',
  },
};

export interface AirdropRecord {
  proof: string;
  address: string;
  investNotional: number;
  amount: number; // 空投
  amountInt: string; // 空投 * decimal 的值，用于 claim
  status: AirdropStatus;
  timestamp: number; // 毫秒
}

export interface BurnByContractRecord {
  hash: string;
  amount: number;
  timestamp: number; // 毫秒
}

export type OriginAirdropInfo = {
  address: string;
  volume: string;
  airdrop: string;
  merkle_proof: string;
};

export interface DailyBonusItem {
  amount: string;
  day: number; // s
  uid: number;
  wallet: string;
}

const AirdropStatusStorage = new UserStorage<
  Record<string /* {chainId}-{address}-{timestampMs} */, boolean>
>('airdrop-status', () => 'curr');

/**
 * RCH 只会在 ETH mainnet 和 Sepolia testnet 上部署
 */
export class RCHService {
  // 注意：合约空投文件生成规则有点不太一样，比如 2024-04-28 16:00 生成的空投文件是 2024-04-27.csv
  private static dateParse(date: string /* YYYY-MM-DD */) {
    return +dayjs(`${date}T08:00Z`) + MsIntervals.day;
  }

  // 注意：合约空投文件生成规则有点不太一样，比如 2024-04-28 16:00 生成的空投文件是 2024-04-27.csv
  private static dateStringify(ms: string | number) {
    return dayjs(+ms - MsIntervals.day).format('YYYY-MM-DD');
  }

  static airdropPlan = {
    address: ContractsService.rchAirdropAddress(),
    initialMint: 25000000,
    airdropStartAt: next8h(+dayjs('2024-06-08').valueOf()),
    airdropSchedule: [
      { startDay: 0, endDay: 180, airdropEveryDay: 12500 },
      // TODO
      { startDay: 180, endDay: 180 * 2, airdropEveryDay: 12500 * 0.8 },
      {
        startDay: 180 * 2,
        endDay: 180 * 3,
        airdropEveryDay: 12500 * 0.8 * 0.8,
      },
      {
        startDay: 180 * 3,
        endDay: 180 * 4,
        airdropEveryDay: 12500 * 0.8 * 0.8 * 0.8,
      },
      {
        startDay: 180 * 4,
        endDay: 180 * 5,
        airdropEveryDay: 12500 * 0.8 * 0.8 * 0.8 * 0.8,
      },
    ],
  };

  static async totalAirdropOfDay(dayMs?: number) {
    const daysSinceStart =
      (next8h(dayMs) - RCHService.airdropPlan.airdropStartAt) / MsIntervals.day;
    const todayAirdropSchedule = RCHService.airdropPlan.airdropSchedule.find(
      (it) => daysSinceStart > it.startDay && daysSinceStart <= it.endDay,
    );
    return todayAirdropSchedule?.airdropEveryDay || 0;
  }

  @asyncCache({
    persist: true,
    until: (val) => !val,
    id: (name, args) => {
      const signer = args[1] as ethers.JsonRpcSigner;
      return `${name}-${args[0]}-${signer.address}`;
    },
  })
  @asyncRetry()
  static isClaimed(
    timestampMs: number, // 注意：空投合约的时间戳是结算日中的起点，这里传的是结算日的终点
    signer: ethers.JsonRpcSigner,
  ): Promise<boolean> {
    const rchAirdropContract = ContractsService.rchAirdropContract(signer);
    return rchAirdropContract['isClaimed(uint256)'](
      (timestampMs - MsIntervals.day) / 1000,
    );
  }

  static async listAirdrop(
    wallet: string,
    signer: ethers.JsonRpcSigner,
  ): Promise<AirdropRecord[]> {
    return http
      .get<
        unknown,
        HttpResponse<
          {
            daytime?: number;
            dateTime?: number;
            wallet: string;
            volume: string;
            rch: string;
            merkleProof: string;
          }[]
        >
      >('/airdrop/history', { params: { wallet } })
      .then((res) =>
        Promise.all(
          res.value.map(async (it) => ({
            proof: it.merkleProof,
            address: it.wallet,
            investNotional: Number(it.volume),
            amount: +ethers.formatUnits(it.rch || 0, 18),
            amountInt: it.rch,
            status: await (async () => {
              const claimed = await RCHService.isClaimed(
                (it.dateTime ?? it.daytime)! * 1000,
                signer,
              );
              if (claimed) return AirdropStatus.Claimed;
              const claiming =
                AirdropStatusStorage.get()?.[
                  `${signer.address}-${(it.dateTime ?? it.daytime)! * 1000}`
                ];
              if (claiming) return AirdropStatus.Claiming;
              return AirdropStatus.Unclaimed;
            })(),
            timestamp: (it.dateTime ?? it.daytime)! * 1000,
          })),
        ),
      );
  }

  static async burn(
    signer: ethers.JsonRpcSigner,
    chainId: number,
    amount: string,
  ) {
    const rchContract = ContractsService.rchContract(signer);
    return ContractsService.dirtyCall(
      rchContract,
      'burn',
      (gasLimit?: number) => [
        ethers.parseUnits(amount, 18),
        ...(gasLimit ? [{ gasLimit }] : [{ blockTag: 'pending' }]),
      ],
    );
  }

  static async claimAirdrop(list: AirdropRecord[]) {
    const chainId = defaultChain.chainId;
    const { signer } = await WalletService.connect(chainId);
    const airdropContract = ContractsService.rchAirdropContract(signer);
    const indexes = list.map((it) => (it.timestamp - MsIntervals.day) / 1000); // 使用这个到期日的开始时间
    const amounts = list.map((it) => it.amountInt && BigInt(it.amountInt));
    const proofs = list.map((it) => {
      if (!it.proof) return [];
      return it.proof.split(',').map((it) => `0x${it}`);
    });
    const args = (gasLimit?: number) => [
      indexes,
      amounts,
      proofs,
      ...(gasLimit ? [{ gasLimit }] : [{ blockTag: 'pending' }]),
    ];
    const hash = await ContractsService.dirtyCall(
      airdropContract,
      'claimMultiple',
      args,
    );
    AirdropStatusStorage.set({
      ...AirdropStatusStorage.get(),
      ...Object.fromEntries(
        list.map((it) => [`${signer.address}-${it.timestamp}`, true]),
      ),
    });
    return pollingUntil(
      () => WalletService.transactionResult(hash, chainId),
      (res) => res !== TransactionStatus.PENDING,
      1000,
    ).then((res) => {
      AirdropStatusStorage.set(
        omit(
          AirdropStatusStorage.get() || {},
          list.map((it) => `${chainId}-${signer.address}-${it.timestamp}`),
        ),
      );
      return res[res.length - 1] === TransactionStatus.FAILED
        ? Promise.reject(new Error('Claim failed on chain'))
        : Promise.resolve();
    });
  }
}
