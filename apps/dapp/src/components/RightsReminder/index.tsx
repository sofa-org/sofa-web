import { Modal } from '@douyinfe/semi-ui';
import { t } from '@sofa/services/i18n';
import { joinUrl } from '@sofa/utils/url';

import { EnvLinks } from '@/env-links';

import styles from './index.module.scss';

export function pokerRightsReminder() {
  return new Promise((resolve, reject) => {
    Modal.confirm({
      icon: null,
      centered: true,
      width: 500,
      className: styles['poker-rights-reminder'],
      title: t({ enUS: 'Poker Museum 🃏', zhCN: '扑克博物馆 🃏' }),
      content: (
        <>
          <p className={styles['content-txt']}>
            {t({
              enUS: `🎉 Congratulations on completing the Poker Museum task! You've earned a chance to draw poker cards, with each card redeemable for up to 100 $RCH!`,
              zhCN: '🎉 恭喜您完成【扑克博物馆】任务，赢得待抽取扑克卡牌，每张扑克最高可兑换 100 $RCH！',
            })}
          </p>
          <p className={styles['content-txt']}>
            {t({
              enUS: `🎉 Please visit the Poker Museum the following 8:00 UTC to claim your poker card. It will expire in 24 hours, so be sure to collect it within the valid period.`,
              zhCN: '⏰ 请在下一个 16:00 UTC+8 后，前往【扑克博物馆】领取您的扑克，24 小时过期，请在有效期内领取。',
            })}
          </p>
        </>
      ),
      okText: t({ enUS: '🎉 Draw Now', zhCN: '🎉 立即领取' }),
      onOk: resolve,
      onCancel: reject,
    });
  }).then(() => {
    window.open(
      joinUrl(EnvLinks.config.VITE_CAMPAIGN_LINK, '/fest-competition'),
      '_blank',
    );
  });
}
