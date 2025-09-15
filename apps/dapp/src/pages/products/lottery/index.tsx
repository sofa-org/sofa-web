import { useEffect, useMemo } from 'react';
import { ContractsService } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import { ProductsService, VaultInfo } from '@sofa/services/products';
import { amountFormatter, cvtAmountsInUsd } from '@sofa/utils/amount';
import { simplePlus } from '@sofa/utils/object';
import classNames from 'classnames';

import { Comp as IconCart } from '@/assets/icon-cart.svg';
import { Comp as IconDel } from '@/assets/icon-del.svg';
import { CCYSelector, useForCcySelect } from '@/components/CCYSelector';
import { useIndexPrices } from '@/components/IndexPrices/store';
import KLine from '@/components/KLine';
import {
  ProductTypeSelector,
  useProductSelect,
  useProjectChange,
  useRiskSelect,
} from '@/components/ProductSelector';
import { ProductTypeRefs } from '@/components/ProductSelector/enums';
import { Time } from '@/components/TimezoneSelector';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';
import BigWins from '@/pages/positions/components/BigWins';
import BuyingSpree from '@/pages/positions/components/BuyingSpree';

import CustomTickets from '../components/CustomTickets';
import { HowToPlay } from '../components/HowToPlay';
import InvestButton from '../components/InvestButton';
import ProductBanner from '../components/ProductBanner';
import ProductDesc from '../components/ProductDesc';
import RecommendedTickets from '../components/RecommendedTickets';
import TicketTypeSelector, {
  useTicketType,
} from '../components/TicketTypeSelector';
import { useHoverTicket, useProductsState } from '../store';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'ProductLottery');

const ProductLottery = (props: BaseProps & { onlyForm?: boolean }) => {
  const [t] = useTranslation('ProductLottery');
  const wallet = useWalletStore();
  const prices = useIndexPrices((state) => state.prices);
  const [forCcy] = useForCcySelect({
    acceptance: ['WBTC', 'WETH'],
  });
  const [project] = useProjectChange();
  const [riskType] = useRiskSelect(project);
  const [productType] = useProductSelect();
  const [ticket] = useTicketType(forCcy);
  const depositCcy = ticket?.value as VaultInfo['depositCcy'];

  const vault = useMemo(
    () =>
      ProductsService.findVault(ContractsService.vaults, {
        chainId: wallet.chainId,
        productType,
        riskType,
        forCcy,
        depositCcy,
        onlyForAutomator: false,
      }),
    [depositCcy, forCcy, productType, riskType, wallet.chainId],
  );

  const products = useProductsState(
    (state) =>
      (vault && state.cart[ContractsService.genVaultInputKey(vault)]) || [],
  );
  const quoteInfos = useProductsState((state) =>
    ((vault && state.cart[ContractsService.genVaultInputKey(vault)]) || []).map(
      (it) => state.quoteInfos[ProductsService.productKey(it)],
    ),
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

  useEffect(() => {
    if (
      hover?.ticket?.vault?.vault.toLowerCase() !== vault?.vault?.toLowerCase()
    ) {
      setHover(undefined);
    }
  }, [hover, setHover, vault]);

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
      <ProductBanner title={<></>} />
      <div className={styles['header']}>
        <ProductTypeSelector />
        <CCYSelector prefix={t('Anchor')} />
        <TicketTypeSelector forCcy={forCcy} />
        <HowToPlay className={styles['header-right']} />
      </div>
      <div className={styles['form']}>
        {vault && (
          <div className={styles['recommended-list']}>
            <RecommendedTickets vault={vault} />
          </div>
        )}
        <div className={styles['content']}>
          {vault && <CustomTickets vault={vault} />}
          <div className={styles['kline']}>
            <KLine
              id="kline-2"
              forCcy={forCcy}
              anchorPrices={hover?.ticket?.anchorPrices}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              relateElPositions={position as any}
            />
            {hover?.quoteInfo?.amounts.maxRedeemable && (
              <div className={styles['quote-infos']}>
                <span className={styles['quote-info-item']}>
                  {t('Expiry')}{' '}
                  <span>
                    <Time
                      time={+hover.ticket.expiry! * 1000}
                      format="YYYY-MM-DD HH:mm"
                    />
                  </span>
                </span>
                <span
                  className={styles['quote-info-item']}
                  dangerouslySetInnerHTML={{
                    __html:
                      ProductTypeRefs[productType]?.returnSituationsDesc(t).max,
                  }}
                />
                <span className={styles['quote-info-item']}>
                  {t('Will win')}{' '}
                  <span style={{ color: 'var(--color-rise)' }}>
                    {amountFormatter(hover.quoteInfo.amounts.maxRedeemable, 2)}{' '}
                    {vault?.realDepositCcy ?? vault?.depositCcy}
                  </span>
                  <span className={styles['win-rch']}>
                    {amountFormatter(hover.quoteInfo.amounts.rchAirdrop, 2)} RCH
                  </span>
                </span>
              </div>
            )}
          </div>
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
              <InvestButton vault={vault} autoQuote />
            </div>
          )}
        </div>
      </div>
      {vault && (
        <ProductDesc
          className={styles['product-desc-wrapper']}
          product={quoteInfos.find(Boolean) || { vault }}
          prefixTabs={[
            {
              itemKey: 'big-wins',
              tab: t('Winning Tickets'),
              element: <BigWins />,
            },
            {
              itemKey: 'buying-spree',
              tab: t('Activity'),
              element: <BuyingSpree />,
            },
          ]}
          noReturnTab
        />
      )}
    </>
  );
};

export default ProductLottery;
