import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from '@douyinfe/semi-ui';
import { AutomatorDetail } from '@sofa/services/automator';
import { CCYService } from '@sofa/services/ccy';
import { useTranslation } from '@sofa/services/i18n';
import {
  amountFormatter,
  cvtAmountsInCcy,
  displayPercentage,
} from '@sofa/utils/amount';
import { formatDurationToDay } from '@sofa/utils/time';
import classNames from 'classnames';

import Address from '@/components/Address';
import AmountDisplay from '@/components/AmountDisplay';
import AsyncButton from '@/components/AsyncButton';
import { useIndexPrices } from '@/components/IndexPrices/store';
import { useIsMobileUI } from '@/components/MobileOnly';
import { formatTime } from '@/components/TimezoneSelector/store';
import { useAutomatorModal } from '@/pages/products/automator/index-modal';
import AutomatorShareModal from '@/pages/products/automator-operate/components/ShareModal';
import { AutomatorShareModalPropsRef } from '@/pages/products/automator-operate/components/ShareModal';

import { Comp as IconCalendar } from '../../assets/icon-calendar.svg';
import { Comp as IconPeople } from '../../assets/icon-people.svg';

import styles from './index.module.scss';

export interface AutomatorCreatorCardProps {
  info: AutomatorDetail;
  modalController: ReturnType<typeof useAutomatorModal>[1];
}

export const AutomatorCreatorCard = (props: AutomatorCreatorCardProps) => {
  const [t] = useTranslation('AutomatorCreatorCard');
  const navigate = useNavigate();
  const prices = useIndexPrices((s) => s.prices);
  const isMobileUI = useIsMobileUI();
  const depositCcyConfig = useMemo(
    () => CCYService.ccyConfigs[props.info.vaultInfo.depositCcy],
    [props.info.vaultInfo.depositCcy],
  );

  const shareModalRef = useRef<AutomatorShareModalPropsRef>(null);
  return (
    <>
      <div
        className={classNames(
          styles['card'],
          isMobileUI ? styles['mobile-ui'] : undefined,
        )}
        onClick={() =>
          props.modalController.open(props.info.vaultInfo, undefined)
        }
      >
        <div className={styles['header']}>
          <div className={styles['left']}>
            <img src={depositCcyConfig?.icon} alt="" />
            <div className={styles['name']}>
              {props.info.vaultInfo.name || props.info.vaultInfo.depositCcy}
            </div>
            <div className={styles['infos']}>
              <Address
                address={props.info.vaultInfo.vault.toLowerCase()}
                simple
                linkBtn
              />
              <div className={styles['other-infos']}>
                <div className={styles['fee']}>
                  <span>{t({ enUS: 'Fee', zhCN: '手续费' })}</span>
                  {props.info.vaultInfo?.creatorFeeRate !== undefined
                    ? displayPercentage(props.info.vaultInfo.creatorFeeRate, 0)
                    : '-'}
                </div>
                <div className={styles['runtime']}>
                  <IconCalendar />
                  {props.info.vaultInfo.createTime
                    ? formatDurationToDay(
                        Date.now() - +props.info.vaultInfo.createTime,
                      )
                    : '-'}
                </div>
                <div className={styles['people']}>
                  <IconPeople />
                  {props.info.currentParticipantNum || '-'}
                </div>
              </div>
            </div>
          </div>
          <div className={styles['right']}>
            <div className={styles['item']}>
              <div className={styles['label']}>
                {t({ enUS: '7D Target Yield', zhCN: '7日年化' })}
              </div>
              <div
                className={classNames(styles['value'], styles['apy'])}
                style={{
                  color:
                    +props.info.yieldPercentage >= 0
                      ? 'var(--color-rise)'
                      : 'var(--color-fall)',
                }}
              >
                {+props.info.yieldPercentage >= 0 && '+'}
                {displayPercentage(+props.info.yieldPercentage / 100)}
              </div>
            </div>
            <div className={styles['item']}>
              <div className={styles['label']}>
                {t({ enUS: 'Swap Ratio', zhCN: '净值' })}
              </div>
              <div className={classNames(styles['value'])}>
                {amountFormatter(+props.info.nav)}
              </div>
            </div>
          </div>
        </div>
        <div className={styles['item']}>
          <div className={styles['label']}>
            {t({ enUS: 'Pool Size', zhCN: '规模' })}
          </div>
          <div className={styles['value']}>
            <AmountDisplay
              amount={
                +props.info.aumBySharesToken ||
                +props.info.aumByVaultDepositCcy / +props.info.nav
              }
              ccy={props.info.vaultInfo.depositCcy}
            />
            <span className={styles['unit']}>
              {props.info.vaultInfo.positionCcy}
            </span>
            <span className={styles['cvt']}>
              <span className={styles['separator']}>≈</span>
              <AmountDisplay
                amount={props.info.aumByVaultDepositCcy}
                ccy={props.info.vaultInfo.vaultDepositCcy}
              />
              <span className={styles['unit']}>
                {props.info.vaultInfo.depositCcy}
              </span>
              <span className={styles['separator']}>≈</span>
              <AmountDisplay
                amount={props.info.aumByClientDepositCcy}
                ccy={props.info.vaultInfo.depositCcy}
              />
              <span className={styles['unit']}>
                {props.info.vaultInfo.depositCcy}
              </span>
            </span>
          </div>
        </div>
        <div className={styles['item']}>
          <div className={styles['label']}>
            {t({ enUS: 'Available Balance', zhCN: '可交易资金' })}
          </div>
          <div className={styles['value']}>
            <AmountDisplay
              amount={props.info.availableAmountByVaultDepositCcy}
              ccy={props.info.vaultInfo.vaultDepositCcy}
            />
            <span className={styles['unit']}>
              {props.info.vaultInfo.vaultDepositCcy}
            </span>
          </div>
        </div>
        <div className={styles['item']}>
          <div className={classNames(styles['label'], styles['underline'])}>
            <Tooltip
              content={t({
                enUS: 'Means the total profit and loss (PnL) accumulated by the Automator, after deducting platform fees and the profit share for the Optivisor, reflecting the actual realized returns for investors and creators.',
                zhCN: '指 Automator 累积的总利润和亏损（PnL），扣除平台费用和 Optivisor 的利润分成后，反映投资者和主理人的实际实现收益。',
              })}
            >
              {t({ enUS: 'Historical Cumulative PnL', zhCN: '历史累计损益' })}
            </Tooltip>
          </div>
          <div className={styles['value']}>
            <span
              style={{
                color:
                  +props.info.totalPnlByClientDepositCcy >= 0
                    ? 'var(--color-rise)'
                    : 'var(--color-fall)',
              }}
            >
              <AmountDisplay
                amount={props.info.totalPnlByClientDepositCcy}
                ccy={props.info.vaultInfo.depositCcy}
              />
              <span className={styles['unit']}>
                {props.info.vaultInfo.depositCcy}
              </span>
            </span>
            <span className={styles['separator']}>+</span>
            <span style={{ color: 'var(--color-rch)' }}>
              <AmountDisplay amount={props.info.totalRchAmount} ccy={'RCH'} />
              <span
                className={classNames(styles['unit'], styles['icon-airdrop'])}
              >
                RCH
              </span>
            </span>
            <span className={classNames(styles['cvt'], styles['weaken'])}>
              <span className={styles['separator']}>≈</span>
              <AmountDisplay
                amount={props.info.totalPnlWithRchByClientDepositCcy}
                ccy={props.info.vaultInfo.depositCcy}
              />
              <span className={styles['unit']}>
                {props.info.vaultInfo.depositCcy}
              </span>
            </span>
          </div>
        </div>
        <div className={styles['item']}>
          <div className={classNames(styles['label'], styles['underline'])}>
            <Tooltip
              content={t({
                enUS: `Represents the percentage return on investment (ROI) accumulated by the Automator, after deducting platform fees and the profit share for the Optivisor. It reflects the overall performance as a percentage of the initial funds invested.`,
                zhCN: '表示 Automator 在扣除平台费用和 Optivisor 的利润分成后累积的投资回报率（ROI）。该指标以初始投资资金的百分比形式反映整体表现。',
              })}
            >
              {t({ enUS: 'Historical Cumulative PnL%', zhCN: '历史累计损益%' })}
            </Tooltip>
          </div>
          <div
            className={styles['value']}
            style={{
              color:
                +props.info.pnlPercentage >= 0
                  ? 'var(--color-rise)'
                  : 'var(--color-fall)',
            }}
          >
            {displayPercentage(+props.info.pnlPercentage / 100, 2, true)}
          </div>
        </div>
        <div className={styles['item']}>
          <div className={styles['label']}>
            {t(
              { enUS: 'Cumulative Profit Share', zhCN: '累计分润' },
              { time: formatTime(props.info.dateTime, 'MMM.DD') },
            )}
          </div>
          <div className={styles['value']}>
            <AmountDisplay
              amount={props.info.totalOptivisorProfitByVaultDepositCcy}
              ccy={props.info.vaultInfo.vaultDepositCcy}
            />
            <span className={styles['unit']}>
              {props.info.vaultInfo.vaultDepositCcy}
            </span>
            <span className={styles['cvt']}>
              <span className={styles['separator']}>≈</span>
              <AmountDisplay
                amount={cvtAmountsInCcy(
                  [
                    [
                      props.info.vaultInfo.vaultDepositCcy,
                      props.info.totalOptivisorProfitByVaultDepositCcy,
                    ],
                  ],
                  prices,
                  props.info.vaultInfo.depositCcy,
                )}
                ccy={props.info.vaultInfo.depositCcy}
              />
              <span className={styles['unit']}>
                {props.info.vaultInfo.depositCcy}
              </span>
            </span>
          </div>
        </div>
        <div className={styles['footer']}>
          <AsyncButton
            className={styles['btn-trade']}
            onClick={() =>
              navigate(
                `/products/automator/operate?automator-vault=${
                  props.info.vaultInfo.vault || ''
                }&automator-operate-tab=trade`,
              )
            }
          >
            {t({ enUS: 'Trade', zhCN: '交易' })}
          </AsyncButton>
          <AsyncButton
            className={classNames(styles['btn-position'], 'btn-ghost')}
            onClick={() =>
              navigate(
                `/products/automator/operate?automator-vault=${
                  props.info.vaultInfo.vault || ''
                }&automator-operate-tab=positions`,
              )
            }
          >
            {t({ enUS: 'Positions', zhCN: '头寸' })}
            {!!props.info.positionSize && (
              <span className={styles['position-size']}>
                {props.info.positionSize}
              </span>
            )}
          </AsyncButton>
          <AsyncButton
            className={classNames(styles['btn'], 'btn-ghost')}
            onClick={() =>
              navigate(
                `/products/automator/operate?automator-vault=${
                  props.info.vaultInfo.vault || ''
                }`,
              )
            }
          >
            {t({ enUS: 'More Detail', zhCN: '更多信息' })}
          </AsyncButton>

          <AsyncButton
            className={classNames(
              styles['btn'],
              'btn-ghost',
              styles['share-btn'],
            )}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              shareModalRef.current?.show();
            }}
          >
            <span>
              {t({
                enUS: 'Share',
                zhCN: '分享',
              })}
            </span>
          </AsyncButton>
        </div>
      </div>
      <AutomatorShareModal automatorDetail={props.info} ref={shareModalRef} />
    </>
  );
};
