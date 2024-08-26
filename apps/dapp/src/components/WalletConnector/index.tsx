import { ReactNode, useEffect } from 'react';
import { Modal } from '@douyinfe/semi-ui';
import { useTranslation } from '@sofa/services/i18n';
import { calcVal } from '@sofa/utils/fns';
import classNames from 'classnames';

import { Comp as IconDropdown } from '@/assets/icon-dropdown.svg';
import { addI18nResources } from '@/locales';

import Address from '../Address';
import AsyncButton from '../AsyncButton';

import locale from './locale';
import { useWalletStore, useWalletUIState } from './store';

import styles from './index.module.scss';

addI18nResources(locale, 'WalletConnector');

const WalletConnector = (
  props: Omit<BaseProps, 'children'> & {
    children?: ReactNode | ((connecting: boolean) => ReactNode);
    hideArrow?: boolean;
    enableServerAuth?: boolean;
  },
) => {
  const [t] = useTranslation('WalletConnector');
  const wallet = useWalletStore();
  // const { serverAuthing } = useWalletStore();
  const { connectVisible, bringUpConnect, dismissConnect } = useWalletUIState(
    (s) => s,
  );

  useEffect(() => {
    const pro = useWalletStore.subscribeAccountChange();
    return () => {
      pro.then((un) => un?.());
    };
  }, [wallet.address]);

  return (
    <>
      <div
        className={classNames(
          styles['wallet-connector'],
          'wallet-connector',
          props.className,
        )}
        style={props.style}
        onClick={() =>
          bringUpConnect({ enableServerAuth: props.enableServerAuth })
        }
      >
        {(() => {
          if (props.children) return calcVal(props.children, connectVisible);
          if (!wallet.address) return t('title');
          return (
            <>
              <img className={styles['logo']} src={wallet.icon} alt="" />
              <Address
                address={wallet.address!}
                simple
                style={{ padding: 0 }}
              />
            </>
          );
        })()}
        {!props.hideArrow && <IconDropdown />}
      </div>
      {/* Audrey Gray Shuyun 会商量一个更合适的 UI/文案，下面代码回头会启用 */}
      {/* {serverAuthing ?
        <div className={styles['server-authing-overlay']}>
          {t({
            enUS: 'Please approve the sign request in your wallet to login',
            zhCN: '请在你的钱包里确认用于登入的签名请求',
          })}
        </div> : undefined} */}
      <Modal
        centered
        className={styles['wallet-connector-modal']}
        width={288 / window.winScale}
        visible={connectVisible}
        onCancel={dismissConnect}
        closable={false}
        title={t('title')}
        footer={null}
      >
        <Address address={wallet.address!} className={styles['address']} />
        <AsyncButton
          size={'large'}
          block
          className={'btn-ghost'}
          onClick={() => {
            useWalletStore.disconnect();
            dismissConnect();
          }}
        >
          {t('disconnect')}
        </AsyncButton>
      </Modal>
    </>
  );
};

export default WalletConnector;