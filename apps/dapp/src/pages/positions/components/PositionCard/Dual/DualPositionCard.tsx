import { RefObject } from 'react';
import { CCYService } from '@sofa/services/ccy';
import {
  DualPositionClaimStatus,
  DualPositionExecutionStatus,
  DualService,
} from '@sofa/services/dual';
import { useTranslation } from '@sofa/services/i18n';
import { amountFormatter } from '@sofa/utils/amount';
import { displayExpiry, next8h } from '@sofa/utils/expiry';
import { useAsyncMemo } from '@sofa/utils/hooks';
import { formatHighlightedText } from '@sofa/utils/string';
import { displayTenor, formatDuration } from '@sofa/utils/time';
import classNames from 'classnames';
import dayjs from 'dayjs';

import AsyncButton from '@/components/AsyncButton';
import {
  ProductTypeRefs,
  RiskTypeRefs,
} from '@/components/ProductSelector/enums';
import { addI18nResources } from '@/locales';

import {
  PositionClaimProgress,
  PositionClaimProgressRef,
} from '../../ClaimProgress';
import { PositionCardProps } from '../common';
import locale from '../locale';

import styles from './DualPositionCard.module.scss';

addI18nResources(locale, 'PositionCard');

const DualPositionCard = (
  props: PositionCardProps & {
    claimProgressRef: RefObject<PositionClaimProgressRef>;
    handleClaim: () => Promise<void>;
  },
) => {
  const [t] = useTranslation('PositionCard');
  const { position, claimProgressRef } = props;
  const product = position.product;
  const riskTypeRef = RiskTypeRefs[product.vault.riskType];
  const productTypeRef = ProductTypeRefs[product.vault.productType];

  const forCcyConfig = CCYService.ccyConfigs[product.vault.forCcy];
  const domCcyConfig = CCYService.ccyConfigs[product.vault.domCcy];
  const depositCcyConfig = CCYService.ccyConfigs[product.vault.depositCcy];
  const linkedCcyOpsiteConfig =
    product.vault.forCcy == product.vault.depositCcy
      ? domCcyConfig
      : forCcyConfig;
  const linkedCcy = DualService.getLinkedCcy(product.vault);

  const { status: claimStatus, leftTime } = DualService.getClaimStatus(
    position,
    new Date(),
  );
  const renderProps = useAsyncMemo(
    () => DualService.getProfitRenderProps(position),
    [position],
  );
  return (
    <>
      <div
        className={classNames(
          styles['card'],
          styles['claim-status-' + claimStatus.toString().toLowerCase()],
          productTypeRef.dualIsBuy ? styles['buy'] : styles['sell'],
          renderProps?.executionResult
            ? styles[
                'execution-status-' +
                  renderProps.executionResult.toString().toLowerCase()
              ]
            : undefined,
        )}
        onClick={() => props.onClick?.()}
      >
        <div className={styles['header']}>
          <span className={styles['icon']}>
            <img src={forCcyConfig?.icon} className={styles['for-ccy']} />
            {/* <img src={domCcyConfig?.icon} className={styles['dom-ccy']} /> */}
          </span>
          <div>
            <div className={styles['name']}>
              {forCcyConfig?.name || product.vault.forCcy}
            </div>
            <div className={styles['dual-status']}>
              <span className={styles['op']}>
                {/* 操作 Buy Low / Sell High */}
                {productTypeRef.dualDesc(t).op2}
              </span>
              <span className={styles['status']}>
                {/* 当前状态 */}
                {[
                  DualPositionClaimStatus.NotExpired,
                  DualPositionClaimStatus.ExpiredButNotClaimable,
                ].includes(claimStatus) ? (
                  // 剩余到期时间
                  <span className={styles['count-down']}>
                    {formatDuration(leftTime).replace(/\d+s/, '') || '0m'}
                  </span>
                ) : (
                  <span className={styles['execution-status']}>
                    {renderProps?.executionResult
                      ? renderProps.executionResult ==
                        DualPositionExecutionStatus.Executed
                        ? t({
                            enUS: 'Successful',
                          })
                        : renderProps.executionResult ==
                            DualPositionExecutionStatus.NotExecuted
                          ? t({
                              enUS: 'Premium Earned',
                            })
                          : productTypeRef.dualDesc(t).partialExecuted
                      : '...'}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
        <div className={classNames(styles['product'])}>
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
              {DualService.getPrice(product)}
            </span>
          </div>
        </div>
        <div className={styles['scenario']}>
          {/* 未到期： */}
          {/* Buy Low => 价格显示在下方*/}
          {/* Sell High => 价格显示在上方 */}
          {/* 执行成功，或者未执行： */}
          {/* 盈利显示在下方 */}
          {/* 部分执行 */}
          {/* 具体币的数额显示在下方 */}
          <div className={styles['left']}>
            <div className={styles['up']}>
              <img src={depositCcyConfig?.icon} />
            </div>
            <span className={styles['arrow']} />
            <div
              className={classNames(styles['down'], {
                [styles['is-dual-ccy']]:
                  renderProps?.executionResult ==
                  DualPositionExecutionStatus.PartialExecuted,
              })}
            >
              {renderProps?.executionResult ==
              DualPositionExecutionStatus.NotExecuted ? (
                <img src={depositCcyConfig?.icon} />
              ) : (
                <img src={linkedCcyOpsiteConfig?.icon} />
              )}

              {renderProps?.executionResult ==
              DualPositionExecutionStatus.PartialExecuted ? (
                // 如果是部分执行，下方需要显示两个图标
                <img
                  src={
                    linkedCcy == product.vault.forCcy
                      ? domCcyConfig?.icon
                      : forCcyConfig?.icon
                  }
                />
              ) : undefined}
            </div>
          </div>
          <div className={styles['right']}>
            <div className={styles['up']}>
              <div className={classNames(styles['ccy'], styles['deposit-ccy'])}>
                <span className={styles['amount']}>
                  {amountFormatter(
                    position.amounts.own,
                    depositCcyConfig?.precision,
                  )}
                </span>
                <span className={styles['unit']}>
                  {depositCcyConfig?.name || product.vault.depositCcy}
                </span>
              </div>
              {/* 如果是未到期的卖，价格显示在上面 */}
              {!productTypeRef.dualIsBuy &&
              claimStatus == DualPositionClaimStatus.NotExpired ? (
                <div className={styles['price']}>
                  <span className={styles['amount']}>
                    {amountFormatter(
                      DualService.getPrice(position.product),
                      domCcyConfig?.precision,
                    )}
                  </span>
                  <span className={styles['unit']}>
                    {domCcyConfig?.name || product.vault.domCcy}
                  </span>
                  <span className={styles['side']}>
                    {productTypeRef.dualDesc(t).op}
                  </span>
                </div>
              ) : undefined}
            </div>
            <div className={styles['down']}>
              {claimStatus == DualPositionClaimStatus.NotExpired ? (
                <>
                  {/* 下方情况1：如果未到期，显示预估买到的币，和价格 */}
                  <div
                    className={classNames(styles['ccy'], styles['linked-ccy'])}
                  >
                    <span className={styles['amount']}>
                      {amountFormatter(
                        position.amounts.maxRedeemableOfLinkedCcy,
                        linkedCcyOpsiteConfig?.precision,
                      )}
                    </span>
                    <span className={styles['unit']}>
                      {linkedCcyOpsiteConfig?.name || linkedCcy}
                    </span>
                  </div>
                  {/* 只有是买方向，才显示价格 */}
                  {productTypeRef.dualIsBuy && (
                    <div className={styles['price']}>
                      <span className={styles['amount']}>
                        {amountFormatter(
                          DualService.getPrice(position.product),
                          domCcyConfig?.precision,
                        )}
                      </span>
                      <span className={styles['unit']}>
                        {domCcyConfig?.name || product.vault.domCcy}
                      </span>
                      <span className={styles['side']}>
                        {productTypeRef.dualDesc(t).op}
                      </span>
                    </div>
                  )}
                </>
              ) : renderProps?.executionResult ==
                DualPositionExecutionStatus.Executed ? (
                <>
                  {/* 下方情况2：如果已执行，显示对手币的数额+Profits(linked ccy) */}

                  <div
                    className={classNames(styles['ccy'], styles['linked-ccy'])}
                  >
                    <span className={styles['amount']}>
                      {amountFormatter(
                        renderProps.redeemableOfLinkedCcy,
                        linkedCcyOpsiteConfig?.precision,
                      )}
                    </span>
                    <span className={styles['unit']}>
                      {linkedCcyOpsiteConfig?.name || linkedCcy}
                    </span>
                  </div>
                  <div className={styles['profits']}>
                    {formatHighlightedText(
                      t(
                        {
                          enUS: '([[{{amount}}]] Profits)',
                        },
                        {
                          amount: amountFormatter(
                            renderProps?.linkedCcyExtraRewardWhenSuccessfulExecuted,
                            linkedCcyOpsiteConfig?.precision,
                          ),
                        },
                      ),
                      {
                        hightlightedClassName: styles['amount'],
                      },
                    )}
                  </div>
                </>
              ) : renderProps?.executionResult ==
                DualPositionExecutionStatus.NotExecuted ? (
                <>
                  {/* 下方情况3：如果未执行，显示depositCcy的数额+Profits(deposit ccy) */}
                  <div
                    className={classNames(styles['ccy'], styles['deposit-ccy'])}
                  >
                    <span className={styles['amount']}>
                      {amountFormatter(
                        renderProps.redeemable,
                        depositCcyConfig?.precision,
                      )}
                    </span>
                    <span className={styles['unit']}>
                      {depositCcyConfig?.name || product.vault.depositCcy}
                    </span>
                  </div>
                  <div className={styles['profits']}>
                    {formatHighlightedText(
                      t(
                        {
                          enUS: '([[{{amount}}]] Profits)',
                        },
                        {
                          amount: amountFormatter(
                            renderProps?.depositCcyExtraRewardWhenNoExecuted,
                            depositCcyConfig?.precision,
                          ),
                        },
                      ),
                      {
                        hightlightedClassName: styles['amount'],
                      },
                    )}
                  </div>
                </>
              ) : renderProps?.executionResult ==
                DualPositionExecutionStatus.PartialExecuted ? (
                <>
                  {/* 下方情况4：如果部分执行，显示两个币的具体数值 */}
                  <div
                    className={classNames(styles['ccy'], styles['dual-ccy'])}
                  >
                    <span className={styles['amount']}>
                      {amountFormatter(
                        renderProps.redeemableOfLinkedCcy,
                        linkedCcyOpsiteConfig?.precision,
                      )}
                    </span>
                    <span className={styles['unit']}>
                      {linkedCcyOpsiteConfig?.name || linkedCcy}
                    </span>
                    <br />+
                    <span className={styles['amount']}>
                      {amountFormatter(
                        renderProps.redeemable,
                        depositCcyConfig?.precision,
                      )}
                    </span>
                    <span className={styles['unit']}>
                      {depositCcyConfig?.name || product.vault.depositCcy}
                    </span>
                  </div>
                </>
              ) : undefined}
            </div>
          </div>
        </div>
        <div className={styles['rch-content']}>
          <div className={styles['rch-amount']}>
            {+position.amounts.rchAirdrop >= 0 ? '+' : ''}
            {amountFormatter(position.amounts.rchAirdrop, 2)} RCH
          </div>
          {claimStatus == DualPositionClaimStatus.Claimable &&
            !props.isAutomator && (
              <div className={styles['btns']}>
                <AsyncButton
                  type="primary"
                  theme="solid"
                  onClick={(e) => {
                    e.stopPropagation();
                    return props.handleClaim();
                  }}
                >
                  {(loading) =>
                    (!loading ? t('CLAIM') : t('CLAIMING...')).toLowerCase()
                  }
                </AsyncButton>
              </div>
            )}
        </div>
      </div>

      <PositionClaimProgress
        ref={claimProgressRef}
        chainId={product.vault.chainId}
        riskType={product.vault.riskType}
        positions={[position]}
      />
    </>
  );
};

export default DualPositionCard;
