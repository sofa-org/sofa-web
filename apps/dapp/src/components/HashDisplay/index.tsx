import { ChainMap } from '@sofa/services/chains';
import { Env } from '@sofa/utils/env';
import classNames from 'classnames';

import styles from './index.module.scss';

export const HashDisplay = (
  props: Omit<BaseProps, 'children'> & { children?: string; chainId: number },
) => {
  return (
    <a
      href={`${ChainMap[props.chainId]?.explorerUrl}/tx/${props.children}`}
      target={Env.isMetaMaskAndroid ? undefined : '_blank'}
      rel="noopener noreferrer"
      className={classNames(styles['hash-display'], props.className)}
      style={props.style}
      title={props.children}
    >
      {props.children?.substring(0, 10)}...
      {props.children?.substring(props.children?.length - 10)}
    </a>
  );
};
