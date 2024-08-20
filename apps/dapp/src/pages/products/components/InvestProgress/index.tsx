import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { Modal, Spin, Table } from '@douyinfe/semi-ui';
import { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import { ChainMap } from '@sofa/services/chains';
import { useTranslation } from '@sofa/services/i18n';
import { DepositProgress, PositionsService } from '@sofa/services/positions';
import { calcVal, getErrorMsg } from '@sofa/utils/fns';
import { useSize } from 'ahooks';
import classNames from 'classnames';

import { Comp as IconRight } from '@/assets/icon-right.svg';
import { Comp as IconWrong } from '@/assets/icon-wrong.svg';
import Address from '@/components/Address';
import { HashDisplay } from '@/components/HashDisplay';
import { MsgDisplay } from '@/components/MsgDisplay';
import { addI18nResources } from '@/locales';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'InvestProgress');

export interface ProgressRef {
  visible: boolean;
  update(progress?: DepositProgress): void;
}

interface ProgressProps {
  chainId: number;
}

export const InvestProgress = forwardRef<ProgressRef, ProgressProps>(
  (props, ref) => {
    const [t] = useTranslation('InvestProgress');
    const size = useSize(document.body);
    const windowWidth = size?.width || window.innerWidth;
    const [progress, setProgress] = useState<DepositProgress>();
    useImperativeHandle(ref, () => ({
      update: setProgress,
      visible: !!progress,
    }));

    const [width, content] = useMemo(() => {
      if (!progress) return [500, null];
      if (progress.status === 'Submitting') {
        return [
          500,
          <div className={styles['deposit-progress']}>
            <Spin spinning style={{ width: '100%' }} size="large" />
            <span className={styles['deposit-progress-title']}>
              {t('Submitting...')}
            </span>
          </div>,
        ];
      }
      const columns = [
        {
          title: t('Vault'),
          key: 'vault',
          render: (_, it) => (
            <Address
              address={it[0].split('-')[0]}
              style={{ justifyContent: 'flex-start', padding: 0 }}
              link
            />
          ),
        },
        {
          title: t('Chain'),
          key: 'chain',
          render: (_, it) => {
            const chainId = it[0].split('-')[1];
            return (
              <span
                className={classNames('flex-center', styles['chain'])}
                style={{ justifyContent: 'flex-start' }}
              >
                {ChainMap[chainId]?.icon && (
                  <img src={ChainMap[chainId].icon} alt="" />
                )}
                {ChainMap[chainId]?.name}
              </span>
            );
          },
        },
        {
          title: t('Transaction Hash'),
          key: 'hash',
          render: (_, it) => (
            <HashDisplay chainId={props.chainId}>{it[1]?.hash}</HashDisplay>
          ),
        },
        {
          title: t('Position Status'),
          key: 'status',
          render: (_, it) => {
            const ref = PositionsService.PositionStatusRefs[it[1].status];
            if (!ref) return '-';
            return (
              <span
                className="flex-center"
                style={{ justifyContent: 'flex-start' }}
              >
                <span
                  className={styles['deposit-progress-status-dec']}
                  style={{ color: ref.color }}
                />
                {ref.label(t)}
              </span>
            );
          },
        },
        {
          title: t('Failed Reason'),
          key: 'error',
          render: (_, it) => {
            const msg = getErrorMsg(it[1].error);
            if (!msg) return '-';
            return (
              <>
                {t('QuoteIds')}: {it[1].quoteIds.join(', ')}
                <MsgDisplay style={{ maxWidth: 250 }}>{msg}</MsgDisplay>
              </>
            );
          },
        },
      ] as XRequired<
        ColumnProps<NonNullable<DepositProgress['details']>[0]>,
        'key' | 'render'
      >[];
      const renderTable = (width: number, $columns = columns) => {
        if (!progress.details) return <></>;
        if (width / window.winScale > windowWidth - 24 / window.winScale) {
          return (
            <div className={styles['deposit-progress-list']}>
              {progress.details.map((it, i) => (
                <div
                  className={styles['progress-info']}
                  key={`${it?.[1]?.hash}-${Math.random()}`}
                >
                  {columns.map((c, i) => (
                    <div
                      className={classNames(styles['progress-info-item'], {
                        [styles['row']]: i === columns.length - 1,
                      })}
                      key={c.key}
                    >
                      <div className={styles['label']}>{calcVal(c.title)}</div>
                      <div className={styles['value']}>
                        {calcVal(c.render, it, it, i) as never}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        }
        return (
          <Table
            className={styles['deposit-progress-table']}
            rowKey={(it) => `${it?.[1]?.hash}-${Math.random()}`}
            dataSource={progress.details.map(
              (it) => ({ 0: it[0], 1: it[1] }) as typeof it,
            )}
            columns={$columns}
            pagination={false}
          />
        );
      };
      if (progress.status === 'SubmitFailed') {
        return [
          700,
          <div className={styles['deposit-progress']}>
            <IconWrong style={{ color: '#eb4476' }} />
            <span className={styles['deposit-progress-title']}>
              {t('Submit Failed')}
            </span>
            {renderTable(
              700,
              columns.filter(
                (it) => !['hash', 'status'].includes(it.key as never),
              ),
            )}
          </div>,
        ];
      }
      if (progress.status === 'QueryResult') {
        return [
          900,
          <div className={styles['deposit-progress']}>
            <Spin spinning style={{ width: '100%' }} size="large" />
            <span className={styles['deposit-progress-title']}>
              {t('Querying Result...')}
            </span>
            {renderTable(900)}
          </div>,
        ];
      }
      if (progress.status === 'Partial Failed') {
        return [
          900,
          <div className={styles['deposit-progress']}>
            <IconRight style={{ color: '#f8d748' }} />
            <span
              className={styles['deposit-progress-title']}
              dangerouslySetInnerHTML={{
                __html: t(
                  'Partial Success.  <a href="{{url}}">Go to position page</a> to see your successful records',
                  {
                    url: `/positions${window.location.search.replace(
                      /([?&])tab=[^&]+/,
                      '$1',
                    )}`,
                  },
                ),
              }}
            />
            {renderTable(900)}
          </div>,
        ];
      }
      if (progress.status === 'All Failed') {
        return [
          900,
          <div className={styles['deposit-progress']}>
            <IconWrong style={{ color: '#eb4476' }} />
            <span className={styles['deposit-progress-title']}>
              {t('Failed')}
            </span>
            {renderTable(900)}
          </div>,
        ];
      }
      return [
        900,
        <div className={styles['deposit-progress']}>
          <IconRight style={{ color: '#50d113' }} />
          <span
            className={styles['deposit-progress-title']}
            dangerouslySetInnerHTML={{
              __html: t(
                'Deposit successful. <a href="{{url}}">Go to position page</a> to see your successful records',
                {
                  url: `/positions${window.location.search.replace(
                    /([?&])tab=[^&]+/,
                    '$1',
                  )}`,
                },
              ),
            }}
          />
          {renderTable(900, columns.slice(0, 3))}
        </div>,
      ];
    }, [progress, props.chainId, t, windowWidth]);

    return (
      <Modal
        visible={!!progress}
        onCancel={() => setProgress(undefined)}
        maskClosable={false}
        // closable={isFinalStatus}
        closeOnEsc={false}
        centered
        footer={null}
        width={width / window.winScale}
      >
        {content}
      </Modal>
    );
  },
);
