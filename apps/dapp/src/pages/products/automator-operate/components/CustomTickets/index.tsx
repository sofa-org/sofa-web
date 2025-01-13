import { Fragment, useEffect, useMemo, useState } from 'react';
import { Button, DatePicker, Table } from '@douyinfe/semi-ui';
import { AutomatorDetail } from '@sofa/services/automator';
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

import styles from './index.module.scss';

export interface CustomTicketProps {
  product: PartialRequired<ProductQuoteParams, 'vault' | 'id'>;
  setActive?(active: boolean): void;
  automatorVault: Pick<AutomatorVaultInfo, 'vault' | 'chainId' | 'depositCcy'>;
  automator: AutomatorDetail;
}

const defaultProductType = ProductType.BullSpread;
const defaultForCCY: VaultInfo['forCcy'] = 'BTC';

const TicketEditor = (props: CustomTicketProps) => {
  const [t] = useTranslation('AutomatorTrade');

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
        id: props.product.id,
        vault,
      });
    }
  }, [vault]);

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
  }, [vault]);

  const percentOfPool = useMemo(() => {
    return Math.round(
      (Number(props.product.depositAmount) /
        Number(props.automator.aumByVaultDepositCcy)) *
        100,
    );
  }, [props.product.depositAmount]);
  if (!vault) return <></>;

  return (
    <div
      className={classNames(styles['custom-ticket'], styles['active'])}
      // onClick={() => {
      //   props.setActive?.(false);
      // }}
      id={`custom-ticket-${props.product.id}`}
    >
      <div className={styles['left']}>
        <div className={styles['form-item']}>
          <div className={styles['value']}>
            <CCYSelector
              prefix={t({
                enUS: 'Anchor',
              })}
              localState={[forCcy, setForCcy]}
              afterChange={() => {
                onChange({
                  anchorPrices: undefined,
                });
              }}
            />
          </div>
        </div>
        <div className={classNames(styles['form-item'], styles['side'])}>
          <div className={styles['label']}>
            {t({
              enUS: 'Side',
            })}
          </div>
          <div className={styles['value']}>
            <ProductTypeSelector
              useRadioCard
              localState={[productType, setProductType]}
            />
            <span className={styles['current-icon']}>
              {ProductTypeRefs[productType]?.img}
            </span>
          </div>
        </div>
        <div className={classNames(styles['form-item'], styles['expiry'])}>
          <div className={styles['label']}>
            {vault.productType === ProductType.DNT ? t('Before') : t('Expiry')}
          </div>
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
              //   { text: '3d', value: next8h(undefined, 3) },
              //   { text: '7d', value: next8h(undefined, 8) },
              //   { text: '10d', value: next8h(undefined, 10) },
              //   { text: '14d', value: next8h(undefined, 14) },
              // ].map((it) => ({ ...it, start: it.value, end: it.value }))}
              disabledDate={(d) => {
                if (!d) return true;
                const curr8h = next8h(d.getTime());
                return curr8h < min || curr8h > max;
              }}
              presetPosition="top"
              defaultValue={
                props.product?.expiry ? props.product.expiry * 1000 : undefined
              }
              onChange={(v) => onChange({ expiry: day8h(Number(v)) / 1000 })}
            />
            {!!props.product?.expiry && (
              <span className={styles['term']}>
                {Math.abs(dayjs().diff(props.product.expiry * 1000, 'day'))}d
              </span>
            )}
          </div>
          {[3, 7, 10, 14].map((day) => (
            <span
              className={styles['preset']}
              onClick={() =>
                onChange({ expiry: next8h(undefined, day + 1) / 1000 })
              }
            >
              {day}d
            </span>
          ))}
        </div>
        <div className={classNames(styles['form-item'], styles['strikes'])}>
          <div className={styles['label']}>{t('Strikes')}</div>
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
        </div>

        <div className={styles['form-item']}>
          <div className={styles['label']}>
            {t({
              enUS: 'Max Acceptable Loss',
            })}
          </div>
          <div className={styles['value']}>
            <AmountInput
              className={styles['amount-input']}
              value={
                props.product.depositAmount
                  ? +props.product.depositAmount
                  : undefined
              }
              onChange={(v) => onChange({ depositAmount: v })}
              onBlur={(e) => {
                const val = (e.target as HTMLInputElement)?.value;
                if (!val) onChange({ depositAmount: 0 });
              }}
              suffix={
                <span className={styles['unit-in-input']}>
                  {props.product.vault.depositCcy}
                </span>
              }
            />
          </div>
        </div>
      </div>
      <div className={styles['right']}>
        <div className={styles['title']}>
          <span className={styles['side']}>
            {ProductTypeRefs[vault.productType]?.label(t)}
          </span>
          <span className={styles['expiry']}>
            {props.product?.expiry ? (
              <Time time={props.product?.expiry * 1000} format="YYYY-MM-DD" />
            ) : undefined}
          </span>
          <span className={styles['strikes']}>
            {props.product?.anchorPrices
              ? props.product?.anchorPrices.map((it, i) => (
                  <Fragment key={it}>
                    {i !== 0 && <span style={{ padding: '0 2px' }}>-</span>}
                    {it}
                  </Fragment>
                ))
              : undefined}
          </span>
          {props.product.expiry ? (
            <span className={styles['term']}>
              {t(
                {
                  enUS: '{{days}} Days',
                },
                {
                  days: Math.abs(
                    dayjs().diff(props.product.expiry * 1000, 'day'),
                  ),
                },
              )}
            </span>
          ) : undefined}
        </div>
        <div className={styles['scenarios']}>
          <div className={styles['ccy']}>
            <div className={styles['win']}>
              {ProductTypeRefs[productType]?.img}
              <span className={styles['price']}>
                {props.product.anchorPrices?.[1]}
              </span>
              <div className={styles['calc']}>
                <div className={styles['title']}>
                  {t({
                    enUS: 'Max Win',
                  })}
                </div>
                <span className={styles['digi']}>
                  {(quoteInfo &&
                    amountFormatter(quoteInfo.amounts.maxRedeemable, 2)) ||
                    undefined}
                </span>
                <span className={styles['unit']}>{vault.depositCcy}</span>
              </div>
            </div>
            <div className={styles['or']}>
              <span>
                {t({
                  enUS: 'Or',
                })}
              </span>
            </div>
            <div className={styles['lose']}>
              {ProductTypeRefs[productType]?.img}
              <span className={styles['price']}>
                {props.product.anchorPrices?.[0]}
              </span>
              <div className={styles['calc']}>
                <div className={styles['title']}>
                  {t({
                    enUS: 'Max Loss',
                  })}
                </div>
                <span className={styles['digi']}>
                  {(props.product.depositAmount &&
                    amountFormatter(props.product.depositAmount, 2)) ||
                    undefined}
                </span>
                <span className={styles['unit']}>{vault.depositCcy}</span>
                <div className={styles['desc']}>
                  {t(
                    {
                      enUS: '{{percent}}% of Pool Size',
                    },
                    {
                      percent: percentOfPool < 1 ? '<1' : percentOfPool,
                    },
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className={styles['plus']}>+</div>
          <div className={styles['rch']}>
            <span className={styles['digi']}>
              {amountFormatter(quoteInfo?.amounts.rchAirdrop, 2)}
            </span>
            <span className={styles['unit']}>RCH</span>
            <span className={styles['desc']}>{t('Est.')}</span>
          </div>
        </div>

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
  );
};

const CustomTickets = (props: {
  vault: Pick<AutomatorVaultInfo, 'vault' | 'chainId' | 'depositCcy'>;
  automator: AutomatorDetail;
}) => {
  const [t] = useTranslation('AutomatorTrade');
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
        depositAmount: 1,
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
  const quoteInfos = useProductsState((state) => state.quoteInfos);
  const [hoverTicket, setHoverTicket] = useHoverTicket(props.vault);
  useEffect(() => {
    console.log('hoverTicket', hoverTicket);
  }, [hoverTicket]);
  useEffect(() => {
    if (!products.length) {
      const product = init();
      useProductsState.updateCart(props.vault, product);
      setHoverTicket(product.id);
    }
  }, [init, products.length, setHoverTicket]);

  return (
    <div className={styles['custom-tickets']}>
      <Table<PartialRequired<ProductQuoteParams, 'vault' | 'id'>>
        columns={[
          // {
          //   title: t({
          //     enUS: 'Product',
          //   }),
          //   // TODO
          //   render: (_, it) => undefined,
          // },
          {
            title: t({
              enUS: 'Side',
            }),
            render: (_, it) => (
              <b>{ProductTypeRefs[it.vault.productType]?.label(t)}</b>
            ),
          },
          {
            title: t({
              enUS: 'Anchor',
            }),
            render: (_, it) => (
              <b>
                <img
                  src={CCYService.ccyConfigs[it.vault.forCcy]?.icon}
                  alt=""
                />
                {t(
                  {
                    enUS: '{{ccy}} Price',
                  },
                  {
                    ccy: CCYService.ccyConfigs[it.vault.forCcy]?.name,
                  },
                )}
              </b>
            ),
          },
          {
            title: t({
              enUS: 'Expiry',
            }),
            render: (_, it) =>
              it.expiry ? (
                <span>
                  <b>
                    <Time time={it.expiry * 1000} format="YYYY-MM-DD" />
                  </b>
                  <span className={styles['term']}>
                    {Math.abs(dayjs().diff(it.expiry * 1000, 'day'))}d
                  </span>
                </span>
              ) : (
                <span>-</span>
              ),
          },
          {
            title: t({
              enUS: 'Strikes',
            }),
            render: (_, it) =>
              it.anchorPrices ? (
                <span>
                  {it.anchorPrices.map((it, i) => (
                    <Fragment key={it}>
                      {i !== 0 && <span style={{ padding: '0 4px' }}>-</span>}
                      <b>{it}</b>
                    </Fragment>
                  ))}
                </span>
              ) : (
                <span>-</span>
              ),
          },
          {
            title: t({
              enUS: 'Max Acceptable Loss',
            }),
            render: (_, it) => {
              const q = quoteInfos[ProductsService.productKey(it)];
              return q ? (
                <>
                  <b>{amountFormatter(it.depositAmount, 2)}</b>
                  <span className={styles['unit']}>
                    {CCYService.ccyConfigs[it.vault.depositCcy]?.name ||
                      it.vault.depositCcy}
                  </span>
                </>
              ) : undefined;
            },
          },
          {
            title: t({
              enUS: 'Max Return',
            }),
            render: (_, it) => {
              const q = quoteInfos[ProductsService.productKey(it)];
              return q ? (
                <>
                  <b>{amountFormatter(q.amounts.maxRedeemable, 2)}</b>
                  <span className={styles['unit']}>
                    {CCYService.ccyConfigs[it.vault.depositCcy]?.name ||
                      it.vault.depositCcy}
                  </span>
                </>
              ) : undefined;
            },
          },
          {
            title: '',
            render: (_, it) => (
              <div
                className={styles['icon-del']}
                onClick={() =>
                  useProductsState.updateCart(props.vault, {
                    ...it,
                    depositAmount: 0,
                  })
                }
              >
                <IconDel />
              </div>
            ),
          },
        ]}
        dataSource={products}
        expandedRowKeys={hoverTicket ? [hoverTicket.ticket.id] : []}
        expandedRowRender={(it, idx) =>
          (it && (
            <TicketEditor
              key={it.id}
              automatorVault={props.vault}
              product={it}
              setActive={(v) => setHoverTicket(v ? it.id : undefined)}
              automator={props.automator}
            />
          )) ||
          undefined
        }
        rowKey={(it) => it?.id || ''}
        onRow={(it) => ({
          onClick: () => setHoverTicket(it?.id),
        })}
        pagination={false}
      />
      <div className={styles['btn-add-container']}>
        <Button
          block
          size="large"
          className={classNames('btn-ghost', styles['btn-add'])}
          onClick={() => useProductsState.updateCart(props.vault, init())}
        >
          <IconPlus />
        </Button>
      </div>
    </div>
  );
};

export default CustomTickets;
