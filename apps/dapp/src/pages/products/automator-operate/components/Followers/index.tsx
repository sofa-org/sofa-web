import { useMemo } from 'react';
import { Table, Toast } from '@douyinfe/semi-ui';
import { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import { AutomatorFollower, AutomatorService } from '@sofa/services/automator';
import { useTranslation } from '@sofa/services/i18n';
import { displayPercentage } from '@sofa/utils/amount';
import { getErrorMsg } from '@sofa/utils/fns';
import { simplePlus } from '@sofa/utils/object';
import { useInfiniteScroll } from 'ahooks';
import classNames from 'classnames';

import Address from '@/components/Address';
import AmountDisplay from '@/components/AmountDisplay';
import CEmpty from '@/components/Empty';

import { useCreatorAutomatorSelector } from '../AutomatorSelector';

import styles from './index.module.scss';

export const AutomatorFollowers = () => {
  const [t] = useTranslation('AutomatorFollowers');
  const { automator } = useCreatorAutomatorSelector();
  const vault = automator?.vaultInfo;

  const { data, loading } = useInfiniteScroll<
    PromiseVal<ReturnType<typeof AutomatorService.followers>>
  >(
    async (pre) => {
      if (!vault) return new Promise(() => {});
      const limit = 20;
      const page = {
        offset: pre?.offset,
        limit,
      };
      return AutomatorService.followers(vault, page);
    },
    {
      target: () => document.querySelector('#root'),
      isNoMore: (d) => !d?.hasMore,
      onError: (err) => Toast.error(getErrorMsg(err)),
      reloadDeps: [vault],
    },
  );

  const columns = useMemo(
    () =>
      [
        {
          title: t({ enUS: 'Address', zhCN: '地址' }),
          render: (_, record) => <Address address={record.wallet} />,
        },
        {
          title: t({ enUS: 'Time Followed', zhCN: '参与天数' }),
          render: (_, record) => <>{record.followDay}d</>,
        },
        {
          title: t({ enUS: 'Holding', zhCN: '份额' }),
          render: (_, record) => (
            <>
              <AmountDisplay amount={record.share} ccy={vault?.positionCcy} />
              <span className={styles['unit']}>{vault?.positionCcy}</span>
              <div className={styles['cvt']}>
                <span className={styles['separator']}>≈</span>
                <AmountDisplay
                  amount={record.amountByClientDepositCcy}
                  ccy={vault?.depositCcy}
                />
                <span className={styles['unit']}>{vault?.depositCcy}</span>
              </div>
            </>
          ),
        },
        {
          title: t({ enUS: 'PnL', zhCN: 'PnL' }),
          render: (_, record) => (
            <>
              <span
                style={{
                  color:
                    +record.totalPnlByClientDepositCcy >= 0
                      ? 'var(--color-rise)'
                      : 'var(--color-fall)',
                }}
              >
                <AmountDisplay
                  amount={record.totalPnlByClientDepositCcy}
                  ccy={vault?.positionCcy}
                />
                <span className={styles['unit']}>{vault?.positionCcy}</span>
              </span>
              <span className={styles['separator']}>+</span>
              <span style={{ color: 'var(--color-rch)' }}>
                <AmountDisplay amount={record.totalRchAmount} ccy="RCH" />
                <span
                  className={classNames(styles['unit'], styles['icon-airdrop'])}
                >
                  RCH
                </span>
              </span>
              <div className={styles['cvt']}>
                <span className={styles['separator']}>≈</span>
                <AmountDisplay
                  amount={simplePlus(
                    record.totalPnlByClientDepositCcy,
                    record.totalRchPnlByClientDepositCcy,
                  )}
                  ccy={vault?.depositCcy}
                />
                <span className={styles['unit']}>{vault?.depositCcy}</span>
              </div>
            </>
          ),
        },
        {
          title: t({ enUS: 'PnL%', zhCN: 'PnL%' }),
          fixed: 'right',
          render: (_, record) => (
            <span
              style={{
                color:
                  +record.pnlPercentage >= 0
                    ? 'var(--color-rise)'
                    : 'var(--color-fall)',
              }}
            >
              {displayPercentage(+record.pnlPercentage / 100)}
            </span>
          ),
        },
      ] as ColumnProps<AutomatorFollower>[],
    [t, vault],
  );

  return (
    <Table
      className={styles['table']}
      columns={columns}
      dataSource={data?.list}
      loading={loading && !data}
      pagination={false}
      rowKey={(record) => String(record?.wallet)}
      empty={<CEmpty />}
    />
  );
};
