import { useTranslation } from '@sofa/services/i18n';

import { addI18nResources } from '@/locales';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'RiskDisclosures');

export const RiskDisclosures = () => {
  const [t] = useTranslation('RiskDisclosures');
  return (
    <div className={styles['section']}>
      <p className={styles['brief']}>
        {t(
          'The SOFA protocols were developed as a transparent and open-source effort, with maximum security and safety of assets at the top of mind.  However, unforeseen and "force majeure" risks are always a remote possibility, and users shall explicitly acknowledge and accept full responsibility for any adverse outcomes that might arise from their activities on the SOFA protocols.',
        )}
      </p>
      <div className={styles['content']}>
        {t(
          `<b>1.Payoff Variability & Losses</b>
· Surge-based products are prone to full capital losses as a result of unfavourable market outcomes.
· Earn-based products could see fluctuations in realized yields from external factors, such as changes in Aave/Lido/Sofa/Curve's prevailing interest rates.

<b>2.DeFi Extensibility Risks with External Protocols</b>
· SOFA protocols are fully extensible with 3rd party DeFi projects beyond our control, and exploits to these external protocols could bring unforeseen negative impact.

<b>3.Staking Yield Deficit</b>
· A short-fall in staking income from Aave/Lido/Sofa/Curve (extreme case = 0%) could cause Earn-based products to return a total payout that is slightly less than the original deposit.

<b>4.Blockchain Systemic Risks</b>
· SOFA protocols are reliant on Ethereum and EVM-compatible L1s/L2s for overall network and asset security.

<b>5.Smart Contract Code Integrity</b>
· The SOFA protocols have passed a full chain audit from {{auditAgent}} as of {{time}}.
`,
          {
            auditAgent: 'SigmaPrime, Code4rena, Peckshield',
            time: t({ enUS: 'June 2024', zhCN: '2024年6月' }),
          },
        )
          .split(/[\n\r]/)
          .map((p, i) => (
            <p
              className={styles['p']}
              key={i}
              dangerouslySetInnerHTML={{ __html: p }}
            />
          ))}
      </div>
    </div>
  );
};
