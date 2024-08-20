import { useLocalStorageState } from 'ahooks';
import classNames from 'classnames';

import { Comp as Step1 } from './assets/1.svg';
import { Comp as Step2 } from './assets/2.svg';
import { Comp as Step3 } from './assets/3.svg';
import { Comp as Step4 } from './assets/4.svg';
import { Comp as IconExpand } from './assets/icon-expand.svg';

import styles from './index.module.scss';

export const FlowEarn = () => {
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
      {expanded !== '1' && (
        <div className={styles['title']}>
          Getting Started with Earn Products
        </div>
      )}
      <div className={styles['content']}>
        <Step1 width={127 / window.winScale} />
        <div className={styles['arrow']} />
        <Step2 width={55 / window.winScale} />
        <div className={styles['arrow']}>
          <span>Expiry</span>
        </div>
        <Step3 width={159 / window.winScale} />
        <div className={styles['arrow-1']}>
          <span className={styles['txt-highlight']}>If you win</span>
        </div>
        <Step4 width={177 / window.winScale} />
      </div>
      <IconExpand className={styles['icon-expand']} />
    </div>
  );
};
