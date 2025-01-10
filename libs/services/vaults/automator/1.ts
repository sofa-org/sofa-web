import { MsIntervals } from '@sofa/utils/expiry';

import { InterestType } from '../../base-type';

const vaults = [
  // bull BTC
  {
    name: 'Bull BTC',
    desc: `<b>Our Bull BTC Automator strategy is a principal-protected low-risk bullish product</b>. It will perform automated execution of our SOFA platform products (eg. Bull Trend & Bear Trend) at model expiration dates and strikes to target an optimized risk-adjusted yield. The strategies are designed to operate systematically via data-driven algorithms, with our data learning models continuously being refined to enhance long term performance. Capital will be continuously deployed to maximize yield compounding benefits, allowing users to deploy volatility monetization strategies with zero hassle. Strategies could include both controlled buying or selling of option exposure to generate returns.<br/><br/><b>我们的 Bull BTC Automator策略是一个低风险的保本型策略</b>。该策略将自动执行 SOFA 平台产品（如牛市趋势和熊市趋势），在模型指定的到期日和行权价下，旨在实现优化的风险调整收益。这些策略通过数据驱动的算法系统化运行，并通过数据学习模型的持续优化提升长期表现。资金将持续部署以最大化收益复利效应，让用户轻松实现波动率套利策略。策略可能包括受控买入或卖出期权敞口，以生成收益`,
    chainId: 1,
    vault: '0x267adC3E106b72ce3b0F2BbDb6c638A12110CF8C',
    depositCcy: 'crvUSD',
    vaultDepositCcy: 'scrvUSD',
    positionCcy: 'lbcrvUSD',
    redeemWaitPeriod: MsIntervals.day * 7,
    claimPeriod: MsIntervals.day * 3,
    createTime: new Date('2024-12-24T08:00Z').getTime(),
    creator: '0xCc19E60c86C396929E76a6a488848C9596de22bd',
    interestType: InterestType.CURVE,
  },
  // bull ETH
  {
    name: 'Bull ETH',
    desc: `<b>Our Bull ETH Automator strategy is a principal-protected low-risk bullish product</b>. It will perform automated execution of our SOFA platform products (eg. Bull Trend & Bear Trend) at model expiration dates and strikes to target an optimized risk-adjusted yield. The strategies are designed to operate systematically via data-driven algorithms, with our data learning models continuously being refined to enhance long term performance. Capital will be continuously deployed to maximize yield compounding benefits, allowing users to deploy volatility monetization strategies with zero hassle. Strategies could include both controlled buying or selling of option exposure to generate returns.<br/><br/><b>我们的 Bull ETH Automator策略是一个低风险的保本型策略</b>。该策略将自动执行 SOFA 平台产品（如牛市趋势和熊市趋势），在模型指定的到期日和行权价下，旨在实现优化的风险调整收益。这些策略通过数据驱动的算法系统化运行，并通过数据学习模型的持续优化提升长期表现。资金将持续部署以最大化收益复利效应，让用户轻松实现波动率套利策略。策略可能包括受控买入或卖出期权敞口，以生成收益`,
    chainId: 1,
    vault: '0x31D22b4afEC06e67A37AF38A62a6ec9546c1bF8A',
    depositCcy: 'crvUSD',
    vaultDepositCcy: 'scrvUSD',
    positionCcy: 'lecrvUSD',
    redeemWaitPeriod: MsIntervals.day * 7,
    claimPeriod: MsIntervals.day * 3,
    createTime: new Date('2024-12-24T08:00Z').getTime(),
    creator: '0xCc19E60c86C396929E76a6a488848C9596de22bd',
    interestType: InterestType.CURVE,
  },
];

export default vaults;
