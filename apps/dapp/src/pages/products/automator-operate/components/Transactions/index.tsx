import { AutomatorHistory } from '@/pages/history/automator';

import { useCreatorAutomatorSelector } from '../AutomatorSelector';

import styles from './index.module.scss';

export const AutomatorTransactions = () => {
  const { automator } = useCreatorAutomatorSelector();
  return (
    <AutomatorHistory
      className={styles['automator-transactions']}
      all
      automator={automator?.vaultInfo}
    />
  );
};
