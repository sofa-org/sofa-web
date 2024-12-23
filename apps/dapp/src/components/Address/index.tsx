import { CSSProperties, memo, ReactNode, useMemo } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import { ChainMap } from '@sofa/services/chains';
import { useTranslation } from '@sofa/services/i18n';
import { useLazyCallback } from '@sofa/utils/hooks';
import classNames from 'classnames';
import { copy } from 'clipboard';

import { Comp as IconCopy } from '@/assets/icon-copy.svg';
import { Comp as IconShare } from '@/assets/icon-share.svg';
import { addI18nResources } from '@/locales';

import { useWalletStore } from '../WalletConnector/store';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'Address');

const Address = memo<{
  address: string;
  className?: string;
  style?: CSSProperties;
  prefix?: ReactNode;
  simple?: boolean;
  link?: string | boolean | { chainId: number };
  linkBtn?: string | boolean | { chainId: number };
}>((props) => {
  const [t] = useTranslation('Address');
  const [, str, last4Words] = useMemo(
    () =>
      props.address?.match(
        props.simple ? /^(\w{6})\w+(\w{4})$/ : /^(\w{10})\w+(\w{4})$/,
      ) || [],
    [props.address, props.simple],
  );

  const handleLink = useLazyCallback(() => {
    const url = (() => {
      if (!props.link) return;
      if (typeof props.link === 'string') return props.link;
      const chainId =
        props.link === true
          ? useWalletStore.getState().chainId!
          : props.link.chainId;
      return `${ChainMap[chainId]?.explorerUrl}/address/${props.address}`;
    })();
    window.open(url, 'address');
  });

  const handleCopy = useLazyCallback(() => {
    Promise.resolve()
      .then(() => copy(props.address))
      .then(() => Toast.success(t('copy.succ')));
  });

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
          handleLink();
        } else if (!props.simple) {
          e.stopPropagation();
          handleCopy();
        }
      }}
    >
      {props.prefix}
      {str}...
      {last4Words}
      {!props.simple && !props.link && !props.linkBtn && (
        <IconCopy
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
        />
      )}
      {props.linkBtn && <IconShare onClick={handleLink} />}
    </div>
  ) : (
    <div
      className={classNames(styles['address'], 'address', props.className)}
      style={props.style}
    />
  );
});

export default Address;
