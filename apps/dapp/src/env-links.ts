import { Env } from '@sofa/utils/env';

export class EnvLinks {
  private static _config: {
    VITE_SOFA_LINK: string;
    VITE_RCH_LINK: string;
    VITE_EARN_LINK: string;
    VITE_SURGE_LINK: string;
    VITE_AUTOMATOR_LINK: string;
    VITE_CAMPAIGN_LINK: string;
  };

  static get config() {
    if (!EnvLinks._config) {
      EnvLinks._config = Env.isTelegram
        ? {
            VITE_SOFA_LINK: '/',
            VITE_RCH_LINK: '/rch',
            VITE_EARN_LINK: '/products?project=PROTECTED',
            VITE_SURGE_LINK: '/products?project=RISKY',
            VITE_AUTOMATOR_LINK: '/products?project=Automator',
            VITE_CAMPAIGN_LINK: Env.isDaily
              ? 'https://t.me/SOFADAppTestBot/campaign'
              : 'https://t.me/SOFADAppBot/campaign',
          }
        : {
            VITE_SOFA_LINK: import.meta.env.VITE_SOFA_LINK,
            VITE_RCH_LINK: import.meta.env.VITE_RCH_LINK,
            VITE_EARN_LINK: import.meta.env.VITE_EARN_LINK,
            VITE_SURGE_LINK: import.meta.env.VITE_SURGE_LINK,
            VITE_AUTOMATOR_LINK: import.meta.env.VITE_AUTOMATOR_LINK,
            VITE_CAMPAIGN_LINK: import.meta.env.VITE_CAMPAIGN_LINK,
          };
    }
    return EnvLinks._config;
  }
}
