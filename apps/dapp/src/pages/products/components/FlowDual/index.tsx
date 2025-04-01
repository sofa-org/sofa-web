import { useTranslation } from '@sofa/services/i18n';
import { useLocalStorageState } from 'ahooks';
import classNames from 'classnames';

import { Comp as Step1 } from './assets/1.svg';
import { Comp as Step2 } from './assets/2.svg';
import { Comp as Step3 } from './assets/3.svg';
import { Comp as Step4 } from './assets/4.svg';
import { Comp as IconExpand } from './assets/icon-expand.svg';

import styles from './index.module.scss';

export const FlowDual = () => {
  const [t] = useTranslation();
  const [expanded, setExpanded] = useLocalStorageState<'1' | '0'>(
    'product-flow',
    { defaultValue: '1' },
  );
  return (
    <div
      className={classNames(styles['flow-wrapper'], {
        [styles['expanded']]: expanded === '1',
      })}
      onClick={() => setExpanded((pre) => (pre === '1' ? '0' : '1'))}
    >
      <div className={styles['title']}>
        {t({ enUS: 'Getting Started with Dual' })}
      </div>
      <div className={styles['content']}>
        <Step1 width={163 / window.winScale} />
        <div className={styles['arrow']} />
        <Step2 width={108 / window.winScale} />
        <div className={styles['arrow2']} />
        <Step3 width={394 / window.winScale} />
        <div className={styles['arrow3']} />
        <Step4 width={138 / window.winScale} />
      </div>
      <IconExpand className={styles['icon-expand']} />
    </div>
  );
};
