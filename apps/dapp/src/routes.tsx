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
  },
  {
    path: '/test', // 开发
    Component: Test,
  },
  {
    path: '/policy',
    Component: Policy,
  },
  {
    path: '/mechanism',
    Component: Mechanism,
  },
  {
    path: '/strengths',
    Component: Advantages,
  },
  {
    path: '/rch',
    Component: RCH,
    title: 'RCH',
    description: '这是 RCH 的页面描述',
    keywords: 'RCH, RCH',
  },
  {
    path: '/points',
    Component: Points,
  },
  {
    path: '/positions',
    Component: Positions,
  },
  {
    path: '/products',
    Component: Products,
  },
  {
    path: '/products/customize',
    Component: ProductCustomize,
  },
  {
    path: '/products/automator',
    Component: Automator,
  },
  {
    path: '/products/automator/mine',
    Component: AutomatorMine,
  },
  {
    path: '/products/automator/operate',
    Component: AutomatorOperate,
  },
  {
    path: '/positions/orders',
    Component: OrderHistory,
  },
  {
    path: '/automator/positions',
    Component: AutomatorPositions,
  },
  {
    path: '/products/automator/create',
    Component: AutomatorCreate,
  },
  {
    path: '/transactions',
    Component: OrderHistory,
  },
  {
    path: '/a',
    Component: AutomatorSharePage,
  },
];
