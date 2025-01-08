import { Spin } from '@douyinfe/semi-ui';

import CEmpty from '@/components/Empty';
import { PositionsEl } from '@/pages/positions';

import { useCreatorAutomatorSelector } from '../AutomatorSelector';

import styles from './index.module.scss';

export const AutomatorPositions = () => {
  const { automator } = useCreatorAutomatorSelector();
  return (
    <Spin wrapperClassName={styles['automator-position']} spinning={!automator}>
      {automator ? (
        <PositionsEl automator={automator?.vaultInfo} />
      ) : (
        <CEmpty className="semi-always-dark" />
      )}
    </Spin>
  );
};
