import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AutomatorService } from '@sofa/services/automator';
import { ProjectType } from '@sofa/services/base-type.ts';
import { TFunction, useTranslation } from '@sofa/services/i18n';
import { amountFormatter } from '@sofa/utils/amount';
import { Env } from '@sofa/utils/env';
import { useIsPortrait } from '@sofa/utils/hooks';
import { formatHighlightedText } from '@sofa/utils/string';
import { joinUrl } from '@sofa/utils/url';
import { useRequest } from 'ahooks';
import classNames from 'classnames';

import { EnvLinks } from '@/env-links';
import { addI18nResources } from '@/locales';
import { useAutomatorCreatorStore } from '@/pages/products/automator-mine/store';
import { RootDomainPaths } from '@/route-guard';

import { ProjectTypeRefs } from '../ProductSelector/enums';
import { useWalletStore } from '../WalletConnector/store';

import { Comp as IconAdd } from './assets/icon-add.svg';
import { Comp as IconBlog } from './assets/icon-blog.svg';
import { Comp as IconClock } from './assets/icon-clock.svg';
import { Comp as IconDefiMode } from './assets/icon-defimode.svg';
import { Comp as IconOverview } from './assets/icon-overview.svg';
import { Comp as IconPos } from './assets/icon-pos.svg';
import { Comp as IconSOFA } from './assets/icon-sofa.svg';
import { Comp as IconSwap } from './assets/icon-swap.svg';
import { Comp as IconUsers } from './assets/icon-users.svg';
import { CommonHeader, HomeHeader, markSelectedMenuItems } from './index-home';
import locale from './locale';
import { MenuItem } from './store';

import styles from './index.module.scss';

addI18nResources(locale, 'Header');

const isAutomatorSharePage = (location: ReturnType<typeof useLocation>) =>
  location.pathname.toLowerCase() == '/a';
const allMenuItems = (
  options: { hasCreateAutomator: boolean; isPortrait?: boolean },
  project: ProjectType,
  location: ReturnType<typeof useLocation>,
): MenuItem[] => {
  // 下面这行被注释掉的code 告诉 ai18n 下面的 t 都是在 Header 包下
  // const [t] = useTranslation('Header');
  const _isAutomatorSharePage = () => isAutomatorSharePage(location);
  const campaign = {
    label: (t: TFunction) =>
      t({
        enUS: 'Game Center',
        zhCN: '游戏中心',
      }),
    target: '_blank',
    path: EnvLinks.config.VITE_CAMPAIGN_LINK,
    hide: () => Env.isTelegram || _isAutomatorSharePage(),
  };
  return markSelectedMenuItems(
    [
      {
        label: (t: TFunction) => t('Trade'),
        path: '',
        hide: _isAutomatorSharePage,
        children: [
          {
            icon: <IconDefiMode />,
            group: (t: TFunction) => t({ enUS: 'Core Mode', zhCN: '标准模式' }),
            label: (t: TFunction) => t({ enUS: 'Core Mode', zhCN: '标准模式' }),
            desc: (t: TFunction) =>
              t({
                enUS: 'Yield earning made easy.  Discover the best solutions for you!',
                zhCN: '轻松赚取收益，发现最适合您的解决方案！',
              }),
            path: '/products?project=Earn',
          },
          {
            icon: ProjectTypeRefs[ProjectType.Earn].icon,
            group: (t: TFunction) => t({ enUS: 'Professional', zhCN: '专业' }),
            label: (t: TFunction) => (
              <span className={styles['txt-gradient']}>
                {ProjectTypeRefs[ProjectType.Earn].label(t)}
              </span>
            ),
            desc: (t: TFunction) => ProjectTypeRefs[ProjectType.Earn].desc1(t),
            path: joinUrl(EnvLinks.config.VITE_EARN_LINK, '/customize'),
          },
          {
            icon: ProjectTypeRefs[ProjectType.Surge].icon,
            group: (t: TFunction) => t({ enUS: 'Professional', zhCN: '专业' }),
            label: (t: TFunction) => (
              <span className={styles['txt-gradient-2']}>
                {ProjectTypeRefs[ProjectType.Surge].label(t)}
              </span>
            ),
            desc: (t: TFunction) => ProjectTypeRefs[ProjectType.Surge].desc1(t),
            path: joinUrl(EnvLinks.config.VITE_SURGE_LINK, '/customize'),
          },
          {
            icon: ProjectTypeRefs[ProjectType.Dual].icon,
            group: (t: TFunction) => t({ enUS: 'Professional', zhCN: '专业' }),
            label: (t: TFunction) => (
              <span className={styles['txt-gradient-2']}>
                {ProjectTypeRefs[ProjectType.Dual].label(t)}
              </span>
            ),
            desc: (t: TFunction) => ProjectTypeRefs[ProjectType.Dual].desc1(t),
            path: joinUrl(EnvLinks.config.VITE_DUAL_LINK, '/customize'),
          },
          {
            icon: <IconPos />,
            group: (t: TFunction) => t({ enUS: 'Position', zhCN: '持仓' }),
            label: (t: TFunction) => t({ enUS: 'Position', zhCN: '持仓' }),
            desc: (t: TFunction) =>
              t({
                enUS: 'Your Earn, Surge & Dual Positions.',
                zhCN: '你交易的 Earn、Surge 和 Dual 的头寸',
              }),
            path: '/positions',
          },
        ],
      },
      {
        label: (t: TFunction) =>
          ProjectTypeRefs[ProjectType.Automator].label(t),
        path: '',
        active: _isAutomatorSharePage() ? true : undefined,
        children: [
          {
            icon: ProjectTypeRefs[ProjectType.Automator].icon,
            group: (t: TFunction) =>
              ProjectTypeRefs[ProjectType.Automator].label(t),
            label: (t: TFunction) =>
              ProjectTypeRefs[ProjectType.Automator].label(t),
            desc: (t: TFunction) =>
              ProjectTypeRefs[ProjectType.Automator].desc1(t),
            path: EnvLinks.config.VITE_AUTOMATOR_LINK,
          },
          {
            icon: <IconClock />,
            group: (t: TFunction) =>
              ProjectTypeRefs[ProjectType.Automator].label(t),
            label: (t: TFunction) => t({ enUS: 'History', zhCN: '历史' }),
            desc: (t: TFunction) =>
              t({
                enUS: 'Review your active and past performance records.',
                zhCN: '查看您的当前和历史绩效记录。',
              }),
            path: '/positions/automator',
          },
          {
            icon: <IconOverview />,
            group: (t: TFunction) =>
              t({ enUS: 'My Automator', zhCN: '我的 Automator' }),
            label: (t: TFunction) =>
              t({ enUS: 'Overview', zhCN: '我的 Automator' }),
            desc: (t: TFunction) =>
              t({
                enUS: 'View your Automators at a glance.',
                zhCN: '查看你创建的 Automator',
              }),
            path: '/products/automator/mine',
            hide: () => !options.hasCreateAutomator,
          },
          {
            icon: <IconSwap />,
            group: (t: TFunction) =>
              t({ enUS: 'My Automator', zhCN: '我的 Automator' }),
            label: (t: TFunction) =>
              t({ enUS: 'Trade Your Strategy', zhCN: '交易' }),
            desc: (t: TFunction) =>
              t({
                enUS: 'Make trades to grow investor returns.',
                zhCN: '为你的 Automator 创收',
              }),
            path: '/products/automator/operate',
            hide: () => !options.hasCreateAutomator || !!options.isPortrait,
          },
          {
            icon: <IconAdd />,
            group: (t: TFunction) =>
              t({ enUS: 'Become An Optivisor', zhCN: '成为 Optivisor' }),
            label: (t: TFunction) =>
              t({
                enUS: 'Create An Automator Strategy',
                zhCN: '创建 Automator',
              }),
            desc: (t: TFunction) =>
              t({
                enUS: 'Earn profit sharing returns from strategy followers.',
                zhCN: '从 Automator 的管理中赚取收益',
              }),
            path: '/products/automator/create',
            hide: () => !!options.isPortrait,
          },
        ],
      },
      campaign,
      {
        label: (t: TFunction) => t({ enUS: 'Community', zhCN: '联系我们' }),
        path: '',
        hide: _isAutomatorSharePage,
        children: [
          {
            icon: <IconUsers />,
            label: (t: TFunction) =>
              t({ enUS: 'Ambassador Program', zhCN: '宣传大使项目' }),
            path: 'https://blog.sofa.org/ambassador/',
          },
          {
            icon: <IconSOFA />,
            label: (t: TFunction) =>
              t({ enUS: 'SOFA Points', zhCN: 'SOFA 积分' }),
            path: joinUrl(EnvLinks.config.VITE_SOFA_LINK, '/points'),
          },
          {
            icon: <IconBlog />,
            label: (t: TFunction) => t({ enUS: 'Blog', zhCN: '博客' }),
            path: 'https://blog.sofa.org/',
          },
        ],
      },
      {
        label: (t: TFunction) => t('Docs'),
        path: 'https://docs.sofa.org',
        type: 1,
        hide: _isAutomatorSharePage,
      },
    ],
    location,
  );
};

const DappHeader = () => {
  const [t] = useTranslation('Header');
  const location = useLocation();
  const isPortrait = useIsPortrait();
  const more = useMemo(() => true, []);
  const { data: globalAutomatorStatus } = useRequest(() =>
    AutomatorService.automatorShareGlobalStatus(),
  );
  const wallet = useWalletStore();

  useEffect(() => {
    if (wallet.address)
      useAutomatorCreatorStore.list(wallet.chainId, wallet.address);
  }, [wallet.address, wallet.chainId]);
  const myAutomators = useAutomatorCreatorStore(
    (state) =>
      state.vaults[`${wallet.chainId}-${wallet.address?.toLowerCase()}`],
  );

  return (
    <CommonHeader
      aside={
        <>
          {more && (
            <div className={styles['other-links']}>
              <a
                className={classNames(styles['btn-link'], 'btn-gradient', {
                  [styles['active']]: location.pathname.startsWith('/rch'),
                })}
                href={EnvLinks.config.VITE_RCH_LINK}
                target={
                  Env.isMetaMaskAndroid || Env.isTelegram ? undefined : 'rch'
                }
              >
                <span>{t('Claim')}</span>
                {t('RCH')}
              </a>
            </div>
          )}
        </>
      }
      menus={(...args) =>
        allMenuItems(
          { hasCreateAutomator: !!myAutomators?.length, isPortrait },
          ...args,
        )
      }
      menuSurfix={
        isAutomatorSharePage(location) && globalAutomatorStatus ? (
          <>
            <span className={styles['automator-status']}>
              {formatHighlightedText(
                t(
                  {
                    enUS: 'Over [[{{amount}}]] {{crypto}} in funds are sharing the profits',
                    zhCN: '和超过 [[{{amount}}]] {{crypto}} 的资金共享利润',
                  },
                  {
                    amount: amountFormatter(
                      globalAutomatorStatus.totalDepositAmount,
                    ),
                    crypto: globalAutomatorStatus.crypto,
                  },
                ),
                {
                  hightlightedClassName: styles['amount'],
                },
              )}
            </span>
          </>
        ) : undefined
      }
      moreIcons={more}
    />
  );
};

const Header = () => {
  const location = useLocation();
  if (RootDomainPaths.includes(location.pathname)) return <HomeHeader />;
  return <DappHeader />;
};

export default Header;
