import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '@sofa/services/i18n';
import { next8h } from '@sofa/utils/expiry';
import { useTime } from '@sofa/utils/hooks';
import { useLocalStorageState } from 'ahooks';
import dayjs from 'dayjs';

import styles from './index.module.scss';

export const GlobalTips = () => {
  const [t] = useTranslation('GlobalTips');

  const [data, setData] = useLocalStorageState('global-tips', {
    defaultValue: { closedAt: 0 },
  });

  const location = useLocation();
  const time = useTime({ interval: 10000 });
  const container = useMemo(() => {
    if (!location || !time) return null;
    return document.querySelector('#global-tips-container');
  }, [location, time]);

  const visible = useMemo(() => {
    if (Date.now() < dayjs('2024-11-08T10:00Z').valueOf()) return false;
    if (Date.now() >= dayjs('2024-12-08T08:00Z').valueOf()) return false;
    // 如果 closedAt 对应的下一个 UTC8:00 小于当前时间对应下一个的 UTC8:00，则显示
    return !data?.closedAt || next8h(data?.closedAt) < next8h();
  }, [data]);

  if (!visible || !container) return <></>;

  return createPortal(
    <div className={styles['global-tips-wrapper']}>
      <div className={styles['global-tips']}>
        <div className={styles['tips-content']} style={{ textAlign: 'center' }}>
          <p className={styles['tips-text']}>
            {t({
              enUS: 'From now until December 8th 8:00 UTC, visit the OKX Web3 x SOFA.org event area and purchase Earn to qualify for more $RCH airdrops!',
              zhCN: '现在至12月8日 16:00 (UTC+8)，前往 OKX Web3 x SOFA 活动专区 购买 Earn 将获得更多 $RCH 空投！',
            })}
          </p>
          {/* <Link to={OKX_WEB3_URL}>{t({ enUS: 'Go to OKX Web3', zhCN: '立即参与' })}</Link> */}
        </div>
        {/* <div className={styles['tips-actions']}>
          <svg
            className={styles['tips-close']}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            onClick={() => setData({ closedAt: Date.now() })}
          >
            <g opacity="0.85">
              <path
                d="M8.87027 7.9983L14.2657 2.60596C14.5064 2.36533 14.5064 1.97627 14.2657 1.73721C14.0251 1.49658 13.636 1.49658 13.397 1.73721L7.99996 7.12798L2.60293 1.73564C2.3623 1.49502 1.97324 1.49502 1.73418 1.73564C1.49355 1.97627 1.49355 2.36533 1.73418 2.60439L7.12964 7.99673L1.73418 13.3906C1.49355 13.6313 1.49355 14.0203 1.73418 14.2594C1.85449 14.3797 2.0123 14.4391 2.16855 14.4391C2.32637 14.4391 2.48262 14.3797 2.60293 14.2594L7.99996 8.86705L13.397 14.2609C13.5173 14.3813 13.6735 14.4406 13.8314 14.4406C13.9892 14.4406 14.1454 14.3813 14.2657 14.2609C14.5064 14.0203 14.5064 13.6313 14.2657 13.3922L8.87027 7.9983Z"
                fill="white"
              />
            </g>
          </svg>
        </div> */}
      </div>
    </div>,
    container,
  );
};
