import { ComponentType } from 'react';
import { Navigate } from 'react-router-dom';
import { Env } from '@sofa/utils/env';

export const RouteGuard = (props: { Comp: ComponentType }) => {
  if (Env.isTelegram) return <props.Comp />;

  const isDapp = /dapp\./i.test(location.origin);
  const isDappPath = [
    '/',
    '/policy',
    '/mechanism',
    '/strengths',
    '/rch',
    '/points',
  ].includes(location.pathname);

  if (isDapp && !isDappPath) {
    return <Navigate to={{ pathname: '/products', search: location.search }} />;
  }

  if (!isDapp && isDappPath) {
    return <Navigate to={{ pathname: '/', search: location.search }} />;
  }

  return <props.Comp />;
};
