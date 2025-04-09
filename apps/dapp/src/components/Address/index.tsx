import { CSSProperties, memo, ReactNode, useMemo } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import { ChainMap } from '@sofa/services/chains';
import { useTranslation } from '@sofa/services/i18n';
import { WalletService } from '@sofa/services/wallet';
import { useAsyncMemo, useLazyCallback } from '@sofa/utils/hooks';
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
  noWeb3Name?: boolean;
  chainIcon?: { chainId: number };
}>((props) => {
  const [t] = useTranslation('Address');

  const web3name = useAsyncMemo(async () => {
    if (props.noWeb3Name !== false) return undefined;
    return WalletService.web3name(props.address);
  }, []);

  const [, str, last4Words] = useMemo(() => {
    if (web3name) return ['', web3name, ''];
    return (
      props.address?.match(
        props.simple ? /^(\w{6})\w+(\w{4})$/ : /^(\w{10})\w+(\w{4})$/,
      ) || []
    );
  }, [props.address, props.simple, web3name]);

  const handleLink = useLazyCallback(() => {
    const url = (() => {
      const link = props.link || props.linkBtn;
      if (!link) return;
      if (typeof link === 'string') return link;
      const chainId =
        link === true ? useWalletStore.getState().chainId! : link.chainId;
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
        [styles['web3name']]: web3name,
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
      {str}
      {last4Words && '...'}
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
      {props.chainIcon && (
        <img
          className={classNames(styles['chain-icon'], 'chain-icon')}
          src={ChainMap[props.chainIcon.chainId].icon}
          alt=""
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
