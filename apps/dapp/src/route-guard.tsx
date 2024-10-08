import { ComponentType } from 'react';
import { Navigate } from 'react-router-dom';
import { Env } from '@sofa/utils/env';

export const RouteGuard = (props: { Comp: ComponentType }) => {
  if (Env.isTelegram) return <props.Comp />;

  const isSubProject =
    /earn|surge/i.test(location.origin) ||
    (/localhost|front.sofa.org|(\d+\.){3}\d+/.test(location.origin) &&
      /project=(PROTECTED|RISKY|LEVERAGE)/.test(location.search));
  const isSubProjectPath = /products|positions/.test(location.pathname);

  if (isSubProject && !isSubProjectPath) {
    return <Navigate to={{ pathname: '/products', search: location.search }} />;
  }

  if (!isSubProject && isSubProjectPath) {
    return <Navigate to={{ pathname: '/', search: location.search }} />;
  }

  return <props.Comp />;
};
