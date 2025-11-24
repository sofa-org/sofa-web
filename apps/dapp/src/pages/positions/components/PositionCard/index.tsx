import { useMemo, useRef } from 'react';
import { CCYService } from '@sofa/services/ccy';
import { useTranslation } from '@sofa/services/i18n';
import {
  PositionsService,
  TransactionProgress,
} from '@sofa/services/positions';
import { ProductType, RiskType } from '@sofa/services/products';
import { PositionStatus } from '@sofa/services/the-graph';
import { amountFormatter } from '@sofa/utils/amount';
import { displayExpiry, MsIntervals, next8h } from '@sofa/utils/expiry';
import { useLazyCallback } from '@sofa/utils/hooks';
import { displayTenor, formatDuration } from '@sofa/utils/time';
import classNames from 'classnames';
import dayjs from 'dayjs';

import AmountDisplay from '@/components/AmountDisplay';
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

import DualPositionCard from './Dual/DualPositionCard';
import { PositionCardProps, usePositionSettled } from './common';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'PositionCard');

const ProtectedAmounts = (
  props: PositionCardProps & { onClaim(): Promise<unknown> },
) => {
  const [t] = useTranslation('PositionCard');
  const position = props.position;
  const product = position.product;
  const vault = product.vault;

  const hasSettled = usePositionSettled(position);

  const pnl = useMemo(
    () => +position.amounts.redeemable! - +position.amounts.own,
    [position.amounts.own, position.amounts.redeemable],
  );
  const minRedemption = position.amounts.minRedeemable;
  const maxRedemption = position.amounts.maxRedeemable;

  const pnlPrecision = useMemo(
    () => (vault.depositCcy.startsWith('USD') ? 2 : 4),
    [vault.depositCcy],
  );

  const claimable = Number(position.amounts.redeemable) > 0 && hasSettled;

  return !hasSettled ? (
    <div
      className={classNames(styles['amounts'], {
        [styles['has-deposit-base-ccy']]: !!vault.depositBaseCcy,
      })}
    >
      <div className={styles['amount']}>
        <span>
          <AmountDisplay
            amount={position.amounts.own}
            precision={pnlPrecision}
          />{' '}
          {vault.realDepositCcy ?? vault.depositCcy}
        </span>
      </div>
      {!!(vault.depositBaseCcy && props.showBaseCcyEst) && (
        <div className={styles['base-ccy-amount-own']}>
          ≈{' '}
          {amountFormatter(
            position.convertedCalculatedInfoByDepositBaseCcy?.amounts?.own,
            CCYService.ccyConfigs[vault.depositBaseCcy]?.precision,
          )}{' '}
          {vault.depositBaseCcy}
        </div>
      )}
      <div className={styles['amount']}>
        <span className={styles['label']}>{t('Min Payout')}</span>{' '}
        <span>
          <AmountDisplay amount={minRedemption} precision={pnlPrecision} />{' '}
          <span className={styles['unit']}>
            {vault.realDepositCcy ?? vault.depositCcy}
          </span>
        </span>
      </div>
      {!!(vault.depositBaseCcy && props.showBaseCcyEst) && (
        <div className={styles['base-ccy-amount']}>
          ≈{' '}
          {amountFormatter(
            position.convertedCalculatedInfoByDepositBaseCcy?.amounts
              ?.minRedeemable,
            CCYService.ccyConfigs[vault.depositBaseCcy]?.precision,
          )}{' '}
          {vault.depositBaseCcy}
        </div>
      )}
      <div className={styles['amount']}>
        <span className={styles['label']}>{t('Max Payout')}</span>{' '}
        <span>
          <AmountDisplay amount={maxRedemption} precision={pnlPrecision} />{' '}
          <span className={styles['unit']}>
            {vault.realDepositCcy ?? vault.depositCcy}
          </span>
        </span>
      </div>
      {!!(vault.depositBaseCcy && props.showBaseCcyEst) && (
        <div className={styles['base-ccy-amount']}>
          ≈{' '}
          {amountFormatter(
            position.convertedCalculatedInfoByDepositBaseCcy?.amounts
              ?.maxRedeemable,
            CCYService.ccyConfigs[vault.depositBaseCcy]?.precision,
          )}{' '}
          {vault.depositBaseCcy}
        </div>
      )}
    </div>
  ) : (
    <div
      className={classNames(styles['amounts'], {
        [styles['has-deposit-base-ccy']]:
          !!vault.depositBaseCcy && props.showBaseCcyEst,
      })}
    >
      <div className={classNames(styles['amount'], styles['amount-for-claim'])}>
        <AmountDisplay
          amount={+position.amounts.own + pnl}
          precision={pnlPrecision}
        />{' '}
        {vault.realDepositCcy ?? vault.depositCcy}
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
  const vault = product.vault;

  const hasSettled = usePositionSettled(position);

  const pnlPrecision = useMemo(
    () => (vault.depositCcy.startsWith('USD') ? 2 : 4),
    [vault.depositCcy],
  );

  const ticketMeta = useMemo(
    () => TicketTypeOptions.find((it) => it.value === vault.depositCcy)!,
    [vault.depositCcy],
  );

  const claimable = Number(position.amounts.redeemable) > 0 && hasSettled;

  return !hasSettled ? (
    <div className={styles['amounts']}>
      {ticketMeta ? (
        <div className={styles['amount']}>
          {amountFormatter(+position.amounts.own / ticketMeta.per, 0)}{' '}
          {t('Tickets')}
        </div>
      ) : (
        <div className={styles['amount']}>
          {amountFormatter(+position.amounts.own)}{' '}
          {vault.realDepositCcy ?? vault.depositCcy}
        </div>
      )}
      <div className={styles['amount']}>
        <span className={styles['label']}>{t('Cost')}</span>{' '}
        <span>
          <AmountDisplay
            amount={position.amounts.own}
            precision={pnlPrecision}
          />{' '}
          <span className={styles['unit']}>
            {vault.realDepositCcy ?? vault.depositCcy}
          </span>
        </span>
      </div>
      <div className={styles['amount']}>
        <span className={styles['label']}>{t('Maximum Payout')}</span>{' '}
        <span>
          <AmountDisplay
            amount={position.amounts.maxRedeemable}
            precision={pnlPrecision}
          />{' '}
          <span className={styles['unit']}>
            {vault.realDepositCcy ?? vault.depositCcy}
          </span>
        </span>
      </div>
    </div>
  ) : (
    <div className={styles['amounts']}>
      {ticketMeta ? (
        <div className={styles['amount']}>
          {amountFormatter(+position.amounts.own / ticketMeta.per, 0)}{' '}
          {t('Tickets')}
        </div>
      ) : (
        <div className={styles['amount']}>
          {amountFormatter(+position.amounts.own)}{' '}
          {vault.realDepositCcy ?? vault.depositCcy}
        </div>
      )}
      <div className={styles['amount']}>
        <span className={styles['label']}>{t('Cost')}</span>{' '}
        <span>
          <AmountDisplay
            amount={position.amounts.own}
            precision={pnlPrecision}
          />{' '}
          <span className={styles['unit']}>
            {vault.realDepositCcy ?? vault.depositCcy}
          </span>
        </span>
      </div>
      {claimable && !props.isAutomator && (
        <div className={styles['btns']}>
          <AsyncButton
            type="primary"
            theme="solid"
            onClick={(e) => {
              e.stopPropagation();
              return props.onClaim();
            }}
          >
            {(loading) => (!loading ? t('CLAIM') : t('CLAIMING...'))}
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
  const vault = product.vault;

  const riskTypeRef = RiskTypeRefs[vault.riskType];
  const productTypeRef = ProductTypeRefs[vault.productType];
  const icon = useMemo(() => {
    if (vault.riskType == RiskType.DUAL) {
      // 特殊样式，没有 icon 定义
      return undefined;
    }
    return productTypeRef.icon(
      vault.riskType,
      !(vault.realDepositCcy ?? vault.depositCcy).startsWith('USD'),
    );
  }, [vault.realDepositCcy, vault.depositCcy, vault.riskType, productTypeRef]);
  // const leverageInfo = useAsyncMemo(
  //   () => ProductsService.vaultLeverageInfo(vault, position.createdAt),
  //   [vault, position.createdAt],
  // );

  const pnlPrecision = useMemo(
    () => (vault.depositCcy.startsWith('USD') ? 2 : 4),
    [vault.depositCcy],
  );

  const hasExpired = useMemo(
    () => product.expiry * 1000 < Date.now(),
    [product.expiry],
  );

  const hasSettled = usePositionSettled(position);

  const leftTime = useMemo(
    () => product.expiry * 1000 - Date.now(),
    [product.expiry],
  );
  const pnl = useMemo(
    () => +position.amounts.redeemable! - +position.amounts.own,
    [position.amounts.own, position.amounts.redeemable],
  );
  const isWin = useMemo(() => {
    if (vault.riskType === RiskType.RISKY)
      return +position.amounts.redeemable! > 0;
    return +position.amounts.redeemable! - +position.amounts.own >= 0;
  }, [position.amounts.own, vault.riskType, position.amounts.redeemable]);

  const params = useMemo(
    () => ({
      positionId: position.id,
      vault: vault.vault,
      productType: vault.productType,
      chainId: vault.chainId,
      owner: position.wallet,
      term: position.claimParams.term,
      expiry: product.expiry,
      anchorPrices: position.claimParams.anchorPrices,
      collateralAtRiskPercentage:
        position.claimParams.collateralAtRiskPercentage,
      isMaker: position.claimParams.maker,
      riskType: vault.riskType,
    }),
    [
      position.id,
      position.wallet,
      position.claimParams.term,
      position.claimParams.anchorPrices,
      position.claimParams.collateralAtRiskPercentage,
      position.claimParams.maker,
      vault.vault,
      vault.productType,
      vault.chainId,
      vault.riskType,
      product.expiry,
    ],
  );

  const claimProgressRef = useRef<PositionClaimProgressRef>(null);

  const handleClaim = useLazyCallback(async () => {
    const cb = (it: TransactionProgress) => {
      claimProgressRef.current?.update(it);
      if (it.status === 'Success')
        props.onStatusChange?.(PositionStatus.CLAIMED);
    };
    return PositionsService.claim(cb, params);
  });
  if (vault.riskType == RiskType.DUAL) {
    return (
      <DualPositionCard
        {...props}
        claimProgressRef={claimProgressRef}
        handleClaim={handleClaim}
      />
    );
  }
  if (!icon) {
    throw new Error(`icon must be non-empty`);
  }
  return (
    <>
      <div
        className={classNames(styles['card'], {
          [styles['has-rch-amount']]: !position.claimParams.maker,
          [styles['has-deposit-base-ccy']]:
            !!vault.depositBaseCcy && props.showBaseCcyEst,
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
          {!hasExpired ? (
            <span className={styles['count-down']}>
              {formatDuration(leftTime).replace(/\d+s/, '') || '0m'}
            </span>
          ) : !hasSettled ? (
            <span
              className={styles['pnl']}
              style={{ color: 'var(--color-rise)' }}
            >
              <span className={styles['range']} />
              {t('Settling...')}
            </span>
          ) : (
            <span
              className={classNames(styles['pnl'], {
                [styles['lose']]: !isWin && hasSettled,
              })}
              style={{
                color: isWin ? 'var(--color-rise)' : 'var(--color-fall)',
              }}
            >
              <span className={styles['range']}>
                {(() => {
                  if (vault.productType === ProductType.DNT)
                    return Number(position.takerAllocationRate) === 1 &&
                      !position.claimParams.maker
                      ? t('In Range')
                      : t('Out of Range');
                  if (!isWin) return '';
                  return vault.riskType !== RiskType.RISKY
                    ? t('Profits')
                    : t('Payout');
                })()}
              </span>
              {vault.riskType !== RiskType.RISKY ? (
                <>
                  <AmountDisplay amount={pnl} precision={pnlPrecision} signed />{' '}
                  {vault.realDepositCcy ?? vault.depositCcy}
                </>
              ) : Number(position.amounts.redeemable) ? (
                <>
                  <AmountDisplay
                    amount={position.amounts.redeemable}
                    precision={pnlPrecision}
                  />{' '}
                  {vault.realDepositCcy ?? vault.depositCcy}
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
              {product.anchorPrices.join('-')}
            </span>
          </div>
          <div className={styles['risk-type']}>
            {props.isAutomator
              ? productTypeRef.label3(t, vault.tradeSide)
              : productTypeRef.alias}
            _{vault.forCcy.replace(/^W/i, '')}
            {vault.riskType === RiskType.LEVERAGE && (
              <span className={styles['badge-leverage']}>Lev.</span>
            )}
            {riskTypeRef.icon}
          </div>
        </div>
        {vault.riskType !== RiskType.RISKY ? (
          <ProtectedAmounts {...props} onClaim={handleClaim} />
        ) : (
          <RiskyAmounts {...props} onClaim={handleClaim} />
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
        chainId={vault.chainId}
        riskType={vault.riskType}
        positions={[position]}
      />
    </>
  );
};

export default PositionCard;
