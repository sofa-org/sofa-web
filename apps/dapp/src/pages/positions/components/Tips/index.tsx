import { useTranslation } from 'react-i18next';
import { RiskType } from '@sofa/services/base-type';
import { useLocalStorageState } from 'ahooks';

import { Comp as IconDel } from '@/assets/icon-del.svg';
import { addI18nResources } from '@/locales';

import chest from '../../assets/chest.png';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'PositionTips');
export const PositionTips = (props: { project: RiskType }) => {
  const [t] = useTranslation('PositionTips');
  const [visible, setVisible] = useLocalStorageState('position-tips', {
    defaultValue: true,
  });

  if (props.project === RiskType.RISKY || !visible) return <></>;
  return (
    <div className={styles['tips-wrapper']}>
      <div className={styles['tips']}>
        <img src={chest} alt="" />
        <span
          dangerouslySetInnerHTML={{
            __html: t(
              `For unclaimed positions, user's deposits will remain within the Aave/Lido protocol, continuing to accrue interest without any loss due to delayed claims.<br/>Note the yield displayed for unclaimed positions is indicative only.<br/>The actual yield of trade will be determined by the Aave/Lido interest accumulated from the time of deposit until the claim is made.`,
            ),
          }}
        />
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          onClick={() => setVisible(false)}
        >
          <g opacity="0.85">
            <path
              d="M8.87027 7.9983L14.2657 2.60596C14.5064 2.36533 14.5064 1.97627 14.2657 1.73721C14.0251 1.49658 13.636 1.49658 13.397 1.73721L7.99996 7.12798L2.60293 1.73564C2.3623 1.49502 1.97324 1.49502 1.73418 1.73564C1.49355 1.97627 1.49355 2.36533 1.73418 2.60439L7.12964 7.99673L1.73418 13.3906C1.49355 13.6313 1.49355 14.0203 1.73418 14.2594C1.85449 14.3797 2.0123 14.4391 2.16855 14.4391C2.32637 14.4391 2.48262 14.3797 2.60293 14.2594L7.99996 8.86705L13.397 14.2609C13.5173 14.3813 13.6735 14.4406 13.8314 14.4406C13.9892 14.4406 14.1454 14.3813 14.2657 14.2609C14.5064 14.0203 14.5064 13.6313 14.2657 13.3922L8.87027 7.9983Z"
              fill="white"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
