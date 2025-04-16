import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Modal } from '@douyinfe/semi-ui';
import { useTranslation } from '@sofa/services/i18n';
import { MsIntervals, next8h } from '@sofa/utils/expiry';
import { joinUrl } from '@sofa/utils/url';
import { useLocalStorageState } from 'ahooks';
import classNames from 'classnames';

import { EnvLinks } from '@/env-links';

import styles from './index.module.scss';

export const GlobalModal = () => {
  const [t] = useTranslation('GlobalModal');
  const location = useLocation();
  const [data, setData] = useLocalStorageState('global-modal-6', {
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
            enUS: 'SOFA Dual Function is Now Live!',
            zhCN: 'SOFA 双币交易上线！',
          }),
        }}
      />
      <p
        dangerouslySetInnerHTML={{
          __html: t({
            enUS: `Set your target price and expiration time — the system will automatically execute your trade, whether you're buying low or selling high.
No matter the outcome, you'll earn both basic rewards and RCH airdrop rewards!`,
            zhCN: `设置目标价格和到期时间，系统自动执行交易，高点卖出 / 低点买入。
无论成功与否，均可获得基础收益和RCH空投奖励！`,
          }).replace(/\n/, '<br />'),
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
            window.location.href = joinUrl(
              EnvLinks.config.VITE_DUAL_LINK,
              '/customize',
            );
          }}
        >
          {t({ enUS: 'Start your journey now!', zhCN: '立即体验' })}
        </Button>
      </div>
    </Modal>
  );
};
