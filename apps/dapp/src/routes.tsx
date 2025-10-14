import React, { ComponentType } from 'react';

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
  title?: string; // for seo
  description?: string; // for seo
  keywords?: string; // for seo
}[] = [
  {
    path: '/',
    Component: Home,
    title: 'SOFA.org',
    description:
      "SOFA.org is a decentralized, nonprofit, open-source technology organization offering protocols for crypto products, especially options. Earn $RCH via protocol use, liquidity provision, and governance. $SOFA enables holders to vote on proposals that shape SOFA.org's future.",
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
    description: '100% on-chain and tokenized positions.',
  },
  {
    path: '/strengths',
    Component: Advantages,
    title: 'Capabilities - SOFA.org',
    description:
      'The SOFA protocol is our ambitious attempt to establish standards of how financial assets can be atomically settled on-chain, while simultaneously catalyzing DeFi capital liquidity through transferrable Position Tokens.',
  },
  {
    path: '/rch',
    Component: RCH,
    title: 'RCH - SOFA.org',
    description:
      'Earn $RCH via protocol use, liquidity provision, and governance.',
    keywords: 'RCH, airdrop',
  },
  {
    path: '/points',
    Component: Points,
    title: 'Points - SOFA.org',
    description:
      'Discover the rules for earning $SOFA points on the SOFA protocol. See how interacting with our DeFi products and options qualifies you for $SOFA airdrop.',
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
    title: 'Products - SOFA.org',
    description:
      'Trade options products like Earn, Surge, and Dual, and follow Automator strategies on our protocol to get $RCH airdrops.',
    keywords: 'earn, surge, dual, airdrop',
  },
  {
    path: '/products/customize',
    Component: ProductCustomize,
    title: 'Customize - SOFA.org',
    description:
      'Customize DeFi options products tailored to your investment strategy and risk preferences on SOFA platform and get exclusive $RCH airdrops.',
  },
  {
    path: '/products/automator',
    Component: Automator,
    title: 'Automator - SOFA.org',
    description:
      'Automator is a DeFi product to follow top strategies or create your own to earn profits and receive exclusive $RCH airdrops.',
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
    description: 'Create your own automator and roll it to earn profits.',
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
      'Follow Automator strategies on our protocol to earn profits and get exclusive $RCH airdrops.',
    keywords: 'automator, airdrop',
  },
];
