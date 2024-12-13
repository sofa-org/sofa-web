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
  const [data, setData] = useLocalStorageState('global-modal-4', {
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
            enUS: '1. The OKX Web3 Joint Campaign has officially ended!',
            zhCN: '1. OKX Web3 联合活动已结束',
          }),
        }}
      />
      <p
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: 'Starting today, all $RCH airdrop rewards are available for you on SOFA.org - head over now and place your orders! ',
            zhCN: '即日起，$RCH 空投奖励已统一回归 SOFA.org，欢迎大家在 SOFA.org 下单！',
          }),
        }}
      />
      <p
        className={styles['head']}
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: '2. Big News: Earn and Surge purchases are now both eligible for the Poker Museum event!',
            zhCN: '2. Earn / Surge 都可参与扑克博物馆',
          }),
        }}
      />
      <p
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: 'Simply make a purchase of either Earn or Surge products to score exclusive poker cards, each redeemable for up to 100 $RCH.',
            zhCN: '新规调整：购买 Earn 产品也能参与活动！购买一笔 Earn 或 Surge 即可赢扑克，每张扑克最高兑换 100 $RCH！',
          }),
        }}
      />
      <p
        className={styles['head']}
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: '3. SOFA.org Automator is officially live!',
            zhCN: '3. SOFA.org 全新产品 Automator 正式上线！',
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
