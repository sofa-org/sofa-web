import { ProjectType } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';

import { useProjectChange } from '@/components/ProductSelector';
import { addI18nResources } from '@/locales';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'RiskDisclosures');

export const RiskDisclosures = () => {
  const [t] = useTranslation('RiskDisclosures');
  const [project] = useProjectChange();
  return (
    <div className={styles['section']}>
      <p className={styles['brief']}>
        {t(
          'The SOFA protocols were developed as a transparent and open-source effort, with maximum security and safety of assets at the top of mind.  However, unforeseen and "force majeure" risks are always a remote possibility, and users shall explicitly acknowledge and accept full responsibility for any adverse outcomes that might arise from their activities on the SOFA protocols.',
        )}
      </p>
      <div className={styles['content']}>
        <p className={styles['p']}>
          <b>
            1.{' '}
            {t({
              enUS: 'Payoff Variability & Losses',
              zhCN: '收益波动性与亏损',
            })}
          </b>
        </p>
        {project === ProjectType.Automator ? (
          <>
            <p className={styles['p']}>
              {t({
                enUS: '· Automator strategies could involve both buying and selling of option exposures, with a potential for limited capital losses.',
                zhCN: '· Automator 策略可能涉及期权敞口的买入和卖出，存在有限的资本损失风险。',
              })}
            </p>
            <p className={styles['p']}>
              {t({
                enUS: `· Target yields could be over- or under-estimated depending on prevailing market conditions beyond our control. Such variables could include external staking yields, $RCH price fluctuations, and realized airdrop allocations, etc.`,
                zhCN: '· 目标收益可能因我们无法控制的市场条件而被高估或低估。这些变量可能包括外部质押收益、$RCH 价格波动以及实际空投分配等。',
              })}
            </p>
          </>
        ) : (
          <>
            <p className={styles['p']}>
              {t({
                enUS: '· Surge-based products are prone to full capital losses as a result of unfavourable market outcomes.',
                zhCN: '· 基于波动的产品可能因不利的市场结果而导致全部资本损失。',
              })}
            </p>
            <p className={styles['p']}>
              {t({
                enUS: `· Earn-based products could see fluctuations in realized yields from external factors, such as changes in Aave/Lido/Sofa/Curve's prevailing interest rates.`,
                zhCN: '· 基于收益的产品可能因外部因素（如 Aave/Lido/Sofa/Curve 的当前利率变化）导致实际收益波动。',
              })}
            </p>
          </>
        )}
        <p className={styles['p']} />
        <p className={styles['p']}>
          <b>
            2.{' '}
            {t({
              enUS: 'DeFi Extensibility Risks with External Protocols',
              zhCN: '与外部协议相关的 DeFi 可扩展性风险',
            })}
          </b>
        </p>
        <p className={styles['p']}>
          {t({
            enUS: '· SOFA protocols are fully extensible with 3rd party DeFi projects beyond our control, and exploits to these external protocols could bring unforeseen negative impact.',
            zhCN: '· SOFA 协议完全可扩展至我们无法控制的第三方 DeFi 项目，这些外部协议的漏洞可能带来不可预见的负面影响。',
          })}
        </p>
        <p className={styles['p']} />
        <p className={styles['p']}>
          <b>3. {t({ enUS: 'Staking Yield Deficit', zhCN: '' })}</b>
        </p>
        <p className={styles['p']}>
          {t({
            enUS: '· A short-fall in staking income from Aave/Lido/Sofa/Curve (extreme case = 0%) could cause Earn-based products to return a total payout that is slightly less than the original deposit.',
            zhCN: '· Aave/Lido/Sofa/Curve 的质押收入不足（极端情况下为 0%）可能导致基于收益的产品的总回报略低于原始存款。',
          })}
        </p>
        <p className={styles['p']} />
        <p className={styles['p']}>
          <b>
            4.{' '}
            {t({ enUS: 'Blockchain Systemic Risks', zhCN: '区块链系统性风险' })}
          </b>
        </p>
        <p className={styles['p']}>
          {t({
            enUS: '· SOFA protocols are reliant on Ethereum and EVM-compatible L1s/L2s for overall network and asset security.',
            zhCN: '· SOFA 协议依赖于以太坊及兼容 EVM 的 L1/L2 网络来确保整体网络和资产安全。',
          })}
        </p>
        <p className={styles['p']} />
        <p className={styles['p']}>
          <b>4. {t({ enUS: 'Smart Contract Code Integrity', zhCN: '' })}</b>
        </p>
        <p className={styles['p']}>
          {t(
            {
              enUS: '· The SOFA protocols have passed a full chain audit from {{auditAgent}} as of {{time}}.',
              zhCN: '· SOFA 协议已于 {{time}} 通过 {{auditAgent}} 的完整链上审计。',
            },
            {
              auditAgent: 'SigmaPrime, Code4rena, Peckshield',
              time: t({ enUS: 'June 2024', zhCN: '2024年6月' }),
            },
          )}
        </p>
        <p className={styles['p']} />
      </div>
    </div>
  );
};
