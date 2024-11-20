import { Env } from '@sofa/utils/env';

import { ProjectType } from '../base-type';

export function getCollateralDecimal(chainId: number, depositCcy: string) {
  const decimal = {
    RCH: 1e18,
    USDT: chainId == 56 ? 1e18 : 1e6,
    USDC: chainId == 56 ? 1e18 : 1e6,
    crvUSD: 1e18,
    WETH: 1e18,
    stETH: 1e18,
    WBTC: 1e18,
  }[depositCcy];
  if (!decimal) throw new Error(`Cannot configure the ${depositCcy} vault`);
  return decimal;
}

export function getDepositMinAmount(depositCcy: string, project: ProjectType) {
  if (Env.isPre || Env.isDaily) {
    // 大约 0.05U
    return {
      RCH: 0.05,
      USDT: 0.05,
      USDC: 0.05,
      crvUSD: 0.05,
      WETH: 0.000015,
      stETH: 0.000015,
      WBTC: 0.000001,
    }[depositCcy];
  }
  return project === ProjectType.Surge
    ? {
        RCH: 20,
        USDT: 20,
        USDC: 20,
        crvUSD: 20,
        WETH: 0.01,
        stETH: 0.01,
        WBTC: 0.0005,
      }[depositCcy]
    : {
        RCH: 100,
        USDT: 100,
        USDC: 100,
        crvUSD: 100,
        WETH: 0.05,
        stETH: 0.05,
        WBTC: 0.002,
      }[depositCcy];
}

export function getDepositTickAmount(depositCcy: string, project: ProjectType) {
  if (Env.isPre || Env.isDaily) {
    // 大约 0.05U
    return {
      RCH: 0.05,
      USDT: 0.05,
      USDC: 0.05,
      crvUSD: 0.05,
      WETH: 0.000001,
      stETH: 0.000001,
      WBTC: 0.000001,
    }[depositCcy];
  }
  return project === ProjectType.Surge
    ? {
        RCH: 20,
        USDT: 20,
        USDC: 20,
        crvUSD: 20,
        WETH: 0.01,
        stETH: 0.01,
        WBTC: 0.0005,
      }[depositCcy]
    : {
        RCH: 1,
        USDT: 1,
        USDC: 1,
        crvUSD: 1,
        WETH: 0.0001,
        stETH: 0.0001,
        WBTC: 0.0001,
      }[depositCcy];
}
