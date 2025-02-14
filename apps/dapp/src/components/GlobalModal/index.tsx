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
  const [data, setData] = useLocalStorageState('global-modal-5', {
    defaultValue: { closedAt: 0, count: 0 },
  });
  const visible = useMemo(() => {
    if (!/products|positions|transactions/.test(location.pathname)) {
      return false;
    }
    if (Number(data?.count) >= 3) return false;
    // 2 天显示一次
    return (
      !data?.closedAt || next8h() - next8h(data?.closedAt) > MsIntervals.day * 2
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
        setData((pre) => ({
          closedAt: Date.now(),
          count: (pre?.count || 0) + 1,
        }));
      }}
    >
      <p
        className={styles['head']}
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: '1. Poker Museum Temporarily Closed',
            zhCN: '1. 扑克博物馆暂时下线',
          }),
        }}
      />
      <p
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: `The Poker Museum will be temporarily closed from 8 AM UTC on February 15, 2025. Please make sure to draw all your cards before then, as any undrawn cards will be forfeited. We're planning a new event, so stay tuned for updates!`,
            zhCN: '扑克博物馆将于 2025年2月15日 16:00 (UTC+8) 暂时下线。请在截止时间前完成抽卡，逾期未抽取的卡片将作废。新活动正在筹划中，敬请期待！',
          }),
        }}
      />
      <p
        className={styles['head']}
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: '2. Automator Follow-Up Feature Now Available',
            zhCN: '2. Automator 跟单功能上线',
          }),
        }}
      />
      <p
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: 'The Automator follow-up feature is here! You can now entrust your funds to top-performing Automator traders and strategies. Your funds will be automatically reinvested, harnessing the power of compound interest to help you easily implement volatility arbitrage strategies.',
            zhCN: 'Automator 跟单功能现已上线！将资金托管给高绩效的 Automator 交易者和策略，资金将自动循环投资，充分发挥复利效应，助你轻松执行波动率套利策略！',
          }),
        }}
      />
      <div className={styles['footer']}>
        <Button
          className={classNames(styles['btn-confirm'], 'btn-gradient')}
          type="primary"
          theme="solid"
          onClick={() => {
            setData((pre) => ({
              closedAt: Date.now(),
              count: (pre?.count || 0) + 1,
            }));
            window.location.href = EnvLinks.config.VITE_AUTOMATOR_LINK;
          }}
        >
          {t({ enUS: 'Go to Automator', zhCN: '前往 Automator' })}
        </Button>
      </div>
    </Modal>
  );
};
