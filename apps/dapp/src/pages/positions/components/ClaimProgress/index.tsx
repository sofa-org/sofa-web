import {
  forwardRef,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Modal, Spin, Table } from '@douyinfe/semi-ui';
import { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import { RiskType } from '@sofa/services/base-type';
import { ChainMap } from '@sofa/services/chains';
import { useTranslation } from '@sofa/services/i18n';
import {
  PosClaimProgress,
  PositionInfo,
  PositionsService,
} from '@sofa/services/positions';
import { amountFormatter } from '@sofa/utils/amount';
import { displayExpiry } from '@sofa/utils/expiry';
import { calcVal, getErrorMsg, isNullLike } from '@sofa/utils/fns';
import { arrToDict, simplePlus } from '@sofa/utils/object';
import { useRequest, useSize } from 'ahooks';
import classNames from 'classnames';

import { Comp as IconRight } from '@/assets/icon-right.svg';
import { Comp as IconWrong } from '@/assets/icon-wrong.svg';
import Address from '@/components/Address';
import CEmpty from '@/components/Empty';
import { HashDisplay } from '@/components/HashDisplay';
import { MsgDisplay } from '@/components/MsgDisplay';
import {
  ProductTypeRefs,
  RiskTypeRefs,
} from '@/components/ProductSelector/enums';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'PosClaimButton');

export interface PositionClaimProgressRef {
  visible: boolean;
  update(progress?: PosClaimProgress): void;
}

interface PositionClaimProgressProps {
  chainId: number;
  riskType: RiskType;
  positions: PositionInfo[];
}

export const PositionClaimProgress = forwardRef<
  PositionClaimProgressRef,
  PositionClaimProgressProps
>((props, ref) => {
  const [t] = useTranslation('PosClaimButton');
  const size = useSize(document.body);
  const windowWidth = size?.width || window.innerWidth;
  const [progress, setProgress] = useState<PosClaimProgress>();
  useImperativeHandle(ref, () => ({
    update: setProgress,
    visible: !!progress,
  }));

  const positions = useRef(props.positions);
  useEffect(() => {
    positions.current = props.positions;
  }, [props.positions]);
  const { data = props.positions } = useRequest(
    async () => {
      if (
        !positions.current.length ||
        !['Partial Failed', 'Success'].includes(progress?.status || '')
      ) {
        return positions.current;
      }
      return PositionsService.history(
        {
          chainId: props.chainId,
          riskType: props.riskType,
          owner: useWalletStore.getState().address,
          claimed: true,
        },
        { limit: Math.min(Math.ceil(positions.current.length * 1.5), 200) },
      ).then((res) => {
        const obj = arrToDict(res.list, 'id');
        positions.current = positions.current.map((it) => {
          const item = obj[it.id];
          if (!item) return it;
          return item;
        });
        return positions.current;
      });
    },
    { refreshDeps: [progress?.status], pollingInterval: 5000 },
  );

  const syncing = useMemo(
    () => data.some((it) => isNullLike(it.amounts.redeemable)),
    [data],
  );

  const [width, content] = useMemo(() => {
    if (!progress) return [500, null];
    if (progress.status === 'Submitting') {
      return [
        500,
        <div className={styles['claim-progress']}>
          <Spin spinning style={{ width: '100%' }} size="large" />
          <span className={styles['claim-progress-title']}>
            {t('Claiming...')}
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
        render: (_, it) =>
          it[1]?.hash?.map((hash) => (
            <HashDisplay key={hash} chainId={props.chainId}>
              {hash}
            </HashDisplay>
          )) || '-',
      },
      {
        title: t('Claim Status'),
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
                className={styles['claim-progress-status-dec']}
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
              <MsgDisplay style={{ maxWidth: 250 }}>
                {t('PositionIds')}: {it[1].positionIds.join(', ')}
              </MsgDisplay>
              <MsgDisplay style={{ maxWidth: 250 }}>{msg}</MsgDisplay>
            </>
          );
        },
      },
    ] as XRequired<
      ColumnProps<NonNullable<PosClaimProgress['details']>[0]>,
      'key' | 'render'
    >[];
    const renderTable = (
      width: number,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      $columns: ColumnProps<any>[] = columns,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dataSource: any[] | undefined = progress.details?.map(
        (it) => ({ 0: it[0], 1: it[1] }) as typeof it,
      ),
      footer?: ReactNode,
    ) => {
      if (!dataSource?.length) return <></>;
      if (width / window.winScale > windowWidth - 24 / window.winScale) {
        return (
          <div className={styles['claim-progress-list']}>
            {footer}
            {dataSource.slice(0, 200).map((it, i) => (
              <div
                className={styles['progress-info']}
                key={`${it?.[1]?.hash}-${Math.random()}`}
              >
                {$columns.map((c, i) => (
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
          key={footer ? '1' : '0'}
          className={styles['claim-progress-table']}
          rowKey={(it) => `${it?.[1]?.hash}-${Math.random()}`}
          dataSource={dataSource.slice(0, 200)}
          columns={$columns}
          empty={<CEmpty />}
          footer={footer}
          pagination={false}
        />
      );
    };
    if (progress.status === 'SubmitFailed') {
      return [
        700,
        <div className={styles['claim-progress']}>
          <IconWrong style={{ color: '#eb4476' }} />
          <span className={styles['claim-progress-title']}>
            {t('Claim Failed')}
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
        <div className={styles['claim-progress']}>
          <Spin spinning style={{ width: '100%' }} size="large" />
          <span className={styles['claim-progress-title']}>
            {t('Querying Result...')}
          </span>
          {renderTable(900)}
        </div>,
      ];
    }
    if (progress.status === 'All Failed') {
      return [
        900,
        <div className={styles['claim-progress']}>
          <IconWrong style={{ color: '#eb4476' }} />
          <span className={styles['claim-progress-title']}>{t('Failed')}</span>
          {renderTable(900)}
        </div>,
      ];
    }
    const totalAmounts = data.reduce(
      (pre, it) => {
        if (!it) return pre;
        if (it.amounts.redeemable) {
          pre[it.product.vault.depositCcy] = simplePlus(
            it.amounts.redeemable,
            pre[it.product.vault.depositCcy],
          );
        } else pre[it.product.vault.depositCcy] = undefined;
        return pre;
      },
      {} as Record<string, number | undefined>,
    );
    const $columns = [
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
        title: t('RCH Airdrop'),
        render: (_, record) =>
          `${amountFormatter(record.amounts.rchAirdrop, 2)} RCH`,
      },
      {
        title: t('Claimed'),
        render: (_, record) =>
          record.amounts.redeemable ? (
            `${amountFormatter(record.amounts.redeemable, 2)} ${
              record.product.vault.depositCcy
            }`
          ) : (
            <span style={{ opacity: 0.5 }}>{t('Syncing...')}</span>
          ),
      },
    ] as ColumnProps<PositionInfo>[];

    return [
      900,
      <div className={styles['claim-progress']}>
        <IconRight style={{ color: '#50d113' }} />
        <span
          className={styles['claim-progress-title']}
          dangerouslySetInnerHTML={{
            __html: t(
              '<a href="{{url}}">Go to history page</a> to see your successful records',
              {
                url: `/positions/orders${window.location.search.replace(
                  /([?&])tab=[^&]+/,
                  '$1',
                )}`,
              },
            ),
          }}
        />
        {renderTable(
          900,
          $columns,
          data,
          <div className={styles['amounts']}>
            <div className={styles['label']}>{t('Total')}</div>
            {Object.entries(totalAmounts).map((it) => (
              <div className={styles['amount']} key={it[0]}>
                <span className={styles['ccy']}>{it[0]}</span>
                <span className={styles['val']}>
                  {!syncing ? (
                    amountFormatter(it[1], 2)
                  ) : (
                    <span style={{ opacity: 0.5 }}>{t('Syncing...')}</span>
                  )}
                </span>
              </div>
            ))}
          </div>,
        )}
      </div>,
    ];
  }, [data, progress, props.chainId, syncing, t, windowWidth]);

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
});
