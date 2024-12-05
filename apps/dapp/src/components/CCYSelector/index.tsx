import { useMemo } from 'react';
import { SelectProps } from '@douyinfe/semi-ui/lib/es/select';
import { VaultInfo } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { ContractsService } from '@sofa/services/contracts';
import { updateQuery } from '@sofa/utils/history';
import { useLazyCallback, useQuery } from '@sofa/utils/hooks';
import classNames from 'classnames';

import { CSelect } from '../CSelect';
import {
  useProductSelect,
  useProjectChange,
  useRiskSelect,
} from '../ProductSelector';
import { useWalletStore } from '../WalletConnector/store';

import styles from './index.module.scss';

export interface CCYSelectorProps
  extends Omit<SelectProps, 'value' | 'onChange' | 'children'> {
  afterChange?(v: VaultInfo['forCcy']): void;
  dark?: boolean;
}

export function useForCcySelect() {
  const query = useQuery();
  const setForCcy = useLazyCallback(
    (v: VaultInfo['forCcy']) => updateQuery?.({ 'for-ccy': v }),
  );
  return [
    (query['for-ccy'] as VaultInfo['forCcy']) || 'WETH',
    setForCcy,
  ] as const;
}

export function useDepositCcySelect() {
  const query = useQuery();
  const [project] = useProjectChange();
  const [riskType] = useRiskSelect(project);
  const [productType] = useProductSelect();
  const chainId = useWalletStore((state) => state.chainId);
  const setDepositCcy = useLazyCallback(
    (v: VaultInfo['depositCcy']) => updateQuery?.({ 'deposit-ccy': v }),
  );
  const $ccy = (query['deposit-ccy'] as VaultInfo['depositCcy']) || 'USDT';
  const ccy = useMemo(
    () =>
      ContractsService.vaults.find(
        (it) =>
          !it.tradeDisable &&
          it.chainId === chainId &&
          it.riskType === riskType &&
          it.productType === productType &&
          it.depositCcy === $ccy,
      )
        ? $ccy
        : 'USDT',
    [$ccy, chainId, productType, riskType],
  );
  return [ccy, setDepositCcy] as const;
}

export const CCYSelector = (props: CCYSelectorProps) => {
  const [ccy, setCcy] = useForCcySelect();
  const options = useMemo(
    () =>
      [
        { label: 'BTC', ccy: 'WBTC' },
        { label: 'ETH', ccy: 'WETH' },
      ].map((it) => ({
        label: (
          <span className={styles['ccy-item']}>
            <img src={CCYService.ccyConfigs[it.label]?.icon} alt="" />
            {it.label}
          </span>
        ),
        value: it.ccy,
      })),
    [],
  );
  return (
    <CSelect
      {...props}
      className={classNames(props.className, styles['ccy-selector'], {
        [styles['dark']]: props.dark,
      })}
      dropdownClassName={classNames(
        props.dropdownClassName,
        styles['ccy-dropdown'],
      )}
      optionList={options}
      value={ccy}
      onChange={(v) => {
        setCcy(v as VaultInfo['forCcy']);
        props.afterChange?.(v as VaultInfo['forCcy']);
      }}
    />
  );
};
