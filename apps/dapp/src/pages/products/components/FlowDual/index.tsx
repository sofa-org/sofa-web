import { useTranslation } from '@sofa/services/i18n';
import { useLocalStorageState } from 'ahooks';
import classNames from 'classnames';

import { Comp as IconExpand } from './assets/icon-expand.svg';

import styles from './index.module.scss';

export const FlowDual = () => {
  const [t, i18n] = useTranslation();
  const [expanded, setExpanded] = useLocalStorageState<'1' | '0'>(
    'product-flow',
    { defaultValue: '1' },
  );
  return (
    <div
      className={classNames(styles['flow-wrapper'], {
        [styles['expanded']]: expanded === '1',
        [styles['lang-zh']]: /^zh/i.test(i18n.language),
      })}
      onClick={() => setExpanded((pre) => (pre === '1' ? '0' : '1'))}
    >
      <div className={styles['title']}>
        {t({ enUS: 'Getting Started with Dual' })}
      </div>
      <div className={styles['content']}>
        <div className={styles['step1']} />
        <div className={styles['arrow']} />
        <div className={styles['step2']} />
        <div className={styles['arrow2']} />
        <div className={styles['step3']} />
        <div className={styles['arrow3']} />
        <div className={styles['step4']} />
      </div>
      <IconExpand className={styles['icon-expand']} />
    </div>
  );
};
