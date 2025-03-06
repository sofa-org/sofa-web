import { useState } from 'react';
import classNames from 'classnames';

import styles from './index.module.scss';

export const MsgDisplay = (props: BaseProps & { expandDisabled?: boolean }) => {
  const [more, setMore] = useState(false);

  return (
    <p
      className={classNames(
        styles['more-info'],
        { [styles['unfold']]: more },
        props.className,
      )}
      style={props.style}
      onClick={() => !props.expandDisabled && setMore((pre) => !pre)}
    >
      {props.children}
      {/* <span className={styles['more']} onClick={() => setMore((pre) => !pre)}>
        {more ? t('More Info') : t('Fold')}
      </span> */}
    </p>
  );
};
