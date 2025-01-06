import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AutomatorDetail } from '@sofa/services/automator';
import { CCYService } from '@sofa/services/ccy';
import { useTranslation } from '@sofa/services/i18n';
import { amountFormatter, displayPercentage } from '@sofa/utils/amount';
import { formatDuration } from '@sofa/utils/time';
import classNames from 'classnames';

import Address from '@/components/Address';
import AmountDisplay from '@/components/AmountDisplay';
import AsyncButton from '@/components/AsyncButton';
import { useIsMobileUI } from '@/components/MobileOnly';
import { formatTime } from '@/components/TimezoneSelector/store';
import { useAutomatorModal } from '@/pages/products/automator/index-modal';

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
  const isMobileUI = useIsMobileUI();
  const depositCcyConfig = useMemo(
    () => CCYService.ccyConfigs[props.info.vaultInfo.depositCcy],
    [props.info.vaultInfo.depositCcy],
  );
  return (
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
            {props.info.automatorName ||
              props.info.vaultInfo.name ||
              props.info.vaultInfo.depositCcy}
          </div>
          <div className={styles['infos']}>
            <Address
              address={props.info.vaultInfo.vault.toLowerCase()}
              simple
              linkBtn
            />
            <div className={styles['fee']}>
              <span>{t({ enUS: 'Fee', zhCN: '手续费' })}</span>
              {props.info.vaultInfo.createTime
                ? formatDuration(
                    Date.now() - +props.info.vaultInfo.createTime,
                    1,
                    true,
                  )
                : '-'}
            </div>
            <div className={styles['runtime']}>
              <IconCalendar />
              {props.info.vaultInfo.createTime
                ? formatDuration(
                    Date.now() - +props.info.vaultInfo.createTime,
                    1,
                    true,
                  )
                : '-'}
            </div>
            <div className={styles['people']}>
              <IconPeople />
              {props.info.participantNum || '-'}
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
            amount={+props.info.aumByVaultDepositCcy / +props.info.nav}
            ccy={props.info.vaultInfo.depositCcy}
          />
          <span className={styles['unit']}>
            {props.info.vaultInfo.positionCcy}
          </span>
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
        </div>
      </div>
      <div className={styles['item']}>
        <div className={styles['label']}>
          {t({ enUS: 'Available Balance', zhCN: '可交易资金' })}
        </div>
        <div className={styles['value']}>
          <AmountDisplay
            amount={props.info.availableAmount}
            ccy={props.info.vaultInfo.vaultDepositCcy}
          />
          <span className={styles['unit']}>
            {props.info.vaultInfo.vaultDepositCcy}
          </span>
        </div>
      </div>
      <div className={styles['item']}>
        <div className={styles['label']}>
          {t(
            { enUS: 'PnL({{time}})', zhCN: 'PnL({{time}})' },
            { time: formatTime(props.info.dateTime, 'MMM.DD') },
          )}
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
            <span className={styles['unit']}>RCH</span>
          </span>
          <span className={styles['separator']}>≈</span>
          <AmountDisplay
            amount={props.info.totalPnlWithRchByClientDepositCcy}
            ccy={props.info.vaultInfo.depositCcy}
          />
          <span className={styles['unit']}>
            {props.info.vaultInfo.depositCcy}
          </span>
        </div>
      </div>
      <div className={styles['item']}>
        <div className={styles['label']}>
          {t(
            { enUS: 'PnL%({{time}})', zhCN: 'PnL%({{time}})' },
            { time: formatTime(props.info.dateTime, 'MMM.DD') },
          )}
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
          {displayPercentage(props.info.pnlPercentage, 2, true)}
        </div>
      </div>
      <div className={styles['item']}>
        <div className={styles['label']}>
          {t(
            { enUS: 'Total Share Profits', zhCN: '你的收益' },
            { time: formatTime(props.info.dateTime, 'MMM.DD') },
          )}
        </div>
        <div className={styles['value']}>
          <AmountDisplay
            amount={props.info.profits}
            ccy={props.info.vaultInfo.vaultDepositCcy}
          />
          <span className={styles['unit']}>
            {props.info.vaultInfo.vaultDepositCcy}
          </span>
        </div>
      </div>
      <div className={styles['footer']}>
        <AsyncButton
          className={styles['btn-deposit']}
          onClick={() =>
            props.modalController.open(props.info.vaultInfo, 'deposit')
          }
        >
          {t({ enUS: 'Trade', zhCN: '交易' })}
        </AsyncButton>
        <AsyncButton
          className={classNames(styles['btn-redeem'], 'btn-ghost')}
          onClick={() =>
            props.modalController.open(props.info.vaultInfo, 'redeem')
          }
        >
          {t({ enUS: 'Positions', zhCN: '头寸' })}
          {!props.info.positionSize && (
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
      </div>
    </div>
  );
};
