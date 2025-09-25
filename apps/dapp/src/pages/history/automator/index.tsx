import { useMemo } from 'react';
import { Table, Toast } from '@douyinfe/semi-ui';
import { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import {
  AutomatorService,
  AutomatorTransaction,
} from '@sofa/services/automator';
import { AutomatorUserService } from '@sofa/services/automator-user';
import {
  AutomatorTransactionStatus,
  AutomatorVaultInfo,
} from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { amountFormatter } from '@sofa/utils/amount';
import { getErrorMsg } from '@sofa/utils/fns';
import { useInfiniteScroll } from 'ahooks';
import classNames from 'classnames';
import { uniqBy } from 'lodash-es';

import Address from '@/components/Address';
import CEmpty from '@/components/Empty';
import { Time } from '@/components/TimezoneSelector';
import { useWalletStore } from '@/components/WalletConnector/store';
import { useAutomatorMarketSelector } from '@/pages/products/automator-market/hooks';

import styles from './index.module.scss';
import { Helmet } from 'react-helmet-async';

export const AutomatorHistory = (props: {
  automator?: AutomatorVaultInfo;
  all?: boolean;
  className?: string;
}) => {
  const wallet = useWalletStore();
  const [t] = useTranslation('AutomatorHistory');

  const market = useAutomatorMarketSelector();
  const vault = 'automator' in props ? props.automator : market.automator;

  const { data: $data, loading } = useInfiniteScroll<
    PromiseVal<ReturnType<typeof AutomatorUserService.userTransactions>>
  >(
    async (pre) => {
      if (!vault) return new Promise(() => {});
      const limit = 20;
      const page = {
        cursor: pre?.cursor,
        limit,
      };
      if (!props.all && wallet.address) {
        const params = { wallet: wallet.address };
        return AutomatorUserService.userTransactions(vault, params, page);
      }
      return AutomatorService.transactions(vault, {}, page);
    },
    {
      target: () => document.querySelector('#root'),
      isNoMore: (d) => !d?.hasMore,
      onError: (err) => Toast.error(getErrorMsg(err)),
      reloadDeps: [wallet.chainId, wallet.address, vault],
    },
  );

  const data = useMemo(() => {
    if (!$data) return null;
    return {
      ...$data,
      list: uniqBy(
        $data.list,
        (it: AutomatorTransaction) => `${it.dateTime}`,
      ) as AutomatorTransaction[],
    };
  }, [$data]);

  const columns = useMemo(
    () =>
      (
        [
          {
            title: t({ enUS: 'Created Time', zhCN: '创建时间' }),
            render: (_, record) => (
              <Time time={record.dateTime * 1000} format="YYYY-MM-DD HH:mm" />
            ),
          },
          {
            title: t({ enUS: 'Wallet', zhCN: '钱包' }),
            hide: !props.automator,
            render: (_, record) => (
              <Address
                address={record.wallet!}
                simple
                linkBtn
                className={styles['address']}
              />
            ),
          },
          {
            title: t({ enUS: 'Action', zhCN: '操作' }),
            render: (_, record) => {
              if (record.action === 'REDEEM') {
                return t({ enUS: 'Redeem', zhCN: '赎回' });
              }
              if (record.action === 'TRANSFER_IN') {
                return t({ enUS: 'Transfer In', zhCN: '转入' });
              }
              if (record.action === 'TRANSFER_OUT') {
                return t({ enUS: 'Transfer Out', zhCN: '转出' });
              }
              return t({ enUS: 'Mint', zhCN: '铸造' });
            },
          },
          {
            title: t({ enUS: 'Shares', zhCN: '份额' }),
            render: (_, record) => (
              <>
                {amountFormatter(record.share, 6)}
                <span className={styles['unit']}>{vault?.positionCcy}</span>
              </>
            ),
          },
          {
            title: `${t({
              enUS: 'Amount',
              zhCN: '金额',
            })} (${vault?.realDepositCcy ?? (vault?.depositCcy || '')})`,
            render: (_, record) =>
              record.status === AutomatorTransactionStatus.PENDING ? (
                '-'
              ) : (
                <>
                  {amountFormatter(record.amountByClientDepositCcy, 2)}
                  <span className={styles['unit']}>
                    {vault?.realDepositCcy ?? vault?.depositCcy}
                  </span>
                </>
              ),
          },
          {
            title: t({ enUS: 'Status', zhCN: '状态' }),
            fixed: 'right',
            hide: !!props.automator,
            render: (_, record) => {
              if (record.status === AutomatorTransactionStatus.PENDING) {
                return (
                  <span
                    className={styles['pending']}
                    style={{ color: '#177DDC' }}
                  >
                    {t({ enUS: 'In Progress', zhCN: '进行中' })}
                  </span>
                );
              }
              if (record.status === AutomatorTransactionStatus.CLAIMABLE) {
                return (
                  <span
                    className={styles['claimable']}
                    style={{ color: '#49AA19' }}
                  >
                    {t({ enUS: 'Claimable', zhCN: '可赎回' })}
                  </span>
                );
              }
              if (record.status === AutomatorTransactionStatus.COMPLETED) {
                return (
                  <span
                    className={styles['completed']}
                    style={{ color: '#49AA19' }}
                  >
                    {record.action === 'REDEEM'
                      ? t({ enUS: 'Claimed', zhCN: '已赎回' })
                      : t({ enUS: 'Completed', zhCN: '已完成' })}
                  </span>
                );
              }
              if (record.status === AutomatorTransactionStatus.CANCELLED) {
                return (
                  <span
                    className={styles['cancelled']}
                    style={{ color: '#0000004c' }}
                  >
                    {t({ enUS: 'Cancelled', zhCN: '已取消' })}
                  </span>
                );
              }
              return (
                <span
                  className={styles['status']}
                  style={{ color: '#0000004c' }}
                >
                  {t({ enUS: 'Expired', zhCN: '已过期' })}
                </span>
              );
            },
          },
        ] as ColumnProps<AutomatorTransaction>[]
      ).filter((it) => !it.hide),
    [props.automator, t, vault?.depositCcy, vault?.positionCcy],
  );

  return (
    <>
      <Helmet>
        <title>Automator - SOFA.org</title>
        <meta name="description" content="" />
      </Helmet>       
      <Table
        className={classNames(styles['table'], props.className)}
        columns={columns}
        dataSource={data?.list}
        loading={loading && !data}
        pagination={false}
        rowKey={(record) => String(record?.dateTime)}
        empty={<CEmpty />}
      />
    </>
  );
};
