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
} from '@sofa/utils/amount';
import { MsIntervals } from '@sofa/utils/expiry';
import { simplePlus } from '@sofa/utils/object';
import classNames from 'classnames';

import CEmpty from '@/components/Empty';
import { useIndexPrices } from '@/components/IndexPrices/store';
import { useWalletStore } from '@/components/WalletConnector/store';
import { useAutomatorStore } from '@/pages/products/automator/store';
import { useGlobalState } from '@/store';

import { useProductsState } from '../../../automator-store';
import { useTicketType } from '../../../components/TicketTypeSelector';
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
                    {amountFormatter(totalWin.amount, 2)}
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
      if (!InterestTypeRefs[automator.vaultInfo.interestType!].isRebase) {
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
          <div className={styles['amount']}>
            <span className={styles['label']}>
              {t({
                enUS: 'Automator Total Available Balance',
                zhCN: '自动化器总可用余额',
              })}
            </span>
            <span className={styles['value']}>
              {automator ? (
                <>
                  <span className={styles['digi']}>
                    {amountFormatter(
                      automator.availableAmountByVaultDepositCcy,
                      CCYService.ccyConfigs[automator.vaultInfo.vaultDepositCcy]
                        ?.precision || undefined,
                    )}
                  </span>

                  <span className={styles['unit']}>
                    {CCYService.ccyConfigs[automator.vaultInfo.vaultDepositCcy]
                      ?.name || automator.vaultInfo.vaultDepositCcy}
                  </span>
                </>
              ) : (
                '-'
              )}
            </span>
          </div>
          <div className={styles['amount']}>
            <span className={styles['label']}>
              {t({
                enUS: 'Available Balance Excluding Principal',
                zhCN: '扣除本金后的可用余额',
              })}
            </span>
            <span className={styles['value']}>
              {automator ? (
                <>
                  <span className={styles['digi']}>
                    {amountFormatter(
                      automator.pastAvailableBalanceExcludingPrincipal,
                      CCYService.ccyConfigs[automator.vaultInfo.vaultDepositCcy]
                        ?.precision || undefined,
                    )}
                  </span>

                  <span className={styles['unit']}>
                    {CCYService.ccyConfigs[automator.vaultInfo.vaultDepositCcy]
                      ?.name || automator.vaultInfo.vaultDepositCcy}
                  </span>

                  <Tooltip
                    className={styles['automator-number-tooltip']}
                    content={
                      <div className={styles['automator-details']}>
                        <div className={styles['amount']}>
                          <span
                            className={styles['label']}
                            dangerouslySetInnerHTML={{
                              __html: t({
                                enUS: 'Historical Interest Earned & Net PnL\n(RCH not included)',
                              }).replace(/\n/g, '<br />'),
                            }}
                          />
                          <span className={styles['desc']}>
                            {t({
                              enUS: 'The cumulative interest earned through Aave/Lido/Sofa/Curve',
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
                            {t({ enUS: 'Current Position' })}
                          </span>
                          <span className={styles['desc']}>
                            {t({
                              enUS: 'Value of open & Unclaimed positions.',
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
                              enUS: 'Available Balance Excluding Principal',
                            })}
                          </span>
                          <span className={styles['desc']}>
                            {t({
                              enUS: 'Historical Interest Earned + Net PnL - Current Position.',
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
                      CCYService.ccyConfigs[automator.vaultInfo.vaultDepositCcy]
                        ?.precision || undefined,
                    )}
                  </span>
                  <span className={styles['unit']}>
                    {CCYService.ccyConfigs[automator.vaultInfo.vaultDepositCcy]
                      ?.name || automator.vaultInfo.vaultDepositCcy}
                  </span>

                  <Tooltip
                    className={styles['automator-number-tooltip']}
                    content={
                      <div>
                        <div className={styles['amount']}>
                          <span className={styles['label']}>
                            {t({ enUS: 'Pool Size' })}
                          </span>
                          {!InterestTypeRefs[automator.vaultInfo.interestType!]
                            .isRebase ? (
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
                                ]?.name || automator.vaultInfo.vaultDepositCcy}
                              </span>
                            </span>
                          )}
                        </div>
                        <div className={styles['amount']}>
                          <span className={styles['label']}>
                            {t({
                              enUS: 'Estimated Aave/Lido/Sofa/Curve Yield',
                            })}
                          </span>
                          <span className={styles['desc']}>
                            {t({
                              enUS: 'Min(1 Month Aave/Lido/Sofa/Curve Average, current Aave/Lido/Sofa/Curve Apy). (Aave/Lido/Sofa/Curve APY)',
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
                            })}
                          </span>
                          <span className={styles['desc']}>
                            {t({
                              enUS: '(Pool Size * (1 + Aave/Lido/Sofa/Curve APY Estimate) ^ (Tenor / 365) - Pool Size)',
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
                      Number(automator.pastAvailableBalanceExcludingPrincipal) +
                        interest.byVaultDepositCcy,
                      CCYService.ccyConfigs[automator.vaultInfo.vaultDepositCcy]
                        ?.precision || undefined,
                    )}
                  </span>

                  <span className={styles['unit']}>
                    {CCYService.ccyConfigs[automator.vaultInfo.vaultDepositCcy]
                      ?.name || automator.vaultInfo.vaultDepositCcy}
                  </span>
                </>
              ) : (
                '-'
              )}
            </span>
          </div>
        </div>
      </div>
      {automator ? (
        <ProductLottery {...props} automator={automator} />
      ) : undefined}
    </>
  );
};

export default AutomatorTrade;
