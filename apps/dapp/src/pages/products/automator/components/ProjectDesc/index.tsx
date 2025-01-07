import { useEffect } from 'react';
import { Spin } from '@douyinfe/semi-ui';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
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
      useAutomatorStore.subscribeSnapshots(props.vault);
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
          {props.vault?.desc ||
            t({
              enUS: 'Our Automator strategies will perform automated execution of our SOFA platform products (eg. Bull Trend & Bear Trend) at model expiration dates and strikes to target an optimized risk-adjusted yield. The strategies are designed to operate systematically via data-driven algorithms, with our data learning models continuously being refined to enhance long term performance. Capital will be continuously deployed to maximize yield compounding benefits, allowing users to deploy volatility monetization strategies with zero hassle. Strategies could include both controlled buying or selling of option exposure to generate returns.',
              zhCN: '我们的 Automator 策略将自动执行 SOFA 平台产品（如牛市趋势和熊市趋势），在模型指定的到期日和行权价下，旨在实现优化的风险调整收益。这些策略通过数据驱动的算法系统化运行，并通过数据学习模型的持续优化提升长期表现。资金将持续部署以最大化收益复利效应，让用户轻松实现波动率套利策略。策略可能包括受控买入或卖出期权敞口，以生成收益。',
            })}
        </div>
      </section>
      <Snapshot vault={props.vault} />
      <AutomatorPerformanceChart vault={props.vault} />
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
                  enUS: '· Users can mint atUSDT by converting USDT at the current atUSDT price. Minting allocates shares proportionally based on the size of the current pool. <br/>· To redeem, users will burn atUSDT to receive USDT, with a {{waitDuration}} waiting period. <br/>· Redemptions must be claimed within {{claimDuration}} following the waiting period, otherwise the request will expire and a new redemption process must be re-submitted.',
                  zhCN: '	•	用户可以通过当前的 atUSDT 价格将 USDT 转换为 atUSDT，从而进行铸造。铸造的份额将根据当前资金池的规模按比例分配。<br/>•	赎回时，用户需销毁 atUSDT 以换取 USDT，并需经历 7 天的等待期。<br/>•	在等待期结束后的 3 天内必须完成领取，否则请求将过期，需重新提交新的赎回流程。',
                },
                {
                  waitDuration:
                    props.vault?.redeemWaitPeriod &&
                    formatDuration(props.vault?.redeemWaitPeriod, 1, true),
                  claimDuration:
                    props.vault?.claimPeriod &&
                    formatDuration(props.vault?.claimPeriod, 1, true),
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
              __html: t({
                enUS: `Automator strategies do not charge any fees on execution, while a performance fee of 15% will only be booked against actual & realized profits. Protocol fees will be recycled into $RCH token burns to maintain our commitment towards sustainable tokenomics.`,
                zhCN: '全程 0 手续费，仅收取利润部分的 15%。此费用将被用于 $RCH 的销毁，为 SOFA.org 的可持续发展贡献力量。',
              }),
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
