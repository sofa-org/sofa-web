import { useTranslation } from '@sofa/services/i18n';
import { ProductQuoteResult, RiskType } from '@sofa/services/products';

import { addI18nResources } from '@/locales';

import locale from './locale';

addI18nResources(locale, 'ClaimWithdrawDesc');
import styles from './index.module.scss';

export const ClaimWithdrawDesc = (product: Partial<ProductQuoteResult>) => {
  const [t] = useTranslation('ClaimWithdrawDesc');
  return (
    <section className={styles['section']}>
      <h2 className={styles['title']}>
        {/* <span className={styles['icon']}>︎︎︎︎︎︎︎♣︎︎︎</span> */}
        {t('Claim & Withdraw')}
      </h2>
      <div
        className={styles['content']}
        dangerouslySetInnerHTML={{
          __html:
            product.vault?.riskType == RiskType.DUAL
              ? t({
                  enUS: 'Once the deposit and smart contract transaction has been executed, assets cannot be withdrawn until the Settlement Date.<br/>\nA "Claim" option will be available post settlement, to transfer the final payout back to the user\'s wallet.<br/><br/>\nFor this product, the settlement time is 10:00 UTC on the settlement date.',
                  zhCN: '一旦存款和智能合约交易被执行，在结算日期之前资产不能被提取。<br/>\n结算后将提供“领取”选项，以将最终支付转回用户的钱包。<br/><br/>\n对于此产品，结算时间为结算日期的UTC时间10:00。',
                })
              : t(
                  `Once the deposit and smart contract transaction has been executed, assets cannot be withdrawn until the Settlement Date.A "Claim & Withdraw" option will be available post settlement, to transfer the final payout back to the user's wallet.`,
                ),
        }}
      />
    </section>
  );
};
