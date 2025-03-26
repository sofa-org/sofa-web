import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Tooltip } from '@douyinfe/semi-ui';
import { ProductType, VaultInfo } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import {
  DualPositionExecutionStatus,
  DualProfitRenderProps,
  DualService,
} from '@sofa/services/dual';
import { useTranslation } from '@sofa/services/i18n';
import { PositionInfo } from '@sofa/services/positions';
import { ProductQuoteResult } from '@sofa/services/products';
import { amountFormatter } from '@sofa/utils/amount';
import { useAsyncMemo } from '@sofa/utils/hooks';
import { simplePlus } from '@sofa/utils/object';
import classNames from 'classnames';

import { useIndexPrices } from '@/components/IndexPrices/store';
import { useIsMobileUI } from '@/components/MobileOnly';
import { ProductTypeRefs } from '@/components/ProductSelector/enums';

import { PartialExecutedTooltip } from './PartialExecutedTooltip';

import styles from './DualProjectReturns.module.scss';

export const DualProfitScenarios = (
  props: DualProfitRenderProps &
    BaseProps & {
      scenario: 'quote' | 'position';
    },
) => {
  const [t] = useTranslation('ProjectedReturns');
  const desc = useMemo(
    () => ProductTypeRefs[props.productType].dualDesc(t),
    [t, props.productType],
  );
  const rchConfig = CCYService.ccyConfigs['RCH'];
  const forCcyConfig = CCYService.ccyConfigs[props.linkedCcy];
  const depositCcyConfig = CCYService.ccyConfigs[props.depositCcy];
  const priceIndex = useIndexPrices();
  const isMobileUI = useIsMobileUI();

  return (
    <div
      className={classNames(
        styles['profit-scenarios-wrapper'],
        styles['for-' + props.scenario],
        props.className,
        {
          [styles['settled']]: !!props.executionResult,
        },
      )}
    >
      {props.scenario === 'position' &&
      props.executionResult == DualPositionExecutionStatus.PartialExecuted ? (
        // 如果是部分执行，顶部显示特殊UI
        <div
          className={classNames(
            styles['profit-scenario-bg'],
            styles['partial-executed'],
            {
              [styles['scenario-selected']]: true,
            },
          )}
        >
          <div className={classNames(styles['profit-scenario-wrapper'])}>
            <div>
              <div className={styles['title']}>{desc.partialExecuted}</div>
              <div className={styles['subtitle']}>
                {t({
                  enUS: 'Still Get Deposit Rewards and RCH Airdrops',
                })}
              </div>
            </div>
            <div className={classNames(styles['profit-scenario'])}>
              <div className={styles['left']}>
                <div className={styles['profit-title']}>
                  {t({
                    enUS: 'Deposit Reward+Partial Buy-in',
                  })}
                </div>
                <div className={styles['result']}>
                  <div className={styles['partial-ccys']}>
                    <img src={forCcyConfig?.icon} /> {props.linkedCcy}
                    +
                    <img src={depositCcyConfig?.icon} /> {props.depositCcy}
                  </div>
                  ≈
                  <span className={styles['amount']}>
                    {amountFormatter(
                      simplePlus(
                        props.depositAmount,
                        props.depositCcyExtraRewardWhenNoExecuted,
                      ),
                      depositCcyConfig?.precision,
                    )}
                  </span>
                  <span className={styles['unit']}>
                    {depositCcyConfig?.name || props.depositCcy}
                  </span>
                </div>
              </div>
              <span className={styles['plus-sign']}>+</span>
              <div className={styles['right']}>
                <div className={styles['profit-title']}>
                  {t({
                    enUS: 'RCH Airdrop | Est.',
                  })}
                </div>

                <div className={styles['result']}>
                  <div className={styles['partial-ccys']}>
                    <img src={rchConfig?.icon} />
                  </div>
                  <span className={styles['amount']}>
                    {amountFormatter(
                      props.rchReturnAmount,
                      rchConfig?.precision,
                    )}
                  </span>
                  <span className={styles['unit']}>RCH</span>
                  {(priceIndex.prices[props.depositCcy] &&
                    priceIndex.prices['RCH'] && (
                      <span className={styles['est']}>
                        ≈
                        <span className={styles['amount']}>
                          {amountFormatter(
                            (props.rchReturnAmount * priceIndex.prices['RCH']) /
                              priceIndex.prices[props.depositCcy]!,
                            rchConfig?.precision,
                          )}
                        </span>
                        <span className={styles['unit']}>
                          {depositCcyConfig?.name || props.depositCcy}
                        </span>
                      </span>
                    )) ||
                    undefined}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : undefined}
      {[
        [
          // 执行成功的情况
          <div
            key="executed"
            className={classNames(
              styles['profit-scenario-bg'],
              styles['executed'],
              {
                [styles['scenario-selected']]:
                  props.executionResult == DualPositionExecutionStatus.Executed,
                [styles['scenario-invalid']]:
                  props.executionResult &&
                  props.executionResult != DualPositionExecutionStatus.Executed,
              },
            )}
          >
            <div className={classNames(styles['profit-scenario-wrapper'])}>
              <div className={styles['title-info']}>
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
                          props.linkedCcyAmountWhenSuccessfulExecuted,
                          props.linkedCcyExtraRewardWhenSuccessfulExecuted,
                        ),
                        forCcyConfig?.precision,
                      ),
                      crypto: forCcyConfig?.name || props.linkedCcy,
                      rchAmount: amountFormatter(
                        props.rchReturnAmount,
                        rchConfig?.precision,
                      ),
                    },
                  )}{' '}
                  |{' '}
                  {t({
                    enUS: 'Est.',
                    zhCN: '预估',
                  })}
                </div>
              </div>
              <div className={classNames(styles['profit-scenario'])}>
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
                  <div className={styles['exchange-rate-info']}>
                    <span className={styles['exchange-rate']}>
                      {props.priceFormatted}
                    </span>
                  </div>
                  <div
                    className={styles['line']}
                    style={{
                      display: isMobileUI ? 'none' : undefined,
                    }}
                  />
                  <div className={styles['result']}>
                    {(forCcyConfig && <img src={forCcyConfig.icon} />) ||
                      undefined}
                    <span className={styles['amount']}>
                      {amountFormatter(
                        props.linkedCcyAmountWhenSuccessfulExecuted,
                        forCcyConfig?.precision,
                      )}
                    </span>
                    <span className={styles['unit']}>
                      {forCcyConfig?.name || props.linkedCcy}
                    </span>
                  </div>
                </div>
                <span className={styles['plus-sign']}>+</span>
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
                            props.linkedCcyExtraRewardWhenSuccessfulExecuted,
                            forCcyConfig?.precision,
                          )}
                        </span>
                        <span className={styles['unit']}>
                          {forCcyConfig?.name || props.linkedCcy}
                        </span>
                      </span>
                    </div>
                    <span className={styles['plus-sign']} />
                    <div className={styles['item']}>
                      <span className={styles['label']}>
                        {(rchConfig && <img src={rchConfig.icon} />) ||
                          undefined}
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
                        {(priceIndex.prices[props.linkedCcy] &&
                          priceIndex.prices['RCH'] && (
                            <span className={styles['est']}>
                              ≈
                              <span className={styles['amount']}>
                                {amountFormatter(
                                  (props.rchReturnAmount *
                                    priceIndex.prices['RCH']) /
                                    priceIndex.prices[props.linkedCcy]!,
                                  rchConfig?.precision,
                                )}
                              </span>
                              <span className={styles['unit']}>
                                {forCcyConfig?.name || props.linkedCcy}
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
          </div>,
          props.executionResult == DualPositionExecutionStatus.Executed,
          1,
        ],
        [
          // 未执行成功的情况
          <div
            key="no-executed"
            className={classNames(
              styles['profit-scenario-bg'],
              styles['no-executed'],
              {
                [styles['scenario-selected']]:
                  props.executionResult ==
                  DualPositionExecutionStatus.NotExecuted,
                [styles['scenario-invalid']]:
                  props.executionResult &&
                  props.executionResult !=
                    DualPositionExecutionStatus.NotExecuted,
              },
            )}
          >
            <div className={classNames(styles['profit-scenario-wrapper'])}>
              <div className={styles['title-info']}>
                <div className={styles['title']}>
                  <span className={styles['emoji']}>️️✌️</span>
                  {t({
                    enUS: 'Not Executed, Premium Earned',
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
                        depositCcyConfig?.precision,
                      ),
                      crypto: depositCcyConfig?.name || props.depositCcy,
                      rchAmount: amountFormatter(
                        props.rchReturnAmount,
                        rchConfig?.precision,
                      ),
                    },
                  )}{' '}
                  |{' '}
                  {t({
                    enUS: 'Est.',
                    zhCN: '预估',
                  })}
                </div>
              </div>
              <div className={classNames(styles['profit-scenario'])}>
                <div className={styles['left']}>
                  <div className={styles['action']}>
                    {t({
                      enUS: 'Deposit',
                      zhCN: '存入',
                    })}
                  </div>
                  <span className={styles['result']}>
                    {(depositCcyConfig && (
                      <img src={depositCcyConfig.icon} />
                    )) ||
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
                        {(depositCcyConfig && (
                          <img src={depositCcyConfig.icon} />
                        )) ||
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
                            depositCcyConfig?.precision,
                          )}
                        </span>
                        <span className={styles['unit']}>
                          {depositCcyConfig?.name || props.depositCcy}
                        </span>
                      </span>
                    </div>
                    <span className={styles['plus-sign']} />
                    <div className={styles['item']}>
                      <span className={styles['label']}>
                        {(rchConfig && <img src={rchConfig.icon} />) ||
                          undefined}
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
                                  (props.rchReturnAmount *
                                    priceIndex.prices['RCH']) /
                                    priceIndex.prices[props.depositCcy]!,
                                  rchConfig?.precision,
                                )}
                              </span>
                              <span className={styles['unit']}>
                                {depositCcyConfig?.name || props.depositCcy}
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
          </div>,
          props.executionResult == DualPositionExecutionStatus.NotExecuted,
          2,
        ],
      ]
        .sort((a, b) => {
          if (
            props.scenario === 'quote' ||
            !props.executionResult ||
            ![
              DualPositionExecutionStatus.Executed,
              DualPositionExecutionStatus.NotExecuted,
            ].includes(props.executionResult)
          ) {
            // 如果没有结果，或者结果是部分执行，按照自然排序
            return (a[2] as number) - (b[2] as number);
          }
          // 和结果一样的排前面
          return (a[1] as boolean) ? -1 : 1;
        })
        .map((r) => r[0])}

      {props.executionResult ==
      DualPositionExecutionStatus.PartialExecuted ? undefined : (
        // 如果不是部分执行，下方简单介绍下部分执行
        <div
          className={classNames(
            styles['profit-scenario-bg'],
            styles['partial-executed'],
            {
              [styles['scenario-invalid']]: props.executionResult,
            },
          )}
        >
          <Tooltip
            className={styles['partial-buy-tooltip']}
            content={<PartialExecutedTooltip {...props} />}
            trigger={isMobileUI ? 'click' : 'hover'}
            position="bottom"
          >
            <div>
              <div className={styles['title']}>{desc.partialExecuted}</div>
              <div className={styles['subtitle']}>
                {t({
                  enUS: 'Still Get Deposit Rewards and RCH Airdrops',
                })}
              </div>
              <div className={styles['line']} />
            </div>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export const DualProjectedReturns = (
  props: BaseProps & {
    data: Partial<PositionInfo> & { vault: VaultInfo };
    scenario: 'quote' | 'position';
  },
) => {
  const [t] = useTranslation('ProjectedReturns');
  const position = props.data;
  const product = position.product;
  const profitsProps = useAsyncMemo(
    () => DualService.getProfitRenderProps(position),
    [product, position],
  );
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
        <DualProfitScenarios {...profitsProps} scenario={props.scenario} />
      </div>
    </section>
  );
};
