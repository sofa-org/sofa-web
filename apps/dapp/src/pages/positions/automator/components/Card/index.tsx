import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { useIsMobileUI } from '@/components/MobileOnly';
import { useAutomatorModal } from '@/pages/products/automator/index-modal';

import styles from './index.module.scss';

export interface AutomatorCardProps {
  info: AutomatorUserDetail;
  modalController: ReturnType<typeof useAutomatorModal>[1];
}

export const AutomatorPositionCard = (props: AutomatorCardProps) => {
  const [t] = useTranslation('AutomatorCard');
  const navigate = useNavigate();
  const depositCcyConfig = useMemo(
    () => CCYService.ccyConfigs[props.info.vaultInfo.depositCcy],
    [props.info.vaultInfo.depositCcy],
  );
  const prices = useIndexPrices((state) => state.prices);
  const convertedPnl = useMemo(
    () =>
      cvtAmountsInCcy(
        [
          [
            props.info.vaultInfo.depositCcy,
            props.info.totalPnlByClientDepositCcy,
          ],
          ['RCH', props.info.rchTotalPnl],
        ],
        prices,
        props.info.vaultInfo.depositCcy,
      ),
    [
      prices,
      props.info.totalPnlByClientDepositCcy,
      props.info.rchTotalPnl,
      props.info.vaultInfo.depositCcy,
    ],
  );

  const isMobileUI = useIsMobileUI();
  return (
    <div
      className={classNames(
        styles['card'],
        isMobileUI ? styles['mobile-ui'] : undefined,
      )}
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
      <div className={styles['item']}>
        <div className={styles['label']}>
          {t({ enUS: 'Holding', zhCN: '持仓' })}
        </div>
        <div className={styles['value']}>
          <AmountDisplay amount={props.info?.share} />
          <span className={styles['unit']}>
            {props.info.vaultInfo.positionCcy}
          </span>
          <div className={styles['decorative']}>
            <span className={styles['operator']}>≈</span>
            <AmountDisplay
              amount={cvtAmountsInCcy(
                [
                  [
                    props.info.vaultInfo.vaultDepositCcy,
                    props.info?.amountInVaultDepositCcy,
                  ],
                ],
                prices,
                props.info.vaultInfo.depositCcy,
              )}
            />
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
          <AmountDisplay amount={props.info?.totalPnlByClientDepositCcy} />
          <span className={styles['unit']}>
            {props.info.vaultInfo.depositCcy}
          </span>
          <span className={styles['operator']}>+</span>
          <span style={{ color: 'var(--color-rch)' }}>
            <AmountDisplay amount={props.info.rchTotalPnl} />
            <span
              className={classNames(styles['unit'], styles['icon-airdrop'])}
            >
              RCH
            </span>
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
                Number(props.info.pnlPercentage) >= 0
                  ? 'var(--color-rise)'
                  : 'var(--color-fall)',
            }}
          >
            {Number(props.info.pnlPercentage) >= 0 && '+'}
            {displayPercentage(Number(props.info.pnlPercentage) / 100)}
          </span>
          {/* <span className={styles['operator']}>+</span>
          <span style={{ color: 'var(--color-rch)' }}>
            {Number(props.info.rchTotalPnlPercentage) >= 0 && '+'}
            {displayPercentage(Number(props.info.rchTotalPnlPercentage) / 100)}
          </span> */}
        </div>
      </div>
      <div className={styles['footer']}>
        <AsyncButton
          className={styles['btn-deposit']}
          onClick={() =>
            props.modalController.open(props.info.vaultInfo, 'deposit')
          }
        >
          {t({ enUS: 'Mint Again', zhCN: '再铸造' })}
        </AsyncButton>
        <AsyncButton
          className={classNames(styles['btn-redeem'], 'btn-ghost')}
          onClick={() =>
            props.modalController.open(props.info.vaultInfo, 'redeem')
          }
        >
          {t({ enUS: 'Redeem', zhCN: '赎回' })}
        </AsyncButton>
        <AsyncButton
          className={classNames(styles['btn'], 'btn-ghost')}
          onClick={() =>
            navigate(
              `/transactions?project=${ProjectType.Automator}&automator-vault=${
                props.info.vaultInfo.vault || ''
              }`,
            )
          }
        >
          {t({ enUS: 'Transaction History', zhCN: '操作历史' })}
        </AsyncButton>
      </div>
    </div>
  );
};
