import { Dispatch, forwardRef, useImperativeHandle, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Toast } from '@douyinfe/semi-ui';
import { useTranslation } from '@sofa/services/i18n';
import { ProductQuoteResult } from '@sofa/services/products';
import { useLazyCallback } from '@sofa/utils/hooks';
import classNames from 'classnames';
import * as htmlToImage from 'html-to-image';

import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';

import locale from '../../locale';

import styles from './index.module.scss';

addI18nResources(locale, 'AutomatorOperate');

export interface AutomatorShareModalPropsRef {
  hide(): void;
  show(): void;
}

export interface AutomatorShareModalProps {}

const El = (
  props: AutomatorShareModalProps & { setVisible: Dispatch<boolean> },
) => {
  const wallet = useWalletStore();
  const navigate = useNavigate();
  const [currentState, setCurrentState] = useState<
    'viewing' | 'capturing-image'
  >('viewing');
  const [t] = useTranslation('AutomatorOperate');

  const copyImage = useLazyCallback(async () => {
    window.devicePixelRatio = 2;
    const blob = await htmlToImage.toBlob(
      document.querySelector<HTMLElement>('.')!,
      {
        pixelRatio: 2,
        skipAutoScale: true,
        filter: (e) =>
          e.tagName == 'BUTTON' ||
          e.tagName == 'A' ||
          e.className?.includes(styles['btns'])
            ? false
            : true,
      },
    );

    const downloadLink = document.createElement('a');
    downloadLink.setAttribute('download', 'ShareImage.png');
    if (!blob) {
      Toast.error('Save picture failed');
      return;
    }
    const url = URL.createObjectURL(blob);
    downloadLink.setAttribute('href', url);
    downloadLink.click();
  });

  return (
    <>
      <div
        id="automator-share-image-container"
        className={classNames(styles['form'], styles[currentState])}
      >
        TODO: share
        <div className={styles['btns']}>
          <div
            className={classNames(styles['btn'], styles['copy-img'])}
            onClick={() => copyImage()}
          >
            <span className={styles['icon']} />
            {t({
              enUS: 'Copy Image',
            })}
          </div>
        </div>
      </div>
    </>
  );
};

const AutomatorShareModal = forwardRef<
  AutomatorShareModalPropsRef,
  AutomatorShareModalProps
>((props, ref) => {
  const [t] = useTranslation('AutomatorOperate');
  const [visible, setVisible] = useState(false);

  useImperativeHandle(ref, () => ({
    hide: () => setVisible(false),
    show: () => setVisible(true),
  }));

  return (
    <Modal
      modalContentClass={styles['automator-share-modal']}
      title={
        <>
          <span>
            {t({
              enUS: 'Automator',
              zhCN: 'Automator',
            })}
          </span>
        </>
      }
      width={1080}
      visible={visible}
      onCancel={() => setVisible(false)}
      footer={null}
      lazyRender
      closeOnEsc={false}
    >
      <El {...props} setVisible={setVisible} />
    </Modal>
  );
});

export default AutomatorShareModal;
