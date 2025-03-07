import { useMemo } from 'react';
import { SelectProps } from '@douyinfe/semi-ui/lib/es/select';
import { VaultInfo } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { ContractsService } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import { updateQuery } from '@sofa/utils/history';
import { useLazyCallback, useQuery } from '@sofa/utils/hooks';
import classNames from 'classnames';
import { unionBy } from 'lodash-es';

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

export interface DepositCCYSelectorProps
  extends Omit<SelectProps, 'value' | 'onChange' | 'children'> {
  afterChange?(v: VaultInfo['depositCcy']): void;
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
      ContractsService.vaults.some(
        (it) =>
          !it.tradeDisable &&
          it.chainId === chainId &&
          it.riskType === riskType &&
          it.productType === productType &&
          it.depositCcy === $ccy,
      )
        ? $ccy
        : ContractsService.vaults.find(
            (it) =>
              !it.tradeDisable &&
              it.chainId === chainId &&
              it.riskType === riskType &&
              it.productType === productType,
          )?.depositCcy || 'USDT',
    [$ccy, chainId, productType, riskType],
  );
  return [ccy, setDepositCcy] as const;
}

export const CCYSelector = (
  props: CCYSelectorProps & {
    localState?: ReturnType<typeof useForCcySelect>;
    optionDisabled?: (v: ReturnType<typeof useForCcySelect>[0]) => boolean;
  },
) => {
  const globalState = useForCcySelect();
  const [ccy, setCcy] = props.localState || globalState;
  const options = useMemo(
    () =>
      [
        { label: 'BTC', ccy: 'WBTC' as const },
        { label: 'ETH', ccy: 'WETH' as const },
      ].map((it) => ({
        label: (
          <span className={styles['ccy-item']}>
            <img src={CCYService.ccyConfigs[it.label]?.icon} alt="" />
            {it.label}
          </span>
        ),
        value: it.ccy,
        disabled: props.optionDisabled
          ? props.optionDisabled(it.ccy)
          : undefined,
      })),
    [props.optionDisabled],
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

export const DepositCCYSelector = (props: DepositCCYSelectorProps) => {
  const [project] = useProjectChange();
  const [productType] = useProductSelect();
  const [riskType] = useRiskSelect(project);
  const chainId = useWalletStore((state) => state.chainId);
  const [ccy, setCcy] = useDepositCcySelect();
  const [t] = useTranslation();
  const options = useMemo(
    () =>
      unionBy(
        ContractsService.vaults.filter(
          (it) =>
            it.chainId === chainId &&
            it.productType === productType &&
            it.riskType === riskType &&
            !it.tradeDisable,
        ),
        (it) => it.depositCcy,
      ).map((it) => ({
        label: (
          <span className={styles['ccy-item']}>
            <img src={CCYService.ccyConfigs[it.depositCcy]?.icon} alt="" />
            {it.depositCcy}
          </span>
        ),
        value: it.depositCcy,
      })),
    [chainId, productType],
  );
  return (
    <CSelect
      {...props}
      prefix={props.prefix || t({ enUS: 'Deposit Token', zhCN: '申购币种' })}
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
        setCcy(v as VaultInfo['depositCcy']);
        props.afterChange?.(v as VaultInfo['depositCcy']);
      }}
    />
  );
};
