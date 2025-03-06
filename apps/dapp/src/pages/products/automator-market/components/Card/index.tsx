import { useMemo } from 'react';
import { Tooltip } from '@douyinfe/semi-ui';
import { AutomatorInfo } from '@sofa/services/automator';
import { CCYService } from '@sofa/services/ccy';
import { useTranslation } from '@sofa/services/i18n';
import { displayPercentage } from '@sofa/utils/amount';
import { useIsPortrait } from '@sofa/utils/hooks';
import { formatDurationToDay, MsIntervals } from '@sofa/utils/time';
import classNames from 'classnames';

import Address from '@/components/Address';
import AmountDisplay from '@/components/AmountDisplay';
import { useIsMobileUI } from '@/components/MobileOnly';
import { MsgDisplay } from '@/components/MsgDisplay';
import { useAutomatorModal } from '@/pages/products/automator/index-modal';
import { AutomatorRiskExposureMap } from '@/pages/products/automator-create/util';

import { Comp as IconCalendar } from '../../assets/icon-calendar.svg';
import { Comp as IconPeople } from '../../assets/icon-people.svg';
import { Comp as IconRisk } from '../../assets/icon-risk.svg';
import { Comp as IconWarning } from '../../assets/icon-warning.svg';

import styles from './index.module.scss';

export interface AutomatorCardProps {
  info: AutomatorInfo;
  modalController: ReturnType<typeof useAutomatorModal>[1];
}

export const AutomatorCard = (props: AutomatorCardProps) => {
  const [t] = useTranslation('AutomatorCard');
  const isMobileUI = useIsMobileUI();
  const depositCcyConfig = useMemo(
    () => CCYService.ccyConfigs[props.info.vaultInfo.depositCcy],
    [props.info.vaultInfo.depositCcy],
  );
  const isPortrait = useIsPortrait();
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
        <img src={depositCcyConfig?.icon} alt="" />
        <div className={styles['name']}>
          <MsgDisplay expandDisabled>
            {props.info.vaultInfo.name || props.info.vaultInfo.depositCcy}
          </MsgDisplay>
        </div>
        <Address
          address={props.info.vaultInfo.vault.toLowerCase()}
          simple
          linkBtn
        />
      </div>
      <div className={styles['yield']}>
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
            opacity:
              Date.now() - +props.info.vaultInfo.createTime <=
              MsIntervals.day * 7
                ? 0.45
                : 1,
          }}
        >
          {+props.info.yieldPercentage >= 0 && '+'}
          {displayPercentage(+props.info.yieldPercentage / 100)}
          {Date.now() - +props.info.vaultInfo.createTime <=
            MsIntervals.day * 7 && (
            <Tooltip
              content={t({
                enUS: 'For Automators with fewer than 7 running days, the displayed APY may be skewed due to early large trades. Please exercise caution when evaluating performance.',
                zhCN: '对于运行时间少于 7 天的 Automator，由于早期大额交易，显示的年化收益率（APY）可能存在偏差。请在评估表现时谨慎对待。',
              })}
              trigger={isPortrait ? 'click' : 'hover'}
            >
              <span
                className={styles['warning']}
                onClick={(e) => e.stopPropagation()}
              >
                <IconWarning />
              </span>
            </Tooltip>
          )}
        </div>
      </div>
      <div className={styles['size']}>
        <div className={styles['label']}>
          {t({ enUS: 'Pool Size', zhCN: '规模' })}
        </div>
        <div className={styles['value']}>
          <AmountDisplay
            amount={+props.info.aumByClientDepositCcy}
            ccy={props.info.vaultInfo.depositCcy}
          />
          <span className={styles['unit']}>
            {props.info.vaultInfo.depositCcy}
          </span>
        </div>
      </div>
      {props.info.vaultInfo.creator && (
        <>
          <div className={styles['creator']}>
            <div className={styles['label']}>
              {t({ enUS: `Optivisor's`, zhCN: '主理人份额' })}
            </div>
            <div className={styles['value']}>
              <AmountDisplay
                amount={props.info.creatorAmountByClientDepositCcy || 0}
                ccy={props.info.vaultInfo.depositCcy}
              />
              <span className={styles['unit']}>
                {props.info.vaultInfo.depositCcy}
              </span>
              <span className={styles['percent']}>
                {displayPercentage(
                  Number(props.info?.creatorAmountByVaultDepositCcy) /
                    Number(props.info?.aumByVaultDepositCcy),
                )}
              </span>
            </div>
          </div>
        </>
      )}
      <div className={styles['footer']}>
        <div className={styles['risk']}>
          <IconRisk />
          <span
            style={{
              color:
                AutomatorRiskExposureMap[props.info.vaultInfo.riskExposure!]
                  ?.color || 'inherit',
            }}
          >
            {AutomatorRiskExposureMap[props.info.vaultInfo.riskExposure!]
              ?.label || 'R-'}
          </span>
        </div>
        <div className={styles['runtime']}>
          <IconCalendar />
          {props.info.vaultInfo.createTime
            ? formatDurationToDay(Date.now() - +props.info.vaultInfo.createTime)
            : '-'}
        </div>
        <div className={styles['people']}>
          <IconPeople />
          {props.info.participantNum || '-'}
        </div>
      </div>
    </div>
  );
};
