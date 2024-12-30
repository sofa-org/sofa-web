import { useMemo } from 'react';
import { Table, Toast } from '@douyinfe/semi-ui';
import { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import {
  AutomatorService,
  AutomatorTransaction,
} from '@sofa/services/automator';
import { AutomatorTransactionStatus } from '@sofa/services/base-type';
import { ContractsService } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import { amountFormatter } from '@sofa/utils/amount';
import { getErrorMsg } from '@sofa/utils/fns';
import { useQuery } from '@sofa/utils/hooks';
import { useInfiniteScroll } from 'ahooks';
import { uniqBy } from 'lodash-es';

import CEmpty from '@/components/Empty';
import { Time } from '@/components/TimezoneSelector';
import { useWalletStore } from '@/components/WalletConnector/store';

import styles from './index.module.scss';

export const AutomatorHistory = () => {
  {
    const wallet = useWalletStore();
    const [t] = useTranslation('AutomatorHistory');
    const v = useQuery((q) => q['automator-vault'] as string);
    const vault = useMemo(
      () =>
        ContractsService.AutomatorVaults.find(
          (it) =>
            it.chainId === wallet.chainId &&
            (!v || v.toLowerCase() === it.vault.toLowerCase()),
        ),
      [v, wallet.chainId],
    );

    const { data: $data, loading } = useInfiniteScroll<
      PromiseVal<ReturnType<typeof AutomatorService.transactions>>
    >(
      async (pre) => {
        if (!wallet.address || !vault) return new Promise(() => {});
        const params = {
          wallet: wallet.address,
        };
        const limit = 20;
        const page = {
          cursor: pre?.cursor,
          limit,
        };
        return AutomatorService.transactions(vault, params, page);
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
        list: uniqBy(
          $data.list,
          (it: AutomatorTransaction) => `${it.dateTime}`,
        ) as AutomatorTransaction[],
      };
    }, [$data]);

    const columns = useMemo(
      () =>
        [
          {
            title: t({ enUS: 'Created Time', zhCN: '创建时间' }),
            render: (_, record) => (
              <Time time={record.dateTime * 1000} format="YYYY-MM-DD HH:mm" />
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
            })} (${vault?.depositCcy})`,
            render: (_, record) =>
              record.status === AutomatorTransactionStatus.PENDING ? (
                '-'
              ) : (
                <>
                  {amountFormatter(record.amountInClientDepositCcy, 2)}
                  <span className={styles['unit']}>{vault?.depositCcy}</span>
                </>
              ),
          },
          {
            title: t({ enUS: 'Status', zhCN: '状态' }),
            fixed: 'right',
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
        ] as ColumnProps<AutomatorTransaction>[],
      [t, vault],
    );

    return (
      <Table
        className={styles['table']}
        columns={columns}
        dataSource={data?.list}
        loading={loading}
        pagination={false}
        rowKey={(record) => String(record?.dateTime)}
        empty={<CEmpty />}
      />
    );
  }
};
