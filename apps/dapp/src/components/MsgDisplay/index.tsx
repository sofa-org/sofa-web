import { useState } from 'react';
import classNames from 'classnames';

import styles from './index.module.scss';

export const MsgDisplay = (props: BaseProps) => {
  const [more, setMore] = useState(false);

  return (
    <p
      className={classNames(styles['more-info'], { [styles['unfold']]: more })}
      style={props.style}
      onClick={() => setMore((pre) => !pre)}
    >
      {props.children}
      {/* <span className={styles['more']} onClick={() => setMore((pre) => !pre)}>
        {more ? t('More Info') : t('Fold')}
      </span> */}
    </p>
  );
};
