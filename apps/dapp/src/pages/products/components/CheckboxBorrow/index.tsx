import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@douyinfe/semi-ui';
import { RiskType, VaultInfo } from '@sofa/services/base-type';
import { ContractsService } from '@sofa/services/contracts';
import { ProductsService } from '@sofa/services/products';
import { amountFormatter } from '@sofa/utils/amount';
import { useAsyncMemo } from '@sofa/utils/hooks';
import Big from 'big.js';
import classNames from 'classnames';
import { omit } from 'lodash-es';

import { addI18nResources } from '@/locales';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'CheckboxBorrow');

export interface CheckboxBorrowProps extends BaseProps {
  depositAmount?: string | number;
  borrowFee?: number;
  vault: VaultInfo;
  onChange(vault: VaultInfo): void;
}

export const CheckboxBorrow = (props: CheckboxBorrowProps) => {
  const [t] = useTranslation('CheckboxBorrow');
  const vaultOptions = useMemo(
    () =>
      ProductsService.filterVaults(
        ContractsService.vaults,
        omit(props.vault, ['abis', 'vault']),
      ),
    [props.vault],
  );
  const leverageVault = useMemo(
    () => vaultOptions.find((it) => it.riskType === RiskType.LEVERAGE),
    [vaultOptions],
  );
  const principal = useMemo(
    () => +Big(props.depositAmount || 0).minus(props.borrowFee || 0),
    [props.borrowFee, props.depositAmount],
  );
  const leverageInfo = useAsyncMemo(
    async () =>
      leverageVault && ProductsService.vaultLeverageInfo(leverageVault),
    [leverageVault],
  );

  if (!leverageVault || !leverageInfo) return <></>;

  return (
    <>
      <Checkbox
        checked={props.vault.riskType === RiskType.LEVERAGE}
        onChange={(v) => {
          props.onChange(
            vaultOptions.find((it) =>
              v.target.checked
                ? it.riskType === RiskType.LEVERAGE
                : it.riskType !== RiskType.LEVERAGE,
            )!,
          );
        }}
        className={classNames(styles['checkbox-borrow'], props.className)}
        style={props.style}
      >
        {t('Borrow')} {props.vault.depositCcy}
        <span
          className={styles['tip']}
          title={t(
            'Pay the borrowing fee and use {{leverage}}x leverage to subscribe for this product',
            { leverage: leverageInfo.leverage },
          )}
        >
          Leverage
        </span>
      </Checkbox>
      {!!(
        props.vault.riskType === RiskType.LEVERAGE &&
        props.depositAmount &&
        props.borrowFee
      ) && (
        <div className={styles['borrow-infos']}>
          <div className={styles['item']}>
            <div className={styles['label']}>{t('Borrow Amount')}</div>
            <div className={classNames(styles['value'], styles['highlight'])}>
              {amountFormatter(principal * (leverageInfo.leverage - 1), 2)}
              <span className={styles['unit']}>{props.vault.depositCcy}</span>
            </div>
          </div>
          <div className={styles['item']}>
            <div className={styles['label']}>{t('Total Notional Value')}</div>
            <div className={styles['value']}>
              {amountFormatter(principal * leverageInfo.leverage, 2)}
              <span className={styles['unit']}>{props.vault.depositCcy}</span>
            </div>
          </div>
          <div className={styles['item']}>
            <div className={styles['label']}>{t('Est.Borrowing Cost ')}</div>
            <div className={styles['value']}>
              {amountFormatter(props.borrowFee, 2)}
              <span className={styles['unit']}>{props.vault.depositCcy}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
