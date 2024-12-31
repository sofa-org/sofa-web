import { useEffect } from 'react';
import { Spin, Tooltip } from '@douyinfe/semi-ui';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { cvtAmountsInCcy, displayPercentage } from '@sofa/utils/amount';
import { formatDuration } from '@sofa/utils/time';

import AmountDisplay from '@/components/AmountDisplay';
import { useIndexPrices } from '@/components/IndexPrices/store';

import { Comp as IconCalendar } from '../../../automator-market/assets/icon-calendar.svg';
import { Comp as IconPeople } from '../../../automator-market/assets/icon-people.svg';
import { useAutomatorStore } from '../../store';

import styles from './index.module.scss';

export interface AutomatorOverviewProps {
  vault?: AutomatorVaultInfo;
}

export const AutomatorOverview = (props: AutomatorOverviewProps) => {
  const [t] = useTranslation('AutomatorOverview');
  const prices = useIndexPrices((s) => s.prices);
  const data = useAutomatorStore(
    (state) =>
      props.vault &&
      state.vaultOverviews[
        `${props.vault.chainId}-${props.vault.vault.toLowerCase()}-`
      ],
  );
  useEffect(() => {
    if (props.vault) return useAutomatorStore.subscribeOverview(props.vault);
  }, [props.vault]);
  return (
    <Spin wrapperClassName={styles['overview']} spinning={!data}>
      <div className={styles['left']}>
        <div className={styles['yield']}>
          <div className={styles['title']}>
            {t({ enUS: '7D Target Yield', zhCN: '7日年化收益率' })}
          </div>
          <div className={styles['value']}>
            {displayPercentage(Number(data?.yieldPercentage) / 100)}
            <span className={styles['footnote']}>
              {t({ enUS: 'Est.', zhCN: '估算' })}
            </span>
          </div>
          {/* <div className={styles['desc']}>
            {t({
              enUS: 'Airdrop Inclusive',
              zhCN: '包含空投奖励',
            })}
          </div> */}
        </div>
        <div className={styles['aum']}>
          <div className={styles['title']}>
            <Tooltip
              content={t({
                enUS: 'Assets Under Management',
                zhCN: '资产管理规模',
              })}
            >
              <span tabIndex={-1}>
                {t({ enUS: 'Pool Size', zhCN: '总资产' })}
              </span>
            </Tooltip>
          </div>
          <div className={styles['value']}>
            <AmountDisplay
              amount={Number(data?.aumInVaultDepositCcy) / Number(data?.nav)}
              ccy={props.vault?.positionCcy}
            />
            <span className={styles['unit']}>{props.vault?.positionCcy}</span>
            <div className={styles['decorative']}>
              ≈{' '}
              <AmountDisplay
                amount={
                  !props.vault
                    ? ''
                    : cvtAmountsInCcy(
                        [
                          [
                            props.vault.vaultDepositCcy,
                            data?.aumInVaultDepositCcy,
                          ],
                        ],
                        prices,
                        props.vault.depositCcy,
                      )
                }
                ccy={props.vault?.depositCcy}
              />
              <span className={styles['unit']}>{props.vault?.depositCcy}</span>
            </div>
          </div>
        </div>
        {/* {data?.creator && (
          <div className={styles['aum']}>
            <div className={styles['title']}>
              {t({ enUS: `Creator's Lead Assets`, zhCN: '创建者份额' })}
            </div>
            <div className={styles['value']}>
              <AmountDisplay
                amount={
                  !props.vault
                    ? ''
                    : cvtAmountsInCcy(
                        [[props.vault.vaultDepositCcy, data?.creatorAmount]],
                        prices,
                        props.vault.vaultDepositCcy,
                      )
                }
                precision={0}
              />
              <span className={styles['unit']}>{props.vault?.depositCcy}</span>
              <span className={styles['percentage']}>
                {displayPercentage(
                  Number(data?.creatorAmount) / Number(data?.amount),
                )}
              </span>
              <ProgressBar
                type="3"
                percent={Number(data?.creatorAmount) / Number(data?.amount)}
                minWidthPercentage={0.05}
              />
            </div>
          </div>
        )} */}
        {/* <div className={styles['nav']}>
        <div className={styles['title']}>
          1 {props.vault?.positionCcy} (
          <Time time={Number(data?.dateTime) * 1000} format="MMM. DD" />)
        </div>
        <div className={styles['value']}>
          ≈ {amountFormatter(data?.nav, 4)}
          <span className={styles['unit']}>{props.vault?.depositCcy}</span>
        </div>
      </div> */}
        <div className={styles['tips']}>
          <p
            className={styles['tip']}
            dangerouslySetInnerHTML={{
              __html: t(
                {
                  enUS: 'This product has a <span class="highlight">{{waitDuration}}</span> waiting period for redemptions.',
                  zhCN: '此产品的赎回需经过 <span class="highlight">{{waitDuration}}</span> 的等待期。',
                },
                {
                  waitDuration:
                    props.vault?.redeemWaitPeriod &&
                    formatDuration(props.vault.redeemWaitPeriod, 1, true),
                },
              ),
            }}
          />
        </div>
      </div>
      <div className={styles['right']}>
        {/* <div className={styles['item']}>
          <div className={styles['title']}>
            {t({ enUS: 'Fee', zhCN: '手续费' })}
          </div>
          <div className={styles['value']}>
            {displayPercentage(props.vault?.creatorFeeRate, 0)}
          </div>
        </div> */}
        <div className={styles['item']}>
          <div className={styles['title']}>
            <Tooltip
              content={t({
                enUS: 'Automator Running Days',
                zhCN: 'Automator 运行天数',
              })}
            >
              <IconCalendar tabIndex={-1} />
            </Tooltip>
          </div>
          <div className={styles['value']}>
            {props.vault?.createTime
              ? formatDuration(Date.now() - +props.vault.createTime, 1, true)
              : '-'}
          </div>
        </div>
        <div className={styles['item']}>
          <div className={styles['title']}>
            <Tooltip
              content={t({
                enUS: 'Participating Wallets',
                zhCN: '参与钱包数',
              })}
            >
              <IconPeople tabIndex={-1} />
            </Tooltip>
          </div>
          <div className={styles['value']}>{data?.participantNum || '-'}</div>
        </div>
      </div>
    </Spin>
  );
};
