import { Fragment, useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Dropdown } from '@douyinfe/semi-ui';
import { RiskType } from '@sofa/services/base-type.ts';
import { TFunction, useTranslation } from '@sofa/services/i18n';
import { Env } from '@sofa/utils/env';
import { joinUrl } from '@sofa/utils/url';
import { useScroll } from 'ahooks';
import classNames from 'classnames';

import { Comp as Logo } from '@/assets/logo';
import { EnvLinks } from '@/env-links';
import { addI18nResources, LangSelector } from '@/locales';

import IndexPrices from '../IndexPrices';
import LaunchApp from '../LaunchApp';
import NetworkSelector from '../NetworkSelector';
import { ProjectSelector, useProjectChange } from '../ProductSelector';
import TimezoneSelector from '../TimezoneSelector';
import WalletConnector from '../WalletConnector';

import { Comp as IconMenu } from './assets/icon-menu.svg';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'Header');

declare const winScale: Global['winScale'];

interface MenuItem {
  path: string;
  type?: 1 | 2;
  target?: string;
  icon?: string;
  children?: MenuItem[];

  label(t: TFunction): string;

  hide?(): boolean;
}

const allMenuItems = (location: ReturnType<typeof useLocation>): MenuItem[] => {
  // 下面这行被注释掉的code 告诉 ai18n 下面的 t 都是在 Header 包下
  // const [t] = useTranslation('Header');
  const campaign = {
    label: (t: TFunction) =>
      t({
        enUS: 'Campaign',
        zhCN: '活动中心',
      }),
    target: '_top',
    // icon: 'battle-tower',
    type: 2 as const,
    path: EnvLinks.config.VITE_CAMPAIGN_LINK,
    hide: () => Env.isTelegram,
  };
  return [
    { label: (t: TFunction) => t('home'), path: '/', type: 1 },
    { label: (t: TFunction) => t('Project'), path: '/mechanism', type: 1 },
    { label: (t: TFunction) => t('Capabilities'), path: '/strengths', type: 1 },
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
    },
    {
      label: (t: TFunction) => t({ enUS: 'Blog', zhCN: '博客' }),
      path: 'https://blog.sofa.org/',
      type: 1,
    },
    {
      label: (t: TFunction) =>
        t({ enUS: 'Ambassador Program', zhCN: '宣传大使项目' }),
      path: 'https://blog.sofa.org/ambassador/',
      type: 1,
    },
    { label: (t: TFunction) => t('Trade'), path: '/products', type: 2 },
    { label: (t: TFunction) => t('Position'), path: '/positions', type: 2 },
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
  const [project] = useProjectChange(RiskType.RISKY);

  const opacity = useOpacity();

  const type = useMemo<number>(() => {
    if (/^\/$|rch/.test(location.pathname)) return 1;
    return (
      allMenuItems(location).find(
        (it) => it.path !== '/' && location.pathname.startsWith(it.path),
      )?.type ?? 2
    );
  }, [location]);

  const menusForRender = useMemo(
    () => allMenuItems(location).filter((it) => it.type === type),
    [type, location],
  );

  const more = useMemo(
    () => /rch|products|positions/.test(location.pathname) || type === 2,
    [location.pathname, type],
  );

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
          {type === 2 ? (
            <ProjectSelector className={styles['product-selector']} />
          ) : (
            <Logo className={styles['logo']} onClick={() => navigate('/')} />
          )}
          <IconMenu
            className={styles['icon-menu']}
            onClick={() => setExpanded((pre) => !pre)}
          />
        </div>

        {menusForRender.map((it) => {
          if (it.hide?.()) return <Fragment key={it.label(t)} />;
          if (it.path && !it.path.startsWith('http')) {
            return (
              <NavLink
                key={it.label(t)}
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
                key={it.label(t)}
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
          return (
            <Dropdown
              key={it.label(t)}
              trigger={Env.isMobile || Env.isTelegram ? 'click' : 'hover'}
              className={styles['nav-selector']}
              position={'bottomLeft'}
              render={
                <Dropdown.Menu className={styles['nav-selector-items']}>
                  {it.children.map((m) => {
                    if (it.hide?.()) return <Fragment key={it.path} />;
                    return (
                      <Dropdown.Item
                        key={m.path}
                        className={classNames(styles['nav-selector-item'])}
                        onClick={() => {
                          window.location.href = m.path;
                        }}
                      >
                        <span className="semi-select-option-text">
                          {m.label(t)}
                          {m.icon && (
                            <span
                              className={classNames(
                                styles[`${m.icon}-icon`],
                                `${m.icon}-icon`,
                              )}
                            />
                          )}
                        </span>
                      </Dropdown.Item>
                    );
                  })}
                </Dropdown.Menu>
              }
            >
              <a
                key={it.label(t)}
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
        {type === 1 && <LaunchApp />}
        {more && type === 2 && (
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
