import { Env } from '@sofa/utils/env';
import { omitBy } from 'lodash-es';

import IconArb from './assets/icon-arb.svg?url';
import IconBNB from './assets/icon-bnb.webp';
import IconETH from './assets/icon-eth.svg?url';
import IconSepolia from './assets/icon-sepolia.svg?url';
import IconSepoliaArb from './assets/icon-sepolia-arb.svg?url';

/*
 * 上新链的 TODO:
 * 前端：
 *  1. ChainMap 配置，一些关键的东西：the graph 服务的 url；oracle 预言机的地址
 *  2. vaults 配置
 * 服务端：
 *  1. 头寸记录，交易记录同步
 *  2. 结算价格同步
 *  3. vaults 配置
 *  4. 获取保本产品底层利率（aave, stETH...）
 * 做市商：
 *  1. 报价支持
 **/

export const ChainMap: Record<
  string | number,
  {
    chainId: number;
    name: string;
    currency: string;
    explorerUrl: string;
    rpcUrl: string;
    rpcUrlsForAddNetwork: string[];
    icon: string;
    isTest: boolean;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    vaultGraphUrl: string;
    automatorTheGraphUrl: string;
    usdtAddress: string;
    rchAddress: string;
    rchAirdropAddress: string;
    rchUniswapAddress: string;
    rchUniswapVersion: 'v2' | 'v3';
    uniswapUrl: string;
    bonusAirdropAddress: string;
    feeContractAddress: string;
    automatorFeeContractAddress: string; // 为 Automator 产品准备的 fee contract
    hlPriceOracle: Record<'BTC' | 'ETH', string>;
    spotPriceOracle: Record<'BTC' | 'ETH', string>;
    stRCHAddress: string;
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
      rpcUrlsForAddNetwork: [
        'https://eth.llamarpc.com',
        'https://rpc.ankr.com/eth',
        'https://eth.meowrpc.com',
        'https://eth.drpc.org',
        'https://1rpc.io/eth',
      ],
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH', // 2-6 characters long
        decimals: 18,
      },
      vaultGraphUrl:
        'https://api.studio.thegraph.com/query/77961/sofa-mainnet/version/latest',
      automatorTheGraphUrl: '', // TODO
      usdtAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      rchAddress: '0x57B96D4aF698605563A4653D882635da59Bf11AF',
      rchAirdropAddress: '0x5a8cDDa6CA37B284b32eF8D513Ef71Ddac553270',
      rchUniswapAddress: '0xc39E83fE4E412A885c0577C08eB53BdB6548004a',
      rchUniswapVersion: 'v3',
      bonusAirdropAddress: '0x1e833096089Df3F8E8BF15839683c17Ad7694888',
      feeContractAddress: '0x4140AB4AFc36B93270a9659BD8387660cC6509b5',
      automatorFeeContractAddress: '', // TODO
      uniswapUrl: 'https://app.uniswap.org/explore/tokens/ethereum/{address}',
      hlPriceOracle: {
        BTC: '0x088dBBeEC1489c557f8D4fD6146E0590E303d7d9',
        ETH: '0x634B69cC4168Cfc1c366078FDeB874AfFBb478b5',
      },
      spotPriceOracle: {
        BTC: '0xFFf0d064B1cbf5D4C97D0af56a73a4C7e31DFb0D',
        ETH: '0x6417084B8Df644e1d7E32BE39B54F3a5BbEA645B',
      },
      stRCHAddress: '0x2B9aeA129B85F51A468274e7271434A83c3BB6b4',
    },
    42161: {
      chainId: 42161,
      isTest: false,
      name: 'Arbitrum One',
      currency: 'ETH',
      icon: IconArb,
      explorerUrl: 'https://arbiscan.io/',
      rpcUrl: import.meta.env.VITE_RPC_URL_OF_42161,
      rpcUrlsForAddNetwork: [
        'https://arbitrum.llamarpc.com',
        'https://arbitrum.meowrpc.com',
        'https://arbitrum.drpc.org',
        'https://1rpc.io/arb',
      ],
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH', // 2-6 characters long
        decimals: 18,
      },
      vaultGraphUrl:
        'https://api.studio.thegraph.com/query/77961/sofa-arbitrum/version/latest',
      automatorTheGraphUrl: '', // TODO
      usdtAddress: '', // 只有 defaultChain 有
      rchAddress: '', // 只有 defaultChain 有
      rchAirdropAddress: '', // 只有 defaultChain 有
      rchUniswapAddress: '', // 只有 defaultChain 有
      rchUniswapVersion: 'v3',
      bonusAirdropAddress: '', // 只有 defaultChain 有
      feeContractAddress: '0x4Bd6bE959897631fbE5a8Aae01707219850e032f',
      automatorFeeContractAddress: '0xE2000D4631793BADe4cbA1b4f1B947C46Cf871a4',
      uniswapUrl: 'https://app.uniswap.org/explore/tokens/arbitrum/{address}',
      hlPriceOracle: {
        BTC: '0x40144BC227f78A288FE9Ae6F4C7389C92C5aD9CF',
        ETH: '0x41Df07a5E58D551164fCAEaD4c1ee67B77a84776',
      },
      spotPriceOracle: {
        BTC: '0xD0fb7977df47d7Fe946A21679DAbCe877f7A3a05',
        ETH: '0xab08fF5dd91636fE556f692825Cadd7bA04A4c97',
      },
      stRCHAddress: '', // 只有 defaultChain 有
    },
    56: {
      chainId: 56,
      isTest: false,
      name: 'BNB Chain',
      currency: 'BNB',
      icon: IconBNB,
      explorerUrl: 'https://bscscan.com',
      rpcUrl: 'https://binance.llamarpc.com',
      rpcUrlsForAddNetwork: [
        'https://binance.llamarpc.com',
        'https://rpc.ankr.com/bsc',
        'https://bsc.meowrpc.com',
        'https://bsc.drpc.org',
      ],
      nativeCurrency: {
        name: 'BNB',
        symbol: 'BNB', // 2-6 characters long
        decimals: 18,
      },
      vaultGraphUrl:
        'https://api.studio.thegraph.com/query/77961/sofa-bsc/version/latest',
      automatorTheGraphUrl: '', // TODO
      usdtAddress: '', // 只有 defaultChain 有
      rchAddress: '', // 只有 defaultChain 有
      rchAirdropAddress: '', // 只有 defaultChain 有
      rchUniswapAddress: '', // 只有 defaultChain 有
      rchUniswapVersion: 'v3',
      bonusAirdropAddress: '', // 只有 defaultChain 有
      feeContractAddress: '0xEC722a53Efee08ebFF8d2C61622991a33705fA79',
      automatorFeeContractAddress: '', // TODO
      uniswapUrl: 'https://app.uniswap.org/explore/tokens/bnb/{address}',
      // TODO
      hlPriceOracle: {
        BTC: '',
        ETH: '',
      },
      spotPriceOracle: {
        BTC: '0x0ce8B7C78491C3db37179B80ac95212fcb611858',
        ETH: '0x6a7F97eD710A162cf5F1Eb8024e613FC9Ce9d563',
      },
      stRCHAddress: '', // 只有 defaultChain 有
    },
    11155111: {
      chainId: 11155111,
      isTest: true,
      name: 'Sepolia',
      currency: 'ETH',
      icon: IconSepolia,
      explorerUrl: 'https://sepolia.etherscan.io',
      rpcUrl: 'https://sepolia.drpc.org',
      rpcUrlsForAddNetwork: [
        'https://rpc2.sepolia.org',
        'https://rpc.sepolia.org',
        'https://1rpc.io/sepolia',
        'https://sepolia.drpc.org',
        'https://endpoints.omniatech.io/v1/eth/sepolia/public',
      ],
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH', // 2-6 characters long
        decimals: 18,
      },
      vaultGraphUrl:
        'https://api.studio.thegraph.com/query/62216/sofa-sepolia/version/latest',
      automatorTheGraphUrl: '', // TODO
      usdtAddress: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
      rchAddress: '0x703B35895b13E1b5CD4A62fd1a2B31783d37ce01',
      rchAirdropAddress: '0xf0E131253ec201f764b75aE9847db5C9cd61c45B',
      rchUniswapAddress: '0x0A0Da6ea38F0A9458992EB08dFb068E8d259F240',
      rchUniswapVersion: 'v3',
      bonusAirdropAddress: '0xE9458738ABC58A225064df36b8a42BCDFBEd47D9',
      uniswapUrl:
        'https://app.uniswap.org/swap?outputCurrency=0x703B35895b13E1b5CD4A62fd1a2B31783d37ce01&chain=sepolia',
      feeContractAddress: '0x1B487bC2F326F08397b0e6c5E861632B1515a118',
      automatorFeeContractAddress: '0xA0C1921F1c65d18E1Ef92C351183C6b3a6c46621',
      hlPriceOracle: {
        BTC: '0x3DD6A9d9bcB17Da01590b83577B4C7D27574F17C',
        ETH: '0x3D9a5ffBd25b17fA6CB34118Dbf9CEaAf18f261f',
      },
      spotPriceOracle: {
        BTC: '0x9ca3FF3117204D1B6f6a81A6E9BDfe9BF4E79Fd5',
        ETH: '0x8Daeb7DcB6a1103b7a601017a479B0e5D10402af',
      },
      stRCHAddress: '0x2845aD1636F2273687850108581E8Cf321AAbD6d',
    },
    421614: {
      chainId: 421614,
      isTest: true,
      name: 'Arbitrum Sepolia',
      currency: 'ETH',
      icon: IconSepoliaArb,
      explorerUrl: 'https://sepolia.arbitrum.io',
      rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
      rpcUrlsForAddNetwork: [
        'https://sepolia-rollup.arbitrum.io/rpc',
        'https://arbitrum-sepolia.blockpi.network/v1/rpc/public',
        'https://endpoints.omniatech.io/v1/arbitrum/sepolia/public',
      ],
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH', // 2-6 characters long
        decimals: 18,
      },
      vaultGraphUrl:
        'https://api.studio.thegraph.com/query/88939/vaults-for-Automator-test/version/latest',
      automatorTheGraphUrl:
        'https://api.studio.thegraph.com/query/88939/automator-arbitrum-sepolia/version/latest',
      usdtAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
      rchAddress: '',
      rchAirdropAddress: '',
      rchUniswapAddress: '',
      rchUniswapVersion: 'v3',
      bonusAirdropAddress: '',
      uniswapUrl:
        'https://app.uniswap.org/swap?outputCurrency=0x703B35895b13E1b5CD4A62fd1a2B31783d37ce01&chain=sepolia',
      feeContractAddress: '0xB6D81aFC1033ad8B509438efcd3623005f05F4A0',
      automatorFeeContractAddress: '0xB6D81aFC1033ad8B509438efcd3623005f05F4A0',
      hlPriceOracle: {
        BTC: '0x56a43EB56Da12C0dc1D972ACb089c06a5dEF8e69',
        ETH: '0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165',
      },
      spotPriceOracle: {
        BTC: '0x13320023796eE64468a2953509eB7D4BDaDb3C3E',
        ETH: '0x097CF0BaC8EeB369e2dbCcf72bCb9e54bC7F5f09',
      },
      stRCHAddress: '',
    },
  },
  (val) => (Env.isDaily ? !val.isTest : val.isTest),
);

export class ChainService {}

export const defaultChain = Env.isDaily ? ChainMap[11155111] : ChainMap[1];

export const rchBrokerAllocation = 0.05; // 每笔交易产生的空投会分给做市商的比例
