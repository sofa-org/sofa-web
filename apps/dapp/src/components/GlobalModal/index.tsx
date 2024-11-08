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
  const [data, setData] = useLocalStorageState('global-modal-1', {
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
      title={t({ enUS: 'Notification', zhCN: '通知' })}
      footer={null}
      visible={visible}
      centered
      closable={false}
      closeOnEsc={false}
      maskClosable={false}
      width={720}
    >
      <p
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: 'The OKX Web3 x SOFA.org joint event kicks off on November 8 at 10:00 UTC!',
            zhCN: 'OKX Web3 x SOFA.org 联合活动于 11月8日 18:00（UTC+8）正式上线！',
          }),
        }}
      />
      <p
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: 'From November 8 at 8:00 UTC to December 8 at 8:00 UTC, the $RCH airdrop allocation will be temporarily adjusted. Of the daily 12,500 $RCH airdrop, 8,000 $RCH will be dedicated to the OKX Web3 x SOFA.org event. Head to OKX Web3, purchase Earn products, and enjoy high returns!',
            zhCN: '11月8日 16:00（UTC+8） - 12月8日 16:00（UTC+8） 期间，$RCH 空投规则将临时调整：每天的 12,500 $RCH 空投中，将有 8,000 $RCH 分配至 OKX Web3 x SOFA.org 活动中。欢迎大家前往 OKX Web3 购买Earn 产品，享受高收益回报！',
          }),
        }}
      />
      <p
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: 'After December 8 at 8:00 UTC, the airdrop will revert to its usual rules.',
            zhCN: '12月8日 16:00（UTC+8） 起，空投将恢复至现有规则。',
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
          {t({ enUS: 'Join now', zhCN: '立即参与' })}
        </Button>
      </div>
    </Modal>
  );
};
