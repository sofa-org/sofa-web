import { useEffect, useMemo } from 'react';
import { useTranslation } from '@sofa/services/i18n';
import { ProductsService } from '@sofa/services/products';
import { amountFormatter, cvtAmountsInUsd } from '@sofa/utils/amount';
import { useLazyCallback } from '@sofa/utils/hooks';
import { simplePlus } from '@sofa/utils/object';
import classNames from 'classnames';

import { Comp as IconCart } from '@/assets/icon-cart.svg';
import { Comp as IconDel } from '@/assets/icon-del.svg';
import { useIndexPrices } from '@/components/IndexPrices/store';

import { useHoverTicket, useProductsState } from '../../../automator-store';
import { useTicketType } from '../../../components/TicketTypeSelector';
import CustomTickets from '../CustomTickets';
import InvestButton from '../InvestButton';

import styles from './index.module.scss';

const ProductLottery = (props: BaseProps & { onlyForm?: boolean }) => {
  const [t] = useTranslation('ProductLottery');
  const prices = useIndexPrices((state) => state.prices);
  const [ticket] = useTicketType();

  const { automatorVault: vault, cart } = useProductsState();
  const products = useProductsState(
    (state) =>
      (vault && state.cart[`${vault.vault.toLowerCase()}-${vault.chainId}`]) ||
      [],
  );
  const quoteInfos = useProductsState((state) =>
    (
      (vault && state.cart[`${vault.vault.toLowerCase()}-${vault.chainId}`]) ||
      []
    ).map((it) => state.quoteInfos[ProductsService.productKey(it)]),
  );
  const totalCost = useMemo(
    () =>
      simplePlus(
        ...products
          .filter((it) => !useProductsState.productValidator(it))
          .map((it) => it.depositAmount),
      ) || 0,
    [products],
  );

  const totalWin = useMemo(() => {
    const amount = simplePlus(
      ...quoteInfos.map((it) => it?.amounts.maxRedeemable),
    );
    const rchAmount = simplePlus(
      ...quoteInfos.map((it) => it?.amounts.rchAirdrop),
    );
    const usdtAmount =
      vault &&
      cvtAmountsInUsd(
        [
          [vault.depositCcy, amount],
          ['RCH', rchAmount],
        ],
        prices,
      );
    return { amount, rchAmount, usdtAmount };
  }, [prices, quoteInfos, vault]);

  const [hover, setHover] = useHoverTicket(vault);

  const position = useMemo(() => {
    if (!hover?.ticket.id) return undefined;
    const el = document.querySelector(`#custom-ticket-${hover.ticket.id}`);
    if (!el) return undefined;
    const kline = document.querySelector(`#kline-2`);
    if (!kline) return undefined;
    const klineRect = kline.getBoundingClientRect();
    const klineRightTop = { x: klineRect.x + klineRect.width, y: klineRect.y };
    const elRect = el.getBoundingClientRect();
    const elLeftTop = { x: elRect.x + 4, y: elRect.y + 4 };
    const elLeftBottom = { x: elRect.x + 4, y: elRect.y + elRect.height + 4 };
    return [
      {
        left: elLeftTop.x - klineRightTop.x,
        top: elLeftTop.y - klineRightTop.y,
      },
      {
        left: elLeftBottom.x - klineRightTop.x,
        top: elLeftBottom.y - klineRightTop.y,
      },
    ];
  }, [hover?.ticket.id]);

  return (
    <>
      <div className={styles['form']}>
        <div className={styles['content']}>
          {vault && <CustomTickets vault={vault} />}
        </div>
        <div className={styles['footer']}>
          <div className={styles['cart-brief']}>
            <div className={styles['left']}>
              <IconCart />
              <div className={styles['ticket']}>
                <span>
                  {ticket?.per} {ticket?.ccy}
                </span>
                {t('Per Ticket')}
              </div>
              <div className={styles['count']}>
                X<span>{ticket?.per && totalCost / ticket?.per}</span>
              </div>
              <div className={styles['amount']}>
                {t('Cost')}
                <span className={styles['label']}>
                  {amountFormatter(totalCost, ticket?.precision)}
                </span>
                {ticket?.ccy}
              </div>
            </div>
            <div className={styles['profits']}>
              <div className={styles['amount']}>
                🎯{t('Target')}
                <span className={styles['label']}>{t('Max Win')} </span>
                <span className={styles['win']}>
                  {amountFormatter(totalWin.amount, 2)}
                  <span className={styles['unit']}>{ticket?.ccy}</span>
                </span>
                <span className={styles['win-rch']}>
                  {amountFormatter(totalWin.rchAmount, 2)}
                  <span className={styles['unit']}>
                    RCH
                    <span>| {t('Est.')}</span>
                  </span>
                </span>
                <span className={styles['win-usdt']}>
                  ≈ {amountFormatter(totalWin.usdtAmount, 2)}
                  <span className={styles['unit']}>USDT</span>
                  <span className={styles['dec']}>| Estimated</span>
                </span>
              </div>
            </div>
          </div>
          {vault && (
            <div className={styles['btn-deposit']}>
              {!!products.length && vault && (
                <div
                  className={classNames(styles['icon-del'])}
                  onClick={() => useProductsState.clearCart(vault)}
                >
                  <IconDel />
                </div>
              )}
              <InvestButton
                vault={vault.vault.toLowerCase()}
                chainId={vault.chainId}
                depositCcy={vault.depositCcy}
                autoQuote
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const AutomatorTrade = (props: BaseProps & { onlyForm?: boolean }) => {
  return <ProductLottery {...props} />;
};

export default AutomatorTrade;
