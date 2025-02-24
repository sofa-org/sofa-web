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
