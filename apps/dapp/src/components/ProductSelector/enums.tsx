import { TFunction } from '@sofa/services/i18n';
import { ProductType, RiskType } from '@sofa/services/products';

import { addI18nResources } from '@/locales';

import iconDntProtected from './assets/dnt-protected.png';
import iconDntProtectedInverse from './assets/dnt-protected-inverse.png';
import iconDntRisky from './assets/dnt-risky.png';
import iconDntRiskyInverse from './assets/dnt-risky-inverse.png';
import IconHighYield from './assets/icon-high-yield.png';
import IconLowRisk from './assets/icon-low-risk.png';
import { Comp as ImgBearSpread } from './assets/product-bear-spread.svg';
import { Comp as ImgBullSpread } from './assets/product-bull-spread.svg';
import { Comp as ImgDNT } from './assets/product-dnt.svg';
import iconSpreadProtected from './assets/spread-protected.png';
import iconSpreadProtectedInverse from './assets/spread-protected-inverse.png';
import iconSpreadRisky from './assets/spread-risky.png';
import iconSpreadRiskyInverse from './assets/spread-risky-inverse.png';
import locale from './locale';

addI18nResources(locale, 'ProjectProductSelector');

export const RiskTypeRefs = {
  [RiskType.PROTECTED]: {
    label: (t: TFunction) => t('Earn'),
    label1: (t: TFunction) => t('Capital Secured Earnings'),
    label2: (t: TFunction) => t('Secured'),
    desc: (t: TFunction) =>
      t(
        'By smartly combining the safety of savings income with a sprinkle of embedded options, your principal is securely generating yield in trusted DeFi protocols such as Aave/Lido/Sofa, while a portion of that income will be funding upside option structures for a chance at extra gains.  Perfect for the risk conscious user who wants to benefit from upside gains with minimal downside.',
      ),
    icon: <img src={IconLowRisk} width="24px" />,
    value: RiskType.PROTECTED,
    link: import.meta.env.VITE_EARN_LINK as string,
  },
  [RiskType.LEVERAGE]: {
    label: (t: TFunction) => t('Leverage'),
    label1: (t: TFunction) => t('Leverage'),
    label2: (t: TFunction) => t('Leverage'),
    desc: (t: TFunction) =>
      t(
        'By smartly combining the safety of savings income with a sprinkle of embedded options, your principal is securely generating yield in trusted DeFi protocols such as Aave/Lido/Sofa, while a portion of that income will be funding upside option structures for a chance at extra gains.  Perfect for the risk conscious user who wants to benefit from upside gains with minimal downside.',
      ),
    icon: <img src={IconLowRisk} width="24px" />,
    value: RiskType.LEVERAGE,
    link: import.meta.env.VITE_EARN_LINK as string,
  },
  [RiskType.RISKY]: {
    label: (t: TFunction) => t('Surge'),
    label1: (t: TFunction) => t('ApxWinnings Tickets'),
    label2: (t: TFunction) => t('All-or-None'),
    desc: (t: TFunction) =>
      t(
        'Popular TradFi exotics investments can now be safely invested on-chain, allowing users to speculate on token price action through a diverse product suite including Rangebound, Trends, and Shark Fin products.  Higher returns will come at the risk of principal losses, though users will have full control over the product parameters under our flexible RFQ interface.',
      ),
    icon: <img src={IconHighYield} width="24px" />,
    value: RiskType.RISKY,
    link: import.meta.env.VITE_SURGE_LINK as string,
  },
};

export const ProductTypeRefs = {
  [ProductType.BullSpread]: {
    label: (t: TFunction) => t('Bull Trend'),
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
    icon: (riskType: RiskType, inverse: boolean) =>
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
    tag: 'Hot',
    tagStyle: {
      background: 'linear-gradient(to left, #FFFA00 0, #FFA82E 100%)',
      color: '#000',
    },
    disabled: false,
  },
  [ProductType.DNT]: {
    label: (t: TFunction) => t('Rangebound'),
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
    icon: (riskType: RiskType, inverse: boolean) =>
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
  },
  [ProductType.BearSpread]: {
    label: (t: TFunction) => t('Bear Trend'),
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
    icon: (riskType: RiskType, inverse: boolean) =>
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
    tag: '',
    tagStyle: {
      background: 'linear-gradient(to left, #FFFA00 0, #FFA82E 100%)',
      color: '#000',
    },
    disabled: false,
  },
};
