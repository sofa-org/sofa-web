import { VaultInfo } from '../contracts';

function mockMarketInterestRate(
  ccy: 'WETH' | 'WBTC' | VaultInfo['depositCcy'],
  chainId: number,
) {
  return {
    current: +0.21,
    avgWeekly: +0.22,
    apyUsed: +0.23,
    apyDefinition: 'AAVE_LENDING_APY',
  };
}
if (!window.mockData) window.mockData = {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
window.mockData.marketInterestRate = mockMarketInterestRate as any;
window.mockData.getPPS = async function (params: {
  forCcy: string;
  domCcy: string;
  timeList?: number[];
  includeNow: boolean;
}): Promise<Record<number | 'now', number>> {
  const r = 1.1;
  const result = {
    now: params.includeNow ? r : undefined,
  } as Record<number | 'now', number>;

  if (params.timeList) {
    for (const t of params.timeList) {
      result[t] = r; //Math.max(0.5, r);
    }
  }
  return result;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;
