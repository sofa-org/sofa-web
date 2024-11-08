import { TFunction } from '@sofa/services/i18n';

import { Comp as LogoDiscord } from './assets/logo-discord.svg';
import { Comp as LogoLinkedIn } from './assets/logo-linkedin.svg';
import LogoMedium from './assets/logo-medium.png';
import { Comp as LogoSofa } from './assets/logo-sofa.svg';
import { Comp as LogoTelegram } from './assets/logo-telegram.svg';
import { Comp as LogoTwitter } from './assets/logo-twitter.svg';

export const Twitter = {
  name: (t: TFunction) => t('Twitter'),
  icon: <LogoTwitter />,
  link: 'https://x.com/SOFAorgDAO',
};

export const Discord = {
  name: (t: TFunction) => t('Discord'),
  icon: <LogoDiscord />,
  link: 'https://discord.gg/sofaorg',
};

export const Telegram = {
  name: (t: TFunction) => t('Telegram'),
  icon: <LogoTelegram />,
  link: 'https://t.me/SOFAorg',
};

export const Medium = {
  name: (t: TFunction) => t('Medium'),
  icon: <img src={LogoMedium} alt="" />,
  link: 'https://medium.com/sofaorg',
};

export const Blog = {
  name: (t: TFunction) => t({ enUS: 'Blog', zhCN: '博客' }),
  icon: <img src={LogoMedium} alt="" />,
  link: 'https://blog.sofa.org',
};

export const Sofa = {
  name: (t: TFunction) => 'SOFA.org',
  icon: <LogoSofa />,
  link: 'https://sofa.org/',
};

export const LinkedIn = {
  name: (t: TFunction) => t('LinkedIn'),
  icon: <LogoLinkedIn />,
  link: 'https://www.linkedin.com/company/sofa-org/',
};

export const LinkItems = [Twitter, Discord, Telegram, Blog];
