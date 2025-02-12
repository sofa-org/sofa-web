import { useMemo, useState } from 'react';
import { Table, Toast } from '@douyinfe/semi-ui';
import { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import { ProductType, ProjectType, RiskType } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { PositionInfo, PositionsService } from '@sofa/services/positions';
import { amountFormatter, cvtAmountsInCcy } from '@sofa/utils/amount';
import { displayExpiry, MsIntervals, next8h } from '@sofa/utils/expiry';
import { getErrorMsg } from '@sofa/utils/fns';
import { useQuery } from '@sofa/utils/hooks';
import { displayTenor } from '@sofa/utils/time';
import { useInfiniteScroll } from 'ahooks';
import dayjs from 'dayjs';
import { uniqBy } from 'lodash-es';

import Address from '@/components/Address';
import AmountDisplay from '@/components/AmountDisplay';
import CEmpty from '@/components/Empty';
import { useIndexPrices } from '@/components/IndexPrices/store';
import { useProjectChange, useRiskSelect } from '@/components/ProductSelector';
import {
  ProductTypeRefs,
  RiskTypeRefs,
} from '@/components/ProductSelector/enums';
import { Time } from '@/components/TimezoneSelector';
import { formatTime } from '@/components/TimezoneSelector/store';
import TopTabs from '@/components/TopTabs';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';

import { judgeSettled } from '../positions/components/PositionCard';

import { Comp as IconDetails } from './assets/icon-details.svg';
import { AutomatorHistory } from './automator';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'History');

const OrderHistory = () => {
  const wallet = useWalletStore();
  const address = useQuery(
    (q) => (q['automator-vault'] as string) || wallet.address,
  );
  const prices = useIndexPrices((state) => state.prices);
  const [t] = useTranslation('History');
  const [project] = useProjectChange();
  const [riskType] = useRiskSelect(project);

  const { data: $data, loading } = useInfiniteScroll(
    async (pre) => {
      if (!address) return new Promise(() => {});
      const params = {
        chainId: wallet.chainId,
        owner: address,
        riskType: address !== wallet.address ? undefined : riskType,
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
      reloadDeps: [wallet.chainId, address],
    },
  );

  const data = useMemo(() => {
    if (!$data) return null;
    return {
      ...$data,
      list: uniqBy(
        $data.list,
        (it: PositionInfo) =>
          `${it.id}-${it.product.vault.vault.toLowerCase()}-${it.createdAt}`,
      ) as PositionInfo[],
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
            if (!record.amounts.redeemable || !judgeSettled(record)) {
              return '-';
            }
            const pnl = Number(record.amounts.redeemable) - +record.amounts.own;
            if (!pnl) return '-';
            return (
              <span
                className={styles['amount']}
                style={{
                  color: pnl >= 0 ? 'var(--color-rise)' : 'var(--color-fall)',
                }}
              >
                <AmountDisplay
                  amount={pnl}
                  ccy={record.product.vault.depositCcy}
                  signed
                />{' '}
                {record.product.vault.depositCcy}
              </span>
            );
          },
        },
        {
          title: t('RCH PnL'),
          render: (_, record) =>
            record.claimParams.maker ||
            Date.now() - next8h() > MsIntervals.min * 10 ? (
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
                  const id = `${record?.product.vault.productType}-${record?.id}`;
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
    <Table
      className={styles['table']}
      columns={columns}
      dataSource={data?.list}
      loading={loading}
      pagination={false}
      rowKey={(record) => `${record?.product.vault.productType}-${record?.id}`}
      empty={<CEmpty />}
      expandedRowKeys={expandedRowKeys}
      expandedRowRender={(record) => {
        if (!record) return null;
        const hasSettled = judgeSettled(record);
        const returnInDepositCcy = !hasSettled
          ? undefined
          : cvtAmountsInCcy(
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
                    (
                    {t(
                      {
                        enUS: 'reached ${{price}} before {{time}}',
                        zhCN: '在 {{time}} 之前到达 ${{price}}',
                      },
                      {
                        price: amountFormatter(record.triggerPrice, 2),
                        time: formatTime(
                          record.triggerTime * 1000,
                          'YYYY-MM-DD HH:mm',
                        ),
                      },
                    )}
                    )
                  </>
                ) : record.product.vault.productType === ProductType.DNT &&
                  hasSettled ? (
                  t('In Range')
                ) : (
                  '-'
                )}
              </span>
            </div>
          </div>
        );
      }}
    />
  );
};

const Index = () => {
  const [t] = useTranslation('History');
  const [project] = useProjectChange();
  const automatorAddress = useQuery((q) => q['automator-vault'] as string);
  return (
    <TopTabs
      banner={
        <>
          <h1 className={styles['head-title']}>
            {project === ProjectType.Automator ? (
              <>
                {t({ enUS: 'Transaction History', zhCN: '交易历史' })}
                {automatorAddress && (
                  <Address
                    address={automatorAddress}
                    linkBtn={`/products/automator?automator-vault=${automatorAddress}`}
                  />
                )}
              </>
            ) : automatorAddress ? (
              <>
                {t({
                  enUS: 'Automator Trade History',
                  zhCN: 'Automator 交易历史',
                })}
                <Address
                  address={automatorAddress}
                  linkBtn={`/products/automator?automator-vault=${automatorAddress}`}
                />
              </>
            ) : (
              t({ enUS: 'Order History', zhCN: '订单历史' })
            )}
          </h1>
        </>
      }
      tabClassName={styles['tabs']}
      options={[]}
      dark
      type={'banner-expandable'}
    >
      {project === ProjectType.Automator ? (
        <AutomatorHistory />
      ) : (
        <OrderHistory />
      )}
    </TopTabs>
  );
};

export default Index;
