import { useMemo, useRef } from 'react';
import { Modal, Table, Toast } from '@douyinfe/semi-ui';
import { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import { ProductType, RiskType } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import {
  PositionInfo,
  PositionsService,
  TransactionInfo,
} from '@sofa/services/positions';
import { PositionStatus } from '@sofa/services/the-graph';
import { amountFormatter } from '@sofa/utils/amount';
import { displayExpiry, next8h } from '@sofa/utils/expiry';
import { displayTenor, formatDuration } from '@sofa/utils/time';
import { useRequest } from 'ahooks';
import classNames from 'classnames';
import dayjs from 'dayjs';

import { Comp as IconInfo } from '@/assets/icon-info.svg';
import AsyncButton from '@/components/AsyncButton';
import CEmpty from '@/components/Empty';
import {
  ProductTypeRefs,
  RiskTypeRefs,
} from '@/components/ProductSelector/enums';
import ProgressBar from '@/components/ProgressBar';
import { Time } from '@/components/TimezoneSelector';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';
import { Calculation } from '@/pages/products/components/Calculation';
import { ProjectedReturns } from '@/pages/products/components/ProjectedReturns';
import { TicketTypeOptions } from '@/pages/products/components/TicketTypeSelector';

import {
  PositionClaimProgress,
  PositionClaimProgressRef,
} from '../ClaimProgress';
import { judgeSettled } from '../PositionCard';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'PositionDetails');

export interface PositionDetailsProps {
  position: PositionInfo;
  onStatusChange?(status: PositionStatus): void;
}

const PositionDetails = (props: PositionDetailsProps) => {
  const [t] = useTranslation('PositionDetails');
  const position = props.position;
  const product = position.product;
  const leftTime = useMemo(
    () => product.expiry * 1000 - Date.now(),
    [product.expiry],
  );
  const hasExpired = leftTime < 0;
  const hasSettled = useMemo(
    () => judgeSettled(product.expiry),
    [product.expiry],
  );

  const isWin = useMemo(() => {
    if (position.product.vault.riskType === RiskType.RISKY)
      return +position.amounts.redeemable! >= 0;
    return +position.amounts.redeemable! - +position.amounts.own >= 0;
  }, [
    position.amounts.own,
    position.product.vault.riskType,
    position.amounts.redeemable,
  ]);

  const observationStart = useMemo(
    () => next8h(position.createdAt * 1000) / 1000,
    [position.createdAt],
  );

  const goTimePercentage = useMemo(() => {
    const totalTime = (product.expiry - observationStart) * 1000;
    return Math.min(1 - leftTime / totalTime, 0.8);
  }, [leftTime, observationStart, product.expiry]);

  const infos = useMemo(
    () => [
      {
        label: t('Expiration'),
        value: displayExpiry(product.expiry * 1000),
      },
      {
        label: t('Term'),
        value: displayTenor(
          dayjs(product.expiry * 1000).diff(observationStart * 1000, 'day'),
          t,
        ),
      },
      {
        label: t('Underlying'),
        value: product.vault.forCcy.replace(/^w/i, ''),
      },
      {
        label: t('Price Range'),
        value: product.anchorPrices
          .map((it) => amountFormatter(it, 0))
          .join('-'),
      },
      {
        label: t('Subscription Time'),
        value: (
          <Time time={observationStart * 1000} format="YYYY-MM-DD HH:mm" />
        ),
      },
      ...([ProductType.BearSpread, ProductType.BullSpread].includes(
        product.vault.productType,
      )
        ? [
            {
              label: t('Settlement Time'),
              value: (
                <Time time={product.expiry * 1000} format="YYYY-MM-DD HH:mm" />
              ),
            },
            ...(position.triggerPrice
              ? [
                  {
                    label: t('Settlement Price'),
                    value: `$${amountFormatter(position.triggerPrice)}`,
                  },
                ]
              : []),
          ]
        : [
            {
              label: t('Before'),
              value: (
                <Time time={product.expiry * 1000} format="YYYY-MM-DD HH:mm" />
              ),
            },
            ...(position.triggerPrice
              ? [
                  {
                    label: (
                      <>
                        {t('Knock-out Time')}
                        {product.vault.riskType !== RiskType.RISKY &&
                          leftTime > 0 && (
                            <IconInfo
                              className={styles['icon-info']}
                              onClick={() =>
                                Toast.info(
                                  `Your trade has been knocked out. You will be able to make a claim on the settlement date.`,
                                )
                              }
                            />
                          )}
                      </>
                    ),
                    value: (
                      <Time
                        time={position.triggerTime! * 1000}
                        format="YYYY-MM-DD HH:mm"
                      />
                    ),
                  },
                  {
                    label: t('Knock-out Price'),
                    value: `$${amountFormatter(position.triggerPrice)}`,
                  },
                ]
              : []),
          ]),
    ],
    [
      leftTime,
      position.triggerPrice,
      position.triggerTime,
      product.anchorPrices,
      product.expiry,
      product.vault.forCcy,
      observationStart,
      product.vault.productType,
      product.vault.riskType,
      t,
    ],
  );

  const params = useMemo(
    () => ({
      positionId: position.id,
      vault: product.vault.vault,
      productType: product.vault.productType,
      chainId: product.vault.chainId,
      owner: position.wallet,
      term: position.claimParams.term,
      expiry: product.expiry,
      anchorPrices: position.claimParams.anchorPrices,
      collateralAtRiskPercentage:
        position.claimParams.collateralAtRiskPercentage,
      isMaker: position.claimParams.maker,
    }),
    [
      position.claimParams.anchorPrices,
      position.claimParams.collateralAtRiskPercentage,
      position.id,
      position.claimParams.term,
      position.claimParams.maker,
      position.wallet,
      product.expiry,
      product.vault.chainId,
      product.vault.productType,
      product.vault.vault,
    ],
  );

  const { data: transactions, loading } = useRequest(
    () =>
      PositionsService.transactions({
        chainId: useWalletStore.getState().chainId,
        vault: position.product.vault.vault,
        minter: position.wallet,
        expiry: position.claimParams.expiry,
        term: position.claimParams.term,
        anchorPrices: position.claimParams.anchorPrices,
        collateralAtRiskPercentage:
          position.claimParams.collateralAtRiskPercentage,
      }),
    {
      onSuccess: (res) => console.info('Transactions of Position', res.list),
    },
  );

  const ticketMeta = useMemo(
    () => TicketTypeOptions.find((it) => it.value === product.vault.depositCcy),
    [product.vault.depositCcy],
  );
  const precision = useMemo(() => 4, []);

  const detailsColumns = useMemo(
    () =>
      [
        {
          title: t('Buy at'),
          key: 'createdAt',
          render: (_, it) => (
            <Time time={it.createdAt * 1000} format="YYYY-MM-DD HH:mm" />
          ),
        },
        ...(ticketMeta
          ? ([
              {
                title: t('Tickets'),
                key: 'tickets',
                render: (_, it) =>
                  amountFormatter(+it.amounts.own / ticketMeta.per, 0),
              },
            ] as ColumnProps<TransactionInfo>[])
          : []),
        {
          title:
            product.vault.riskType === RiskType.RISKY
              ? t('Cost')
              : t('Deposit Principal'),
          key: 'cost',
          render: (_, it) =>
            `${amountFormatter(it.amounts.own, precision)} ${
              it.product.vault.depositCcy
            }`,
        },
        {
          title:
            product.vault.riskType === RiskType.RISKY ? t('Win') : t('PnL'),
          key: 'win',
          render: (_, it) =>
            Date.now() < product.expiry * 1000
              ? '-'
              : `${amountFormatter(
                  product.vault.riskType === RiskType.RISKY
                    ? it.amounts.redeemable
                    : Number(it.amounts.redeemable) - +it.amounts.own,
                  precision,
                )} ${it.product.vault.depositCcy}`,
        },
      ] as ColumnProps<TransactionInfo>[],
    [precision, product.expiry, product.vault.riskType, t, ticketMeta],
  );

  const claimProgressRef = useRef<PositionClaimProgressRef>(null);

  return (
    <>
      <div
        className={classNames(styles['infos-wrapper'], {
          [styles['has-progress']]: !position.claimed && !hasExpired,
        })}
      >
        <div className={styles['infos']}>
          {infos.map((it, i) => (
            <div className={styles['info']} key={`${String(it.label)}-${i}`}>
              <span className={styles['label']}>{it.label}</span>
              <span className={styles['value']}>{it.value}</span>
            </div>
          ))}
          <Calculation
            quote={{ ...position, ...product, timestamp: position.createdAt }}
            className={styles['calculation']}
          />
        </div>
        {product.vault.riskType === RiskType.RISKY && hasSettled && (
          <div
            className={styles['result-badge']}
            style={{
              background: isWin ? 'var(--color-rise)' : 'var(--color-fall)',
            }}
          >
            {isWin ? t('WIN') : t('LOSE')}
          </div>
        )}
        {position.claimed ? (
          <span className={styles['status']}>{t('CLAIMED')}</span>
        ) : hasExpired ? (
          !!Number(position.amounts.redeemable) &&
          hasSettled && (
            <AsyncButton
              type="primary"
              theme="solid"
              className={styles['btn']}
              onClick={() =>
                PositionsService.claim((it) => {
                  claimProgressRef.current?.update(it);
                  if (it.status === 'Success')
                    props.onStatusChange?.(PositionStatus.CLAIMED);
                }, params)
              }
            >
              {(loading) => (loading ? t('CLAIMING') : t('CLAIM'))}
            </AsyncButton>
          )
        ) : (
          <div className={styles['progress']}>
            <ProgressBar percent={Math.max(goTimePercentage, 0.1)}>
              <span className={styles['left-time']}>
                {formatDuration(leftTime).replace(/\d+s/, '') || '0m'}
              </span>
            </ProgressBar>
          </div>
        )}
      </div>
      {(Number(transactions?.list?.length) > 1 ||
        product.vault.riskType === RiskType.RISKY) && (
        <div className={styles['details']}>
          <div className={styles['total']}>
            {product.vault.riskType !== RiskType.PROTECTED && ticketMeta && (
              <div className={styles['ticket-item']}>
                <div className={styles['label']}>{t('Total Tickets Buy')}</div>
                <div className={styles['value']}>
                  {amountFormatter(+position.amounts.own / ticketMeta.per, 0)}{' '}
                  {t('Tickets')}
                </div>
              </div>
            )}
            <div className={styles['ticket-item']}>
              <div className={styles['label']}>
                {product.vault.riskType !== RiskType.PROTECTED
                  ? t('Total Cost')
                  : t('Total Deposit')}
              </div>
              <div className={styles['value']}>
                {amountFormatter(position.amounts.own, 0)}{' '}
                {product.vault.depositCcy}
              </div>
            </div>
            <div className={styles['ticket-item']}>
              <div className={styles['label']}>
                {product.vault.riskType !== RiskType.PROTECTED
                  ? t('Total Win')
                  : t('Total PnL')}
              </div>
              <div
                className={styles['value']}
                style={{
                  color: Number(position.amounts.redeemable)
                    ? 'var(--color-rise)'
                    : 'var(--color-fall)',
                }}
              >
                {amountFormatter(
                  product.vault.riskType !== RiskType.PROTECTED
                    ? position.amounts.redeemable
                    : Number(position.amounts.redeemable) -
                        +position.amounts.own,
                  precision,
                )}{' '}
                {product.vault.depositCcy}
              </div>
            </div>
          </div>
          <Table
            className={styles['transactions']}
            columns={detailsColumns}
            dataSource={transactions?.list}
            pagination={false}
            loading={loading}
            rowKey={(it) => it?.hash || String(Math.random())}
            empty={<CEmpty />}
          />
        </div>
      )}
      {!position.claimParams.maker && (
        <div className={styles['returns']}>
          <ProjectedReturns data={position} />
        </div>
      )}
      <PositionClaimProgress
        ref={claimProgressRef}
        chainId={product.vault.chainId}
        riskType={product.vault.riskType}
        positions={[position]}
      />
    </>
  );
};

const PositionDetailsModal = (
  props: Partial<PositionDetailsProps> & {
    visible?: boolean;
    onHide?(): void;
  },
) => {
  const position = props.position;
  const product = position?.product;
  const riskTypeRef =
    product?.vault.riskType && RiskTypeRefs[product.vault.riskType];
  const productTypeRef =
    product?.vault.productType && ProductTypeRefs[product.vault.productType];

  // const leverageInfo = useAsyncMemo(
  //   async () =>
  //     product?.vault && position?.createdAt
  //       ? ProductsService.vaultLeverageInfo(product.vault, position.createdAt)
  //       : undefined,
  //   [product?.vault, position?.createdAt],
  // );

  return (
    <Modal
      className={styles['position-details-modal']}
      width={'min(1080px, 100vw - 24px)'}
      title={
        <>
          {riskTypeRef?.icon}
          {productTypeRef?.alias}
          {product?.vault.riskType === RiskType.LEVERAGE && (
            <span className={styles['badge-leverage']}>Lev.</span>
          )}
        </>
      }
      visible={props.visible}
      onCancel={props.onHide}
      footer={null}
      closeOnEsc={false}
    >
      {position && (
        <PositionDetails
          position={position}
          onStatusChange={props.onStatusChange}
        />
      )}
    </Modal>
  );
};

export default PositionDetailsModal;
