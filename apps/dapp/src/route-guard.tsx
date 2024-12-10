import { ComponentType } from 'react';
import { Navigate } from 'react-router-dom';
import { Env } from '@sofa/utils/env';

export const RootDomainPaths = [
  '/',
  '/policy',
  '/mechanism',
  '/strengths',
  '/rch',
  '/points',
];

export const RouteGuard = (props: { Comp: ComponentType }) => {
  if (Env.isTelegram || Env.isDev) return <props.Comp />;

  const isDapp = /dapp\./i.test(location.origin);
  const isDappPath = !RootDomainPaths.includes(location.pathname);

  if (isDapp && !isDappPath) {
    return <Navigate to={{ pathname: '/products', search: location.search }} />;
  }

  if (!isDapp && isDappPath) {
    return <Navigate to={{ pathname: '/', search: location.search }} />;
  }

  return <props.Comp />;
};
