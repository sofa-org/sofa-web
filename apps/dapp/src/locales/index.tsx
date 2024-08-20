/* eslint-disable react-refresh/only-export-components */
import { ComponentType } from 'react';
import {
  initReactI18next,
  useTranslation as useTranslation_,
} from 'react-i18next';
import { Env } from '@sofa/utils/env';
import classNames from 'classnames';
import i18next from 'i18next';

import { Comp as IconI18n } from '@/assets/icon-i18n.svg';
import { CSelect } from '@/components/CSelect';

import styles from './index.module.scss';

/*
  - de-DE Deutsch 德国 - 德国
  - en-US English 英语 - 美国
  - es-MX Espanol(Europa) 西班牙 - 墨西哥
  - es-ES Español(Latinoamérica) 西班牙 - 西班牙
  - fr-FR Français 法国 - 法国
  - it-IT Italiano 意大利 -意大利
  - pt-BR Portugués(Brasil) 葡萄牙 - 巴西
  - vi-VN Tiếng Việt 越南 - 越南
  - ru-RU Русский 俄国 -俄国
  - ar-DZ العربية 阿拉伯语 -阿尔及利亚
  - ko-KR 한국어 韩国 -韩国
  */
const langs: Record<
  string,
  {
    name: string;
    icon?: ComponentType;
    resource(): Promise<{ default: Record<string, unknown> }>;
    _resource?: Record<string, unknown>;
  }
> = Env.isDaily
  ? {
      // 测试版语言
      'en-US': {
        name: 'English',
        resource: () => import('./en-US'),
      },
      'zh-CN': {
        name: '简体中文',
        resource: () => import('./zh-CN'),
      },
      'zh-HK': {
        name: '繁體中文 (香港)',
        resource: () => import('./zh-HK'),
      },
      'zh-TW': {
        name: '繁體中文 (台灣)',
        resource: () => import('./zh-TW'),
      },
      'ru-RU': {
        name: 'Русский',
        resource: () => import('./ru-RU'),
      },
      'ja-JP': {
        name: '日本語',
        resource: () => import('./ja-JP'),
      },
    }
  : {
      // 正式版语言
      'en-US': {
        name: 'English',
        resource: () => import('./en-US'),
      },
      'zh-CN': {
        name: '简体中文',
        resource: () => import('./zh-CN'),
      },
    };

export const LangStorage = {
  key: Env.isDaily ? 'lang-test' : 'lang',
  get: () => {
    const cookies = Object.fromEntries(
      document.cookie.split(/;\s*/).map((it) => it.split('=').slice(0, 2)),
    );
    return cookies[LangStorage.key]
      ? decodeURIComponent(cookies[LangStorage.key])
      : undefined;
  },
  set: (val?: string) => {
    // 测试网用二级域名，正式网用根域名
    const rootOrigin = window.location.origin.match(
      Env.isDaily
        ? /(([^./:]+\.)?([^./:]+\.)?[^./:]+)(?=$|:\d+)/
        : /(([^./:]+\.)?[^./:]+)(?=$|:\d+)/,
    )?.[1];
    if (!rootOrigin) return;
    const v = encodeURIComponent(val || '');
    document.cookie = `${LangStorage.key}=${v}; domain=${rootOrigin}; path=/`;
  },
};

// ----------- load resource
export async function loadI18nResource(lang: string) {
  if (!langs[lang]) {
    lang = 'en-US';
  }
  if (!langs[lang]._resource) {
    langs[lang]._resource = await langs[lang]
      .resource()
      .then((res) => res.default);
    i18next.addResourceBundle(lang, 'global', langs[lang]._resource);
  }
}

const langOptions = Object.entries(langs).map(([value, { name: label }]) => ({
  label,
  value,
}));

const initialized = { curr: null as null | Promise<unknown> };
export function initI18n() {
  if (initialized.curr) return initialized.curr;
  initialized.curr = i18next
    .use(initReactI18next)
    .init({
      resources: {},
      lng: LangStorage.get() || 'en-US',
      ns: ['global'],
      defaultNS: 'global',
      fallbackNS: 'global',
      fallbackLng: /^(zh-TW|zh-HK)/i.test(LangStorage.get() || '')
        ? ['zh-CN', 'en-US']
        : 'en-US',
      interpolation: { escapeValue: false },
    })
    .then(() => loadI18nResource(i18next.language));
  return initialized.curr;
}

export async function addI18nResources(
  resources: Record<string, Record<string, unknown>>,
  ns: string,
  deep = true,
  overwrite?: boolean,
) {
  await initI18n();
  Object.entries(resources).forEach(([lang, resource]) => {
    i18next.addResourceBundle(lang, ns, resource, deep, overwrite);
  });
}

export const LangSelector = ({
  color,
  showLocale,
  className,
}: {
  color?: string;
  showLocale?: boolean;
  className?: string;
}) => {
  const [, inst] = useTranslation_();

  return (
    <CSelect
      className={classNames(styles['lang-selector'], className)}
      value={inst.language}
      optionList={langOptions}
      onChange={async (v) => {
        await loadI18nResource(v as string);
        inst.changeLanguage(v as string);
        LangStorage.set(v as string);
      }}
      renderSelectedItem={() => (
        <>
          <IconI18n color={color || '#fff'} />
          {showLocale ? (
            <span className={styles['current-locale']}>
              {langs[inst.language].name || inst.language}
            </span>
          ) : undefined}
        </>
      )}
    />
  );
};
