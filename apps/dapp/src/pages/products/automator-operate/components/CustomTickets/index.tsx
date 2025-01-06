import { Fragment, useEffect, useMemo, useState } from 'react';
import { Button, DatePicker } from '@douyinfe/semi-ui';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { ContractsService, RiskType } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import {
  ProductQuoteParams,
  ProductsService,
  ProductType,
  VaultInfo,
} from '@sofa/services/products';
import { amountFormatter } from '@sofa/utils/amount';
import { day8h, next8h, pre8h } from '@sofa/utils/expiry';
import { currQuery } from '@sofa/utils/history';
import { useAsyncMemo, useLazyCallback } from '@sofa/utils/hooks';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';

import { Comp as IconDel } from '@/assets/icon-del.svg';
import { Comp as IconPlus } from '@/assets/icon-plus.svg';
import AmountInput from '@/components/AmountInput';
import { CCYSelector } from '@/components/CCYSelector';
import PriceRangeInput from '@/components/PriceRangeInput';
import { ProductTypeSelector } from '@/components/ProductSelector';
import { ProductTypeRefs } from '@/components/ProductSelector/enums';
import { Time } from '@/components/TimezoneSelector';

import { useHoverTicket, useProductsState } from '../../../automator-store';
import { TicketTypeOptions } from '../../../components/TicketTypeSelector';

import styles from './index.module.scss';

export interface CustomTicketProps {
  active?: boolean;
  product: PartialRequired<ProductQuoteParams, 'vault' | 'id'>;
  setActive?(active: boolean): void;
  automatorVault: Pick<AutomatorVaultInfo, 'vault' | 'chainId' | 'depositCcy'>;
}

const defaultProductType = ProductType.BullSpread;
const defaultForCCY: VaultInfo['forCcy'] = 'BTC';

const CustomTicket = (props: CustomTicketProps) => {
  const [t] = useTranslation('CustomTicket');

  const [productType, setProductType] = useState<ProductType>(
    props.product.vault.productType || defaultProductType,
  );
  const customDev = useMemo(() => currQuery()['custom-dev'] === '1', []);

  const [forCcy, setForCcy] = useState<VaultInfo['forCcy']>(
    props.product.vault.forCcy || defaultForCCY,
  );
  const [riskType] = [RiskType.RISKY];

  const vault = useMemo(
    () =>
      ProductsService.findVault(ContractsService.vaults, {
        chainId: props.product.vault.chainId,
        productType,
        riskType,
        forCcy,
        depositCcy: props.product.vault.depositCcy,
      }),
    [
      forCcy,
      productType,
      riskType,
      props.product.vault.chainId,
      props.product.vault.depositCcy,
    ],
  );

  const onChange = useLazyCallback((val: Partial<ProductQuoteParams>) => {
    useProductsState.updateCart(props.automatorVault, {
      ...props.product,
      ...val,
    });
  });

  useEffect(() => {
    if (vault && vault != props.product.vault) {
      useProductsState.updateCart(props.automatorVault, {
        ...props.product,
        vault,
      });
    }
  }, [vault]);

  const ticketMeta = useMemo(
    () => TicketTypeOptions.find((it) => it.value === vault?.depositCcy),
    [vault?.depositCcy],
  );

  const quoteInfo = useProductsState(
    (state) => state.quoteInfos[ProductsService.productKey(props.product)],
  );

  const expiries = useAsyncMemo(
    async () => vault && ProductsService.genExpiries(vault),
    [vault],
  );
  const { min, max } = useMemo(() => {
    if (!expiries?.length) return { min: next8h(), max: pre8h() };
    return {
      min: customDev ? next8h(undefined, 1) : expiries[0],
      max: customDev ? next8h(undefined, 180) : expiries[expiries.length - 1],
    };
  }, [customDev, expiries]);

  useEffect(() => {
    if (!vault) {
      console.warn(
        `cannot find vault: ${props.product.vault.chainId} ${props.product.vault.vault}`,
      );
      return;
    }
    if (!ticketMeta) {
      console.warn(`cannot find ticketMeta: ${vault.depositCcy}`);
    }
  }, [vault, ticketMeta]);
  if (!vault || !ticketMeta) return <></>;

  return (
    <div
      className={classNames(styles['custom-ticket'], {
        [styles['active']]: props.active,
      })}
      onMouseEnter={() => {
        props.setActive?.(true);
      }}
      id={`custom-ticket-${props.product.id}`}
    >
      <div className={styles['left']}>
        <div className={styles['form-item']}>
          {props.active ? (
            <div className={styles['value']}>
              <CCYSelector
                prefix={t({
                  enUS: 'Anchor',
                })}
                localState={[forCcy, setForCcy]}
              />
            </div>
          ) : (
            <div className={styles['value']}>
              {CCYService.ccyConfigs[forCcy]?.name || '-'}
            </div>
          )}
          <div className={styles['label']}>
            {t({
              enUS: 'Anchor',
            })}
          </div>
        </div>
        <div className={styles['form-item']}>
          {props.active ? (
            <div className={styles['value']}>
              <ProductTypeSelector localState={[productType, setProductType]} />
            </div>
          ) : (
            <div className={styles['value']}>
              {ProductTypeRefs[productType]?.label(t) || '-'}
            </div>
          )}
          <div className={styles['label']}>
            {t({
              enUS: 'Product',
            })}
          </div>
        </div>
        <div className={styles['form-item']}>
          {props.active ? (
            <div className={styles['value']}>
              <PriceRangeInput
                forCcy={vault.forCcy}
                value={props.product.anchorPrices}
                prefixes={
                  vault.productType !== ProductType.DNT
                    ? undefined
                    : [t('B1'), t('B2')]
                }
                onChange={(v) =>
                  v?.every(Boolean) &&
                  onChange({ anchorPrices: v as (string | number)[] })
                }
                mustIncludeAtm={vault.productType === ProductType.DNT}
              />
            </div>
          ) : (
            <div className={styles['value']}>
              {props.product.anchorPrices?.map((it, i) => (
                <Fragment key={it}>
                  {i !== 0 && <span style={{ padding: '0 4px' }}>-</span>}
                  {it}
                </Fragment>
              )) || ' - '}
            </div>
          )}
          <div className={styles['label']}>{t('Price Range')}</div>
        </div>
        <div className={styles['form-item']}>
          {props.active ? (
            <div
              className={classNames(
                styles['value'],
                styles['date-picker-wrapper'],
              )}
            >
              <DatePicker
                key={props.product?.expiry}
                className={styles['date-picker']}
                dropdownClassName={styles['date-picker-dropdown']}
                type="date"
                // presets={[
                //   { text: '7d', value: next8h(undefined, 8) },
                //   { text: '14d', value: next8h(undefined, 15) },
                //   { text: '21d', value: next8h(undefined, 22) },
                //   { text: '30d', value: next8h(undefined, 31) },
                // ].map((it) => ({ ...it, start: it.value, end: it.value }))}
                disabledDate={(d) => {
                  if (!d) return true;
                  const curr8h = next8h(d.getTime());
                  return curr8h < min || curr8h > max;
                }}
                presetPosition="top"
                defaultValue={
                  props.product?.expiry
                    ? props.product.expiry * 1000
                    : undefined
                }
                onChange={(v) => onChange({ expiry: day8h(Number(v)) / 1000 })}
              />
              {!!props.product?.expiry && (
                <span className={styles['term']}>
                  {Math.abs(dayjs().diff(props.product.expiry * 1000, 'day'))}d
                </span>
              )}
            </div>
          ) : (
            <div className={styles['value']}>
              {props.product.expiry ? (
                <>
                  <Time
                    time={props.product.expiry * 1000}
                    format="YYYY-MM-DD HH:mm"
                  />

                  <span className={styles['term']}>
                    {Math.abs(dayjs().diff(props.product.expiry * 1000, 'day'))}
                    d
                  </span>
                </>
              ) : (
                '-'
              )}
            </div>
          )}
          <div className={styles['label']}>
            {vault.productType === ProductType.DNT ? t('Before') : t('Expiry')}
          </div>
        </div>
      </div>
      <div className={styles['right']}>
        <div className={styles['form-item']}>
          <div className={styles['label']}>
            <span
              className={styles['return']}
              style={{
                color:
                  Number(quoteInfo?.amounts.maxRedeemable) -
                  Number(quoteInfo?.amounts.minRedeemable)
                    ? 'var(--color-rise)'
                    : 'rgba(0,0,0,0.2)',
              }}
            >
              <span className={styles['icon']}>{t('Win')}</span>
              <span className={styles['amount']}>
                {amountFormatter(
                  Number(quoteInfo?.amounts.maxRedeemable) -
                    Number(quoteInfo?.amounts.minRedeemable),
                  2,
                )}
              </span>
              <span className={styles['unit']}>{vault.depositCcy}</span>
            </span>
            <span className={styles['rch-return']}>
              <span className={styles['amount']}>
                <span>+</span>{' '}
                {amountFormatter(quoteInfo?.amounts.rchAirdrop, 2)}
              </span>
              <span className={styles['unit']}>
                RCH
                <span>| {t('Est.')}</span>
              </span>
            </span>
          </div>
          <div className={styles['value']}>
            {props.active ? (
              <AmountInput
                className={styles['amount-input']}
                type="internal"
                tick={1}
                min={1}
                max={999}
                value={
                  props.product.depositAmount
                    ? +props.product.depositAmount / ticketMeta.per
                    : undefined
                }
                onChange={(v) =>
                  onChange({ depositAmount: ticketMeta.per * (Number(v) || 1) })
                }
                onBlur={(e) => {
                  const val = (e.target as HTMLInputElement)?.value;
                  if (!val) onChange({ depositAmount: 0 });
                }}
                suffix={
                  <span className={styles['unit-in-input']}>
                    {t('Tickets')}
                  </span>
                }
              />
            ) : (
              <>
                {props.product.depositAmount
                  ? +props.product.depositAmount / ticketMeta.per
                  : '-'}{' '}
                {t('Tickets')}
              </>
            )}
            <div
              className={styles['icon-del']}
              onClick={() =>
                useProductsState.updateCart(props.automatorVault, {
                  ...props.product,
                  depositAmount: 0,
                })
              }
            >
              <IconDel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomTickets = (props: {
  vault: Pick<AutomatorVaultInfo, 'vault' | 'chainId' | 'depositCcy'>;
}) => {
  const ticketMeta = useMemo(
    () => TicketTypeOptions.find((it) => it.value === props.vault.depositCcy)!,
    [props.vault.depositCcy],
  );
  useEffect(() => {
    if (!ticketMeta) {
      throw new Error(`cannot find ticketMeta: ${[props.vault.depositCcy]}`);
    }
  }, [ticketMeta]);
  const init = useLazyCallback(
    () =>
      ({
        id: nanoid(),
        vault: {
          vault: '',
          forCcy: defaultForCCY,
          productType: defaultProductType,
          chainId: props.vault.chainId,
          depositCcy: props.vault.depositCcy,
        },
        depositAmount: ticketMeta.per,
      }) as PartialRequired<ProductQuoteParams, 'id' | 'vault'>,
  );
  const products = useProductsState((state) => {
    return (
      state.cart[`${props.vault.vault.toLowerCase()}-${props.vault.chainId}`] ||
      []
    );
    // const list =
    //   state.cart[`${props.vault.vault.toLowerCase()}-${props.vault.chainId}`] ||
    //   [];
    // if (!list.length) return [];
    // const recommendedList =
    //   state.recommendedList[
    //     `${props.vault.vault.toLowerCase()}-${props.vault.chainId}`
    //   ];
    // const key = (it: Partial<ProductQuoteParams>) =>
    //   [it.expiry, it.anchorPrices].flat().join('-');
    // const recommendedListMap = arrToDict(recommendedList, key);
    // return list.filter((it) => !recommendedListMap[key(it)]);
  });
  const [hoverTicket, setHoverTicket] = useHoverTicket(props.vault);

  useEffect(() => {
    if (!products.length) {
      const product = init();
      useProductsState.updateCart(props.vault, product);
      setHoverTicket(product.id);
    }
  }, [init, products.length, setHoverTicket]);

  return (
    <div className={styles['custom-tickets']}>
      {products?.map((it) => (
        <CustomTicket
          key={it.id}
          automatorVault={props.vault}
          product={it}
          active={hoverTicket?.ticket.id === it.id}
          setActive={(v) => setHoverTicket(v ? it.id : undefined)}
        />
      ))}
      <Button
        block
        size="large"
        className={classNames('btn-ghost', styles['btn-add'])}
        onClick={() => useProductsState.updateCart(props.vault, init())}
      >
        <IconPlus />
      </Button>
    </div>
  );
};

export default CustomTickets;
