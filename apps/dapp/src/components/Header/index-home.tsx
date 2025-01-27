import { Fragment, useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Dropdown } from '@douyinfe/semi-ui';
import { ProjectType } from '@sofa/services/base-type.ts';
import { TFunction, useTranslation } from '@sofa/services/i18n';
import { Env } from '@sofa/utils/env';
import { joinUrl } from '@sofa/utils/url';
import { useScroll, useSize } from 'ahooks';
import classNames from 'classnames';

import { Comp as Logo } from '@/assets/logo';
import { EnvLinks } from '@/env-links';
import { addI18nResources, LangSelector } from '@/locales';

import { GlobalTips } from '../GlobalTips';
import IndexPrices from '../IndexPrices';
import LaunchApp from '../LaunchApp';
import { useIsMobileUI } from '../MobileOnly';
import NetworkSelector from '../NetworkSelector';
import { useProjectChange } from '../ProductSelector';
import TimezoneSelector from '../TimezoneSelector';
import WalletConnector from '../WalletConnector';

import { Comp as IconMenu } from './assets/icon-menu.svg';
import locale from './locale';
import { MenuItem, useMobileHeaderState } from './store';

import styles from './index.module.scss';

addI18nResources(locale, 'Header');

declare const winScale: Global['winScale'];

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
    // icon: 'battle-tower',
    type: 2 as const,
    path: EnvLinks.config.VITE_CAMPAIGN_LINK,
    hide: () => Env.isTelegram,
  };
  return markSelectedMenuItems(
    [
      { label: (t: TFunction) => t('home'), path: '/', type: 1 },
      { label: (t: TFunction) => t('Project'), path: '/mechanism', type: 1 },
      {
        label: (t: TFunction) => t('Capabilities'),
        path: '/strengths',
        type: 1,
      },
      { label: (t: TFunction) => t('RCH'), path: '/rch', type: 1 },
      { ...campaign, type: 1 },
      {
        label: (t: TFunction) => t({ enUS: 'Points', zhCN: '积分' }),
        path: '/points',
        type: 1,
      },
      {
        label: (t: TFunction) => t('Docs'),
        path: 'https://docs.sofa.org',
        type: 1,
        target: '_blank',
      },
      {
        label: (t: TFunction) => t({ enUS: 'Blog', zhCN: '博客' }),
        path: 'https://blog.sofa.org/',
        type: 1,
        target: '_blank',
      },
      {
        label: (t: TFunction) =>
          t({ enUS: 'Ambassador Program', zhCN: '宣传大使项目' }),
        path: 'https://blog.sofa.org/ambassador/',
        type: 1,
        target: '_blank',
      },
    ],
    location,
  );
};

function locationMatches(
  item: MenuItem,
  location: ReturnType<typeof useLocation>,
) {
  if (!item.path.replace(/^\/+/, '') && location.pathname !== '/') return false;
  const [, origin = '', path = '', search = '', hash = ''] =
    item.path.match(/^(https?:\/\/[^/]+)?([^#?]+)?([^#]+)?(.*)?$/) || [];

  if (origin && window.location.origin !== origin) return false;
  if (!location.pathname.includes(path)) return false;
  if (search.split(/[?&]/).some((it) => !location.search.includes(it)))
    return false;
  return location.hash === hash;
  // let itemPath =
  //   (item.path && item.path.replace(/\?.*/, '').replace(/(^\/+|\/+$)/g, '')) ||
  //   '';
  // if (!/^\w+:/.test(itemPath)) {
  //   if (itemPath) {
  //     itemPath = window.location.origin + '/' + itemPath;
  //   } else {
  //     itemPath = window.location.origin;
  //   }
  // }
  // const itemSearch =
  //   (item.path && /\?/.test(item.path) && item.path.replace(/^.*\?/, '')) || '';
  // const locationPath = (window.location.origin + location.pathname).replace(
  //   /\/+$/g,
  //   '',
  // );
  // return !!(
  //   itemPath == locationPath &&
  //   (!itemSearch || location.search.includes(itemSearch)) &&
  //   (itemSearch ||
  //     // this is to differentiate:
  //     // Automator: /products?project=Automator
  //     // Trade - Core Mode: /products
  //     !/project=/.test(location.search))
  // );
}

export function markSelectedMenuItems(
  items: MenuItem[],
  location: ReturnType<typeof useLocation>,
): MenuItem[] {
  for (const item of items) {
    let selected = locationMatches(item, location);
    if (item.children) {
      markSelectedMenuItems(item.children, location);
      // if any of my children is selected, the parent menu item is selected
      if (!selected && item.children?.filter((c) => c.active)?.length) {
        selected = true;
      }
    }
    item.active = selected;
  }
  return items;
}
export function useHeaderOpacity() {
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
export const RenderMenu = (it: MenuItem) => {
  const [t] = useTranslation('Header');
  const navigate = useNavigate();
  const isMobileUI = useIsMobileUI();
  const { selectedMenuItem, setSelectedMenuItem } = useMobileHeaderState();
  if (it.hide?.()) return <Fragment />;
  if (!it.children?.length && it.path && !it.path.startsWith('http')) {
    return (
      <NavLink
        to={joinUrl(it.path, location.search)}
        className={classNames(styles['link'], 'link', {
          [styles['active']]: it.active,
          ['active']: it.active,
        })}
      >
        {it.label(t)}
        {it.icon ? <span className={styles[`${it.icon}-icon`]} /> : undefined}
      </NavLink>
    );
  }
  if (!it.children?.length) {
    return (
      <a
        href={joinUrl(it.path, location.search)}
        className={classNames(styles['link'], 'link', {
          [styles['active']]: it.active,
          ['active']: it.active,
        })}
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
            className={classNames(styles[`${it.icon}-icon`], `${it.icon}-icon`)}
          />
        ) : undefined}
      </a>
    );
  }
  const groups = it.children.reduce(
    (pre, it) => {
      if (it.hide?.()) return pre;
      const group = String(it.group?.(t));
      if (!pre[group]) pre[group] = [];
      pre[group].push(it);
      return pre;
    },
    {} as Record<string, MenuItem[]>,
  );
  return (
    <Dropdown
      trigger={Env.isMobile || Env.isTelegram ? 'click' : 'hover'}
      className={classNames(
        styles['nav-selector'],
        'nav-selector',
        'header-menu',
        'semi-always-dark',
      )}
      position={'bottomLeft'}
      getPopupContainer={() => {
        // b.c. we are no longer using body as popup container
        // due to semi Dropdown implementation, we need to set a minus top for the menu container
        const root = document.querySelector<HTMLDivElement>('#root');
        document.documentElement.style.setProperty(
          '--header-menu-container-margin-top',
          (root ? -root.scrollTop : 0) + 'px',
        );
        const res = document.querySelector<HTMLDivElement>(
          '#header-menu-container',
        )!;
        return res;
      }}
      onVisibleChange={(v) => {
        if (v) {
          setSelectedMenuItem(it);
        } else {
          if (it == selectedMenuItem) {
            setSelectedMenuItem(undefined);
          }
        }
      }}
      clickToHide
      render={
        <Dropdown.Menu className={styles['nav-selector-items']}>
          {Object.entries(groups).map(([group, children], _, arr) => {
            return (
              <Fragment key={group}>
                {arr.length > 1 && <Dropdown.Title>{group}</Dropdown.Title>}
                {children.map((m) => {
                  if (it.hide?.()) return <Fragment key={m.path} />;
                  return (
                    <Dropdown.Item
                      key={m.path}
                      className={classNames(
                        styles['nav-selector-item'],
                        'nav-selector-item',
                        {
                          [styles['active']]: m.active,
                          ['active']: m.active,
                        },
                      )}
                      onClick={() => {
                        const path = joinUrl(location.search, m.path);
                        if (path.startsWith('http'))
                          window.location.href = path;
                        else navigate(path);
                      }}
                    >
                      <span className="semi-select-option-text">
                        {m.icon && (
                          <span className={classNames(styles[`icon`], `icon`)}>
                            {m.icon}
                          </span>
                        )}
                        <span className={styles['txt']}>
                          <span
                            className={classNames(
                              styles['txt-label'],
                              'txt-label',
                            )}
                          >
                            {m.label(t)}
                          </span>
                          <span
                            className={classNames(
                              styles['txt-desc'],
                              'txt-desc',
                            )}
                          >
                            {m.desc?.(t)}
                          </span>
                        </span>
                      </span>
                    </Dropdown.Item>
                  );
                })}
              </Fragment>
            );
          })}
        </Dropdown.Menu>
      }
    >
      <a
        className={classNames(styles['link'], 'link', {
          [styles['active']]: it.active,
          ['active']: it.active,
          [styles['selected']]: selectedMenuItem == it,
          ['selected']: selectedMenuItem == it,
        })}
        href={it.path}
        onClick={(e) => {
          if (!it.path || (it.children?.length && isMobileUI)) {
            e.preventDefault();
          }
        }}
      >
        {it.label(t)}
        {it.icon && (
          <span
            className={classNames(styles[`${it.icon}-icon`], `${it.icon}-icon`)}
          />
        )}
      </a>
    </Dropdown>
  );
};

export function useHeaderHeight() {
  const size = useSize(() => document.getElementById('header'));
  return size?.height || 48;
}

export const CommonHeader = (props: {
  aside?: React.ReactNode;
  menus: (
    project: ProjectType,
    location: ReturnType<typeof useLocation>,
  ) => MenuItem[];
  moreIcons?: boolean;
  indexPrices?: boolean;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [project] = useProjectChange(ProjectType.Surge);
  const more = props.moreIcons;
  const opacity = useHeaderOpacity();
  const isMobile = useIsMobileUI();
  const { headerHidden } = useMobileHeaderState();
  const menusForRender = useMemo(
    () => props.menus(project, location),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project, location, props.menus],
  );

  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setExpanded(false);
  }, [location.pathname]);

  return (
    <>
      <header
        className={classNames(styles['header'], 'header', {
          [styles['expanded']]: expanded,
          ['expanded']: expanded,
        })}
        id="header"
        style={{
          visibility: isMobile && headerHidden ? 'hidden' : undefined,
        }}
      >
        <GlobalTips />
        <div className={styles['bg']} style={{ opacity }} />
        <div className={classNames(styles['menu'], 'menu')}>
          <div className={styles['expanded-bg']} />
          <nav className={styles['left']}>
            <div className={classNames(styles['logo-wrapper'], 'logo-wrapper')}>
              {' '}
              <Logo className={styles['logo']} onClick={() => navigate('/')} />
              <IconMenu
                className={styles['icon-menu']}
                onClick={() => setExpanded((pre) => !pre)}
              />
            </div>

            {menusForRender.map((it, i) => {
              if (it.hide?.()) return <Fragment key={i} />;
              return <RenderMenu {...it} key={i} />;
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
            {props.aside}
          </aside>
        </div>
        {more && props.indexPrices !== false && (
          <IndexPrices className={styles['index-prices']} />
        )}
      </header>
      <div
        id="header-menu-container"
        style={{
          visibility: isMobile && headerHidden ? 'hidden' : undefined,
        }}
      />
    </>
  );
};

export const HomeHeader = () => {
  const location = useLocation();
  const more = useMemo(
    () => /rch|points/.test(location.pathname),
    [location.pathname],
  );
  return (
    <CommonHeader
      aside={
        <>
          <LaunchApp />
        </>
      }
      menus={allMenuItems}
      moreIcons={more}
    />
  );
};
