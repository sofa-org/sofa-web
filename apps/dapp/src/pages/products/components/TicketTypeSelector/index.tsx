import { useMemo } from 'react';
import { SelectProps } from '@douyinfe/semi-ui/lib/es/select';
import { CCYService } from '@sofa/services/ccy';
import { ContractsService } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import { ProductsService, VaultInfo } from '@sofa/services/products';
import { updateQuery } from '@sofa/utils/history';
import { useLazyCallback, useQuery } from '@sofa/utils/hooks';
import classNames from 'classnames';

import { CSelect } from '@/components/CSelect';
import {
  useProductSelect,
  useProjectChange,
} from '@/components/ProductSelector';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'TicketTypeSelector');

export interface TicketTypeSelectorProps
  extends BaseProps,
    Omit<SelectProps, 'value' | 'onChange' | 'style' | 'children'> {
  forCcy: VaultInfo['forCcy'];
}

export const TicketTypeOptions = ProductsService.TicketTypeOptions;

export function useTicketType(forCcy: VaultInfo['forCcy']) {
  const query = useQuery();
  const depositCcy = query?.['deposit-ccy'];
  const chainId = useWalletStore((state) => state.chainId);
  const [riskType] = useProjectChange();
  const [productType] = useProductSelect();
  const options = useMemo(
    () =>
      TicketTypeOptions.filter((it) =>
        ProductsService.findVault(ContractsService.vaults, {
          chainId,
          riskType,
          productType,
          depositCcy: it.value as VaultInfo['depositCcy'],
        }),
      ),
    [chainId, productType, riskType],
  );
  const ticketMeta = useMemo(() => {
    return options.find((it) => depositCcy === it.value);
  }, [depositCcy, options]);
  const setDepositCcy = useLazyCallback((ccy: VaultInfo['depositCcy']) => {
    updateQuery({ 'deposit-ccy': ccy });
  });
  return [ticketMeta, setDepositCcy, options] as const;
}

const TicketTypeSelector = (props: TicketTypeSelectorProps) => {
  const [t] = useTranslation('TicketTypeSelector');
  const [item, setCcy, $options] = useTicketType(props.forCcy);
  const options = useMemo(
    () =>
      $options.map((it) => ({
        label: (
          <span className={styles['ticket-item']}>
            <img src={CCYService.ccyConfigs[it.ccy]?.icon} alt="" />
            {it.per} {it.ccy}
          </span>
        ),
        value: it.value,
      })),
    [$options],
  );
  return (
    <CSelect
      {...props}
      className={classNames(props.className, styles['ticket-type-selector'])}
      dropdownClassName={classNames(
        props.dropdownClassName,
        styles['ticket-type-dropdown'],
      )}
      optionList={options}
      value={item?.value}
      onChange={(v) => setCcy?.(v as VaultInfo['depositCcy'])}
      renderSelectedItem={() => (
        <span className={styles['tick']}>
          {item?.per}
          <span className={styles['unit']}>{item?.ccy}</span>
        </span>
      )}
      prefix={t('Per Ticket Price')}
    />
  );
};

export default TicketTypeSelector;
