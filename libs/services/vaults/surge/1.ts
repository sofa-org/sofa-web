import { ProductType, RiskType, TradeSide } from '../../base-type';

const USDTVaults = [
  // SmartBullVault(USDT)
  {
    chainId: 1,
    vault: '0x106825b71ccE77a70B69f57A0ACf9C4a6acf292a',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // SmartBullVault(WBTC/USDT)
  {
    chainId: 1,
    vault: '0x5494855B98858Ea4eF54D13E1d003197A387CE34',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // SmartBearVault(USDT)
  {
    chainId: 1,
    vault: '0x9C5D3C3AbD633b8eA68C5a51325f8630DC620AD9',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // SmartBearVault(WBTC/USDT)
  {
    chainId: 1,
    vault: '0x2F1C60bA96ec6925fA9bBbFC9Eb7908bD35Bc224',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // DNTVault(USDT)
  {
    chainId: 1,
    vault: '0x3a253838121b9ad9736fAFc030Cf4971615D68b2',
    productType: ProductType.DNT,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
    tradeDisable: true,
  },
  // DNTVault(WBTC/USDT)
  {
    chainId: 1,
    vault: '0xD9cFF1bc89f705EaB2579fA2DC86E9a6F971370a',
    productType: ProductType.DNT,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
    tradeDisable: true,
  },
];

const RCHVaults = [
  {
    chainId: 1,
    vault: '0xBEFB3aAD1dfb1660444f0D76A91261EF755B2B86',
    productType: ProductType.DNT,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'RCH',
    rchMultiplier: 2,
    usePermit2: false,
    tradeDisable: true,
  },
  // DNTVault(WBTC/RCH)
  {
    chainId: 1,
    vault: '0xBFD58c8150cF7048D5C149fA2bAdDD194b8416fe',
    productType: ProductType.DNT,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'RCH',
    rchMultiplier: 2,
    usePermit2: false,
    tradeDisable: true,
  },
  // SmartBullVault(ETH/RCH)
  {
    chainId: 1,
    vault: '0xfA49f859a012e8b1795A81B23b21Db0bD40e7770',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'RCH',
    rchMultiplier: 2,
    usePermit2: false,
  },
  // SmartBullVault(WBTC/RCH)
  {
    chainId: 1,
    vault: '0x94Fe821E8Adde08aB97530D432Ff34A724FD7830',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'RCH',
    rchMultiplier: 2,
    usePermit2: false,
  },
  // SmartBearVault(ETH/RCH)
  {
    chainId: 1,
    vault: '0x4a5B4049a4aFae31278d36768704872f73dA67D1',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'RCH',
    rchMultiplier: 2,
    usePermit2: false,
  },
  // SmartBearVault(WBTC/RCH)
  {
    chainId: 1,
    vault: '0x08c57aE48a89b6876A76dC618972Ef1602da7ED8',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'RCH',
    rchMultiplier: 2,
    usePermit2: false,
  },
];

const scrvUSDVaultsForAutomator = [
  // SimpleSmartBullVault(ETH/USDT)
  {
    chainId: 1,
    vault: '0x4A1Bc9d8B2eD7BF9B9C1979037992Cff064E4F40',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'scrvUSD',
    rchMultiplier: 1,
    usePermit2: false,
  },
  // SimpleSmartBullVault(BTC/USDT)
  {
    chainId: 1,
    vault: '0x5e5E689284a614127Af9deA546b8D943B8b80e5c',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'scrvUSD',
    rchMultiplier: 1,
    usePermit2: false,
  },
].map((it) => ({ ...it, onlyForAutomator: true }));

const aUSDTVaultsForAutomator = [
  // RebaseSmartBullVault(ETH/aUSDT)
  {
    chainId: 1,
    vault: '0x550cceC27639E01C5d9adE39f75e1351F791d2C2',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'aUSDT',
    rchMultiplier: 1,
    usePermit2: false,
  },
  // RebaseSmartBullVault(BTC/aUSDT)
  {
    chainId: 1,
    vault: '0x622ccb3C38502DD9175B347FD32bb327A7175ffD',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'aUSDT',
    rchMultiplier: 1,
    usePermit2: false,
  },
  // RebaseSmartBearVault(ETH/aUSDT)
  {
    chainId: 1,
    vault: '0x26E9aA240070d37C109E976b688E9B05C6Bd946b',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'aUSDT',
    rchMultiplier: 1,
    usePermit2: false,
  },
  // RebaseSmartBearVault(BTC/aUSDT)
  {
    chainId: 1,
    vault: '0xA86dC0E47697D23469C1804a3a40021BEfCd89A2',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'aUSDT',
    rchMultiplier: 1,
    usePermit2: false,
  },
  // SellRebaseSmartBullVault(ETH/aUSDT) | 收益曲线向下
  {
    chainId: 1,
    vault: '0x4a42a325C5Ec31F6a6eb547B00ce6Bf6f2c057F2',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'aUSDT',
    usePermit2: false,
    tradeSide: TradeSide.SELL,
  },
  // SellRebaseSmartBullVault(BTC/aUSDT) | 收益曲线向下
  {
    chainId: 1,
    vault: '0x81ed11567B73043ad7F05d4531Ba431811029452',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'aUSDT',
    usePermit2: false,
    tradeSide: TradeSide.SELL,
  },
  // SellRebaseSmartBearVault(ETH/aUSDT) | 收益曲线向上
  {
    chainId: 1,
    vault: '0x69Bd97280e3e3597b42b0c9e01000812EAd5af6E',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'aUSDT',
    usePermit2: false,
    tradeSide: TradeSide.SELL,
  },
  // SellRebaseSmartBearVault(BTC/aUSDT) | 收益曲线向上
  {
    chainId: 1,
    vault: '0xE8F4CEf205aDCae6521da662954Ebc6fe4497968',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'aUSDT',
    usePermit2: false,
    tradeSide: TradeSide.SELL,
  },
].map((it) => ({ ...it, onlyForAutomator: true }));

const zRCHVaultsForAutomator = [
  // SimpleSmartBullVault(ETH/zRCH)
  {
    chainId: 1,
    vault: '0x829f4309b664a8977CC325363454b87Ce7dD1184',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'zRCH',
    rchMultiplier: 1,
    usePermit2: false,
  },
  // SimpleSmartBullVault(BTC/zRCH)
  {
    chainId: 1,
    vault: '0x2BDbDb994FB7e7772EAa16Ccc41430e095D0706a',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'zRCH',
    rchMultiplier: 1,
    usePermit2: false,
  },
  // SimpleSmartBearVault(ETH/zRCH)
  {
    chainId: 1,
    vault: '0x6D05Eba244fb40B4Db1df9d66103735b90733F67',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USD',
    depositCcy: 'zRCH',
    rchMultiplier: 1,
    usePermit2: false,
  },
  // SimpleSmartBearVault(BTC/zRCH)
  {
    chainId: 1,
    vault: '0xde417ea3a884A34A8f2DC32B4B0A1a9c3C9B61A0',
    productType: ProductType.BearSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WBTC',
    domCcy: 'USD',
    depositCcy: 'zRCH',
    rchMultiplier: 1,
    usePermit2: false,
  },
].map((it) => ({ ...it, onlyForAutomator: true }));

const vaults = [
  ...USDTVaults,
  ...RCHVaults,
  ...scrvUSDVaultsForAutomator,
  ...aUSDTVaultsForAutomator,
  ...zRCHVaultsForAutomator,
];

export default vaults;
