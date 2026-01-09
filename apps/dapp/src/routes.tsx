import React, { ComponentType } from 'react';
import { ParsedQs } from 'qs';

const Test = React.lazy(() => import('@/pages/test'));
const Home = React.lazy(() => import('@/pages/home'));
const Policy = React.lazy(() => import('@/pages/policy'));
const Positions = React.lazy(() => import('@/pages/positions'));
const ProductCustomize = React.lazy(() => import('@/pages/products/customize'));
const RCH = React.lazy(() => import('@/pages/rch'));
const Points = React.lazy(() => import('@/pages/points'));
const Mechanism = React.lazy(() => import('@/pages/mechanism'));
const Advantages = React.lazy(() => import('@/pages/advantages'));
const OrderHistory = React.lazy(() => import('@/pages/history'));
const Products = React.lazy(() => import('@/pages/products'));
const Automator = React.lazy(() => import('@/pages/products/automator'));
const AutomatorMine = React.lazy(
  () => import('@/pages/products/automator-mine'),
);
const AutomatorOperate = React.lazy(
  () => import('@/pages/products/automator-operate'),
);
const AutomatorPositions = React.lazy(
  () => import('@/pages/positions/automator'),
);
const AutomatorCreate = React.lazy(
  () => import('@/pages/products/automator-create'),
);
const AutomatorSharePage = React.lazy(
  () => import('@/pages/products/automator-operate/share'),
);

export const routes: {
  path: string;
  Component: ComponentType;
  needGuard?: boolean; // default: true
  title?: string | ((query?: ParsedQs, hash?: string) => string); // for seo
  description?: string | ((query?: ParsedQs, hash?: string) => string); // for seo
  keywords?: string | ((query?: ParsedQs, hash?: string) => string); // for seo
}[] = [
  {
    path: '/',
    Component: Home,
    title: 'SOFA.org',
    description:
      'SOFA.org is a decentralized, nonprofit, open-source organization building DeFi protocols for crypto structured products and options. Earn RCH tokens via protocol use. $SOFA holders vote on governance proposals.',
    keywords:
      'DeFi, RCH, SOFA, decentralized finance, crypto structured products, blockchain, protocol safety, community rewards, financial technology, governance token, decentralized organization, DeFi education, capital efficiency, nonprofit finance',
  },
  {
    path: '/test',
    Component: Test,
  },
  {
    path: '/policy',
    Component: Policy,
    title: 'Policy - SOFA.org',
  },
  {
    path: '/mechanism',
    Component: Mechanism,
    title: 'Project - SOFA.org',
    description:
      'Mechanism: 100% on-chain DeFi structured products and crypto options with tokenized positions (ERC-1155), market-maker liquidity, and transparent settlement.',
  },
  {
    path: '/strengths',
    Component: Advantages,
    title: 'Capabilities - SOFA.org',
    description:
      'Capabilities: On-chain vaults enable atomic settlement and mint ERC-1155 Position Tokens, transferable collateral that unlocks liquidity across DeFi and CeFi.',
  },
  {
    path: '/rch',
    Component: RCH,
    title: 'RCH - SOFA.org',
    description:
      'RCH is SOFA.org’s utility rewards token. Earn via trade mining, protocol use, and liquidity in DeFi structured products & options. Claim daily airdrops.',
    keywords: 'RCH, airdrop',
  },
  {
    path: '/points',
    Component: Points,
    title: 'Points - SOFA.org',
    description:
      'SOFA Points: Earn points by trading SOFA DeFi products, holding RCH, and joining games & community tasks. Check $SOFA airdrop eligibility.',
    keywords: 'SOFA points, airdrop',
  },
  {
    path: '/positions',
    Component: Positions,
    title: 'Positions - SOFA.org',
  },
  {
    path: '/products',
    Component: Products,
    title: (q) => {
      const map = {
        Automator: 'Automator - SOFA.org',
        _: 'Products - SOFA.org',
      };
      return map[q?.project as keyof typeof map] || map._;
    },
    description: (q) => {
      const map = {
        Automator:
          'SOFA Automator: Follow Optivisor-managed DeFi options strategies or create your own. Earn passive yields with gas-saving automation and daily $RCH airdrops.',
        _: 'Trade SOFA DeFi options products (Earn, Surge, Dual) or follow Automator strategies to earn $RCH rewards—daily airdrops allocated by on-chain trading volume.',
      };
      return map[q?.project as keyof typeof map] || map._;
    },
    keywords: (q) => {
      const map = {
        Automator: 'automator, airdrop',
        _: 'earn, surge, dual, airdrop',
      };
      return map[q?.project as keyof typeof map] || map._;
    },
  },
  {
    path: '/products/customize',
    Component: ProductCustomize,
    title: (q) => {
      const map = {
        Dual: 'Dual - SOFA.org',
        Surge: 'Surge - SOFA.org',
        Earn: 'Earn - SOFA.org',
      };
      return map[(q?.project as never) || 'Earn'];
    },
    description: (q) => {
      const map = {
        Dual: 'SOFA Dual: Buy low or sell high with automated on-chain execution for DeFi options. Earn yield plus $RCH rewards even if your trade doesn’t execute.',
        Surge:
          'SOFA Surge: High-upside on-chain DeFi structured products for BTC/ETH options (Rangebound, Bull/Bear Trend). Trade to earn daily $RCH airdrops.',
        Earn: 'SOFA Earn: Lower-risk on-chain DeFi options structured products for BTC/ETH (Rangebound, Bull Trend, Bear Trend). Earn base yield with downside protection plus daily $RCH airdrops.',
      };
      return map[(q?.project as never) || 'Earn'];
    },
    keywords: (q) => {
      const map = {
        Dual: 'dual, airdrop',
        Surge: 'surge, airdrop',
        Earn: 'earn, airdrop',
      };
      return map[(q?.project as never) || 'Earn'];
    },
  },
  {
    path: '/products/automator',
    Component: Automator,
    title: 'Automator - SOFA.org',
    description:
      'SOFA Automator: Follow Optivisor-managed DeFi options strategies or create your own. Earn passive yields with gas-saving automation and daily $RCH airdrops.',
    keywords: 'automator, airdrop',
  },
  {
    path: '/products/automator/mine',
    Component: AutomatorMine,
    title: 'My Automators - SOFA.org',
  },
  {
    path: '/products/automator/operate',
    Component: AutomatorOperate,
    title: 'Operate Automator - SOFA.org',
  },
  {
    path: '/positions/orders',
    Component: OrderHistory,
    title: 'Order History - SOFA.org',
  },
  {
    path: '/automator/positions',
    Component: AutomatorPositions,
    title: 'Automator Positions - SOFA.org',
  },
  {
    path: '/products/automator/create',
    Component: AutomatorCreate,
    title: 'Create Automator - SOFA.org',
    description:
      'Create a SOFA Automator as an Optivisor: build and roll on-chain options strategies to earn a share of profits plus $RCH airdrop rewards.',
  },
  {
    path: '/transactions',
    Component: OrderHistory,
    title: 'Transactions History - SOFA.org',
  },
  {
    path: '/a',
    Component: AutomatorSharePage,
    title: 'Automator Sharing - SOFA.org',
    description:
      'Follow top Automator strategies to earn passive yields and daily $RCH airdrops on SOFA.org.',
    keywords: 'automator, airdrop',
  },
];
