import { useMemo } from 'react';
import { AutomatorInfo } from '@sofa/services/automator';
import { CCYService } from '@sofa/services/ccy';
import { useTranslation } from '@sofa/services/i18n';
import { displayPercentage } from '@sofa/utils/amount';
import { formatDuration } from '@sofa/utils/time';
import classNames from 'classnames';

import Address from '@/components/Address';
import AmountDisplay from '@/components/AmountDisplay';
import { useIsMobileUI } from '@/components/MobileOnly';
import { useAutomatorModal } from '@/pages/products/automator/index-modal';

import { Comp as IconCalendar } from '../../assets/icon-calendar.svg';
import { Comp as IconPeople } from '../../assets/icon-people.svg';

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
          {props.info.vaultInfo.name || props.info.vaultInfo.depositCcy}
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
          }}
        >
          {+props.info.yieldPercentage >= 0 && '+'}
          {displayPercentage(+props.info.yieldPercentage / 100)}
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
              {t({ enUS: `Optivisor's`, zhCN: '创建者份额' })}
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
  );
};
