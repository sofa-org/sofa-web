import { MsIntervals } from '@sofa/utils/expiry';

const vaults = [
  {
    chainId: 42161,
    vault: '0x4C241483B4a85e44C59bcEcFe17A4E7d0A073CDB',
    depositCcy: 'USDT',
    vaultDepositCcy: 'USDT',
    positionCcy: 'atUSDT',
    redeemWaitPeriod: MsIntervals.day * 7,
    claimPeriod: MsIntervals.day * 3,
    createTime: new Date('2024-11-24T08:00Z').getTime(),
    creator: '0xCc19E60c86C396929E76a6a488848C9596de22bd',
    desc: `Our Automator strategies will perform automated execution of our SOFA platform products (eg. Bull Trend & Bear Trend) at model expiration dates and strikes to target an optimized risk-adjusted yield. The strategies are designed to operate systematically via data-driven algorithms, with our data learning models continuously being refined to enhance long term performance. Capital will be continuously deployed to maximize yield compounding benefits, allowing users to deploy volatility monetization strategies with zero hassle. Strategies could include both controlled buying or selling of option exposure to generate returns.<br/><br/>我们的 Automator 策略将自动执行 SOFA 平台产品（如牛市趋势和熊市趋势），在模型指定的到期日和行权价下，旨在实现优化的风险调整收益。这些策略通过数据驱动的算法系统化运行，并通过数据学习模型的持续优化提升长期表现。资金将持续部署以最大化收益复利效应，让用户轻松实现波动率套利策略。策略可能包括受控买入或卖出期权敞口，以生成收益。`,
  },
];

export default vaults;
