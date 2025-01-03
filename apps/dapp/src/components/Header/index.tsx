import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ProjectType } from '@sofa/services/base-type.ts';
import { TFunction, useTranslation } from '@sofa/services/i18n';
import { Env } from '@sofa/utils/env';
import { joinUrl } from '@sofa/utils/url';
import classNames from 'classnames';

import { EnvLinks } from '@/env-links';
import { addI18nResources } from '@/locales';
import { RootDomainPaths } from '@/route-guard';

import { ProjectTypeRefs } from '../ProductSelector/enums';

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

const allMenuItems = (
  project: ProjectType,
  location: ReturnType<typeof useLocation>,
): MenuItem[] => {
  // 下面这行被注释掉的code 告诉 ai18n 下面的 t 都是在 Header 包下
  // const [t] = useTranslation('Header');
  const campaign = {
    label: (t: TFunction) =>
      t({
        enUS: 'Game Center',
        zhCN: '游戏中心',
      }),
    target: '_blank',
    path: EnvLinks.config.VITE_CAMPAIGN_LINK,
    hide: () => Env.isTelegram,
  };
  return markSelectedMenuItems(
    [
      {
        label: (t: TFunction) => t('Trade'),
        path: '',
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
            icon: <IconPos />,
            group: (t: TFunction) => t({ enUS: 'Position', zhCN: '持仓' }),
            label: (t: TFunction) => t({ enUS: 'Position', zhCN: '持仓' }),
            desc: (t: TFunction) =>
              t({
                enUS: 'Your Earn & Surge Positions.',
                zhCN: '你交易的 Earn 和 Surge 的头寸',
              }),
            path: '/positions?project=Earn',
          },
        ],
      },
      {
        label: (t: TFunction) =>
          ProjectTypeRefs[ProjectType.Automator].label(t),
        path: '',
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
          },
        ],
      },
      campaign,
      {
        label: (t: TFunction) => t({ enUS: 'Community', zhCN: '联系我们' }),
        path: '',
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
      },
    ],
    location,
  );
};

const DappHeader = () => {
  const [t] = useTranslation('Header');
  const location = useLocation();
  const more = useMemo(() => true, []);

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
      menus={allMenuItems}
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
