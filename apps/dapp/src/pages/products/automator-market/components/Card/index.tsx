import { useMemo } from 'react';
import { AutomatorInfo } from '@sofa/services/automator';
import { CCYService } from '@sofa/services/ccy';
import { useTranslation } from '@sofa/services/i18n';
import { cvtAmountsInCcy, displayPercentage } from '@sofa/utils/amount';
import { formatDuration } from '@sofa/utils/time';
import classNames from 'classnames';

import Address from '@/components/Address';
import AmountDisplay from '@/components/AmountDisplay';
import { useIndexPrices } from '@/components/IndexPrices/store';
import ProgressBar from '@/components/ProgressBar';
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
  const prices = useIndexPrices((s) => s.prices);
  const depositCcyConfig = useMemo(
    () => CCYService.ccyConfigs[props.info.vaultInfo.depositCcy],
    [props.info.vaultInfo.depositCcy],
  );
  return (
    <div
      className={styles['card']}
      onClick={() =>
        props.modalController.open(props.info.vaultInfo, 'deposit')
      }
    >
      <div className={styles['header']}>
        <img src={depositCcyConfig?.icon} alt="" />
        <div className={styles['name']}>
          {props.info.automatorName ||
            props.info.vaultInfo.name ||
            props.info.vaultInfo.depositCcy}
        </div>
        <Address address={props.info.vaultInfo.vault} simple linkBtn />
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
            amount={cvtAmountsInCcy(
              [[props.info.vaultInfo.vaultDepositCcy, +props.info.amount]],
              prices,
              props.info.vaultInfo.depositCcy,
            )}
            ccy={props.info.vaultInfo.depositCcy}
          />
          <span className={styles['unit']}>
            {props.info.vaultInfo.depositCcy}
          </span>
        </div>
      </div>
      {/* {props.info.creator && (
        <>
          <div className={styles['creator']}>
            <div className={styles['label']}>
              {t({ enUS: `Creator's`, zhCN: '创建者份额' })}
            </div>
            <div className={styles['value']}>
              <AmountDisplay
                amount={cvtAmountsInCcy(
                  [
                    [
                      props.info.vaultInfo.vaultDepositCcy,
                      Number(props.info.creatorAmount),
                    ],
                  ],
                  prices,
                  props.info.vaultInfo.depositCcy,
                )}
                ccy={props.info.vaultInfo.depositCcy}
              />
              <span className={styles['unit']}>
                {props.info.vaultInfo.positionCcy}
              </span>
            </div>
          </div>
          <ProgressBar
            type="3"
            className={styles['progress']}
            percent={
              Number(props.info?.creatorAmount) / Number(props.info?.amount)
            }
            minWidthPercentage={0.05}
          />
        </>
      )} */}
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
