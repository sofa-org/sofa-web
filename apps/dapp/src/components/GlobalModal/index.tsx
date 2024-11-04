import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Modal } from '@douyinfe/semi-ui';
import { useTranslation } from '@sofa/services/i18n';
import { next8h } from '@sofa/utils/expiry';
import { useLocalStorageState } from 'ahooks';

import styles from './index.module.scss';

export const GlobalModal = () => {
  const [t] = useTranslation('GlobalModal');
  const location = useLocation();
  const [data, setData] = useLocalStorageState('global-modal-postpone', {
    defaultValue: { closedAt: 0 },
  });
  const visible = useMemo(() => {
    if (!/products|positions|transactions/.test(location.pathname)) {
      return false;
    }
    // 如果 closedAt 对应的下一个 UTC8:00 小于当前时间对应下一个的 UTC8:00，则显示
    return !data?.closedAt || next8h(data?.closedAt) < next8h();
  }, [data, location.pathname]);

  return (
    <Modal
      className={styles['global-modal']}
      title={t({ enUS: 'Postponement Notification', zhCN: '延期通知' })}
      footer={null}
      visible={visible}
      centered
      closable={false}
      closeOnEsc={false}
      maskClosable={false}
      width={720}
    >
      {/* <p
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: 'Get ready for the OKX Web3 x SOFA.org joint event! Starting November 4 at 8am UTC and running until December 4 at 8am, visit the OKX Web3 x SOFA.org event area and purchase Earn to receive even more $RCH airdrops.',
            zhCN: 'OKX Web3 x SOFA.org 联合活动即将上线！届时，前往 OKX Web3 x SOFA.org 活动专区 购买Earn将获得更多 $RCH 空投！',
          }),
        }}
      />
      <p
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: 'During the event, airdrop rules will be temporarily adjusted: of the daily 12,500 $RCH airdrop, 8,000 $RCH will be dedicated to the OKX Web3 x SOFA.org event. The official launch is set for November 5th at 10am - don’t miss out and join us at OKX Web3!',
            zhCN: '11 月 4 日 16:00 - 12 月 4 日 16:00 期间，$RCH 空投规则将临时调整：每天的 12,500 $RCH 空投中，将有 8,000 $RCH 分配至 OKX Web3 x SOFA.org 活动中。预计 11 月 5 日 18:00 正式上线，欢迎大家前往 OKX Web3 参与！',
          }),
        }}
      />
      <p
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: 'On December 4 at 8:00 UTC, airdrops will revert to the current distribution rules.',
            zhCN: '12 月 4 日 16:00 起，空投将恢复至现有规则。',
          }),
        }}
      /> */}
      <p
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: 'We regret to inform you that the OKX Web3 joint event has been postponed. Until the event launches, the $RCH airdrop distribution will remain unchanged.',
            zhCN: '很抱歉，OKX Web3 联合活动将延期上线。活动上线前，$RCH 空投与之前保持不变。',
          }),
        }}
      />
      <p
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: 'In the meantime, you can secure your $RCH airdrop in advance by purchasing long-term Earn products, with yields of up to 20% on a 60-day expiry.',
            zhCN: '目前购买较长期限的Earn产品，能提前锁定 $RCH 空投。60 天到期日，收益率高达 20%。',
          }),
        }}
      />
      <p
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: 'The new start date for the joint event will be announced separately. Please stay tuned for updates.',
            zhCN: '联合活动的开始日期将另行通知，敬请留意。',
          }),
        }}
      />
      <div className={styles['footer']}>
        <Button
          className={styles['btn-confirm']}
          type="primary"
          theme="solid"
          onClick={() => setData({ closedAt: Date.now() })}
        >
          {t({ enUS: 'Okay', zhCN: '好的' })}
          {/* {t({ enUS: 'Go to OKX Web3', zhCN: '立即参与' })} */}
        </Button>
      </div>
    </Modal>
  );
};
