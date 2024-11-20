import { useEffect, useRef } from 'react';
import { wait } from '@livelybone/promise-wait';
import { AutomatorService } from '@sofa/services/automator';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { amountFormatter } from '@sofa/utils/amount';

import AmountInput from '@/components/AmountInput';
import { useWalletStore } from '@/components/WalletConnector/store';
import { AutomatorProgress } from '@/pages/products/components/AutomatorProgress';
import { BaseInvestButton } from '@/pages/products/components/InvestButton';
import { ProgressRef } from '@/pages/products/components/InvestProgress';

import { useAutomatorStore } from '../../store';

import styles from './index.module.scss';

export interface AutomatorDepositProps {
  vault?: AutomatorVaultInfo;
}

export const AutomatorDeposit = (props: AutomatorDepositProps) => {
  const [t] = useTranslation('Automator');
  const vault = props.vault;
  const depositCcy = vault?.depositCcy || 'USDT';

  const wallet = useWalletStore();
  useEffect(() => {
    if (vault) {
      useWalletStore.updateBalanceByAutomatorVault(vault);
    }
  }, [vault]);

  const balance = wallet.balance?.[depositCcy];

  const depositData = useAutomatorStore(
    (state) =>
      vault &&
      state.depositData[`${vault.chainId}-${vault.vault}-${wallet.address}`],
  );

  const progressRef = useRef<ProgressRef>(null);

  return (
    <div className={styles['deposit']}>
      <div className={styles['form-item']}>
        <div className={styles['label']}>
          {t({ enUS: 'Deposit Amount', zhCN: '申购金额' })}
        </div>
        <div className={styles['input-wrapper']}>
          <AmountInput
            max={
              balance! > Number(vault?.depositMinAmount) ? balance : undefined
            }
            min={vault?.depositMinAmount}
            tick={vault?.depositTickAmount}
            value={depositData?.amount}
            onChange={(v) =>
              vault &&
              wallet.address &&
              useAutomatorStore.updateDepositData(
                vault,
                { amount: v },
                wallet.address,
              )
            }
            suffix={<span className={styles['suffix']}>{depositCcy}</span>}
          />
        </div>
        <div className={styles['balance']}>
          <span className={styles['label']}>
            {t({ enUS: 'Wallet Balance', zhCN: '钱包余额' })}
          </span>
          <span className={styles['value']}>
            {amountFormatter(wallet.balance?.[depositCcy], 2)} {depositCcy}
          </span>
        </div>
      </div>
      <BaseInvestButton
        className={styles['button']}
        preparing={!vault}
        prepareText={t({ enUS: 'No vault', zhCN: '未找到产品' })}
        insufficient={!!balance && balance < Number(depositData?.amount)}
        onSubmit={async () => {
          if (!vault) return;
          await wait(100);
          if (!depositData?.amount) throw new Error('Please input amount');
          return AutomatorService.deposit(
            (it) => progressRef.current?.update(it),
            vault,
            depositData.amount,
          );
        }}
      >
        {t({ enUS: 'Deposit', zhCN: '存入' })}
      </BaseInvestButton>
      <AutomatorProgress
        chainId={wallet.chainId}
        vault={vault?.vault || ''}
        ref={progressRef}
      />
    </div>
  );
};
