/* eslint-disable react-refresh/only-export-components */
import React, { ComponentType } from 'react';

const Test = React.lazy(() => import('@/pages/test'));
const Home = React.lazy(() => import('@/pages/home'));
const Policy = React.lazy(() => import('@/pages/policy'));
const Positions = React.lazy(() => import('@/pages/positions'));
const Products = React.lazy(() => import('@/pages/products'));
const ProductCustomize = React.lazy(() => import('@/pages/products/customize'));
const RCH = React.lazy(() => import('@/pages/rch'));
const Points = React.lazy(() => import('@/pages/points'));
const Mechanism = React.lazy(() => import('@/pages/mechanism'));
const Advantages = React.lazy(() => import('@/pages/advantages'));
const OrderHistory = React.lazy(() => import('@/pages/history'));

export const routes: {
  path: string;
  Component: ComponentType;
  needGuard?: boolean; // default: true
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
    path: '/positions/orders',
    Component: OrderHistory,
  },
  {
    path: '/transactions',
    Component: OrderHistory,
  },
];
