import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';
import { Table } from '@douyinfe/semi-ui';
import { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import { RiskType } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { AirdropRecord, AirdropStatusRefs } from '@sofa/services/rch';
import { amountFormatter } from '@sofa/utils/amount';
import { Env } from '@sofa/utils/env';
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
  const list = useRCHState((state) => state.myAirdropList);

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
          render: (_, it) => (
            <span className={styles['amount-rch']}>
              {amountFormatter(it.amount, 4)} RCH
            </span>
          ),
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

  return list?.length === 0 ? (
    <CEmpty
      style={{ height: 580 }}
      description={
        <div className="flex-column-center" style={{ color: '#fff', gap: 40 }}>
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
    <Table
      className={classNames('semi-always-dark', styles['table'])}
      columns={columns}
      dataSource={list}
      pagination={false}
      loading={!history}
      empty={<CEmpty className="semi-always-dark" />}
      rowKey={(it) => String(it?.timestamp || Math.random())}
    />
  );
});
