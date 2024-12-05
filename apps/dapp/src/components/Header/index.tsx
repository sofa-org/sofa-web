import { Fragment, ReactNode, useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Dropdown } from '@douyinfe/semi-ui';
import { ProjectType } from '@sofa/services/base-type.ts';
import { TFunction, useTranslation } from '@sofa/services/i18n';
import { Env } from '@sofa/utils/env';
import { joinUrl } from '@sofa/utils/url';
import { useScroll } from 'ahooks';
import classNames from 'classnames';

import { Comp as Logo } from '@/assets/logo';
import { EnvLinks } from '@/env-links';
import { addI18nResources, LangSelector } from '@/locales';

import IndexPrices from '../IndexPrices';
import NetworkSelector from '../NetworkSelector';
import { useProjectChange } from '../ProductSelector';
import { ProjectTypeRefs } from '../ProductSelector/enums';
import TimezoneSelector from '../TimezoneSelector';
import WalletConnector from '../WalletConnector';

import { Comp as IconBlog } from './assets/icon-blog.svg';
import { Comp as IconClock } from './assets/icon-clock.svg';
import { Comp as IconDefiMode } from './assets/icon-defimode.svg';
import { Comp as IconMenu } from './assets/icon-menu.svg';
import { Comp as IconPos } from './assets/icon-pos.svg';
import { Comp as IconSOFA } from './assets/icon-sofa.svg';
import { Comp as IconUsers } from './assets/icon-users.svg';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'Header');

declare const winScale: Global['winScale'];

interface MenuItem {
  path: string;
  type?: 1 | 2;
  target?: string;
  icon?: ReactNode;
  children?: MenuItem[];

  label(t: TFunction): ReactNode;
  desc?(t: TFunction): ReactNode;
  group?(t: TFunction): string;

  hide?(): boolean;
}

const allMenuItems = (project: ProjectType): MenuItem[] => {
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
  return [
    {
      label: (t: TFunction) => t('Trade'),
      path: '',
      children: [
        {
          icon: <IconDefiMode />,
          group: (t: TFunction) => t({ enUS: 'DeFi Mode', zhCN: 'DeFi Mode' }),
          label: (t: TFunction) => t({ enUS: 'DeFi Mode', zhCN: 'DeFi Mode' }),
          desc: (t: TFunction) =>
            t({
              enUS: 'Yield earning made easy.  Discover the best solutions for you!',
              zhCN: '轻松赚取收益，发现最适合您的解决方案！',
            }),
          path: '/products',
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
          path: EnvLinks.config.VITE_EARN_LINK,
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
          path: EnvLinks.config.VITE_SURGE_LINK,
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
          path: '/positions',
        },
      ],
    },
    {
      label: (t: TFunction) => ProjectTypeRefs[ProjectType.Automator].label(t),
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
          path: '/transactions',
        },
      ],
    },
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
          path: '/points',
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
    campaign,
  ];
};

function useOpacity() {
  const location = useLocation();
  const disableOpacityChange = useMemo(
    () => /strengths|faq/i.test(location.pathname),
    [location.pathname],
  );

  const position = useScroll(
    () => document.getElementById('root'),
    () => !disableOpacityChange,
  );
  const opacity = useMemo(() => {
    const scrollLen = /^\/$/i.test(location.pathname)
      ? window.innerHeight * 4
      : /products\/customize/i.test(location.pathname)
        ? 100 / winScale
        : 140 / winScale;
    return !position?.top ? 0 : Math.min(1, position.top / scrollLen);
  }, [location.pathname, position?.top]);

  return disableOpacityChange ? 1 : opacity;
}

const Header = () => {
  const [t] = useTranslation('Header');
  const navigate = useNavigate();
  const location = useLocation();
  const [project] = useProjectChange(ProjectType.Surge);

  const opacity = useOpacity();

  const menusForRender = useMemo(() => allMenuItems(project), [project]);

  const more = useMemo(() => true, []);

  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setExpanded(false);
  }, [location.pathname]);

  return (
    <header
      className={classNames(styles['header'], {
        [styles['expanded']]: expanded,
      })}
      id="header"
    >
      <div className={styles['bg']} style={{ opacity }} />
      <nav className={styles['left']}>
        <div className={styles['logo-wrapper']}>
          <Logo className={styles['logo']} onClick={() => navigate('/')} />
          <IconMenu
            className={styles['icon-menu']}
            onClick={() => setExpanded((pre) => !pre)}
          />
        </div>

        {menusForRender.map((it) => {
          if (it.hide?.()) return <Fragment key={it.path} />;
          if (it.path && !it.path.startsWith('http')) {
            return (
              <NavLink
                key={it.path}
                to={joinUrl(it.path, location.search)}
                className={classNames(styles['link'], {
                  [styles['active']]:
                    it.path === '/'
                      ? it.path === location.pathname
                      : location.pathname.startsWith(
                          it.path.replace(/\?.*$/, ''),
                        ),
                })}
              >
                {it.label(t)}
                {it.icon ? (
                  <span className={styles[`${it.icon}-icon`]} />
                ) : undefined}
              </NavLink>
            );
          }
          if (!it.children) {
            return (
              <a
                key={it.path}
                href={joinUrl(it.path, `?project=${project}`)}
                className={classNames(styles['link'])}
                target={
                  Env.isMetaMaskAndroid ||
                  (Env.isTelegram &&
                    it.path.includes('sofa.org') &&
                    !it.path.includes('docs.sofa.org'))
                    ? undefined
                    : it.target
                }
                rel="noopener noreferrer"
              >
                {it.label(t)}
                {it.icon ? (
                  <span
                    className={classNames(
                      styles[`${it.icon}-icon`],
                      `${it.icon}-icon`,
                    )}
                  />
                ) : undefined}
              </a>
            );
          }
          const groups = it.children.reduce(
            (pre, it) => {
              const group = String(it.group?.(t));
              if (!pre[group]) pre[group] = [];
              pre[group].push(it);
              return pre;
            },
            {} as Record<string, MenuItem[]>,
          );
          return (
            <Dropdown
              key={it.path}
              trigger={Env.isMobile || Env.isTelegram ? 'click' : 'hover'}
              className={classNames(styles['nav-selector'], 'semi-always-dark')}
              position={'bottomLeft'}
              render={
                <Dropdown.Menu className={styles['nav-selector-items']}>
                  {Object.entries(groups).map(([group, children], _, arr) => {
                    return (
                      <>
                        {arr.length > 1 && (
                          <Dropdown.Title>{group}</Dropdown.Title>
                        )}
                        {children.map((m) => {
                          if (it.hide?.()) return <Fragment key={it.path} />;
                          return (
                            <Dropdown.Item
                              key={m.path}
                              className={classNames(
                                styles['nav-selector-item'],
                              )}
                              onClick={() => {
                                window.location.href = m.path;
                              }}
                            >
                              <span className="semi-select-option-text">
                                {m.icon && (
                                  <span
                                    className={classNames(
                                      styles[`icon`],
                                      `icon`,
                                    )}
                                  >
                                    {m.icon}
                                  </span>
                                )}
                                <span className={styles['txt']}>
                                  <span className={styles['txt-label']}>
                                    {m.label(t)}
                                  </span>
                                  <span className={styles['txt-desc']}>
                                    {m.desc?.(t)}
                                  </span>
                                </span>
                              </span>
                            </Dropdown.Item>
                          );
                        })}
                      </>
                    );
                  })}
                </Dropdown.Menu>
              }
            >
              <a
                className={classNames(styles['link'])}
                href={it.path}
                onClick={(e) => !it.path && e.preventDefault()}
              >
                {it.label(t)}
                {it.icon && (
                  <span
                    className={classNames(
                      styles[`${it.icon}-icon`],
                      `${it.icon}-icon`,
                    )}
                  />
                )}
              </a>
            </Dropdown>
          );
        })}
      </nav>
      <aside className={styles['right']}>
        <LangSelector className={styles['lang-selector']} />
        {more && (
          <div className={styles['wallet']}>
            <NetworkSelector />
            <WalletConnector />
          </div>
        )}
        {more && <TimezoneSelector />}
        {more && <IndexPrices />}
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
      </aside>
    </header>
  );
};

export default Header;
