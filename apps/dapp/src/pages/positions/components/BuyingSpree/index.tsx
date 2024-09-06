import { useMemo } from 'react';
import { Table, Toast } from '@douyinfe/semi-ui';
import { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import { useTranslation } from '@sofa/services/i18n';
import { PositionInfo, PositionsService } from '@sofa/services/positions';
import { amountFormatter } from '@sofa/utils/amount';
import { getErrorMsg } from '@sofa/utils/fns';
import { useRequest } from 'ahooks';

import Address from '@/components/Address';
import CEmpty from '@/components/Empty';
import { useProductSelect } from '@/components/ProductSelector';
import { ProductTypeRefs } from '@/components/ProductSelector/enums';
import { Time } from '@/components/TimezoneSelector';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'BuyingSpree');

const BuyingSpree = () => {
  const [t] = useTranslation('BuyingSpree');
  const [productType] = useProductSelect();
  const wallet = useWalletStore();

  const { data, loading } = useRequest(
    async () => {
      if (!wallet.chainId) return undefined;
      const params = {
        chainId: wallet.chainId,
        productType,
      };
      const limit = 40;
      const page = { limit };
      return PositionsService.buyingSpree(params, page);
    },
    {
      refreshDeps: [wallet.chainId, productType],
      onError: (err) => Toast.error(getErrorMsg(err)),
    },
  );

  const columns = useMemo(
    () =>
      [
        {
          title: t('Address'),
          key: 'address',
          render: (_, it) => <Address address={it.wallet} />,
        },
        {
          title: t('Product'),
          key: 'product',
          render: (_, it) => {
            const productRef = ProductTypeRefs[it.product.vault.productType];
            return `${it.product.vault.forCcy.replace(
              /^W/,
              '',
            )}-${productRef.label(t)}`;
          },
        },
        {
          title: t('Expiry'),
          key: 'expiry',
          render: (_, it) => (
            <Time time={it.product.expiry * 1000} format="YYYY-MM-DD HH:mm" />
          ),
        },
        {
          title: t('Price Range'),
          key: 'price-range',
          render: (_, it) =>
            it.product.anchorPrices
              .map((it) => amountFormatter(it, 0))
              .join('-'),
        },
        {
          title: t('Buying'),
          key: 'amount',
          render: (_, it) => `${it.amounts.own} ${it.product.vault.depositCcy}`,
        },
      ] as ColumnProps<PositionInfo>[],
    [t],
  );
  return (
    <Table
      className={styles['container']}
      columns={columns}
      dataSource={data}
      pagination={false}
      loading={loading && !data?.length}
      rowKey={(it) =>
        it?.id ? `${it.id}-${it.createdAt}` : String(Math.random())
      }
      empty={<CEmpty />}
    />
  );
};

export default BuyingSpree;
