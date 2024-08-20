import { useMemo } from 'react';
import { RiskType } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { PositionInfo } from '@sofa/services/positions';
import { amountFormatter, cvtAmountsInUsd } from '@sofa/utils/amount';
import { displayExpiry, next8h } from '@sofa/utils/expiry';
import { displayTenor } from '@sofa/utils/time';
import dayjs from 'dayjs';

import { useIndexPrices } from '@/components/IndexPrices/store';
import {
  ProductTypeRefs,
  RiskTypeRefs,
} from '@/components/ProductSelector/enums';
import { addI18nResources } from '@/locales';

import locale from '../WonderfulMoments/locale';

import { WonderfulMomentLevels } from './level';

import styles from './index.module.scss';

addI18nResources(locale, 'WonderfulMoment');

export interface WonderfulMomentCardProps {
  position: PositionInfo;
}

const WonderfulMomentCard = (props: WonderfulMomentCardProps) => {
  const [t] = useTranslation('WonderfulMoment');
  const prices = useIndexPrices((state) => state.prices);
  const position = props.position;
  const product = position.product;
  const riskTypeRef = RiskTypeRefs[product.vault.riskType];
  const productTypeRef = ProductTypeRefs[product.vault.productType];
  const productIcon = useMemo(
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

  const pnl = useMemo(
    () => +position.amounts.redeemable! - +position.amounts.own,
    [position.amounts.own, position.amounts.redeemable],
  );
  const levelRef = useMemo(() => {
    const returnInUsd = cvtAmountsInUsd(
      [
        [product.vault.depositCcy, pnl],
        ['RCH', position.amounts.rchAirdrop],
      ],
      prices,
    );
    return (
      WonderfulMomentLevels.find((it) => it.is(returnInUsd)) ||
      WonderfulMomentLevels[WonderfulMomentLevels.length - 1]
    );
  }, [pnl, product.vault.depositCcy, position.amounts.rchAirdrop, prices]);
  const pnlPrecision = useMemo(
    () => (product.vault.depositCcy.startsWith('USD') ? 2 : 5),
    [product.vault.depositCcy],
  );
  if (!levelRef) return <></>;
  return (
    <div className={styles['card']}>
      <div className={styles['profits']} style={{ background: levelRef.color }}>
        <img
          className={styles['product-icon']}
          src={productIcon.icon}
          alt="icon"
        />
        <span className={styles['level-icon']}>{levelRef.icon}</span>
        {product.vault.riskType === RiskType.RISKY ? (
          <div className={styles['profit']}>
            <span className={styles['value']}>
              {amountFormatter(position.amounts.redeemable, pnlPrecision)}
            </span>
            <span className={styles['unit']}>{product.vault.depositCcy}</span>
          </div>
        ) : (
          <div className={styles['profit']}>
            <span className={styles['value']}>
              {pnl >= 0 ? '+' : ''}
              {amountFormatter(pnl, pnlPrecision)}
            </span>
            <span className={styles['unit']}>{product.vault.depositCcy}</span>
          </div>
        )}
        <div className={styles['profit']}>
          <span className={styles['value']}>
            +{amountFormatter(position.amounts.rchAirdrop, 2)}
          </span>
          <span className={styles['unit']}>RCH</span>
        </div>

        <div className={styles['risk-type']}>
          {productTypeRef.alias}
          {product.vault.riskType === RiskType.LEVERAGE && (
            <span className={styles['badge-leverage']}>Lev.</span>
          )}
          {riskTypeRef.icon}
        </div>
      </div>
      <div className={styles['others']}>
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
            {product.anchorPrices.map((it) => amountFormatter(it, 0)).join('-')}
          </span>
        </div>
        <div className={styles['amounts']}>
          <div className={styles['amount']}>
            <span className={styles['label']}>
              {product.vault.riskType === RiskType.RISKY
                ? t('Cost')
                : t('Deposit')}
            </span>
            <span>
              {amountFormatter(position.amounts.own, pnlPrecision)}{' '}
              <span className={styles['unit']}>{product.vault.depositCcy}</span>
            </span>
          </div>
          {product.vault.riskType === RiskType.RISKY ? (
            <div className={styles['amount']}>
              <span className={styles['label']}>{t('Payout')}</span>
              <span>
                {amountFormatter(position.amounts.redeemable, pnlPrecision)}{' '}
                <span className={styles['unit']}>
                  {product.vault.depositCcy}
                </span>
              </span>
            </div>
          ) : (
            <div className={styles['amount']}>
              <span className={styles['label']}>{t('Profits')}</span>
              <span>
                +{amountFormatter(pnl, pnlPrecision)}{' '}
                <span className={styles['unit']}>
                  {product.vault.depositCcy}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WonderfulMomentCard;
