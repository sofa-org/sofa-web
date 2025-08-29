import { useMemo } from 'react';
import { Radio, RadioGroup } from '@douyinfe/semi-ui';
import { SelectProps } from '@douyinfe/semi-ui/lib/es/select';
import { VaultInfo } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { ContractsService } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import { PositionInfo } from '@sofa/services/positions';
import { CalculatedInfo, ProductQuoteResult } from '@sofa/services/products';
import { updateQuery } from '@sofa/utils/history';
import { useLazyCallback, useQuery } from '@sofa/utils/hooks';
import classNames from 'classnames';
import { isEqual, unionBy } from 'lodash-es';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

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

export function useForCcySelect(options?: {
  defaultValue?: VaultInfo['forCcy'];
  acceptance?:
    | VaultInfo['forCcy'][]
    | ((forCcy: VaultInfo['forCcy']) => boolean);
}) {
  const query = useQuery();
  const setForCcy = useLazyCallback((v: VaultInfo['forCcy']) =>
    updateQuery?.({ 'for-ccy': v }),
  );
  const rawV = useMemo(
    () => query['for-ccy'] as VaultInfo['forCcy'],
    [query['for-ccy']],
  );
  const currentV = useMemo(() => {
    if (options?.acceptance) {
      const accept =
        typeof options.acceptance == 'function'
          ? options.acceptance(rawV)
          : options.acceptance.includes(rawV);
      if (accept) {
        return rawV;
      }
      return options?.defaultValue || 'WETH';
    }
    return rawV || options?.defaultValue || 'WETH';
  }, [options?.defaultValue, options?.acceptance, rawV]);
  return [currentV, setForCcy] as const;
}

export function useDepositCcySelect() {
  const query = useQuery();
  const [project] = useProjectChange();
  const [forCcy] = useForCcySelect();
  const [riskType] = useRiskSelect(project);
  const [productType] = useProductSelect();
  const chainId = useWalletStore((state) => state.chainId);
  const setDepositCcy = useLazyCallback((v: VaultInfo['depositCcy']) =>
    updateQuery?.({ 'deposit-ccy': v }),
  );
  const $ccy = (query['deposit-ccy'] as VaultInfo['depositCcy']) || 'USDT';
  const ccy = useMemo(
    () =>
      ContractsService.vaults.some(
        (it) =>
          !it.tradeDisable &&
          it.chainId === chainId &&
          it.forCcy === forCcy &&
          it.riskType === riskType &&
          it.productType === productType &&
          it.depositCcy === $ccy,
      )
        ? $ccy
        : ContractsService.vaults.find(
            (it) =>
              !it.tradeDisable &&
              it.chainId === chainId &&
              it.forCcy === forCcy &&
              it.riskType === riskType &&
              it.productType === productType,
          )?.depositCcy || 'USDT',
    [$ccy, chainId, forCcy, productType, riskType],
  );
  return [ccy, setDepositCcy] as const;
}

export const CCYSelector = (
  props: CCYSelectorProps & {
    localState?: ReturnType<typeof useForCcySelect>;
    optionDisabled?: (v: ReturnType<typeof useForCcySelect>[0]) => boolean;
  },
) => {
  const globalState = useForCcySelect({
    acceptance: ['WBTC', 'WETH'],
  });
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
  const [forCcy] = useForCcySelect();
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
            it.forCcy === forCcy &&
            it.productType === productType &&
            it.riskType === riskType &&
            !it.tradeDisable,
        ),
        (it) => it.depositCcy,
      ).map((it) => ({
        label: (
          <span className={styles['ccy-item']}>
            <img
              src={
                CCYService.ccyConfigs[it.realDepositCcy ?? it.depositCcy]?.icon
              }
              alt=""
            />
            {it.realDepositCcy ?? it.depositCcy}
          </span>
        ),
        value: it.depositCcy,
      })),
    [chainId, forCcy, productType, riskType],
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

const useBaseDepositCcyStore = Object.assign(
  createWithEqualityFn(
    persist(
      () => ({
        baseCcyConfig: {} as Record<
          `${VaultInfo['chainId']}-${VaultInfo['depositCcy']}`,
          VaultInfo['depositCcy'] | VaultInfo['depositBaseCcy']
        >,
      }),
      {
        name: 'baseDepositCcySelector-state-1',
        storage: createJSONStorage(() => localStorage),
      },
    ),
    isEqual,
  ),
  {
    setBaseCcyConfig(
      vault: VaultInfo,
      baseCcy: VaultInfo['depositCcy'] | VaultInfo['depositBaseCcy'],
    ) {
      useBaseDepositCcyStore.setState({
        baseCcyConfig: {
          ...useBaseDepositCcyStore.getState().baseCcyConfig,
          [`${vault.chainId}-${vault.depositCcy}`]: baseCcy,
        },
      });
    },
  },
);

export const BaseDepositCcySelector = ({
  vault,
  className,
}: {
  vault: VaultInfo;
} & Omit<SelectProps, 'value' | 'onChange' | 'children'>) => {
  const baseCcy = useBaseDepositCcyStore(
    (s) => s.baseCcyConfig[`${vault.chainId}-${vault.depositCcy}`],
  );
  return vault.depositBaseCcy ? (
    <RadioGroup
      type="button"
      buttonSize="small"
      value={baseCcy === undefined ? vault.depositBaseCcy : baseCcy}
      className={classNames(styles['base-ccy-select'], className)}
      onChange={(v) =>
        useBaseDepositCcyStore.setBaseCcyConfig(vault, v.target.value)
      }
    >
      <Radio value={vault.depositBaseCcy}>{vault.depositBaseCcy}</Radio>
      <Radio value={vault.depositCcy}>
        {vault.realDepositCcy ?? vault.depositCcy}
      </Radio>
    </RadioGroup>
  ) : undefined;
};

export const useBaseDepositCcySelector = ({
  vault,
  quoteResult,
  position,
}: {
  vault?: VaultInfo;
  quoteResult?: ProductQuoteResult;
  position?: Partial<PositionInfo>;
}): {
  depositCcy?: string;
  apyInfo?: CalculatedInfo['apyInfo'];
  calculatedInfo?: Partial<CalculatedInfo>;
} => {
  const useDepositBaseCcy = useBaseDepositCcyStore((s) => {
    if (!vault?.depositBaseCcy) {
      return false;
    } else {
      const res = s.baseCcyConfig[`${vault.chainId}-${vault.depositCcy}`];
      if (res === undefined || res === vault.depositBaseCcy) {
        return true;
      }
    }
    return false;
  });
  return useDepositBaseCcy
    ? {
        depositCcy: vault?.depositBaseCcy,
        calculatedInfo:
          quoteResult?.convertedCalculatedInfoByDepositBaseCcy ||
          position?.convertedCalculatedInfoByDepositBaseCcy,
        apyInfo:
          quoteResult?.convertedCalculatedInfoByDepositBaseCcy?.apyInfo ||
          position?.convertedCalculatedInfoByDepositBaseCcy?.apyInfo,
      }
    : {
        depositCcy: vault?.depositCcy,
        calculatedInfo: quoteResult || position,
        apyInfo: quoteResult?.apyInfo || position?.apyInfo,
      };
};
