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
window.mockData.getPPS = async function (
  ccy: string,
  timeList: number[],
): Promise<Record<(typeof timeList)[0] | 'now', number>> {
  let r = 2.0;
  const result = {
    now: 1,
  } as Record<(typeof timeList)[0] | 'now', number>;

  for (const t of timeList) {
    r *= 0.94;
    result[t] = 1; //Math.max(0.5, r);
  }
  return result;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;
