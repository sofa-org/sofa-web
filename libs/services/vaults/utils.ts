import { Env } from '@sofa/utils/env';

import { ProjectType } from '../base-type';

export function getCollateralDecimal(chainId: number, depositCcy: string) {
  const decimal = {
    RCH: 1e18,
    stRCH: 1e18,
    zRCH: 1e18,
    USDT: chainId == 56 ? 1e18 : 1e6,
    aUSDT: chainId == 56 ? 1e18 : 1e6,
    USDC: chainId == 56 ? 1e18 : 1e6,
    NativeUSDC: chainId == 56 ? 1e18 : 1e6,
    'USDC.n': chainId == 56 ? 1e18 : 1e6,
    aArbSepUSDC: chainId == 56 ? 1e18 : 1e6,
    aUSDC: chainId == 56 ? 1e18 : 1e6,
    crvUSD: 1e18,
    scrvUSD: 1e18,
    WETH: 1e18,
    stETH: 1e18,
    WBTC: 1e18,
    CRV: 1e18,
    sUSDa: 1e18,
    rtCIC: 1e18,
  }[depositCcy];
  if (!decimal) throw new Error(`Cannot configure the ${depositCcy} vault`);
  return decimal;
}

export function getDepositMinAmount(depositCcy: string, project: ProjectType) {
  if (project === ProjectType.Dual) {
    return {
      RCH: 10,
      USDT: 10,
      crvUSD: 10,
      CRV: 10,
    }[depositCcy];
  }
  if (Env.isPre || Env.isDaily) {
    // 大约 0.05U
    return {
      RCH: 0.05,
      stRCH: 0.05,
      zRCH: 0.05,
      USDT: 0.05,
      aUSDT: 0.05,
      USDC: 0.05,
      NativeUSDC: 0.05,
      'USDC.n': 0.05,
      aArbSepUSDC: 0.05,
      aUSDC: 0.05,
      crvUSD: 0.05,
      scrvUSD: 0.05,
      WETH: 0.000015,
      stETH: 0.000015,
      WBTC: 0.000001,
      CRV: 0.05,
      sUSDa: 0.05,
      rtCIC: 0.05,
    }[depositCcy];
  }
  return project === ProjectType.Surge
    ? {
        RCH: 20,
        stRCH: 20,
        zRCH: 20,
        USDT: 20,
        aUSDT: 20,
        USDC: 20,
        NativeUSDC: 20,
        'USDC.n': 20,
        aArbSepUSDC: 20,
        aUSDC: 20,
        crvUSD: 20,
        scrvUSD: 20,
        WETH: 0.01,
        stETH: 0.01,
        WBTC: 0.0005,
        sUSDa: 0.05,
        rtCIC: 0.05,
      }[depositCcy]
    : {
        RCH: 100,
        stRCH: 100,
        zRCH: 100,
        USDT: 100,
        aUSDT: 100,
        USDC: 100,
        NativeUSDC: 100,
        'USDC.n': 100,
        aArbSepUSDC: 100,
        aUSDC: 100,
        crvUSD: 100,
        scrvUSD: 100,
        WETH: 0.05,
        stETH: 0.05,
        WBTC: 0.002,
        sUSDa: 0.05,
        rtCIC: 0.05,
      }[depositCcy];
}

export function getDepositTickAmount(depositCcy: string, project: ProjectType) {
  if (project === ProjectType.Dual) {
    return {
      RCH: 1,
      USDT: 1,
      crvUSD: 1,
      CRV: 1,
    }[depositCcy];
  }
  if (Env.isPre || Env.isDaily) {
    // 大约 0.05U
    return {
      RCH: 0.05,
      stRCH: 0.05,
      zRCH: 0.05,
      USDT: 0.05,
      aUSDT: 0.05,
      USDC: 0.05,
      NativeUSDC: 0.05,
      'USDC.n': 0.05,
      aArbSepUSDC: 0.05,
      aUSDC: 0.05,
      crvUSD: 0.05,
      scrvUSD: 0.05,
      WETH: 0.000001,
      stETH: 0.000001,
      WBTC: 0.000001,
      sUSDa: 0.05,
      rtCIC: 0.05,
    }[depositCcy];
  }
  // TODO: Dual values
  return project === ProjectType.Surge
    ? {
        RCH: 20,
        stRCH: 20,
        zRCH: 20,
        USDT: 20,
        aUSDT: 20,
        USDC: 20,
        NativeUSDC: 20,
        'USDC.n': 20,
        aArbSepUSDC: 20,
        aUSDC: 20,
        crvUSD: 20,
        scrvUSD: 20,
        WETH: 0.01,
        stETH: 0.01,
        WBTC: 0.0005,
        sUSDa: 0.05,
        rtCIC: 0.05,
      }[depositCcy]
    : {
        RCH: 1,
        stRCH: 1,
        zRCH: 1,
        USDT: 1,
        aUSDT: 1,
        USDC: 1,
        NativeUSDC: 1,
        'USDC.n': 1,
        aArbSepUSDC: 1,
        aUSDC: 1,
        crvUSD: 1,
        scrvUSD: 1,
        WETH: 0.0001,
        stETH: 0.0001,
        WBTC: 0.0001,
        sUSDa: 0.05,
        rtCIC: 0.05,
      }[depositCcy];
}
