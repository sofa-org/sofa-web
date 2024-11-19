import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';
import { Checkbox, Table } from '@douyinfe/semi-ui';
import { ColumnProps, TableProps } from '@douyinfe/semi-ui/lib/es/table';
import { RiskType } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import {
  AirdropRecord,
  AirdropStatus,
  AirdropStatusRefs,
} from '@sofa/services/rch';
import { amountFormatter } from '@sofa/utils/amount';
import { Env } from '@sofa/utils/env';
import { useLocalStorageState } from 'ahooks';
import classNames from 'classnames';

import CEmpty from '@/components/Empty';
import { RiskTypeRefs } from '@/components/ProductSelector/enums';
import { Time } from '@/components/TimezoneSelector';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';

import { useRCHState } from '../../store';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'RCHHistory');

export interface RCHHistoryRef {
  refresh(): Promise<unknown>;
}

export const RCHHistory = forwardRef<RCHHistoryRef>((_, ref) => {
  const [t] = useTranslation('RCHHistory');
  const wallet = useWalletStore();

  const [hideClaimedAirdrop, setHideClaimedAirdrop] = useLocalStorageState(
    'hide-claimed-airdrop',
    {
      defaultValue: false,
    },
  );

  const rowSelection = useMemo(
    () =>
      ({
        getCheckboxProps: (row) => ({
          disabled: row.status === AirdropStatus.Claimed,
        }),
        onChange: (selectedKeys) => {
          useRCHState.updateSelectedAirdropKeys(
            selectedKeys?.map(Number) || [],
          );
        },
      }) as TableProps<AirdropRecord>['rowSelection'],
    [],
  );

  const list = useRCHState((state) =>
    !hideClaimedAirdrop ? state.myAirdropList : state.claimableList(),
  );

  useImperativeHandle(ref, () => ({
    refresh: async () => useRCHState.fetchAirdropHistory(),
  }));

  useEffect(() => {
    if (wallet.address) useRCHState.fetchAirdropHistory();
  }, [wallet.address]);

  const columns = useMemo(
    () =>
      [
        {
          title: t('Time'),
          key: 'time',
          render: (_, it) => <Time time={it.timestamp} format="MMM DD, YYYY" />,
        },
        // {
        //   title: t('Deposit Volume(U)'),
        //   key: 'deposit-amount',
        //   render: (_, it) => amountFormatter(it.investNotional, 2),
        // },
        {
          title: t('Airdrop Rewards'),
          key: 'reward',
          dataIndex: 'reward',
          render: (_, it) => (
            <span className={styles['amount-rch']}>
              {amountFormatter(it.amount, 4)} RCH
            </span>
          ),
          sorter: (a, b, direction) => {
            return direction ? Number(a?.amount) - Number(b?.amount) || 0 : 0;
          },
        },
        {
          title: t('Status'),
          key: 'status',
          render: (_, it) => {
            const ref = AirdropStatusRefs[it.status];
            if (!ref) return <span className="placeholder">-</span>;
            return (
              <div
                className="flex-center"
                style={{ justifyContent: 'flex-start', flexWrap: 'nowrap' }}
              >
                <div
                  style={{
                    width: 4,
                    height: 4,
                    background: ref.color,
                    borderRadius: 2,
                  }}
                />
                {ref.label(t)}
              </div>
            );
          },
        },
        // {
        //   title: t('apy'),
        //   key: 'apy',
        //   render: (_, it) => displayPercentage(it.apy),
        // },
      ] as ColumnProps<AirdropRecord>[],
    [t],
  );

  return (
    <>
      <div className={styles['operators']}>
        <Checkbox
          className={classNames('semi-always-dark', styles['btn-hide'])}
          checked={hideClaimedAirdrop}
          onChange={() => setHideClaimedAirdrop((pre) => !pre)}
        >
          {t({ enUS: 'Hide claimed records', zhCN: '隐藏已领取的空投记录' })}
        </Checkbox>
      </div>
      {list?.length === 0 ? (
        <CEmpty
          style={{ height: 580 }}
          description={
            <div
              className="flex-column-center"
              style={{ color: '#fff', gap: 40 }}
            >
              {t('No Rewards History')}
              <a
                className={classNames('btn-gradient', styles['btn-link'])}
                href={RiskTypeRefs[RiskType.PROTECTED].link}
                target={
                  Env.isMetaMaskAndroid || Env.isTelegram
                    ? undefined
                    : RiskType.PROTECTED
                }
              >
                {t('Deposit & GET REWARDS')}
              </a>
            </div>
          }
        />
      ) : (
        <>
          <div className={styles['select-tips']}>
            *{' '}
            {t({
              enUS: 'You can filter records to claim',
              zhCN: '您可以筛选记录进行部分领取',
            })}
          </div>
          <Table
            className={classNames('semi-always-dark', styles['table'])}
            columns={columns}
            dataSource={list}
            pagination={false}
            rowSelection={rowSelection}
            loading={!list && !!wallet.address}
            empty={<CEmpty className="semi-always-dark" />}
            rowKey={(it) => String(it?.timestamp || Math.random())}
          />
        </>
      )}
    </>
  );
});
