import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Modal } from '@douyinfe/semi-ui';
import { useTranslation } from '@sofa/services/i18n';
import { MsIntervals, next8h } from '@sofa/utils/expiry';
import { useLocalStorageState } from 'ahooks';
import classNames from 'classnames';

import { EnvLinks } from '@/env-links';

import styles from './index.module.scss';

export const GlobalModal = () => {
  const [t] = useTranslation('GlobalModal');
  const location = useLocation();
  const [data, setData] = useLocalStorageState('global-modal-3', {
    defaultValue: { closedAt: 0 },
  });
  const visible = useMemo(() => {
    if (!/products|positions|transactions/.test(location.pathname)) {
      return false;
    }
    // 7 天显示一次
    return (
      !data?.closedAt || next8h() - next8h(data?.closedAt) > MsIntervals.day * 7
    );
  }, [data, location.pathname]);

  return (
    <Modal
      className={styles['global-modal']}
      title={t({ enUS: 'Event Update Reminder', zhCN: '活动更新提醒' })}
      footer={null}
      visible={visible}
      centered
      closeOnEsc={false}
      maskClosable={false}
      width={720}
      onCancel={() => {
        setData({ closedAt: Date.now() });
      }}
    >
      <p
        className={styles['head']}
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: '1. SOFA.org Automator is officially live!',
            zhCN: '1. SOFA.org 全新产品 Automator 正式上线！',
          }),
        }}
      />
      <p
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: 'Delegate your funds to high-performing Automator traders & strategies. Funds will be utilized and continuously re-invested in optimized return strategies until user redemption. (Switch to the Arbitrum One network to access Automator.)',
            zhCN: '将资金托管给高绩效的 Automator 交易者及策略。资金将被充分利用，持续再投资以实现最佳回报，直至用户赎回。（切换至 Arbitrum One 链，即可进入 Automator）',
          }),
        }}
      />
      <p
        className={styles['head']}
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: '2. Surge Poker Museum Update',
            zhCN: '2. Surge 扑克博物馆',
          }),
        }}
      />
      <p
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: 'Rule Update: Earn products are not included in this event. <br/>Event Rules: Buy a Surge to participate in the poker game.Each poker can be redeemed for up to 100 $RCH.',
            zhCN: '规则调整：Earn 产品暂不参与本期活动<br/>具体规则：购买一笔 Surge 即可参与赢扑克，每张扑克最高可兑换 100 $RCH！',
          }),
        }}
      />
      <div className={styles['footer']}>
        <Button
          className={classNames(styles['btn-confirm'], 'btn-gradient')}
          type="primary"
          theme="solid"
          onClick={() => {
            setData({ closedAt: Date.now() });
            window.location.href = EnvLinks.config.VITE_AUTOMATOR_LINK;
          }}
        >
          {t({ enUS: 'Go to Automator', zhCN: '前往 Automator' })}
        </Button>
      </div>
    </Modal>
  );
};
