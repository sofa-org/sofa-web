import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AutomatorUserDetail } from '@sofa/services/automator';
import { ProjectType } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { useTranslation } from '@sofa/services/i18n';
import { cvtAmountsInCcy, displayPercentage } from '@sofa/utils/amount';
import classNames from 'classnames';

import Address from '@/components/Address';
import AmountDisplay from '@/components/AmountDisplay';
import AsyncButton from '@/components/AsyncButton';
import { useIndexPrices } from '@/components/IndexPrices/store';

import styles from './index.module.scss';

export interface AutomatorCardProps {
  info: AutomatorUserDetail;
}

export const AutomatorPositionCard = (props: AutomatorCardProps) => {
  const [t] = useTranslation('AutomatorCard');
  const depositCcyConfig = useMemo(
    () => CCYService.ccyConfigs[props.info.vaultInfo.depositCcy],
    [props.info.vaultInfo.depositCcy],
  );
  const prices = useIndexPrices((state) => state.prices);
  const convertedPnl = useMemo(
    () =>
      cvtAmountsInCcy(
        [
          [props.info.vaultInfo.depositCcy, props.info.depositTotalPnl],
          ['RCH', props.info.rchTotalPnl],
        ],
        prices,
        props.info.vaultInfo.depositCcy,
      ),
    [
      prices,
      props.info.depositTotalPnl,
      props.info.rchTotalPnl,
      props.info.vaultInfo.depositCcy,
    ],
  );
  return (
    <div className={styles['card']}>
      <div className={styles['header']}>
        <img src={depositCcyConfig?.icon} alt="" />
        <div className={styles['name']}>
          {props.info.automatorName ||
            props.info.vaultInfo.name ||
            props.info.vaultInfo.depositCcy}
        </div>
        <Address address={props.info.automatorVault} simple linkBtn />
      </div>
      <div className={styles['item']}>
        <div className={styles['label']}>
          {t({ enUS: 'Holding', zhCN: '持仓' })}
        </div>
        <div className={styles['value']}>
          <AmountDisplay amount={props.info?.share} />
          <span className={styles['unit']}>
            {props.info.vaultInfo.balanceCcy}
          </span>
          <div className={styles['decorative']}>
            <span className={styles['operator']}>≈</span>
            <AmountDisplay amount={props.info?.amount} />
            <span className={styles['unit']}>
              {props.info.vaultInfo.depositCcy}
            </span>
          </div>
        </div>
      </div>
      <div className={styles['item']}>
        <div className={styles['label']}>
          {t({ enUS: 'Cumulative PnL', zhCN: '累计收益' })}
        </div>
        <div className={styles['value']}>
          <AmountDisplay amount={props.info?.depositTotalPnl} />
          <span className={styles['unit']}>
            {props.info.vaultInfo.balanceCcy}
          </span>
          <span className={styles['operator']}>+</span>
          <span style={{ color: 'var(--color-rch)' }}>
            <AmountDisplay amount={props.info.rchTotalPnl} />
            <span className={styles['unit']}>RCH</span>
          </span>
          <div className={styles['decorative']}>
            <span className={styles['operator']}>≈</span>
            <AmountDisplay amount={convertedPnl} />
            <span className={styles['unit']}>
              {props.info.vaultInfo.depositCcy}
            </span>
          </div>
        </div>
      </div>
      <div className={styles['item']}>
        <div className={styles['label']}>
          {t({ enUS: 'Cumulative PnL %', zhCN: '累计收益年化' })}
        </div>
        <div className={classNames(styles['value'], styles['apy'])}>
          <span
            style={{
              color:
                Number(props.info.depositTotalPnlPercentage) >= 0
                  ? 'var(--color-rise)'
                  : 'var(--color-fall)',
            }}
          >
            {Number(props.info.depositTotalPnlPercentage) >= 0 && '+'}
            {displayPercentage(
              Number(props.info.depositTotalPnlPercentage) / 100,
            )}
          </span>
          <span className={styles['operator']}>+</span>
          <span style={{ color: 'var(--color-rch)' }}>
            {Number(props.info.rchTotalPnlPercentage) >= 0 && '+'}
            {displayPercentage(Number(props.info.rchTotalPnlPercentage) / 100)}
          </span>
        </div>
      </div>
      <div className={styles['footer']}>
        <AsyncButton className={styles['btn-deposit']}>
          {t({ enUS: 'Mint Again', zhCN: '再铸造' })}
        </AsyncButton>
        <AsyncButton className={classNames(styles['btn-redeem'], 'btn-ghost')}>
          {t({ enUS: 'Redeem', zhCN: '赎回' })}
        </AsyncButton>
        <Link to={`/transactions?project=${ProjectType.Automator}`}>
          {t({ enUS: 'Transaction History', zhCN: '操作历史' })}
        </Link>
      </div>
    </div>
  );
};
