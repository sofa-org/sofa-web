import { useEffect } from 'react';
import { Spin } from '@douyinfe/semi-ui';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { displayPercentage } from '@sofa/utils/amount';
import { displayExpiry } from '@sofa/utils/expiry';
import { formatDuration } from '@sofa/utils/time';
import classNames from 'classnames';

import Address from '@/components/Address';

import { useAutomatorStore } from '../../store';
import { AutomatorPerformanceChart } from '../PerformanceChart';

import styles from './index.module.scss';

const Snapshot = (props: { vault?: AutomatorVaultInfo }) => {
  const [t] = useTranslation('AutomatorProjectDesc');
  const list = useAutomatorStore(
    (state) =>
      props.vault &&
      state.snapshots[
        `${props.vault.chainId}-${props.vault.vault.toLowerCase()}-`
      ],
  );
  useEffect(() => {
    if (props.vault) {
      return useAutomatorStore.subscribeSnapshots(props.vault);
    }
  }, [props.vault]);
  if (!list?.length) return <></>;
  return (
    <div className={classNames(styles['snapshot'], styles['section'])}>
      <h2 className={styles['title']}>
        {/* <span className={styles['icon']}>︎︎✹︎</span> */}
        {t({ enUS: 'Strategy Snapshot', zhCN: '策略快照' })}
      </h2>
      <Spin spinning={!list} wrapperClassName={styles['content']}>
        {list?.map((it, i) => (
          <div className={styles['it-item']} key={i}>
            <div className={styles['left']}>
              <div
                className={classNames(
                  styles['direction'],
                  it.side.toLowerCase(),
                )}
              >
                {it.side}
              </div>
              <div className={styles['product']}>
                {it.forCcy.replace(/^w/i, '')}{' '}
                {{ BULLISH: 'BullTrend', BEARISH: 'BearTrend' }[it.direction]}{' '}
                {displayExpiry(it.expiry * 1000)} {it.lowerStrike}-
                {it.upperStrike}
              </div>
            </div>
            <div className={styles['deposit-percentage']}>
              {it.depositPercentage}%
            </div>
          </div>
        ))}
      </Spin>
    </div>
  );
};

export const AutomatorProjectDesc = (props: { vault?: AutomatorVaultInfo }) => {
  const [t] = useTranslation('AutomatorProjectDesc');
  return (
    <div className={styles['project-desc']}>
      <section className={styles['section']}>
        <h2 className={styles['title']}>
          {/* <span className={styles['icon']}>︎︎✹︎</span> */}
          {t({ enUS: 'Suitability', zhCN: '适用场景' })}
        </h2>
        <div className={styles['content']}>
          <div
            dangerouslySetInnerHTML={{
              __html: props.vault?.desc || '...',
            }}
          />
        </div>
      </section>
      <Snapshot vault={props.vault} />
      <AutomatorPerformanceChart
        className={styles['performance']}
        vault={props.vault}
      />
      <section className={styles['section']}>
        <h2 className={styles['title']}>
          {/* <span className={styles['icon']}>︎︎✹︎</span> */}
          {t({ enUS: 'Mint & Redemption Procedures', zhCN: '铸造与赎回' })}
        </h2>
        <div className={styles['content']}>
          <div
            dangerouslySetInnerHTML={{
              __html: t(
                {
                  enUS: '· Users can mint {{positionCcy}} by converting {{depositCcy}} at the current {{positionCcy}} price. Minting allocates shares proportionally based on the size of the current pool. <br/>· To redeem, users will burn {{positionCcy}} to receive {{depositCcy}}, with a {{waitDuration}} waiting period. <br/>· Redemptions must be claimed within {{claimDuration}} following the waiting period, otherwise the request will expire and a new redemption process must be re-submitted.',
                  zhCN: '	•	用户可以通过当前的 {{positionCcy}} 价格将 {{depositCcy}} 转换为 {{positionCcy}}，从而进行铸造。铸造的份额将根据当前资金池的规模按比例分配。<br/>•	赎回时，用户需销毁 {{positionCcy}} 以换取 {{depositCcy}}，并需经历 7 天的等待期。<br/>•	在等待期结束后的 3 天内必须完成领取，否则请求将过期，需重新提交新的赎回流程。',
                },
                {
                  waitDuration:
                    props.vault?.redeemWaitPeriod &&
                    formatDuration(props.vault?.redeemWaitPeriod, 1, true),
                  claimDuration:
                    props.vault?.claimPeriod &&
                    formatDuration(props.vault?.claimPeriod, 1, true),
                  ...props.vault,
                },
              ),
            }}
          />
        </div>
      </section>
      <section className={styles['section']}>
        <h2 className={styles['title']}>
          {/* <span className={styles['icon']}>︎︎✹︎</span> */}
          {t({ enUS: 'Fees', zhCN: '费用' })}
        </h2>
        <div className={styles['content']}>
          <div
            dangerouslySetInnerHTML={{
              __html: t(
                {
                  enUS: `The fees for Automators are split into two parts:
<br/>1. SOFA Protocol Fee: A 15% service fee is charged on the profits generated by the Automator. This fee will be used for $RCH token burns, supporting the platform’s sustainable tokenomics.
<br/>2. Optivisor Commission: The Automator's manager will receive a {{feeRate}} commission from the profits generated by the Automator.`,
                  zhCN: `Automator 的费用分为两部分：
<br/>1. SOFA 协议费用：对 Automator 产生的利润收取 15% 的服务费。此费用将用于 $RCH 代币销毁，以支持平台的可持续代币经济模型。
<br/>2. Optivisor 佣金：Automator 管理者将从 Automator 产生的利润中获得 {{feeRate}} 的佣金。`,
                },
                { feeRate: displayPercentage(props.vault?.creatorFeeRate) },
              ),
            }}
          />
        </div>
      </section>
      <section className={styles['section']}>
        <h2 className={styles['title']}>
          {/* <span className={styles['icon']}>︎︎︎♥</span> */}
          {t('Vault')}
        </h2>
        <div className={styles['content']}>
          <div className={styles['address']}>
            {props.vault && (
              <Address
                address={props.vault.vault.toLowerCase()}
                prefix={t('CONTRACT: ')}
                link
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
