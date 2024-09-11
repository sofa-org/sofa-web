import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Dropdown } from '@douyinfe/semi-ui';
import { TFunction, useTranslation } from '@sofa/services/i18n';
import { Env } from '@sofa/utils/env';
import { joinUrl } from '@sofa/utils/url';
import { useScroll } from 'ahooks';
import classNames from 'classnames';

import { Comp as Logo } from '@/assets/logo';
import { addI18nResources, LangSelector } from '@/locales';

import Community from '../Community';
import IndexPrices from '../IndexPrices';
import LaunchApp from '../LaunchApp';
import NetworkSelector from '../NetworkSelector';
import { ProjectSelector } from '../ProductSelector';
import TimezoneSelector from '../TimezoneSelector';
import WalletConnector from '../WalletConnector';

import { Comp as IconMenu } from './assets/icon-menu.svg';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'Header');

declare const winScale: Global['winScale'];

function getCampaignStatus(location: { pathname: string }) {
  const isFest = location.pathname == '/fest-competition';
  const isBtcAdventure = /\/btc-adventure/i.test(location.pathname);
  const isCelebrity = /\/rch-celebrity/i.test(location.pathname);
  const isCampaign = isFest || isBtcAdventure || isCelebrity;
  return {
    isFest,
    isBtcAdventure,
    isCampaign,
    isCelebrity,
  };
}

const campaignMenuItems = (location: ReturnType<typeof useLocation>) => {
  // 下面这行被注释掉的code 告诉 ai18n 下面的 t 都是在 Header 包下
  // const [t] = useTranslation('Header');
  const campaign = getCampaignStatus(location);
  return [
    {
      label: (t: TFunction) => t('Competition & Claim Prize'),
      path: joinUrl(
        import.meta.env.VITE_CAMPAIGN_LINK,
        '/fest-competition',
      ).replace(window.location.origin, ''),
      target: '_top',
      active: campaign.isFest,
      noNavLinkWrap: true,
    },
    {
      label: (t: TFunction) =>
        t({
          enUS: 'RCH Celebrity',
          zhCN: 'RCH 名人堂',
        }),
      path: joinUrl(
        import.meta.env.VITE_CAMPAIGN_LINK,
        '/rch-celebrity',
      ).replace(window.location.origin, ''),
      target: '_top',
      noNavLinkWrap: true,
      newIcon: true,
      active: campaign.isCelebrity,
    },
    {
      label: (t: TFunction) =>
        t({
          enUS: 'RCH Game Center',
          zhCN: 'RCH 游戏中心',
        }),
      path: joinUrl(
        import.meta.env.VITE_CAMPAIGN_LINK,
        '/rch-game-center/btc-adventure',
      ).replace(window.location.origin, ''),
      target: '_top',
      noNavLinkWrap: true,
      active: campaign.isBtcAdventure,
    },
  ];
};

const allMenuItems = (location: ReturnType<typeof useLocation>) => {
  // 下面这行被注释掉的code 告诉 ai18n 下面的 t 都是在 Header 包下
  // const [t] = useTranslation('Header');
  const campaign = getCampaignStatus(location);
  return [
    { label: (t: TFunction) => t('home'), path: '/', type: 1 },
    { label: (t: TFunction) => t('Project'), path: '/mechanism', type: 1 },
    { label: (t: TFunction) => t('Capabilities'), path: '/strengths', type: 1 },
    { label: (t: TFunction) => t('RCH'), path: '/rch', type: 1 },
    {
      label: (t: TFunction) => t('Docs'),
      path: 'https://docs.sofa.org',
      type: 1,
    },
    {
      label: (t: TFunction) => t('Trade'),
      path: joinUrl(
        campaign.isCampaign ? import.meta.env.VITE_SURGE_LINK : '/products',
        '/products',
      )
        .replace('/products', '')
        .replace(window.location.origin, ''),
      type: 2,
    },
    {
      label: (t: TFunction) => t('Position'),
      path: joinUrl(
        campaign.isCampaign ? import.meta.env.VITE_SURGE_LINK : '/products',
        '/positions',
      )
        .replace('/products', '')
        .replace(window.location.origin, ''),
      type: 2,
    },
    {
      label: (t: TFunction) =>
        t({
          enUS: 'Campaign',
          zhCN: '活动中心',
        }),
      path: '',
      target: '_top',
      noNavLinkWrap: true,
      isCampaignCSelect: true,
      active: campaign.isCampaign,
      newIcon: true,
      type: 2,
    },
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

  const opacity = useOpacity();

  const campaign = useMemo(() => getCampaignStatus(location), [location]);

  const type = useMemo<number>(() => {
    if (campaign.isCampaign) return 2;
    if (/^\/$|rch/.test(location.pathname)) return 1;
    return (
      allMenuItems(location).find(
        (it) => it.path !== '/' && location.pathname.startsWith(it.path),
      )?.type || 2
    );
  }, [location, campaign]);

  const menusForRender = useMemo(
    () => allMenuItems(location).filter((it) => it.type === type),
    [type, location],
  );

  const campaignMenus = useMemo(
    () => campaignMenuItems(location),
    [location, campaign],
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
        {campaign.isBtcAdventure ? undefined : (
          <>
            <div className={styles['logo-wrapper']}>
              {campaign.isFest ? (
                <Logo
                  className={styles['logo']}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = import.meta.env.VITE_SOFA_LINK;
                  }}
                />
              ) : type === 2 ? (
                <ProjectSelector className={styles['product-selector']} />
              ) : (
                <Logo
                  className={styles['logo']}
                  onClick={() => navigate('/')}
                />
              )}
              {
                <IconMenu
                  className={styles['icon-menu']}
                  onClick={() => setExpanded((pre) => !pre)}
                />
              }
            </div>

            {menusForRender.map((it) =>
              /^http/.test(it.path) ||
              it.noNavLinkWrap ||
              it.isCampaignCSelect ? (
                it.isCampaignCSelect ? (
                  <Dropdown
                    key={it.label(t)}
                    trigger={'hover'}
                    className={styles['nav-selector']}
                    position={'bottomLeft'}
                    render={
                      <Dropdown.Menu className={styles['nav-selector-items']}>
                        {campaignMenus.map((m) => {
                          const selected = m.active;

                          return (
                            <Dropdown.Item
                              key={m.path}
                              type={selected ? 'primary' : undefined}
                              className={classNames(
                                styles['nav-selector-item'],
                                selected
                                  ? 'semi-select-option-selected'
                                  : undefined,
                              )}
                              onClick={() => {
                                window.location.href = m.path;
                              }}
                            >
                              <span className="semi-select-option-text">
                                {m.label(t)}
                                {m.newIcon ? (
                                  <span
                                    className={classNames(
                                      styles['new-icon'],
                                      'new-icon',
                                    )}
                                  />
                                ) : undefined}
                              </span>
                            </Dropdown.Item>
                          );
                        })}
                      </Dropdown.Menu>
                    }
                  >
                    <a
                      key={it.label(t)}
                      className={classNames(
                        styles['link'],
                        it.active ? styles['active'] : undefined,
                      )}
                      onClick={(e) => e.preventDefault()}
                    >
                      {it.label(t)}
                      {it.newIcon ? (
                        <span
                          className={classNames(styles['new-icon'], 'new-icon')}
                        />
                      ) : undefined}
                    </a>
                  </Dropdown>
                ) : (
                  <a
                    key={it.label(t)}
                    href={it.path}
                    className={classNames(
                      styles['link'],
                      it.active ? styles['active'] : undefined,
                    )}
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
                    {it.newIcon ? (
                      <span
                        className={classNames(styles['new-icon'], 'new-icon')}
                      />
                    ) : undefined}
                  </a>
                )
              ) : (
                <NavLink
                  key={it.label(t)}
                  to={joinUrl(it.path, location.search)}
                  className={classNames(styles['link'], {
                    [styles['active']]:
                      it.path === '/'
                        ? it.path === location.pathname
                        : location.pathname.startsWith(it.path),
                  })}
                >
                  {it.label(t)}
                  {it.newIcon ? (
                    <span className={styles['new-icon']} />
                  ) : undefined}
                </NavLink>
              ),
            )}
          </>
        )}
      </nav>
      <aside className={styles['right']}>
        <LangSelector className={styles['lang-selector']} />
        {more && (
          <div className={styles['wallet']}>
            <NetworkSelector />
            <WalletConnector
              enableServerAuth={campaign.isBtcAdventure || campaign.isCelebrity}
            />
          </div>
        )}
        {more && <TimezoneSelector />}
        {more && !campaign.isCampaign && <IndexPrices />}
        {type === 1 && !campaign.isBtcAdventure && !campaign.isCelebrity && (
          <LaunchApp />
        )}
        {more && type === 2 && (
          <div className={styles['other-links']}>
            <a
              className={classNames(styles['btn-link'], 'btn-gradient', {
                [styles['active']]: location.pathname.startsWith('/rch'),
              })}
              href={import.meta.env.VITE_RCH_LINK}
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
