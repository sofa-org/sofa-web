import { Env } from '@sofa/utils/env';
import { omitBy } from 'lodash-es';

import IconArb from './assets/icon-arb.svg?url';
import IconETH from './assets/icon-eth.svg?url';

export const ChainMap: Record<
  string | number,
  {
    chainId: number;
    name: string;
    currency: string;
    explorerUrl: string;
    rpcUrl: string;
    icon: string;
    isTest: boolean;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    vaultGraphUrl: string;
    usdtAddress: string;
    rchAddress: string;
    rchAirdropAddress: string;
    rchUniswapAddress: string;
    rchUniswapVersion: 'v2' | 'v3';
    uniswapUrl: string;
    bonusAirdropAddress: string;
    feeContractAddress: string;
    hlPriceOracle: Record<'BTC' | 'ETH', string>;
    spotPriceOracle: Record<'BTC' | 'ETH', string>;
    aaveGraphUrl: string;
  }
> = omitBy(
  {
    1: {
      chainId: 1,
      isTest: false,
      name: 'Ethereum',
      currency: 'ETH',
      icon: IconETH,
      explorerUrl: 'https://etherscan.io',
      rpcUrl: import.meta.env.VITE_RPC_URL_OF_1,
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH', // 2-6 characters long
        decimals: 18,
      },
      vaultGraphUrl:
        'https://api.studio.thegraph.com/query/77961/sofa-mainnet/version/latest',
      usdtAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      rchAddress: '0x57B96D4aF698605563A4653D882635da59Bf11AF',
      rchAirdropAddress: '0x5a8cDDa6CA37B284b32eF8D513Ef71Ddac553270',
      rchUniswapAddress: '0xc39E83fE4E412A885c0577C08eB53BdB6548004a',
      rchUniswapVersion: 'v3',
      bonusAirdropAddress: '0x1e833096089Df3F8E8BF15839683c17Ad7694888',
      feeContractAddress: '0x4140AB4AFc36B93270a9659BD8387660cC6509b5',
      uniswapUrl: 'https://app.uniswap.org/explore/tokens/ethereum/{address}',
      hlPriceOracle: {
        BTC: '0x088dBBeEC1489c557f8D4fD6146E0590E303d7d9',
        ETH: '0x634B69cC4168Cfc1c366078FDeB874AfFBb478b5',
      },
      spotPriceOracle: {
        BTC: '0xFFf0d064B1cbf5D4C97D0af56a73a4C7e31DFb0D',
        ETH: '0x6417084B8Df644e1d7E32BE39B54F3a5BbEA645B',
      },
      aaveGraphUrl: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3',
    },
    42161: {
      chainId: 42161,
      isTest: false,
      name: 'Arbitrum One',
      currency: 'ETH',
      icon: IconArb,
      explorerUrl: 'https://arbiscan.io/',
      rpcUrl: import.meta.env.VITE_RPC_URL_OF_42161,
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH', // 2-6 characters long
        decimals: 18,
      },
      vaultGraphUrl:
        'https://api.studio.thegraph.com/query/77961/sofa-arbitrum/version/latest',
      usdtAddress: '', // 只有 defaultChain 有
      rchAddress: '', // 只有 defaultChain 有
      rchAirdropAddress: '', // 只有 defaultChain 有
      rchUniswapAddress: '', // 只有 defaultChain 有
      rchUniswapVersion: 'v3',
      bonusAirdropAddress: '', // 只有 defaultChain 有
      feeContractAddress: '0x4Bd6bE959897631fbE5a8Aae01707219850e032f',
      uniswapUrl: 'https://app.uniswap.org/explore/tokens/arbitrum/{address}',
      hlPriceOracle: {
        BTC: '0x40144BC227f78A288FE9Ae6F4C7389C92C5aD9CF',
        ETH: '0x41Df07a5E58D551164fCAEaD4c1ee67B77a84776',
      },
      spotPriceOracle: {
        BTC: '0xD0fb7977df47d7Fe946A21679DAbCe877f7A3a05',
        ETH: '0xab08fF5dd91636fE556f692825Cadd7bA04A4c97',
      },
      aaveGraphUrl:
        'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-arbitrum',
    },
    11155111: {
      chainId: 11155111,
      isTest: true,
      name: 'Sepolia',
      currency: 'ETH',
      icon: IconETH,
      explorerUrl: 'https://sepolia.etherscan.io',
      rpcUrl: 'https://rpc2.sepolia.org',
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH', // 2-6 characters long
        decimals: 18,
      },
      vaultGraphUrl:
        'https://api.studio.thegraph.com/query/62216/sofa-sepolia/version/latest',
      usdtAddress: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
      rchAddress: '0x703B35895b13E1b5CD4A62fd1a2B31783d37ce01',
      rchAirdropAddress: '0xf0E131253ec201f764b75aE9847db5C9cd61c45B',
      rchUniswapAddress: '0x0A0Da6ea38F0A9458992EB08dFb068E8d259F240',
      rchUniswapVersion: 'v3',
      bonusAirdropAddress: '0xE9458738ABC58A225064df36b8a42BCDFBEd47D9',
      uniswapUrl:
        'https://app.uniswap.org/swap?outputCurrency=0x703B35895b13E1b5CD4A62fd1a2B31783d37ce01&chain=sepolia',
      feeContractAddress: '0x1B487bC2F326F08397b0e6c5E861632B1515a118',
      hlPriceOracle: {
        BTC: '0x3DD6A9d9bcB17Da01590b83577B4C7D27574F17C',
        ETH: '0x3D9a5ffBd25b17fA6CB34118Dbf9CEaAf18f261f',
      },
      spotPriceOracle: {
        BTC: '0x9ca3FF3117204D1B6f6a81A6E9BDfe9BF4E79Fd5',
        ETH: '0x8Daeb7DcB6a1103b7a601017a479B0e5D10402af',
      },
      aaveGraphUrl: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3',
    },
  },
  (val) => (Env.isDaily ? !val.isTest : val.isTest),
);

export class ChainService {}

export const defaultChain = Env.isDaily ? ChainMap[11155111] : ChainMap[1];

export const rchBrokerAllocation = 0.05; // 每笔交易产生的空投会分给做市商的比例
