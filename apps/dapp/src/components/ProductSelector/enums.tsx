import { ProjectType, VisibleRiskType } from '@sofa/services/base-type';
import { TFunction } from '@sofa/services/i18n';
import {
  ProductType,
  RiskType,
  WinningProbabilities,
} from '@sofa/services/products';
import { displayPercentage } from '@sofa/utils/amount';

import { EnvLinks } from '@/env-links';
import { addI18nResources } from '@/locales';

import iconDntProtected from './assets/dnt-protected.png';
import iconDntProtectedInverse from './assets/dnt-protected-inverse.png';
import iconDntRisky from './assets/dnt-risky.png';
import iconDntRiskyInverse from './assets/dnt-risky-inverse.png';
import IconAutomator from './assets/icon-automator.png';
import { Comp as IconDown } from './assets/icon-down.svg';
import IconDual from './assets/icon-dual.png';
import { Comp as IconFlat } from './assets/icon-flat.svg';
import IconHighYield from './assets/icon-high-yield.png';
import IconLowRisk from './assets/icon-low-risk.png';
import { Comp as IconUp } from './assets/icon-up.svg';
import { Comp as ImgBearSpread } from './assets/product-bear-spread.svg';
import { Comp as ImgBullSpread } from './assets/product-bull-spread.svg';
import { Comp as ImgDNT } from './assets/product-dnt.svg';
import iconSpreadProtected from './assets/spread-protected.png';
import iconSpreadProtectedInverse from './assets/spread-protected-inverse.png';
import iconSpreadRisky from './assets/spread-risky.png';
import iconSpreadRiskyInverse from './assets/spread-risky-inverse.png';
import locale from './locale';

addI18nResources(locale, 'ProjectProductSelector');

export const ProjectTypeRefs = {
  [ProjectType.Earn]: {
    label: (t: TFunction) => t('Earn'),
    desc: (t: TFunction) =>
      t(
        'By smartly combining the safety of savings income with a sprinkle of embedded options, your principal is securely generating yield in trusted DeFi protocols such as Aave/Lido/Sofa/Curve/Avalon, while a portion of that income will be funding upside option structures for a chance at extra gains.  Perfect for the risk conscious user who wants to benefit from upside gains with minimal downside.',
      ),
    desc1: (t: TFunction) =>
      t({
        enUS: 'Stable yield and low-risk. Ideal for risk-averse users seeking consistent returns.',
        zhCN: '稳定收益，低风险。适合追求稳定回报的风险规避型用户。',
      }),
    icon: <img src={IconLowRisk} width="24px" />,
    value: ProjectType.Earn,
    link: EnvLinks.config.VITE_EARN_LINK,
  },
  [ProjectType.Surge]: {
    label: (t: TFunction) => t('Surge'),
    desc: (t: TFunction) =>
      t(
        'Popular TradFi exotics investments can now be safely invested on-chain, allowing users to speculate on token price action through a diverse product suite including Rangebound, Trends, and Shark Fin products.  Higher returns will come at the risk of principal losses, though users will have full control over the product parameters under our flexible RFQ interface.',
      ),
    desc1: (t: TFunction) =>
      t({
        enUS: 'High returns & high risk. Designed for risk-takers who can stomach potential losses.',
        zhCN: '高回报 & 高风险。为能够承受潜在亏损的冒险者量身打造。',
      }),
    icon: <img src={IconHighYield} width="24px" />,
    value: ProjectType.Surge,
    link: EnvLinks.config.VITE_SURGE_LINK,
  },
  [ProjectType.Automator]: {
    label: (t: TFunction) => t({ enUS: 'Automator', zhCN: 'Automator' }),
    desc: (t: TFunction) =>
      t({
        enUS: 'Delegate your funds to high-performing Automator traders & strategies. Funds will be utilized and continuously re-invested in optimized return strategies until user redemption.',
        zhCN: '将资金托管给高绩效的 Automator 交易者及策略。资金将被充分利用，持续再投资以实现最佳回报，直至用户赎回。',
      }),
    desc1: (t: TFunction) =>
      t({
        enUS: `Mirror the top traders' positions with just a click!`,
        zhCN: '一键复制顶级交易者的持仓！',
      }),
    icon: <img src={IconAutomator} width="24px" />,
    value: ProjectType.Automator,
    link: EnvLinks.config.VITE_AUTOMATOR_LINK,
  },
  [ProjectType.Dual]: {
    label: (t: TFunction) => t({ enUS: 'DualFlex', zhCN: '双币交易' }),
    desc: (t: TFunction) =>
      t({
        enUS: 'DualFlex: Buy Low, Sell High',
      }),
    desc1: (t: TFunction) =>
      t({
        enUS: `Buy Low & Sell High.
Designed for users confident in market trends and seeking dynamic opportunities.`,
      }),
    icon: <img src={IconDual} width="24px" />,
    value: ProjectType.Dual,
    link: EnvLinks.config.VITE_DUAL_LINK,
  },
};

export const RiskTypeRefs = {
  [RiskType.PROTECTED]: {
    label: (t: TFunction) => t('Earn'),
    label2: (t: TFunction) => t('Secured'),
    label3: (t: TFunction) => t('Earn'),
    desc: (t: TFunction) =>
      t({ enUS: 'No losses, please', zhCN: '不接受损失' }),
    icon: <img src={IconLowRisk} width="24px" />,
    value: RiskType.PROTECTED,
  },
  [RiskType.LEVERAGE]: {
    label: (t: TFunction) => t('Leverage'),
    label2: (t: TFunction) => t('Leverage'),
    label3: (t: TFunction) => t('Earn'),
    desc: (t: TFunction) =>
      t({ enUS: 'No pain, no gain', zhCN: '能接受少量损失' }),
    icon: <img src={IconLowRisk} width="24px" />,
    value: RiskType.LEVERAGE,
  },
  [RiskType.RISKY]: {
    label: (t: TFunction) => t('Surge'),
    label2: (t: TFunction) => t('All-or-None'),
    label3: (t: TFunction) => t('Surge'),
    desc: (t: TFunction) =>
      t({ enUS: 'Risking it all', zhCN: '能接受全部损失' }),
    icon: <img src={IconHighYield} width="24px" />,
    value: RiskType.RISKY,
  },
  [RiskType.DUAL]: {
    label: (t: TFunction) => t('Dual'),
    label2: (t: TFunction) => t('[DUAL]All-or-None'),
    label3: (t: TFunction) => t('Dual'),
    desc: (t: TFunction) =>
      t({ enUS: '[DUAL]Risking it all', zhCN: '[DUAL]能接受全部损失' }),
    icon: <img src={IconHighYield} width="24px" />,
    value: RiskType.DUAL,
  },
};

export const ProductTypeRefs = {
  [ProductType.BullSpread]: {
    label: (t: TFunction) => t('Bull Trend'),
    label1: (t: TFunction) => t({ enUS: 'Go up', zhCN: '上涨' }),
    label2: (t: TFunction) => t({ enUS: 'Buy', zhCN: '买涨' }),
    label3: (t: TFunction) => (
      <>
        <span style={{ color: 'var(--color-rise)' }}>
          {t({ enUS: 'Buy', zhCN: '买' })}
        </span>
        {t({ enUS: 'Smart Trend', zhCN: 'Smart Trend' })}
      </>
    ),
    desc: (t: TFunction) =>
      t('Earn Extra Yield on directional market movements'),
    suitableDesc: (t: TFunction) =>
      t(
        'Trend product is suitable for users who expect markets to move in one direction in a smooth and steady manner.',
      ),
    settlementPriceDesc: (t: TFunction) =>
      t(
        `As covered in our oracle section, SOFA utilizes ChainLink's Automation service as our settlement pricing source. Their service enables conditional execution of smart contract functions through a reliable and decentralized automation platform with a proven network of external node operations, currently securing over billions in TVL.`,
      ),
    strikeDesc: (t: TFunction) =>
      t(
        'If the asset price at expiry is higher than the lower strike,<br/>users will earn extra returns, which will be maximized at or above upper strike.',
      ),
    returnSituationsDesc: (t: TFunction) => ({
      max: t('The underlying price is above the upper strike at settlement'),
      min: t('The underlying price is below the lower strike at settlement'),
      middle: {
        situation: t(
          'The underlying price is between the lower strike and the upper strike at settlement',
        ),
        description: t(
          'The payoff will be derived based on a sliding scale between <b>Potential</b> and <b>Base+ Profits</b>.',
        ),
      } as { situation: string; description: string } | undefined,
    }),
    dualDesc: (t: TFunction) => ({
      executed: t({ enUS: 'Buy Low Executed' }),
      limited: t({ enUS: 'Limit Buy {{amount}} {{crypto}}' }),
      partialExecuted: t({ enUS: 'Partial Buy' }),
    }),
    extraDesc: (t: TFunction) =>
      t(
        'Users expressing a bullish market view can benefit from the Bull Trend .<br/>If the asset price is within the range [K1 ~ K2] at expiry, payouts increase from the lower strike [K1] to the maximum at the upper strike [K2].<br/>If the price drops below [K1], investors still receive the Base Yield and RCH tokens.',
      ),
    quoteExplain: (t: TFunction, risk: RiskType) =>
      t(
        '* Price Source: Data Feeds via Chainlink<br/>* {{name}} calculations are indicative and estimated based on current market conditions',
        { name: risk !== RiskType.RISKY ? t('Yield') : t('Payout') },
      ),
    alias: 'Bull Trend',
    value: ProductType.BullSpread,
    img: <ImgBullSpread />,
    icon: (riskType: VisibleRiskType, inverse: boolean) =>
      ({
        [`${RiskType.PROTECTED}-false`]: {
          icon: iconSpreadProtected,
          color:
            'linear-gradient(135deg, #00FFFF 0%, rgba(15, 71, 122, 0.8) 100%)',
        },
        [`${RiskType.PROTECTED}-true`]: {
          icon: iconSpreadProtectedInverse,
          color:
            'linear-gradient(135deg, #00FFFF 0%, rgba(15, 71, 122, 0.8) 100%)',
        },
        [`${RiskType.LEVERAGE}-false`]: {
          icon: iconSpreadProtected,
          color:
            'linear-gradient(135deg, #00FFFF 0%, rgba(15, 71, 122, 0.8) 100%)',
        },
        [`${RiskType.LEVERAGE}-true`]: {
          icon: iconSpreadProtectedInverse,
          color:
            'linear-gradient(135deg, #00FFFF 0%, rgba(15, 71, 122, 0.8) 100%)',
        },
        [`${RiskType.RISKY}-false`]: {
          icon: iconSpreadRisky,
          color: 'linear-gradient(135deg, #D1B32F 0%, #FFCF00 100%)',
        },
        [`${RiskType.RISKY}-true`]: {
          icon: iconSpreadRiskyInverse,
          color: 'linear-gradient(135deg, #D1B32F 0%, #FFCF00 100%)',
        },
      })[`${riskType}-${inverse}`],
    icon1: <IconUp />,
    tag: 'Hot',
    tagStyle: {
      background: 'linear-gradient(to left, #FFFA00 0, #FFA82E 100%)',
      color: '#000',
    },
    disabled: false,
    probability: (
      t: TFunction,
      probability: WinningProbabilities,
      strikes: (string | number)[],
    ) => [
      t(
        {
          enUS: 'Reference Probability ≥{{strike}}: <span class="bold">{{value}}</span>',
          zhCN: '参考概率 ≥{{strike}}: <span class="bold">{{value}}</span>',
        },
        {
          value: displayPercentage(probability.probBullTrendItmLowerStrike),
          strike: strikes[0],
        },
      ),
      t(
        {
          enUS: 'Reference Probability ≥{{strike}}: <span class="bold">{{value}}</span>',
          zhCN: '参考概率 ≥{{strike}}: <span class="bold">{{value}}</span>',
        },
        {
          value: displayPercentage(probability.probBullTrendItmUpperStrike),
          strike: strikes[1],
        },
      ),
    ],
  },
  [ProductType.DNT]: {
    label: (t: TFunction) => t('Rangebound'),
    label1: (t: TFunction) => t({ enUS: 'Flat', zhCN: '震荡' }),
    label2: (t: TFunction) => t({ enUS: 'Flat', zhCN: '震荡' }),
    label3: (t: TFunction) => (
      <>
        <span style={{ color: 'var(--color-rise)' }}>
          {t({ enUS: 'Buy', zhCN: '买' })}
        </span>
        {t({ enUS: 'Rangebound', zhCN: 'Rangebound' })}
      </>
    ),
    desc: (t: TFunction) => t('Win if price always in Range before expiry.'),
    suitableDesc: (t: TFunction) =>
      t(
        "Rangebound products are suitable for boring, sideways markets!  Users will get a higher chance of earning upside payoffs when volatility is low and prices aren't moving much!",
      ),
    settlementPriceDesc: (t: TFunction) =>
      t(
        'Price Source: <span class="txt-gradient">COINBASE - BTC/USDT spot prices</span>. \n\nAt settlement, the vault will automatically check the asset price changes during the subscription period.',
      ),
    strikeDesc: (t: TFunction) =>
      t(
        `If the asset price is always within the range (Lower Barrier ~ Upper Barrier) until settlement,<br/>users will earn Upside Returns at maturity.`,
      ),
    returnSituationsDesc: (t: TFunction) => ({
      max: t('Price stays fully within the range prior to settlement'),
      min: t('Price touches either of the barriers prior to settlement'),
      middle: undefined as
        | { situation: string; description: string }
        | undefined,
    }),
    dualDesc: (t: TFunction) => {
      throw new Error('Not suported scenario');
    },
    extraDesc: (t: TFunction) =>
      t(
        'Users can take advantage of sideways markets with the Rangebound.<br/>If the asset price remains within the preset range during the period, users will earn Potential Yield.<br/>Should the price touch either the lower or upper barriers, users will still receive the Base Yield and RCH tokens.',
      ),
    quoteExplain: (t: TFunction, risk: RiskType) =>
      t(
        '* Price Source: Coinbase via Chainlink<br/>* {{name}} calculations are indicative and estimated based on current market conditions',
        { name: risk !== RiskType.RISKY ? t('Yield') : t('Payout') },
      ),
    alias: 'Rangebound',
    value: ProductType.DNT,
    img: <ImgDNT />,
    icon: (riskType: VisibleRiskType, inverse: boolean) =>
      ({
        [`${RiskType.PROTECTED}-false`]: {
          icon: iconDntProtected,
          color:
            'linear-gradient(135deg, #00FFFF 0%, rgba(15, 71, 122, 0.8) 100%)',
        },
        [`${RiskType.PROTECTED}-true`]: {
          icon: iconDntProtectedInverse,
          color:
            'linear-gradient(135deg, #00FFFF 0%, rgba(15, 71, 122, 0.8) 100%)',
        },
        [`${RiskType.LEVERAGE}-false`]: {
          icon: iconDntProtected,
          color:
            'linear-gradient(135deg, #00FFFF 0%, rgba(15, 71, 122, 0.8) 100%)',
        },
        [`${RiskType.LEVERAGE}-true`]: {
          icon: iconDntProtectedInverse,
          color:
            'linear-gradient(135deg, #00FFFF 0%, rgba(15, 71, 122, 0.8) 100%)',
        },
        [`${RiskType.RISKY}-false`]: {
          icon: iconDntRisky,
          color: 'linear-gradient(135deg, #D1B32F 0%, #FFCF00 100%)',
        },
        [`${RiskType.RISKY}-true`]: {
          icon: iconDntRiskyInverse,
          color: 'linear-gradient(135deg, #D1B32F 0%, #FFCF00 100%)',
        },
      })[`${riskType}-${inverse}`],
    icon1: <IconFlat />,
    tag: '',
    // tagStyle: {
    //   background:
    //     'linear-gradient(90.37deg, rgba(0, 133, 255, 0.22) 0.32%, rgba(0, 255, 209, 0.22) 99.68%)',
    //   color: 'rgba(0,0,0,0.3)',
    // },
    tagStyle: {
      background: 'linear-gradient(to left, #FFFA00 0, #FFA82E 100%)',
      color: '#000',
    },
    disabled: false,
    probability: (
      t: TFunction,
      probability: WinningProbabilities,
      strikes: (string | number)[],
    ) => [
      t(
        {
          enUS: 'Reference Probability Always In Range: <span class="bold">{{value}}</span>',
          zhCN: '始终在范围内的参考概率: <span class="bold">{{value}}</span>',
        },
        {
          value: displayPercentage(probability.probDntStayInRange),
          strike: strikes.join('-'),
        },
      ),
    ],
  },
  [ProductType.BearSpread]: {
    label: (t: TFunction) => t('Bear Trend'),
    label1: (t: TFunction) => t({ enUS: 'Go down', zhCN: '下跌' }),
    label2: (t: TFunction) => t({ enUS: 'Sell', zhCN: '买跌' }),
    label3: (t: TFunction) => (
      <>
        <span style={{ color: 'var(--color-)' }}>
          {t({ enUS: 'Sell', zhCN: '卖' })}
        </span>
        {t({ enUS: 'Smart Trend', zhCN: 'Smart Trend' })}
      </>
    ),
    desc: (t: TFunction) =>
      t('Earn Extra Yield on directional market movements'),
    suitableDesc: (t: TFunction) =>
      t(
        'Trend product is suitable for users who expect markets to move in one direction in a smooth and steady manner.',
      ),
    settlementPriceDesc: (t: TFunction) =>
      t(
        `As covered in our oracle section, SOFA utilizes ChainLink's Automation service as our settlement pricing source. Their service enables conditional execution of smart contract functions through a reliable and decentralized automation platform with a proven network of external node operations, currently securing over billions in TVL.`,
      ),
    strikeDesc: (t: TFunction) =>
      t(
        'If the asset price at expiry is lower than the upper strike,<br/>users will earn extra returns, which will be maximized at or below lower strike.',
      ),
    returnSituationsDesc: (t: TFunction) => ({
      max: t('The underlying price is below the lower strike at settlement'),
      min: t('The underlying price is above the upper strike at settlement'),
      middle: {
        situation: t(
          'The underlying price is between the lower strike and the upper strike at settlement',
        ),
        description: t(
          'The payoff will be derived based on a sliding scale between <b>Potential</b> and <b>Base+ Profits</b>.',
        ),
      } as { situation: string; description: string } | undefined,
    }),
    dualDesc: (t: TFunction) => ({
      executed: t({ enUS: 'Sell High Executed' }),
      limited: t({ enUS: 'Limit Sell {{amount}} {{crypto}}' }),
      partialExecuted: t({ enUS: 'Partial Sell' }),
    }),
    extraDesc: (t: TFunction) =>
      t(
        'Users with a bearish market view can benefit from the Bear Trend.<br/>If the asset price is within the range [K1 ~ K2] at expiry,  payouts increase from the upper strike [K2] to the maximum at the lower strike [K1].<br/>If the price exceeds [K2], investors still receive the Base Yield and RCH tokens.',
      ),
    quoteExplain: (t: TFunction, risk: RiskType) =>
      t(
        '* Price Source: Data Feeds via Chainlink<br/>* {{name}} calculations are indicative and estimated based on current market conditions',
        { name: risk !== RiskType.RISKY ? t('Yield') : t('Payout') },
      ),
    alias: 'Bear Trend',
    value: ProductType.BearSpread,
    img: <ImgBearSpread />,
    icon: (riskType: VisibleRiskType, inverse: boolean) =>
      ({
        [`${RiskType.PROTECTED}-false`]: {
          icon: iconSpreadProtected,
          color:
            'linear-gradient(135deg, #00FFFF 0%, rgba(15, 71, 122, 0.8) 100%)',
        },
        [`${RiskType.PROTECTED}-true`]: {
          icon: iconSpreadProtectedInverse,
          color:
            'linear-gradient(135deg, #00FFFF 0%, rgba(15, 71, 122, 0.8) 100%)',
        },
        [`${RiskType.LEVERAGE}-false`]: {
          icon: iconSpreadProtected,
          color:
            'linear-gradient(135deg, #00FFFF 0%, rgba(15, 71, 122, 0.8) 100%)',
        },
        [`${RiskType.LEVERAGE}-true`]: {
          icon: iconSpreadProtectedInverse,
          color:
            'linear-gradient(135deg, #00FFFF 0%, rgba(15, 71, 122, 0.8) 100%)',
        },
        [`${RiskType.RISKY}-false`]: {
          icon: iconSpreadRisky,
          color: 'linear-gradient(135deg, #D1B32F 0%, #FFCF00 100%)',
        },
        [`${RiskType.RISKY}-true`]: {
          icon: iconSpreadRiskyInverse,
          color: 'linear-gradient(135deg, #D1B32F 0%, #FFCF00 100%)',
        },
      })[`${riskType}-${inverse}`],
    icon1: <IconDown />,
    tag: '',
    tagStyle: {
      background: 'linear-gradient(to left, #FFFA00 0, #FFA82E 100%)',
      color: '#000',
    },
    disabled: false,
    probability: (
      t: TFunction,
      probability: WinningProbabilities,
      strikes: (string | number)[],
    ) => [
      t(
        {
          enUS: 'Reference Probability ≤{{strike}}: <span class="bold">{{value}}</span>',
          zhCN: '参考概率 ≤{{strike}}: <span class="bold">{{value}}</span>',
        },
        {
          value: displayPercentage(probability.probBearTrendItmLowerStrike),
          strike: strikes[0],
        },
      ),
      t(
        {
          enUS: 'Reference Probability ≤{{strike}}: <span class="bold">{{value}}</span>',
          zhCN: '参考概率 ≤{{strike}}: <span class="bold">{{value}}</span>',
        },
        {
          value: displayPercentage(probability.probBearTrendItmUpperStrike),
          strike: strikes[1],
        },
      ),
    ],
  },
};
