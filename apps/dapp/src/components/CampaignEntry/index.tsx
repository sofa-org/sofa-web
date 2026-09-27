import { useLocation } from 'react-router-dom';
import { ProjectType } from '@sofa/services/base-type';
import { CampaignService } from '@sofa/services/campaign';
import { joinUrl } from '@sofa/utils/url';
import { useRequest } from 'ahooks';
import classNames from 'classnames';

import { EnvLinks } from '@/env-links';

import { useProjectChange } from '../ProductSelector';
import { useWalletStore } from '../WalletConnector/store';

import styles from './index.module.scss';

const CampaignEntryEl = () => {
  const { address } = useWalletStore();
  const { data } = useRequest(
    async () =>
      !address ? { unDrawnTimes: 1 } : CampaignService.getLotteryInfo(address),
    { pollingInterval: 10000, refreshDeps: [address] },
  );

  const notify = !!data?.unDrawnTimes;

  return (
    <div className={styles['campaign-entry']}>
      <a
        className={classNames(styles['treasure'], {
          [styles['active']]: notify,
        })}
        href={joinUrl(EnvLinks.config.VITE_CAMPAIGN_LINK, '?open-wheel=1')}
      >
        <span />
      </a>
    </div>
  );
};

export const CampaignEntry = () => {
  const [project] = useProjectChange();
  const location = useLocation();
  if (
    project === ProjectType.Automator ||
    !['/products'].includes(location.pathname)
  ) {
    return <></>;
  }
  return <CampaignEntryEl />;
};
