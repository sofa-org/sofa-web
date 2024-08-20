import { CSSProperties, memo, ReactNode, useMemo } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import { ChainMap } from '@sofa/services/chains';
import { useTranslation } from '@sofa/services/i18n';
import classNames from 'classnames';
import { copy } from 'clipboard';

import { Comp as IconCopy } from '@/assets/icon-copy.svg';
import { addI18nResources } from '@/locales';

import { useWalletStore } from '../WalletConnector/store';

import locale from './locale';

addI18nResources(locale, 'Address');
import styles from './index.module.scss';

const Address = memo<{
  address: string;
  className?: string;
  style?: CSSProperties;
  prefix?: ReactNode;
  simple?: boolean;
  link?: string | boolean | { chainId: number };
}>((props) => {
  const [t] = useTranslation('Address');
  const [, str, last4Words] = useMemo(
    () =>
      props.address?.match(
        props.simple ? /^(\w{6})\w+(\w{4})$/ : /^(\w{10})\w+(\w{4})$/,
      ) || [],
    [props.address, props.simple],
  );
  return props.address ? (
    <div
      className={classNames(styles['address'], 'address', props.className, {
        [styles['link']]: props.link,
        link: props.link,
      })}
      style={props.style}
      onClick={(e) => {
        if (props.link) {
          e.stopPropagation();
          const url = (() => {
            if (typeof props.link === 'string') return props.link;
            const chainId =
              props.link === true
                ? useWalletStore.getState().chainId!
                : props.link.chainId;
            return `${ChainMap[chainId]?.explorerUrl}/address/${props.address}`;
          })();
          window.open(url, 'address');
        } else if (!props.simple) {
          e.stopPropagation();
          Promise.resolve()
            .then(() => copy(props.address))
            .then(() => Toast.success(t('copy.succ')));
        }
      }}
    >
      {props.prefix}
      {str}...
      {last4Words}
      {!props.simple && (
        <IconCopy
          onClick={(e) => {
            if (!props.simple) return;
            e.stopPropagation();
            Promise.resolve()
              .then(() => copy(props.address))
              .then(() => Toast.success(t('copy.succ')));
          }}
        />
      )}
    </div>
  ) : (
    <div
      className={classNames(styles['address'], 'address', props.className)}
      style={props.style}
    />
  );
});

export default Address;
