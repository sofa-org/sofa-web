import { useEffect, useMemo, useRef } from 'react';
import { wait } from '@livelybone/promise-wait';
import { AutomatorService } from '@sofa/services/automator';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { amountFormatter, cvtAmountsInCcy } from '@sofa/utils/amount';

import AmountInput from '@/components/AmountInput';
import { useIndexPrices } from '@/components/IndexPrices/store';
import { useWalletStore } from '@/components/WalletConnector/store';
import { AutomatorProgress } from '@/pages/products/components/AutomatorProgress';
import { BaseInvestButton } from '@/pages/products/components/InvestButton';
import { ProgressRef } from '@/pages/products/components/InvestProgress';

import { useAutomatorStore } from '../../store';

import styles from './index.module.scss';

export interface AutomatorDepositProps {
  vault?: AutomatorVaultInfo;
  onSuccess?(): void;
}

export const AutomatorDeposit = (props: AutomatorDepositProps) => {
  const [t] = useTranslation('Automator');
  const address = useWalletStore((state) => state.address);

  const prices = useIndexPrices((s) => s.prices);

  const vault = props.vault;
  const depositCcy = vault?.depositCcy || 'USDT';

  const wallet = useWalletStore();
  useEffect(() => {
    if (vault) {
      useWalletStore.updateBalanceByAutomatorVault(vault);
    }
  }, [vault, address]);

  const balance = wallet.balance?.[depositCcy];

  const depositData = useAutomatorStore(
    (state) =>
      vault &&
      state.depositData[
        `${vault.chainId}-${vault.vault.toLowerCase()}-${wallet.address}`
      ],
  );
  const overview = useAutomatorStore(
    (state) =>
      vault &&
      state.vaultOverviews[`${vault.chainId}-${vault.vault.toLowerCase()}-`],
  );

  const convertedShare = useMemo(() => {
    if (!vault || !depositData?.amount || !overview?.nav) return undefined;
    return (
      cvtAmountsInCcy(
        [[vault.depositCcy, Number(depositData.amount)]],
        prices,
        vault.vaultDepositCcy,
      ) / Number(overview.nav)
    );
  }, [depositData?.amount, overview?.nav, prices, vault]);

  const progressRef = useRef<ProgressRef>(null);

  return (
    <div className={styles['deposit']}>
      <div className={styles['form-item']}>
        <div className={styles['label']}>
          {t({ enUS: 'Mint Amount', zhCN: '铸造金额' })}
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
            disabledUnlessWalletConnected
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
      <div className={styles['nav']}>
        1<span className={styles['unit']}>{vault?.positionCcy}</span> ≈{' '}
        {!vault
          ? '-'
          : amountFormatter(
              cvtAmountsInCcy(
                [[vault?.vaultDepositCcy, Number(overview?.nav)]],
                prices,
                vault?.depositCcy,
              ),
            )}
        <span className={styles['unit']}>{vault?.depositCcy}</span>
      </div>
      <div className={styles['buttons']}>
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
              (it) => {
                progressRef.current?.update(it);
                if (it.status === 'Success') {
                  props.onSuccess?.();
                }
              },
              vault,
              depositData.amount,
            );
          }}
        >
          {t({ enUS: 'Mint', zhCN: '铸造' })} {props.vault?.positionCcy}
          {!!convertedShare && (
            <span className={styles['converted-share']}>
              (≈ {amountFormatter(convertedShare, 2)}{' '}
              <span className={styles['unit']}>{props.vault?.positionCcy}</span>
              )
            </span>
          )}
        </BaseInvestButton>
      </div>
      <AutomatorProgress
        chainId={wallet.chainId}
        vault={vault?.vault || ''}
        ref={progressRef}
      />
    </div>
  );
};
