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

import { useLivePPS } from '@/components/IndexPrices/store';
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
  const linkedCcyConfig = CCYService.ccyConfigs[props.linkedCcy];
  const depositCcyConfig = CCYService.ccyConfigs[props.depositCcy];
  const depositCcyToRCH = useLivePPS({
    forCcy: props.depositCcy as VaultInfo['forCcy'],
    domCcy: 'RCH',
  });
  const linkedCcyToRCH = useLivePPS({
    forCcy: props.linkedCcy as VaultInfo['forCcy'],
    domCcy: 'RCH',
  });
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
                  zhCN: '仍然获得双币收益和RCH空投',
                })}
              </div>
            </div>
            <div className={classNames(styles['profit-scenario'])}>
              <div className={styles['left']}>
                <div className={styles['profit-title']}>
                  {t({
                    enUS: 'Deposit Reward+Partial Buy-in',
                    zhCN: '双币收益 + 部分买入',
                  })}
                </div>
                <div className={styles['result']}>
                  <div className={styles['partial-ccys']}>
                    <img src={linkedCcyConfig?.icon} /> {props.linkedCcy}
                    <span className={styles['plus-sign']} />
                    <img src={depositCcyConfig?.icon} /> {props.depositCcy}
                  </div>
                  <div>
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
              </div>
              <span className={styles['plus-sign']}>+</span>
              <div className={styles['right']}>
                <div className={styles['profit-title']}>
                  {t({ enUS: 'RCH Airdrop | Est.', zhCN: 'RCH空投 | 估计' })}
                </div>

                <div className={styles['result']}>
                  <span className={styles['amount']}>
                    <img src={rchConfig?.icon} />
                    {amountFormatter(
                      props.rchReturnAmount,
                      rchConfig?.precision,
                    )}
                    <span className={styles['unit']}>RCH</span>
                  </span>
                  {(depositCcyToRCH && (
                    <span className={styles['est']}>
                      ≈
                      <span className={styles['amount']}>
                        {amountFormatter(
                          props.rchReturnAmount / depositCcyToRCH,
                          depositCcyConfig?.precision,
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
                      zhCN: '收到 {{amount}} {{crypto}} + {{rchAmount}} RCH',
                    },
                    {
                      amount: amountFormatter(
                        simplePlus(
                          props.linkedCcyAmountWhenSuccessfulExecuted,
                          props.linkedCcyExtraRewardWhenSuccessfulExecuted,
                        ),
                        linkedCcyConfig?.precision,
                      ),
                      crypto: linkedCcyConfig?.name || props.linkedCcy,
                      rchAmount: amountFormatter(
                        props.rchReturnAmount,
                        rchConfig?.precision,
                      ),
                    },
                  )}
                  <span className={styles['est']}>
                    {' '}
                    |{' '}
                    {t({
                      enUS: 'Est.',
                      zhCN: '预估',
                    })}
                  </span>
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
                    {(linkedCcyConfig && <img src={linkedCcyConfig.icon} />) ||
                      undefined}
                    <span className={styles['amount']}>
                      {amountFormatter(
                        props.linkedCcyAmountWhenSuccessfulExecuted,
                        linkedCcyConfig?.precision,
                      )}
                    </span>
                    <span className={styles['unit']}>
                      {linkedCcyConfig?.name || props.linkedCcy}
                    </span>
                  </div>
                </div>
                <span className={styles['plus-sign']}>+</span>
                <div className={styles['right']}>
                  <div className={styles['label']}>
                    {t({
                      enUS: 'Rewards',
                      zhCN: '收益',
                    })}
                  </div>
                  <div className={styles['rewards']}>
                    <div className={styles['item']}>
                      <span className={styles['label']}>
                        {t({
                          enUS: 'Deposit Reward',
                          zhCN: '双币收益',
                        })}
                      </span>
                      <span className={styles['value']}>
                        {(linkedCcyConfig && (
                          <img src={linkedCcyConfig.icon} />
                        )) ||
                          undefined}
                        <span className={styles['amount']}>
                          {amountFormatter(
                            props.linkedCcyExtraRewardWhenSuccessfulExecuted,
                            linkedCcyConfig?.precision,
                          )}
                        </span>
                        <span className={styles['unit']}>
                          {linkedCcyConfig?.name || props.linkedCcy}
                        </span>
                      </span>
                    </div>
                    <span className={styles['plus-sign']} />
                    <div className={styles['item']}>
                      <span className={styles['label']}>
                        {t({
                          enUS: 'RCH Airdrop | Est.',
                          zhCN: 'RCH 空投 | 预估',
                        })}
                      </span>
                      <span className={styles['value']}>
                        {(rchConfig && <img src={rchConfig.icon} />) ||
                          undefined}
                        <span className={styles['amount']}>
                          {amountFormatter(
                            props.rchReturnAmount,
                            rchConfig?.precision,
                          )}
                        </span>
                        <span className={styles['unit']}>
                          {rchConfig?.name || 'RCH'}
                        </span>
                      </span>
                      {(linkedCcyToRCH && (
                        <span className={styles['est']}>
                          ≈
                          <span className={styles['amount']}>
                            {amountFormatter(
                              props.rchReturnAmount / linkedCcyToRCH,
                              linkedCcyConfig?.precision,
                            )}
                          </span>
                          <span className={styles['unit']}>
                            {linkedCcyConfig?.name || props.linkedCcy}
                          </span>
                        </span>
                      )) ||
                        undefined}
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
                  {desc.notExecuted}
                </div>
                <div className={styles['subtitle']}>
                  {t(
                    {
                      enUS: 'Receive {{amount}} {{crypto}} + {{rchAmount}} RCH',
                      zhCN: '收到 {{amount}} {{crypto}} + {{rchAmount}} RCH',
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
                  )}
                  <span className={styles['est']}>
                    {' '}
                    |{' '}
                    {t({
                      enUS: 'Est.',
                      zhCN: '预估',
                    })}
                  </span>
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
                <span className={styles['plus-sign']}>+</span>
                <div className={styles['right']}>
                  <div className={styles['label']}>
                    {t({
                      enUS: 'Rewards',
                      zhCN: '收益',
                    })}
                  </div>
                  <div className={styles['rewards']}>
                    <div className={styles['item']}>
                      <span className={styles['label']}>
                        {t({
                          enUS: 'Deposit Reward',
                          zhCN: '双币收益',
                        })}
                      </span>
                      <span className={styles['value']}>
                        {(depositCcyConfig && (
                          <img src={depositCcyConfig.icon} />
                        )) ||
                          undefined}
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
                        {t({
                          enUS: 'RCH Airdrop | Est.',
                          zhCN: 'RCH 空投 | 预估',
                        })}
                      </span>
                      <span className={styles['value']}>
                        {(rchConfig && <img src={rchConfig.icon} />) ||
                          undefined}
                        <span className={styles['amount']}>
                          {amountFormatter(
                            props.rchReturnAmount,
                            rchConfig?.precision,
                          )}
                        </span>
                        <span className={styles['unit']}>
                          {rchConfig?.name || 'RCH'}
                        </span>
                      </span>
                      {(depositCcyToRCH && (
                        <span className={styles['est']}>
                          ≈
                          <span className={styles['amount']}>
                            {amountFormatter(
                              props.rchReturnAmount / depositCcyToRCH,
                              depositCcyConfig?.precision,
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
                  zhCN: '仍然获得双币收益和RCH空投',
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
