import { useEffect, useMemo } from 'react';
import { Tooltip } from '@douyinfe/semi-ui';
import { calc_yield } from '@sofa/alg';
import { AutomatorDetail } from '@sofa/services/automator';
import { InterestTypeRefs } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { useTranslation } from '@sofa/services/i18n';
import { ProductsService } from '@sofa/services/products';
import {
  amountFormatter,
  cvtAmountsInCcy,
  cvtAmountsInUsd,
  displayPercentage,
} from '@sofa/utils/amount';
import { MsIntervals } from '@sofa/utils/expiry';
import { simplePlus } from '@sofa/utils/object';
import classNames from 'classnames';

import AsyncButton from '@/components/AsyncButton';
import CEmpty from '@/components/Empty';
import { useIndexPrices } from '@/components/IndexPrices/store';
import { useWalletStore } from '@/components/WalletConnector/store';
import { useAutomatorModal } from '@/pages/products/automator/index-modal';
import { useAutomatorStore } from '@/pages/products/automator/store';
import { calcAvailableBalance } from '@/pages/products/automator-create/util';
import { useGlobalState } from '@/store';

import { useProductsState } from '../../../automator-store';
import { useCreatorAutomatorSelector } from '../AutomatorSelector';
import CustomTickets from '../CustomTickets';
import InvestButton from '../InvestButton';

import { Comp as IconDetail } from './assets/icon-detail.svg';

import styles from './index.module.scss';

const ProductLottery = (
  props: BaseProps & { onlyForm?: boolean; automator: AutomatorDetail },
) => {
  const [t] = useTranslation('AutomatorOperate');
  const prices = useIndexPrices((state) => state.prices);

  const { automator } = useCreatorAutomatorSelector();
  const ticket = useMemo(
    () => ({
      ccy: automator?.vaultInfo.vaultDepositCcy,
      precision: 2,
    }),
    [automator],
  );
  const vault = useMemo(() => automator?.vaultInfo, [automator]);
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

  return (
    <>
      <div className={classNames(styles['form'], styles['body'])}>
        <div className={styles['content']}>
          {vault && <CustomTickets vault={vault} automator={props.automator} />}
        </div>
        <div className={styles['footer']}>
          <div className={styles['cart-brief']}>
            <div className={styles['amount']}>
              <span className={styles['label']}>
                {t({ enUS: 'Total Cost', zhCN: '总成本' })}
              </span>
              <span className={styles['total-cost']}>
                <span className={styles['digi']}>
                  {amountFormatter(totalCost, ticket?.precision)}
                </span>
                <span className={styles['unit']}>{ticket?.ccy}</span>
              </span>
            </div>
            <div className={styles['profits']}>
              <div className={styles['amount']}>
                <span className={styles['label']}>
                  {t({ enUS: 'Target Max Return', zhCN: '目标最大回报' })}
                </span>
                <span className={styles['win']}>
                  <span className={styles['digi']}>
                    {totalWin.amount === undefined
                      ? '-'
                      : amountFormatter(totalWin.amount, 2)}
                  </span>
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
                </span>
              </div>
            </div>
          </div>
          {vault && (
            <div className={styles['btn-deposit']}>
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
  const { chainId } = useWalletStore((state) => state);
  const [t] = useTranslation('AutomatorOperate');

  const { automator } = useCreatorAutomatorSelector();
  const prices = useIndexPrices((s) => s.prices);
  const automatorVault = useMemo(() => automator?.vaultInfo, [automator]);
  useEffect(() => {
    return useAutomatorStore.subscribeVaults(chainId);
  }, [chainId]);

  const apy = useGlobalState(
    (state) =>
      automator &&
      state.interestRate[automator.vaultInfo.chainId]?.[
        automator.vaultInfo.depositCcy
      ],
  );

  const interest = useMemo(() => {
    if (!apy?.apyUsed || !automator?.aumByVaultDepositCcy)
      return { byVaultDepositCcy: 0, byDepositCcy: 0 };
    const byDepositCcy = calc_yield(
      apy.apyUsed,
      +automator.aumByVaultDepositCcy,
      Date.now(),
      Date.now() + MsIntervals.day * 7,
    );
    const byVaultDepositCcy = (() => {
      if (
        !InterestTypeRefs[automator.vaultInfo.interestType!].isRebaseInAutomator
      ) {
        return cvtAmountsInCcy(
          [[automator.vaultInfo.depositCcy, byDepositCcy]],
          prices,
          automator.vaultInfo.vaultDepositCcy,
        );
      }
      return byDepositCcy;
    })();
    return { byVaultDepositCcy, byDepositCcy };
  }, [
    apy?.apyUsed,
    automator?.aumByVaultDepositCcy,
    automator?.vaultInfo.depositCcy,
    automator?.vaultInfo.interestType,
    automator?.vaultInfo.vaultDepositCcy,
    prices,
  ]);

  const [modal, modalController] = useAutomatorModal();

  return !automatorVault ? (
    <CEmpty
      className="semi-always-dark"
      description={t({
        enUS: 'There are no supported Automator contracts on this chain. Please switch to another chain',
        zhCN: '这条链上没有支持的 Automator 合约，请切换到其它的链',
      })}
    />
  ) : (
    <>
      <div className={classNames(styles['form'], styles['header'])}>
        <div className={styles['content']}>
          <div className={styles['left']}>
            <div className={styles['amount']}>
              <span className={styles['label']}>
                {t({
                  enUS: 'Available Balance (Risk Limited)',
                  zhCN: '可用余额 (风险限制)',
                })}
              </span>
              <span className={styles['value']}>
                {automator ? (
                  <>
                    <span className={styles['digi']}>
                      {amountFormatter(
                        calcAvailableBalance(automator),
                        CCYService.ccyConfigs[
                          automator.vaultInfo.vaultDepositCcy
                        ]?.precision || undefined,
                      )}
                    </span>
                    <span className={styles['unit']}>
                      {CCYService.ccyConfigs[
                        automator.vaultInfo.vaultDepositCcy
                      ]?.name || automator.vaultInfo.vaultDepositCcy}
                    </span>
                    <Tooltip
                      className={styles['automator-number-tooltip']}
                      content={
                        <div className={styles['automator-details']}>
                          <div
                            className={styles['desc']}
                            dangerouslySetInnerHTML={{
                              __html: t({
                                enUS: 'This shows the maximum balance available for trading, capped by the Automator’s risk exposure limit.',
                                zhCN: '这显示了可用于交易的最大余额，并受 Automator 的风险敞口上限限制。',
                              }).replace(/\n/g, '<br />'),
                            }}
                          />
                          <div className={styles['amount']}>
                            <span
                              className={styles['label']}
                              dangerouslySetInnerHTML={{
                                __html: t({
                                  enUS: 'Risk Exposure%',
                                  zhCN: '风险敞口%',
                                }).replace(/\n/g, '<br />'),
                              }}
                            />
                            <span className={styles['desc']}>
                              {t({
                                enUS: 'Your Selected Risk Exposure %',
                                zhCN: '你选择的风险敞口%',
                              })}
                            </span>
                            <span className={styles['value']}>
                              {displayPercentage(
                                automator.vaultInfo.riskExposure,
                              )}
                            </span>
                          </div>
                          <div className={styles['amount']}>
                            <span className={styles['label']}>
                              {t({
                                enUS: 'Current Position',
                                zhCN: '当前头寸',
                              })}
                            </span>
                            <span className={styles['desc']}>
                              {t({
                                enUS: 'Value of open & Unclaimed positions.',
                                zhCN: '未平仓及未认领头寸的价值。',
                              })}
                            </span>
                            <span className={styles['value']}>
                              {amountFormatter(
                                automator.lockedByUnclaimedPosition,
                                CCYService.ccyConfigs[
                                  automator.vaultInfo.vaultDepositCcy
                                ]?.precision || undefined,
                              )}
                              <span className={styles['unit']}>
                                {CCYService.ccyConfigs[
                                  automator.vaultInfo.vaultDepositCcy
                                ]?.name || automator.vaultInfo.vaultDepositCcy}
                              </span>
                            </span>
                          </div>
                          <div className={styles['amount']}>
                            <span className={styles['label']}>
                              {t({
                                enUS: 'Available Balance [Risk-Limited]',
                                zhCN: '可用余额 (风险限制)',
                              })}
                            </span>
                            <span className={styles['desc']}>
                              {t({
                                enUS: '(Pool Size -  To Be Redeemed) * Risk Exposure % - Current Position',
                                zhCN: '(总资金 - 用户申请赎回资金) * 允许的风险敞口% - 当前头寸占用资金',
                              })}
                            </span>
                            <span className={styles['value']}>
                              {amountFormatter(
                                calcAvailableBalance(automator),
                                CCYService.ccyConfigs[
                                  automator.vaultInfo.vaultDepositCcy
                                ]?.precision || undefined,
                              )}
                              <span className={styles['unit']}>
                                {CCYService.ccyConfigs[
                                  automator.vaultInfo.vaultDepositCcy
                                ]?.name || automator.vaultInfo.vaultDepositCcy}
                              </span>
                            </span>
                          </div>
                        </div>
                      }
                    >
                      <IconDetail className={styles['icon-detail']} />
                    </Tooltip>
                  </>
                ) : (
                  '-'
                )}
              </span>
            </div>
            <AsyncButton
              className={styles['btn-deposit-1']}
              onClick={() =>
                automator &&
                modalController.open(automator.vaultInfo, 'deposit')
              }
            >
              {t({ enUS: 'Deposit', zhCN: '铸造' })}
            </AsyncButton>
          </div>
          <div className={styles['right']}>
            <div className={styles['amount']}>
              <span className={styles['label']}>
                {t({
                  enUS: 'Available Balance (Use Interest-Only)',
                  zhCN: '可用余额 (只用利息交易)',
                })}
              </span>
              <span className={styles['value']}>
                {automator ? (
                  <>
                    <span className={styles['digi']}>
                      {amountFormatter(
                        automator.pastAvailableBalanceExcludingPrincipal,
                        CCYService.ccyConfigs[
                          automator.vaultInfo.vaultDepositCcy
                        ]?.precision || undefined,
                      )}
                    </span>

                    <span className={styles['unit']}>
                      {CCYService.ccyConfigs[
                        automator.vaultInfo.vaultDepositCcy
                      ]?.name || automator.vaultInfo.vaultDepositCcy}
                    </span>

                    <Tooltip
                      className={styles['automator-number-tooltip']}
                      content={
                        <div className={styles['automator-details']}>
                          <div
                            className={styles['desc']}
                            dangerouslySetInnerHTML={{
                              __html: t({
                                enUS: 'This shows the balance made up of the interest earned by your Automator and net PnL from trading, excluding the principal. It is the amount available for trading without affecting your initial investment.',
                                zhCN: '这里显示的是您的Automator赚取的利息和交易净PnL组成的余额，不包括本金。这是不会让您初始本金受损的可用余额。',
                              }).replace(/\n/g, '<br />'),
                            }}
                          />
                          <div className={styles['amount']}>
                            <span
                              className={styles['label']}
                              dangerouslySetInnerHTML={{
                                __html: t({
                                  enUS: 'Historical Interest Earned & Net PnL\n(without RCH)',
                                  zhCN: '历史已赚取利息 & 净利润\n（不包括RCH）',
                                }).replace(/\n/g, '<br />'),
                              }}
                            />
                            <span className={styles['desc']}>
                              {t({
                                enUS: 'The cumulative interest earned through Aave/Lido/Sofa/Curve',
                                zhCN: '通过Aave/Lido/Sofa/Curve的累积收益',
                              })}
                            </span>
                            <span className={styles['value']}>
                              {amountFormatter(
                                automator.historicalInterestPlusNetPnL,
                                CCYService.ccyConfigs[
                                  automator.vaultInfo.vaultDepositCcy
                                ]?.precision || undefined,
                              )}
                              <span className={styles['unit']}>
                                {CCYService.ccyConfigs[
                                  automator.vaultInfo.vaultDepositCcy
                                ]?.name || automator.vaultInfo.vaultDepositCcy}
                              </span>
                            </span>
                          </div>
                          <div className={styles['amount']}>
                            <span className={styles['label']}>
                              {t({
                                enUS: 'Current Position',
                                zhCN: '当前头寸',
                              })}
                            </span>
                            <span className={styles['desc']}>
                              {t({
                                enUS: 'Value of open & Unclaimed positions.',
                                zhCN: '未平仓及未认领头寸的价值。',
                              })}
                            </span>
                            <span className={styles['value']}>
                              {amountFormatter(
                                automator.lockedByUnclaimedPosition,
                                CCYService.ccyConfigs[
                                  automator.vaultInfo.vaultDepositCcy
                                ]?.precision || undefined,
                              )}
                              <span className={styles['unit']}>
                                {CCYService.ccyConfigs[
                                  automator.vaultInfo.vaultDepositCcy
                                ]?.name || automator.vaultInfo.vaultDepositCcy}
                              </span>
                            </span>
                          </div>
                          <div className={styles['amount']}>
                            <span className={styles['label']}>
                              {t({
                                enUS: 'Available Balance (Use Interest-Only)',
                                zhCN: '可用余额 (只用利息交易)',
                              })}
                            </span>
                            <span className={styles['desc']}>
                              {t({
                                enUS: 'Historical Interest Earned + Net PnL - Current Position.',
                                zhCN: '历史已赚取利息 + 净利润 - 当前头寸。',
                              })}
                            </span>
                            <span className={styles['value']}>
                              {amountFormatter(
                                automator.pastAvailableBalanceExcludingPrincipal,
                                CCYService.ccyConfigs[
                                  automator.vaultInfo.vaultDepositCcy
                                ]?.precision || undefined,
                              )}
                              <span className={styles['unit']}>
                                {CCYService.ccyConfigs[
                                  automator.vaultInfo.vaultDepositCcy
                                ]?.name || automator.vaultInfo.vaultDepositCcy}
                              </span>
                            </span>
                          </div>
                        </div>
                      }
                    >
                      <IconDetail className={styles['icon-detail']} />
                    </Tooltip>
                  </>
                ) : (
                  '-'
                )}
              </span>
            </div>

            <div className={styles['amount']} style={{ flex: 0 }}>
              <span className={styles['label']}>&nbsp;</span>
              <span className={styles['value']}>+</span>
            </div>
            <div className={styles['amount']}>
              <span className={styles['label']}>
                {t({ enUS: 'Estimated 7-Day Interest', zhCN: '预估7天利息' })}
              </span>
              <span className={styles['value']}>
                {automator && apy ? (
                  <>
                    {interest.byVaultDepositCcy !== interest.byDepositCcy && (
                      <>
                        <span className={styles['digi']}>
                          {amountFormatter(
                            interest.byVaultDepositCcy,
                            CCYService.ccyConfigs[
                              automator.vaultInfo.vaultDepositCcy
                            ]?.precision || undefined,
                          )}
                        </span>
                        <span className={styles['unit']}>
                          {CCYService.ccyConfigs[
                            automator.vaultInfo.vaultDepositCcy
                          ]?.name || automator.vaultInfo.vaultDepositCcy}
                        </span>
                        <span className={styles['separator']}>≈</span>
                      </>
                    )}
                    <span className={styles['digi']}>
                      {amountFormatter(
                        interest.byVaultDepositCcy,
                        CCYService.ccyConfigs[
                          automator.vaultInfo.vaultDepositCcy
                        ]?.precision || undefined,
                      )}
                    </span>
                    <span className={styles['unit']}>
                      {CCYService.ccyConfigs[
                        automator.vaultInfo.vaultDepositCcy
                      ]?.name || automator.vaultInfo.vaultDepositCcy}
                    </span>

                    <Tooltip
                      className={styles['automator-number-tooltip']}
                      content={
                        <div>
                          <div className={styles['amount']}>
                            <span className={styles['label']}>
                              {t({ enUS: 'Pool Size', zhCN: '池子大小' })}
                            </span>
                            {!InterestTypeRefs[
                              automator.vaultInfo.interestType!
                            ].isRebaseInAutomator ? (
                              <span className={styles['value']}>
                                {amountFormatter(
                                  automator.aumByClientDepositCcy,
                                  CCYService.ccyConfigs[
                                    automator.vaultInfo.depositCcy
                                  ]?.precision || undefined,
                                )}
                                <span className={styles['unit']}>
                                  {CCYService.ccyConfigs[
                                    automator.vaultInfo.depositCcy
                                  ]?.name || automator.vaultInfo.depositCcy}
                                </span>
                              </span>
                            ) : (
                              <span className={styles['value']}>
                                {amountFormatter(
                                  automator.aumByVaultDepositCcy,
                                  CCYService.ccyConfigs[
                                    automator.vaultInfo.vaultDepositCcy
                                  ]?.precision || undefined,
                                )}
                                <span className={styles['unit']}>
                                  {CCYService.ccyConfigs[
                                    automator.vaultInfo.vaultDepositCcy
                                  ]?.name ||
                                    automator.vaultInfo.vaultDepositCcy}
                                </span>
                              </span>
                            )}
                          </div>
                          <div className={styles['amount']}>
                            <span className={styles['label']}>
                              {t({
                                enUS: 'Estimated Aave/Lido/Sofa/Curve Yield',
                                zhCN: '预估Aave/Lido/Sofa/Curve收益',
                              })}
                            </span>
                            <span className={styles['desc']}>
                              {t({
                                enUS: 'Min(1 Month Aave/Lido/Sofa/Curve Average, current Aave/Lido/Sofa/Curve Apy). (Aave/Lido/Sofa/Curve APY)',
                                zhCN: '最小值 (1个月Aave/Lido/Sofa/Curve的平均收益，当前Aave/Lido/Sofa/Curve年化)。 （Aave/Lido/Sofa/Curve年化）',
                              })}
                            </span>
                            <span className={styles['value']}>
                              {amountFormatter(apy.apyUsed, 2)}%
                            </span>
                          </div>
                          <div className={styles['amount']}>
                            <span className={styles['label']}>
                              {t({
                                enUS: 'Estimated Aave/Lido/Sofa/Curve Interest',
                                zhCN: '预估Aave/Lido/Sofa/Curve利息',
                              })}
                            </span>
                            <span className={styles['desc']}>
                              {t({
                                enUS: '(Pool Size * (1 + Aave/Lido/Sofa/Curve APY Estimate) ^ (Tenor / 365) - Pool Size)',
                                zhCN: '（池子大小 * (1 + Aave/Lido/Sofa/Curve年化预估) ^ (期限 / 365) - 池子大小）',
                              })}
                            </span>
                            <span className={styles['value']}>
                              {amountFormatter(
                                interest.byVaultDepositCcy,
                                CCYService.ccyConfigs[
                                  automator.vaultInfo.positionCcy
                                ]?.precision || undefined,
                              )}
                            </span>
                          </div>
                        </div>
                      }
                    >
                      <IconDetail className={styles['icon-detail']} />
                    </Tooltip>
                  </>
                ) : (
                  '-'
                )}
              </span>
            </div>
            <div className={styles['amount']}>
              <span className={styles['label']}>&nbsp;</span>
              <span className={styles['value']}>
                {automator ? (
                  <>
                    <span className={styles['digi']}>
                      =&nbsp;
                      {amountFormatter(
                        Number(
                          automator.pastAvailableBalanceExcludingPrincipal,
                        ) + interest.byVaultDepositCcy,
                        CCYService.ccyConfigs[
                          automator.vaultInfo.vaultDepositCcy
                        ]?.precision || undefined,
                      )}
                    </span>

                    <span className={styles['unit']}>
                      {CCYService.ccyConfigs[
                        automator.vaultInfo.vaultDepositCcy
                      ]?.name || automator.vaultInfo.vaultDepositCcy}
                    </span>
                  </>
                ) : (
                  '-'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
      {automator ? (
        <ProductLottery {...props} automator={automator} />
      ) : undefined}
      {modal}
    </>
  );
};

export default AutomatorTrade;
