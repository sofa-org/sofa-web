import { ProductType, RiskType } from '../base-type';

const USDTVaults = [
  // SmartBullVault(USDT)
  {
    chainId: 1,
    vault: '0x106825b71ccE77a70B69f57A0ACf9C4a6acf292a',
    productType: ProductType.BullSpread,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USDT',
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
    domCcy: 'USDT',
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
    domCcy: 'USDT',
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
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
  },
  // SmartBullPrincipalVault(USDT)
  {
    chainId: 1,
    vault: '0x9377f17ABde96887943e5Fcc92Db034c76820529',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: true,
    tradeDisable: true,
  },
  // SmartBullPrincipalVault(WBTC/USDT)
  {
    chainId: 1,
    vault: '0x99c59D82b10c56950F6C031946656e6D0aD509ca',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: true,
    tradeDisable: true,
  },
  // SmartBearPrincipalVault(USDT)
  {
    chainId: 1,
    vault: '0xF6c70b5F034070001E833C9EbC6a3A0176B683A6',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: true,
    tradeDisable: true,
  },
  // SmartBearPrincipalVault(WBTC/USDT)
  {
    chainId: 1,
    vault: '0x62104e40fA81a19f2B7E17C78C3ffBF4aCa4F212',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: true,
    tradeDisable: true,
  },
  // DNTVault(USDT)
  {
    chainId: 1,
    vault: '0x3a253838121b9ad9736fAFc030Cf4971615D68b2',
    productType: ProductType.DNT,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USDT',
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
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 1,
    usePermit2: true,
    tradeDisable: true,
  },
  // PrincipalDNTVault(USDT) deprecated
  {
    chainId: 1,
    vault: '0x00aEca021D0f06c7dee54D58ee6Af47B5645aB19',
    productType: ProductType.DNT,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: true,
    tradeDisable: true,
    earlyClaimable: true,
  },
  // PrincipalDNTVault(WBTC/USDT) deprecated
  {
    chainId: 1,
    vault: '0x989897f1D976EE0b59Bf0A3172C170D8f3Cb84e3',
    productType: ProductType.DNT,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: true,
    tradeDisable: true,
    earlyClaimable: true,
  },
  // PrincipalDNTVault(USDT)
  {
    chainId: 1,
    vault: '0x20A82619FCd300f3E0028db6353D38E3cC3B9E14',
    productType: ProductType.DNT,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
  // PrincipalDNTVault(WBTC/USDT)
  {
    chainId: 1,
    vault: '0x1F519b172917Cfd6B7A69EF9d37E13Ac7dFF5E39',
    productType: ProductType.DNT,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
  // LeverageDNTVault(ETH/USDT)
  {
    chainId: 1,
    vault: '0xF4A60252B139E29A415C341a0D21261496D27d02',
    productType: ProductType.DNT,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
  // LeverageDNTVault(WBTC/USDT)
  {
    chainId: 1,
    vault: '0x50752522d249230FE60C855098BB4a7a0974E746',
    productType: ProductType.DNT,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
  // LeverageBullSpreadVault(ETH/USDT)
  {
    chainId: 1,
    vault: '0x8Ea9638f2587b20396ec8c45dd639dEB115F5211',
    productType: ProductType.BullSpread,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // LeverageBullSpreadVault(WBTC/USDT)
  {
    chainId: 1,
    vault: '0x8F9259a355933737F8F11f95d32460eCd5ED0706',
    productType: ProductType.BullSpread,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // LeverageBearSpreadVault(ETH/USDT)
  {
    chainId: 1,
    vault: '0x3AbC7053ec29e26c1429195fd971F280422ecA80',
    productType: ProductType.BearSpread,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // LeverageBearSpreadVault(WBTC/USDT)
  {
    chainId: 1,
    vault: '0x071E0C2BE2b16c8B00173c6535eF8331b8e1feeD',
    productType: ProductType.BearSpread,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // AAVESmartBullVault(ETH/USDT)
  {
    chainId: 1,
    vault: '0xe483d580664cd72B0A8cae0D65EFfA6587bd2263',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
  // AAVESmartBullVault(WBTC/USDT)
  {
    chainId: 1,
    vault: '0x21f759Bcb31739032A00b37e3560a216AE52eFDC',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
  // AAVESmartBearVault(ETH/USDT)
  {
    chainId: 1,
    vault: '0x3191a0008415dEB5c5161C4B394Ec46C8C703f8c',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
  // AAVESmartBearVault(WBTC/USDT)
  {
    chainId: 1,
    vault: '0xC9Aa266e2E50EC2474cD881566845480F8daE931',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
];

const RCHVaults = [
  // RCHDNTVault(ETH/RCH)
  {
    chainId: 1,
    vault: '0xe517772Fa1EeDAF3F69917240Da5f6dC3294499D',
    productType: ProductType.DNT,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'RCH',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
  // RCHDNTVault(WBTC/RCH)
  {
    chainId: 1,
    vault: '0x53EE67c562A7e933679425e6C0070E2b810387A3',
    productType: ProductType.DNT,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'RCH',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
  // RCHBearTrendVault(ETH/RCH)
  {
    chainId: 1,
    vault: '0xf07d6B83433876e79b656c008034c687509d77a7',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'RCH',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // RCHBearTrendVault(WBTC/RCH)
  {
    chainId: 1,
    vault: '0xc0BAA3440F14137e4Af0C60cf181812ddF791f38',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'RCH',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // RCHBullTrendVault(ETH/RCH)
  {
    chainId: 1,
    vault: '0x13Ef7013E98197Ef850969a21ef1b42e71dD6cfa',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'RCH',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // RCHBullTrendVault(WBTC/RCH)
  {
    chainId: 1,
    vault: '0x4cFc3A41d652af5Cd5f1c3E729048890B0173123',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'RCH',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // DNTVault(ETH/RCH)
  {
    chainId: 1,
    vault: '0xBEFB3aAD1dfb1660444f0D76A91261EF755B2B86',
    productType: ProductType.DNT,
    riskType: RiskType.RISKY,
    forCcy: 'WETH',
    domCcy: 'USDT',
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
    domCcy: 'USDT',
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
    domCcy: 'USDT',
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
    domCcy: 'USDT',
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
    domCcy: 'USDT',
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
    domCcy: 'USDT',
    depositCcy: 'RCH',
    rchMultiplier: 2,
    usePermit2: false,
  },
];

const stETHVaults = [
  // StETHDNTPrincipalVault(ETH/STETH)
  {
    chainId: 1,
    vault: '0x141B893e4ae446e634E92116000e54d7fc72Bc65',
    productType: ProductType.DNT,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'stETH',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
  // StETHDNTPrincipalVault(WBTC/STETH)
  {
    chainId: 1,
    vault: '0xC0f6d3B7B4073Df68DB5897C0884264D03A780C1',
    productType: ProductType.DNT,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'stETH',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
  // StETHSmartBullPrincipalVault(ETH/STETH)
  {
    chainId: 1,
    vault: '0x5bbEB889339CE028dC57a1C9A721eAa085BE2368',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'stETH',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // StETHSmartBullPrincipalVault(WBTC/STETH)
  {
    chainId: 1,
    vault: '0x22D6201FF78854713CED5542658F16244335ae69',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'stETH',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // StETHSmartBearPrincipalVault(ETH/STETH)
  {
    chainId: 1,
    vault: '0xBEB059D623ac9817fc2F0414F1dCc61416da4540',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'stETH',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // StETHSmartBearPrincipalVault(WBTC/STETH)
  {
    chainId: 1,
    vault: '0x4f8Abbc658338E4065acb154679931648195b793',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'stETH',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // StETHLeverageDNTVault(ETH/STETH)
  {
    chainId: 1,
    vault: '0x6014784FC074706ab810130f77135bfb24463f06',
    productType: ProductType.DNT,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'stETH',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
  // StETHLeverageDNTVault(WBTC/STETH)
  {
    chainId: 1,
    vault: '0xD94A2BB8059E3bA3041592deeaF2B2eF4CcDec71',
    productType: ProductType.DNT,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'stETH',
    rchMultiplier: 20,
    usePermit2: false,
    tradeDisable: true,
  },
  // StETHLeverageBullSpreadVault(ETH/STETH)
  {
    chainId: 1,
    vault: '0x1361fa1398c22D6644DcC1AA619F1B84F6DB4366',
    productType: ProductType.BullSpread,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'stETH',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // StETHLeverageBullSpreadVault(WBTC/STETH)
  {
    chainId: 1,
    vault: '0xB8610F07D25C3B0D7D589bDe8be1b07Ffae1A0A5',
    productType: ProductType.BullSpread,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'stETH',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // StETHLeverageBearSpreadVault(ETH/STETH)
  {
    chainId: 1,
    vault: '0x36Ac0331D03e40ab67Af564bC453314Cb58E0629',
    productType: ProductType.BearSpread,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'stETH',
    rchMultiplier: 20,
    usePermit2: false,
  },
  // StETHLeverageBearSpreadVault(WBTC/STETH)
  {
    chainId: 1,
    vault: '0x858Af7297a3D20f61E0F7A2487c686e0A3353f2C',
    productType: ProductType.BearSpread,
    riskType: RiskType.LEVERAGE,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'stETH',
    rchMultiplier: 20,
    usePermit2: false,
  },
];

const USDTVaultsForOKXWeb3 = [
  // AAVESmartBullVault(ETH/USDT)
  {
    chainId: 1,
    vault: '0xe483d580664cd72B0A8cae0D65EFfA6587bd2263',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 0,
    usePermit2: false,
  },
  // AAVESmartBullVault(WBTC/USDT)
  {
    chainId: 1,
    vault: '0x21f759Bcb31739032A00b37e3560a216AE52eFDC',
    productType: ProductType.BullSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 0,
    usePermit2: false,
  },
  // AAVESmartBearVault(ETH/USDT)
  {
    chainId: 1,
    vault: '0x3191a0008415dEB5c5161C4B394Ec46C8C703f8c',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WETH',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 0,
    usePermit2: false,
  },
  // AAVESmartBearVault(WBTC/USDT)
  {
    chainId: 1,
    vault: '0xC9Aa266e2E50EC2474cD881566845480F8daE931',
    productType: ProductType.BearSpread,
    riskType: RiskType.PROTECTED,
    forCcy: 'WBTC',
    domCcy: 'USDT',
    depositCcy: 'USDT',
    rchMultiplier: 0,
    usePermit2: false,
  },
];

const vaults = [
  ...USDTVaults,
  ...RCHVaults,
  ...stETHVaults,
  ...USDTVaultsForOKXWeb3,
];

export default vaults;
