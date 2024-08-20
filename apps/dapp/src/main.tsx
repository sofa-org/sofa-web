/* eslint-disable react-refresh/only-export-components */
import { Suspense, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { useTranslation as useTranslation_ } from 'react-i18next';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useLocation,
} from 'react-router-dom';
import { ConfigProvider, Modal } from '@douyinfe/semi-ui';
import init from '@sofa/alg';
import { configReactI18next, t } from '@sofa/services/i18n';
import { ReferralCode } from '@sofa/services/referral';
import { Env } from '@sofa/utils/env';
import { useQuery } from '@sofa/utils/hooks';
import { versionGuardian } from '@sofa/utils/version';

import ErrorBoundary from '@/components/ErrorBoundary/index';
import Footer from '@/components/Footer/index';
import Header from '@/components/Header/index';
import { useTimezone } from '@/components/TimezoneSelector/store';
import { WasmSuspenseHoc } from '@/components/WasmSuspense/index';
import { initI18n } from '@/locales/index';
import NotFound from '@/pages/not-found';

import './global-var';

import { RouteGuard } from './route-guard';
import { routes } from './routes';
import { useGlobalState } from './store';

import './index.scss';
import 'locomotive-scroll/dist/locomotive-scroll.css';

configReactI18next({
  useTranslation: useTranslation_,
});
const Root = WasmSuspenseHoc(
  () => {
    const [, i18n] = useTranslation_();
    const timezone = useTimezone((state) => state.timezone);

    const location = useLocation();
    useEffect(() => {
      document.getElementById('root')?.scrollTo(0, 0);
      document.body.classList.add('no-scrollbar');
      if (Env.isMobile) document.body.classList.add('is-mobile');
      else document.body.classList.add('is-pc');
    }, [location.pathname]);

    const query = useQuery();
    useEffect(() => {
      const referralCode = (query['referral'] ||
        query['sfg'] ||
        query['x']) as string;
      if (referralCode) ReferralCode.set(referralCode);
    }, [query]);

    return (
      <ConfigProvider
        locale={i18n.getResourceBundle(i18n.language, 'global')}
        timeZone={timezone}
        direction={undefined} // 后面增加多语言的时候有用
      >
        <ErrorBoundary style={{ height: '100vh' }}>
          <Header />
          <main className="main-content">
            <Suspense>
              <Outlet />
            </Suspense>
          </main>
          <Footer />
          {/* <CursorTail /> */}
        </ErrorBoundary>
      </ConfigProvider>
    );
  },
  [init, initI18n, useGlobalState.getVaults],
  () => <></>,
);

/*
 * Router
 */
window.$router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: routes.map((it) => {
      if (it.needGuard === false) return it;
      return {
        ...it,
        Component: () => <RouteGuard Comp={it.Component!} />,
      };
    }),
  },
  {
    path: '*',
    Component: () => {
      // 处理 wallet connect 手机端跳转加 /wc 的逻辑
      // 处理 okx wallet 推荐链接可能在路径后面加 %20 的逻辑
      if (/%20$|\/wc$/.test(location.pathname)) {
        return (
          <Navigate
            to={{
              pathname: location.pathname.replace(/%20$|\/wc$/, ''),
              search: location.search,
            }}
          />
        );
      }
      return <NotFound />;
    },
  },
]);

if (!window.$root)
  window.$root = ReactDOM.createRoot(document.getElementById('root')!);

window.$root.render(<RouterProvider router={window.$router} />);

declare global {
  interface Window {
    $root: ReactDOM.Root;
    $router: ReturnType<typeof createBrowserRouter>;
  }
}

versionGuardian(
  {
    confirm: (options) =>
      Modal.confirm({
        ...options,
        centered: true,
        closable: false,
        closeOnEsc: false,
        cancelButtonProps: { style: { display: 'none' } },
      }),
  },
  t,
);
