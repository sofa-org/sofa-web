import { TFunction, useTranslation } from '@sofa/services/i18n';
import { useQuery } from '@sofa/utils/hooks';

import AsyncButton from '@/components/AsyncButton';
import { EnvLinks } from '@/env-links';
import { addI18nResources } from '@/locales';

import { useAutomatorStore } from '../../automator/store';
import { useAutomatorMarketSelector } from '../../automator-market/hooks';
import locale from '../locale';

import styles from './index.module.scss';

addI18nResources(locale, 'AutomatorOperate');

const Share = () => {
  const [t] = useTranslation('AutomatorOperate');
  const { automator } = useAutomatorMarketSelector({
    queryName: 'v',
  });
  const automatorDetail = useAutomatorStore(
    (state) =>
      automator &&
      state.vaultDetails[
        `${automator.chainId}-${automator.vault.toLowerCase()}-`
      ],
  );
  return (
    <div className={styles['automator-share-page']}>
      <AsyncButton
        className={styles['btn-deposit']}
        onClick={() => {
          if (!automator) return;
          window.location.href =
            EnvLinks.config.VITE_AUTOMATOR_LINK +
            (EnvLinks.config.VITE_AUTOMATOR_LINK.includes('?') ? '&' : '?') +
            `automator-vault=${automator.vault}&automator-trade-tab=deposit`;
        }}
      >
        {t({ enUS: 'Mint Now', zhCN: '现在铸造' })}
      </AsyncButton>
      TODO: 分享出来的页面:
      {automator?.name}
      {automator?.vault}
    </div>
  );
};

export default Share;
