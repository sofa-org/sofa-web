import { useMemo, useState } from 'react';
import { Table, Toast } from '@douyinfe/semi-ui';
import { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import { ProductType, RiskType } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { PositionInfo, PositionsService } from '@sofa/services/positions';
import { amountFormatter, cvtAmountsInCcy } from '@sofa/utils/amount';
import { displayExpiry, next8h } from '@sofa/utils/expiry';
import { getErrorMsg } from '@sofa/utils/fns';
import { displayTenor } from '@sofa/utils/time';
import { useInfiniteScroll } from 'ahooks';
import dayjs from 'dayjs';

import CEmpty from '@/components/Empty';
import { useIndexPrices } from '@/components/IndexPrices/store';
import { useProjectChange } from '@/components/ProductSelector';
import {
  ProductTypeRefs,
  RiskTypeRefs,
} from '@/components/ProductSelector/enums';
import { Time } from '@/components/TimezoneSelector';
import TopTabs from '@/components/TopTabs';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';

import { Comp as IconDetails } from './assets/icon-details.svg';
import locale from './locale';

addI18nResources(locale, 'History');
import { uniqBy } from 'lodash-es';

import styles from './index.module.scss';

const OrderHistory = () => {
  const wallet = useWalletStore();
  const prices = useIndexPrices((state) => state.prices);
  const [t] = useTranslation('History');
  const [project] = useProjectChange();

  const { data: $data, loading } = useInfiniteScroll(
    async (pre) => {
      if (!wallet.address) return new Promise(() => {});
      const params = {
        chainId: wallet.chainId,
        owner: wallet.address,
        riskType: project,
      };
      const limit = 20;
      const page = {
        cursor: pre?.cursor,
        limit,
      };
      return PositionsService.history(params, page);
    },
    {
      target: () => document.querySelector('#root'),
      isNoMore: (d) => !d?.hasMore,
      onError: (err) => Toast.error(getErrorMsg(err)),
      reloadDeps: [wallet.chainId, wallet.address],
    },
  );

  const data = useMemo(() => {
    if (!$data) return null;
    return {
      ...$data,
      list: uniqBy($data.list, (it) => it.id) as PositionInfo[],
    };
  }, [$data]);

  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>(() => []);

  const columns = useMemo(
    () =>
      [
        {
          title: t('Product'),
          render: (_, record) =>
            ProductTypeRefs[record.product.vault.productType].alias,
        },
        {
          title: t('Type'),
          render: (_, record) => (
            <span className={styles['product-type']}>
              {RiskTypeRefs[record.product.vault.riskType].icon}
              {record.product.vault.riskType === RiskType.LEVERAGE && (
                <span className={styles['badge-leverage']}>Lev.</span>
              )}
            </span>
          ),
        },
        {
          title: t('Expiration'),
          render: (_, record) => displayExpiry(record.product.expiry * 1000),
        },
        {
          title: t('Term'),
          render: (_, record) =>
            displayTenor(
              dayjs(record.product.expiry * 1000).diff(
                next8h(record.createdAt * 1000),
                'day',
              ),
              t,
            ),
        },
        {
          title: t('Strikes'),
          render: (_, record) =>
            record.product.anchorPrices
              .map((it) => amountFormatter(it, 0))
              .join('-'),
        },
        {
          title: t('Deposit'),
          render: (_, record) =>
            `${amountFormatter(record.amounts.own, 2)} ${
              record.product.vault.depositCcy
            }`,
        },
        {
          title: t('Basic PnL'),
          render: (_, record) => {
            if (!record.amounts.redeemable) return '-';
            const pnl = Number(record.amounts.redeemable) - +record.amounts.own;
            if (!pnl) return '-';
            return (
              <span
                className={styles['amount']}
                style={{
                  color: pnl >= 0 ? 'var(--color-rise)' : 'var(--color-fall)',
                }}
              >
                {pnl >= 0 ? '+' : ''}
                {amountFormatter(pnl, 2)} {record.product.vault.depositCcy}
              </span>
            );
          },
        },
        {
          title: t('RCH PnL'),
          render: (_, record) =>
            record.claimParams.maker ||
            Date.now() <= next8h(record.createdAt * 1000) ? (
              '-'
            ) : (
              <span className={styles['amount-rch']}>
                {amountFormatter(record.amounts.rchAirdrop, 4)} RCH
              </span>
            ),
        },
        {
          title: t('Created Time'),
          render: (_, record) => (
            <Time time={record.createdAt * 1000} format="YYYY-MM-DD HH:mm" />
          ),
        },
        {
          title: t('Settlement Time'),
          render: (_, record) => (
            <Time
              time={record.product.expiry * 1000}
              format="YYYY-MM-DD HH:mm"
            />
          ),
        },
        {
          title: t('Details'),
          fixed: 'right',
          render: (_, record) => (
            <IconDetails
              className={styles['icon-details']}
              onClick={() =>
                setExpandedRowKeys((pre) => {
                  const id = String(record?.id);
                  if (id === pre[0]) return [];
                  return [id];
                })
              }
            />
          ),
        },
      ] as ColumnProps<PositionInfo>[],
    [t],
  );

  return (
    <TopTabs banner={<></>} options={[]} dark type={'tab'}>
      <Table
        className={styles['table']}
        columns={columns}
        dataSource={data?.list}
        loading={loading}
        pagination={false}
        rowKey={(record) => String(record?.id)}
        empty={<CEmpty />}
        expandedRowKeys={expandedRowKeys}
        expandedRowRender={(record) => {
          if (!record) return null;
          const returnInDepositCcy = cvtAmountsInCcy(
            [
              [record.product.vault.depositCcy, record.amounts.redeemable],
              ['RCH', record.amounts.rchAirdrop],
            ],
            prices,
            record.product.vault.depositCcy,
          );
          return (
            <div className={styles['extra']}>
              <div className={styles['extra-item']}>
                <span className={styles['label']}>{t('Return')}</span>
                <span className={styles['value']}>
                  {amountFormatter(returnInDepositCcy, 2)}{' '}
                  {record.product.vault.depositCcy}
                </span>
              </div>
              <div className={styles['extra-item']}>
                <span className={styles['label']}>{t('Settlement Info')}</span>
                <span className={styles['value']}>
                  {record.triggerTime ? (
                    <>
                      {record.product.vault.productType === ProductType.DNT
                        ? t('Out of Range')
                        : t('Settled')}{' '}
                      ({t('at')} ${amountFormatter(record.triggerPrice, 2)}{' '}
                      <Time
                        time={record.triggerTime * 1000}
                        format="YYYY-MM-DD HH:mm"
                      />
                      )
                    </>
                  ) : (
                    '-'
                  )}
                </span>
              </div>
            </div>
          );
        }}
      />
    </TopTabs>
  );
};

export default OrderHistory;
