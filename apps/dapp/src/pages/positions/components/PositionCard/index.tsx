import { useMemo, useRef } from 'react';
import { useTranslation } from '@sofa/services/i18n';
import { PositionInfo, PositionsService } from '@sofa/services/positions';
import { ProductType, RiskType } from '@sofa/services/products';
import { PositionStatus } from '@sofa/services/the-graph';
import { amountFormatter } from '@sofa/utils/amount';
import { displayExpiry, MsIntervals, next8h } from '@sofa/utils/expiry';
import { displayTenor, formatDuration } from '@sofa/utils/time';
import classNames from 'classnames';
import dayjs from 'dayjs';

import AsyncButton from '@/components/AsyncButton';
import {
  ProductTypeRefs,
  RiskTypeRefs,
} from '@/components/ProductSelector/enums';
import { addI18nResources } from '@/locales';
import { TicketTypeOptions } from '@/pages/products/components/TicketTypeSelector';

import {
  PositionClaimProgress,
  PositionClaimProgressRef,
} from '../ClaimProgress';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'PositionCard');

export interface PositionCardProps {
  position: PositionInfo;
  onStatusChange?(status: PositionStatus): void;
  onClick?(): void;
}

export const BUFFER_TIME_FOR_SETTLEMENT = MsIntervals.min * 10;
export function judgeSettled(expiry: number) {
  return Date.now() - expiry * 1000 > BUFFER_TIME_FOR_SETTLEMENT;
}

const ProtectedAmounts = (
  props: PositionCardProps & { onClaim(): Promise<unknown> },
) => {
  const [t] = useTranslation('PositionCard');
  const position = props.position;
  const product = position.product;

  const hasExpired = useMemo(
    () => product.expiry * 1000 < Date.now(),
    [product.expiry],
  );

  const hasSettled = useMemo(
    () => judgeSettled(product.expiry),
    [product.expiry],
  );

  const pnl = useMemo(
    () => +position.amounts.redeemable! - +position.amounts.own,
    [position.amounts.own, position.amounts.redeemable],
  );
  const minRedemption = position.amounts.minRedeemable;
  const maxRedemption = position.amounts.maxRedeemable;

  const pnlPrecision = useMemo(
    () => (product.vault.depositCcy.startsWith('USD') ? 2 : 4),
    [product.vault.depositCcy],
  );

  const claimable = !!position.amounts.redeemable && hasSettled;

  return !hasExpired ? (
    <div className={styles['amounts']}>
      <div className={styles['amount']}>
        {amountFormatter(position.amounts.own, pnlPrecision)}{' '}
        {product.vault.depositCcy}
      </div>
      <div className={styles['amount']}>
        <span className={styles['label']}>{t('Min Payout')}</span>{' '}
        <span>
          {amountFormatter(minRedemption, pnlPrecision)}{' '}
          <span className={styles['unit']}>{product.vault.depositCcy}</span>
        </span>
      </div>
      <div className={styles['amount']}>
        <span className={styles['label']}>{t('Max Payout')}</span>{' '}
        <span>
          {amountFormatter(maxRedemption, pnlPrecision)}{' '}
          <span className={styles['unit']}>{product.vault.depositCcy}</span>
        </span>
      </div>
    </div>
  ) : (
    <div className={styles['amounts']}>
      <div className={classNames(styles['amount'], styles['amount-for-claim'])}>
        {amountFormatter(+position.amounts.own + pnl, pnlPrecision)}{' '}
        {product.vault.depositCcy}
        {claimable && (
          <span className={styles['badge-est']}>| {t('Est.')}</span>
        )}
      </div>
      {claimable && (
        <div className={styles['btns']}>
          <AsyncButton
            type="primary"
            theme="solid"
            onClick={(e) => {
              e.stopPropagation();
              return props.onClaim();
            }}
          >
            {(loading) => (!loading ? t('Claim') : t('Claiming...'))}
          </AsyncButton>
        </div>
      )}
    </div>
  );
};

const RiskyAmounts = (
  props: PositionCardProps & { onClaim(): Promise<unknown> },
) => {
  const [t] = useTranslation('PositionCard');
  const position = props.position;
  const product = position.product;

  const hasExpired = useMemo(
    () => product.expiry * 1000 < Date.now(),
    [product.expiry],
  );

  const hasSettled = useMemo(
    () => judgeSettled(product.expiry),
    [product.expiry],
  );

  const pnlPrecision = useMemo(
    () => (product.vault.depositCcy.startsWith('USD') ? 2 : 4),
    [product.vault.depositCcy],
  );

  const ticketMeta = useMemo(
    () =>
      TicketTypeOptions.find((it) => it.value === product.vault.depositCcy)!,
    [product.vault.depositCcy],
  );

  const claimable = !!position.amounts.redeemable && hasSettled;

  return !hasExpired ? (
    <div className={styles['amounts']}>
      <div className={styles['amount']}>
        {amountFormatter(+position.amounts.own / ticketMeta.per, 0)}{' '}
        {t('Tickets')}
      </div>
      <div className={styles['amount']}>
        <span className={styles['label']}>{t('Cost')}</span>{' '}
        <span>
          {amountFormatter(position.amounts.own, pnlPrecision)}{' '}
          <span className={styles['unit']}>{product.vault.depositCcy}</span>
        </span>
      </div>
      <div className={styles['amount']}>
        <span className={styles['label']}>{t('Maximum Payout')}</span>{' '}
        <span>
          {amountFormatter(position.amounts.maxRedeemable, pnlPrecision)}{' '}
          <span className={styles['unit']}>{product.vault.depositCcy}</span>
        </span>
      </div>
    </div>
  ) : (
    <div className={styles['amounts']}>
      <div className={styles['amount']}>
        {amountFormatter(+position.amounts.own / ticketMeta.per, 0)}{' '}
        {t('Tickets')}
      </div>
      <div className={styles['amount']}>
        <span className={styles['label']}>{t('Cost')}</span>{' '}
        <span>
          {amountFormatter(position.amounts.own, pnlPrecision)}{' '}
          <span className={styles['unit']}>{product.vault.depositCcy}</span>
        </span>
      </div>
      {claimable && (
        <div className={styles['btns']}>
          <AsyncButton
            type="primary"
            theme="solid"
            onClick={(e) => {
              e.stopPropagation();
              return props.onClaim();
            }}
          >
            {(loading) => (loading ? t('CLAIM') : t('CLAIMING...'))}
          </AsyncButton>
        </div>
      )}
    </div>
  );
};

const PositionCard = (props: PositionCardProps) => {
  const [t] = useTranslation('PositionCard');
  const position = props.position;
  const product = position.product;
  const riskTypeRef = RiskTypeRefs[product.vault.riskType];
  const productTypeRef = ProductTypeRefs[product.vault.productType];
  const icon = useMemo(
    () =>
      productTypeRef.icon(
        product.vault.riskType,
        !product.vault.depositCcy.startsWith('USD'),
      ),
    [product.vault.depositCcy, product.vault.riskType, productTypeRef],
  );
  // const leverageInfo = useAsyncMemo(
  //   () => ProductsService.vaultLeverageInfo(product.vault, position.createdAt),
  //   [product.vault, position.createdAt],
  // );

  const pnlPrecision = useMemo(
    () => (product.vault.depositCcy.startsWith('USD') ? 2 : 4),
    [product.vault.depositCcy],
  );

  const hasExpired = useMemo(
    () => product.expiry * 1000 < Date.now(),
    [product.expiry],
  );

  const hasSettled = useMemo(
    () => judgeSettled(product.expiry),
    [product.expiry],
  );

  const leftTime = useMemo(
    () => product.expiry * 1000 - Date.now(),
    [product.expiry],
  );
  const pnl = useMemo(
    () => +position.amounts.redeemable! - +position.amounts.own,
    [position.amounts.own, position.amounts.redeemable],
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

  const params = useMemo(
    () => ({
      positionId: position.id,
      vault: product.vault.vault,
      productType: product.vault.productType,
      chainId: product.vault.chainId,
      owner: position.owner,
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
      position.owner,
      product.expiry,
      product.vault.chainId,
      product.vault.productType,
      product.vault.vault,
    ],
  );

  const claimProgressRef = useRef<PositionClaimProgressRef>(null);

  return (
    <>
      <div
        className={classNames(styles['card'], {
          [styles['has-rch-amount']]: true,
        })}
        onClick={() => props.onClick?.()}
      >
        <div
          className={classNames(styles['product'], {
            [styles['has-expired']]: hasExpired,
          })}
          style={{ background: icon.color }}
        >
          <div className={styles['img']}>
            <img src={icon.icon} alt="" />
            <img src={icon.icon} alt="" />
          </div>
          {!hasSettled ? (
            <span className={styles['count-down']}>
              {formatDuration(leftTime).replace(/\d+s/, '') || '0m'}
            </span>
          ) : (
            <span
              className={styles['pnl']}
              style={{
                color: isWin ? 'var(--color-rise)' : 'var(--color-fall)',
              }}
            >
              <span className={styles['range']}>
                {(() => {
                  if (product.vault.productType === ProductType.DNT)
                    return position.takerAllocationRate === 1 &&
                      !position.claimParams.maker
                      ? t('In Range')
                      : t('Out of Range');
                  if (!isWin) return '';
                  return product.vault.riskType !== RiskType.RISKY
                    ? t('Profits')
                    : t('Payout');
                })()}
                {/* {product.vault.riskType !== RiskType.RISKY &&
                position.takerAllocationRate === 0 && (
                  <span>({t('protected')})</span>
                )} */}
              </span>
              {product.vault.riskType !== RiskType.RISKY ? (
                <>
                  {pnl >= 0 ? '+' : ''}
                  {amountFormatter(pnl, pnlPrecision)}{' '}
                  {product.vault.depositCcy}
                </>
              ) : position.amounts.redeemable ? (
                <>
                  {amountFormatter(position.amounts.redeemable, pnlPrecision)}{' '}
                  {product.vault.depositCcy}
                </>
              ) : (
                t('Lose')
              )}
            </span>
          )}
          <div className={styles['infos']}>
            <span className={styles['expiry']}>
              {displayExpiry(product.expiry * 1000)}
            </span>
            <span className={styles['expiry']}>
              {displayTenor(
                dayjs(product.expiry * 1000).diff(
                  next8h(position.createdAt * 1000),
                  'day',
                ),
                t,
              )}
            </span>
            <span className={styles['prices']}>
              {product.anchorPrices
                .map((it) => amountFormatter(it, 0))
                .join('-')}
            </span>
          </div>
          <div className={styles['risk-type']}>
            {productTypeRef.alias}_{product.vault.forCcy.replace(/^W/i, '')}
            {product.vault.riskType === RiskType.LEVERAGE && (
              <span className={styles['badge-leverage']}>Lev.</span>
            )}
            {riskTypeRef.icon}
          </div>
        </div>
        {product.vault.riskType !== RiskType.RISKY ? (
          <ProtectedAmounts
            {...props}
            onClaim={() => {
              return PositionsService.claim((it) => {
                claimProgressRef.current?.update(it);
                if (it.status === 'Success')
                  props.onStatusChange?.(PositionStatus.CLAIMED);
              }, params);
            }}
          />
        ) : (
          <RiskyAmounts
            {...props}
            onClaim={() => {
              return PositionsService.claim((it) => {
                claimProgressRef.current?.update(it);
                if (it.status === 'Success')
                  props.onStatusChange?.(PositionStatus.CLAIMED);
              }, params);
            }}
          />
        )}
        {Date.now() >
          next8h(position.createdAt * 1000) + MsIntervals.min * 10 &&
          !position.claimParams.maker && (
            <div className={styles['rch-amount']}>
              {+position.amounts.rchAirdrop >= 0 ? '+' : ''}
              {amountFormatter(position.amounts.rchAirdrop, 2)} RCH
            </div>
          )}
      </div>

      <PositionClaimProgress
        ref={claimProgressRef}
        chainId={product.vault.chainId}
        riskType={product.vault.riskType}
        positions={[position]}
      />
    </>
  );
};

export default PositionCard;
