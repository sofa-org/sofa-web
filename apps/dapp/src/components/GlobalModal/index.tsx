import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Modal } from '@douyinfe/semi-ui';
import { useTranslation } from '@sofa/services/i18n';
import { MsIntervals, next8h } from '@sofa/utils/expiry';
import { useLocalStorageState } from 'ahooks';
import classNames from 'classnames';

import styles from './index.module.scss';

export const GlobalModal = () => {
  const [t] = useTranslation('GlobalModal');
  const location = useLocation();
  const [data, setData] = useLocalStorageState('global-modal-2', {
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
            enUS: '1. OKX Web3 x SOFA.org Joint Event Now Live',
            zhCN: '1. OKX Web3 x SOFA.org 联合活动已上线！',
          }),
        }}
      />
      <p
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: 'From November 8 at 8:00 UTC to December 8 at 8:00 UTC, we’re excited to announce an adjustment to the $RCH airdrop allocation. During this period, 8,000 $RCH out of the daily 12,500 $RCH airdrop will be exclusively dedicated to the OKX Web3 x SOFA.org event. Head over to OKX Web3, purchase SOFA Earn products, and enjoy high returns.',
            zhCN: '11月8日 16:00 - 12月8日 16:00 (UTC+8) 期间，$RCH 空投规则将临时调整：每天的 12,500 $RCH 空投中，将有 8,000 $RCH 分配至 OKX Web3 x SOFA.org 活动中。欢迎大家前往 OKX Web3 购买Earn 产品，享受高收益回报！',
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
            window.open('https://www.okx.com/web3/defi/activity/33', '_blank');
          }}
        >
          {t({ enUS: 'Go to OKX Web3', zhCN: '前往 OKX Web3' })}
        </Button>
      </div>
    </Modal>
  );
};
