import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ProductType, VaultInfo } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { useTranslation } from '@sofa/services/i18n';
import { PositionInfo } from '@sofa/services/positions';
import { amountFormatter } from '@sofa/utils/amount';
import { simplePlus } from '@sofa/utils/object';
import classNames from 'classnames';

import { useIndexPrices } from '@/components/IndexPrices/store';
import { ProductTypeRefs } from '@/components/ProductSelector/enums';

import styles from './DualProjectReturns.module.scss';

export interface DualProfitRenderProps extends BaseProps {
  forCcy: VaultInfo['forCcy'] | VaultInfo['domCcy'];
  forCcyAmountWhenSuccessfulExecuted: number; // 要交换目标币种金额(如果成功兑换)
  forCcyExtraRewardWhenSuccessfulExecuted: number; // 要交换目标币种奖励金额(如果成功兑换)
  depositCcy: VaultInfo['depositCcy'];
  depositAmount: number; // 本金
  rchReturnAmount: number; // RCH 空投金额
  depositCcyExtraRewardWhenNoExecuted: number; // 如果没交换成功，得到的金额
  productType: VaultInfo['productType'];
}

export const DualProfitScenarios = (props: DualProfitRenderProps) => {
  const [t] = useTranslation('ProjectedReturns');
  const desc = useMemo(
    () => ProductTypeRefs[props.productType].dualDesc(t),
    [t, props.productType],
  );
  const rchConfig = CCYService.ccyConfigs['RCH'];
  const forCcyConfig = CCYService.ccyConfigs[props.forCcy];
  const depositCcyConfig = CCYService.ccyConfigs[props.depositCcy];
  const priceIndex = useIndexPrices();
  return (
    <div
      className={classNames(
        styles['profit-scenarios-wrapper'],
        props.className,
      )}
    >
      <div
        className={classNames(
          styles['profit-scenario-wrapper'],
          styles['executed'],
        )}
      >
        <div className={styles['title']}>
          <span className={styles['emoji']}>🎉</span>
          {desc.executed}
        </div>
        <div className={styles['subtitle']}>
          {t(
            {
              enUS: 'Receive {{amount}} {{crypto}} + {{rchAmount}} RCH',
            },
            {
              amount: amountFormatter(
                simplePlus(
                  props.forCcyAmountWhenSuccessfulExecuted,
                  props.forCcyExtraRewardWhenSuccessfulExecuted,
                ),
                forCcyConfig?.precision,
              ),
              crypto: forCcyConfig?.name || props.forCcy,
              rchAmount: amountFormatter(
                props.rchReturnAmount,
                rchConfig?.precision,
              ),
            },
          )}
          |
          {t({
            enUS: 'Est.',
            zhCN: '预估',
          })}
        </div>
        <div
          className={classNames(styles['profit-scenario'], styles['executed'])}
        >
          <div className={styles['left']}>
            <div className={styles['action']}>{desc.limited}</div>
            <div className={styles['target']}>
              <span className={styles['amount']}>
                {amountFormatter(
                  props.depositAmount,
                  depositCcyConfig?.precision,
                )}
              </span>
              <span className={styles['unit']}>
                {depositCcyConfig?.name || props.depositCcy}
              </span>
            </div>
            <span className={styles['divide-icon']} />
            <span className={styles['exchange-rate']}>
              {amountFormatter(
                props.depositAmount / props.forCcyAmountWhenSuccessfulExecuted,
                Math.max(
                  forCcyConfig?.precision || 6,
                  depositCcyConfig?.precision || 6,
                ),
              )}
            </span>
            <span className={styles['result']}>
              {(forCcyConfig && <img src={forCcyConfig.icon} />) || undefined}
              <span className={styles['amount']}>
                {amountFormatter(
                  props.forCcyAmountWhenSuccessfulExecuted,
                  forCcyConfig?.precision,
                )}
              </span>
              <span className={styles['unit']}>
                {forCcyConfig?.name || props.forCcy}
              </span>
            </span>
          </div>
          <span className="plus-sign">+</span>
          <div className={styles['right']}>
            <div className={styles['label']}>
              {t({
                enUS: 'Extra rewards',
                zhCN: '额外收益',
              })}
            </div>
            <div className={styles['rewards']}>
              <div className={styles['item']}>
                <span className={styles['label']}>
                  {(forCcyConfig && <img src={forCcyConfig.icon} />) ||
                    undefined}
                  {t({
                    enUS: 'Deposit Reward',
                    zhCN: '充值奖励',
                  })}
                </span>
                <span className={styles['value']}>
                  <span className={styles['amount']}>
                    {amountFormatter(
                      props.forCcyExtraRewardWhenSuccessfulExecuted,
                      forCcyConfig?.precision,
                    )}
                  </span>
                  <span className={styles['unit']}>
                    {forCcyConfig?.name || props.forCcy}
                  </span>
                </span>
              </div>
              <span className="plus-sign">+</span>
              <div className={styles['item']}>
                <span className={styles['label']}>
                  {(rchConfig && <img src={rchConfig.icon} />) || undefined}
                  {t({
                    enUS: 'RCH Airdrop | Est.',
                    zhCN: 'RCH 空投 | 预估',
                  })}
                </span>
                <span className={styles['value']}>
                  <span className={styles['amount']}>
                    {amountFormatter(
                      props.rchReturnAmount,
                      rchConfig?.precision,
                    )}
                  </span>
                  <span className={styles['unit']}>
                    {rchConfig?.name || 'RCH'}
                  </span>
                  {(priceIndex.prices[props.forCcy] &&
                    priceIndex.prices['RCH'] && (
                      <span className={styles['est']}>
                        ≈
                        <span className={styles['amount']}>
                          {amountFormatter(
                            (props.rchReturnAmount * priceIndex.prices['RCH']) /
                              priceIndex.prices[props.forCcy]!,
                            forCcyConfig?.precision,
                          )}
                        </span>
                        <span className={styles['unit']}>
                          {forCcyConfig?.name || props.forCcy}
                        </span>
                      </span>
                    )) ||
                    undefined}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className={classNames(
          styles['profit-scenario-wrapper'],
          styles['no-executed'],
        )}
      >
        <div className={styles['title']}>
          <span className={styles['emoji']}>️️✌️</span>
          {t({
            enUS: 'No Executed, Premium Earned',
            zhCN: '未成交，获得额外奖励',
          })}
        </div>
        <div className={styles['subtitle']}>
          {t(
            {
              enUS: 'Receive {{amount}} {{crypto}} + {{rchAmount}} RCH',
            },
            {
              amount: amountFormatter(
                simplePlus(
                  props.depositAmount,
                  props.depositCcyExtraRewardWhenNoExecuted,
                ),
                forCcyConfig?.precision,
              ),
              crypto: depositCcyConfig?.name || props.depositCcy,
              rchAmount: amountFormatter(
                props.rchReturnAmount,
                rchConfig?.precision,
              ),
            },
          )}
          |
          {t({
            enUS: 'Est.',
            zhCN: '预估',
          })}
        </div>
        <div
          className={classNames(styles['profit-scenario'], styles['executed'])}
        >
          <div className={styles['left']}>
            <div className={styles['action']}>
              {t({
                enUS: 'Deposit',
                zhCN: '存入',
              })}
            </div>
            <span className={styles['result']}>
              {(depositCcyConfig && <img src={depositCcyConfig.icon} />) ||
                undefined}
              <span className={styles['amount']}>
                {amountFormatter(
                  props.depositAmount,
                  depositCcyConfig?.precision,
                )}
              </span>
              <span className={styles['unit']}>
                {depositCcyConfig?.name || props.depositAmount}
              </span>
            </span>
          </div>
          <span className="plus-sign">+</span>
          <div className={styles['right']}>
            <div className={styles['label']}>
              {t({
                enUS: 'Extra rewards',
                zhCN: '额外收益',
              })}
            </div>
            <div className={styles['rewards']}>
              <div className={styles['item']}>
                <span className={styles['label']}>
                  {(forCcyConfig && <img src={forCcyConfig.icon} />) ||
                    undefined}
                  {t({
                    enUS: 'Deposit Reward',
                    zhCN: '存入奖励',
                  })}
                </span>
                <span className={styles['value']}>
                  <span className={styles['amount']}>
                    {amountFormatter(
                      props.depositCcyExtraRewardWhenNoExecuted,
                      forCcyConfig?.precision,
                    )}
                  </span>
                  <span className={styles['unit']}>
                    {forCcyConfig?.name || props.forCcy}
                  </span>
                </span>
              </div>
              <span className="plus-sign">+</span>
              <div className={styles['item']}>
                <span className={styles['label']}>
                  {(rchConfig && <img src={rchConfig.icon} />) || undefined}
                  {t({
                    enUS: 'RCH Airdrop | Est.',
                    zhCN: 'RCH 空投 | 预估',
                  })}
                </span>
                <span className={styles['value']}>
                  <span className={styles['amount']}>
                    {amountFormatter(
                      props.rchReturnAmount,
                      rchConfig?.precision,
                    )}
                  </span>
                  <span className={styles['unit']}>
                    {rchConfig?.name || 'RCH'}
                  </span>
                  {(priceIndex.prices[props.depositCcy] &&
                    priceIndex.prices['RCH'] && (
                      <span className={styles['est']}>
                        ≈
                        <span className={styles['amount']}>
                          {amountFormatter(
                            (props.rchReturnAmount * priceIndex.prices['RCH']) /
                              priceIndex.prices[props.depositCcy]!,
                            forCcyConfig?.precision,
                          )}
                        </span>
                        <span className={styles['unit']}>
                          {forCcyConfig?.name || props.depositCcy}
                        </span>
                      </span>
                    )) ||
                    undefined}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className={classNames(
          styles['profit-scenario-wrapper'],
          styles['partial-executed'],
        )}
      >
        <div className={styles['title']}>{desc.partialExecuted}</div>
        <div className={styles['subtitle']}>
          {t({
            enUS: 'Still Get Deposit Rewards and RCH Airdrops',
          })}
        </div>
      </div>
    </div>
  );
};

export const DualProjectedReturns = (
  props: BaseProps & { data: Partial<PositionInfo> & { vault: VaultInfo } },
) => {
  const [t] = useTranslation('ProjectedReturns');
  const position = props.data;
  const product = position.product;
  const profitsProps = useMemo(() => {
    if (!product || !position.amounts) {
      return undefined;
    }
    const res = {
      productType: product?.vault.productType,
    } as DualProfitRenderProps;
    if (product?.vault.productType == ProductType.BullSpread) {
      res.forCcy = product.vault.forCcy;
      // TODO:
      // (anchorPrice[0] * depositAmount)
      res.forCcyAmountWhenSuccessfulExecuted = 1000;
      // maxRedeemableOfLinkedCcy - (anchorPrice[0] * depositAmount)
      res.forCcyExtraRewardWhenSuccessfulExecuted = 100;
      res.depositCcy = product.vault.depositCcy;

      res.depositAmount = Number(position.amounts.own || 0);
      // maxRedeemable - own
      res.depositCcyExtraRewardWhenNoExecuted = 100;
      res.rchReturnAmount = Number(position.amounts.rchAirdrop || 0);
    } else {
      res.forCcy = product.vault.domCcy;
      // 倒过来，只不过小心一下 anchorPrice
      res.forCcyAmountWhenSuccessfulExecuted = 1000;
      res.forCcyExtraRewardWhenSuccessfulExecuted = 100;
      res.depositCcy = product.vault.forCcy;
      res.depositAmount = Number(position.amounts.own || 0);
      res.depositCcyExtraRewardWhenNoExecuted = 100;
      res.rchReturnAmount = Number(position.amounts.rchAirdrop || 0);
    }
    return res;
  }, [product, position]);
  const [basedCcy, setBasedCcy] = useState<CCY | USDS | undefined>(undefined);
  useEffect(() => {
    if (!basedCcy && position.vault.depositBaseCcy) {
      setBasedCcy(position.vault.depositBaseCcy);
    }
  }, [basedCcy, position]);
  if (!product || !profitsProps)
    return <div className={styles['profit-scenarios']} />;
  const hasExpired = Number(product.expiry) * 1000 <= Date.now();

  return (
    <section className={classNames(styles['section'])}>
      <div
        className={classNames(styles['profit-scenarios'], props.className, {
          [styles['highlight']]: hasExpired,
          [styles['highlight-red']]:
            hasExpired && Number(position.takerAllocationRate) <= 0,
          [styles['expired']]: hasExpired,
        })}
        style={props.style}
      >
        <DualProfitScenarios {...profitsProps} />
      </div>
    </section>
  );
};
