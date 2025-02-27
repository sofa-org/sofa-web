import { Dispatch, forwardRef, useImperativeHandle, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Toast } from '@douyinfe/semi-ui';
import { AutomatorDetail } from '@sofa/services/automator';
import { useTranslation } from '@sofa/services/i18n';
import { ProductQuoteResult } from '@sofa/services/products';
import { amountFormatter, displayPercentage } from '@sofa/utils/amount';
import { getErrorMsg } from '@sofa/utils/fns';
import { useLazyCallback } from '@sofa/utils/hooks';
import { formatHighlightedText } from '@sofa/utils/string';
import classNames from 'classnames';
import * as htmlToImage from 'html-to-image';
import { resolve } from 'path';

import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';
import { AutomatorRiskExposureMap } from '@/pages/products/automator-create/util';

import { Comp as IconRisk } from '../../automator-mine/assets/icon-risk.svg';
import locale from '../../locale';

import styles from './index.module.scss';

addI18nResources(locale, 'AutomatorOperate');

export interface AutomatorShareModalPropsRef {
  hide(): void;
  show(): void;
}

export interface AutomatorShareModalProps {
  automatorDetail: AutomatorDetail;
}

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

  const copyImage = useLazyCallback(async () => {
    const element = document.querySelector<HTMLElement>('.semi-modal')!;
    element.className = element.className + ' ' + styles['modal-capturing'];
    await new Promise((resolve) => setTimeout(resolve, 0));
    // window.devicePixelRatio = 2;
    const blob = await htmlToImage.toBlob(element, {
      // pixelRatio: 2,
      // skipAutoScale: true,
      // filter: (e) =>
      //   e.tagName == 'BUTTON' ||
      //   e.tagName == 'A' ||
      //   e.className?.includes(styles['btns'])
      //     ? false
      //     : true,
    });
    element.className = element.className.replace(
      styles['modal-capturing'],
      '',
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
    <Modal
      modalContentClass={styles['automator-share-modal']}
      title={
        <div className={styles['modal-title']}>
          <span className={styles['sofa-icon']} />
          <span className={styles['automator']}>
            <span className={styles['automator-icon']} />
            {t({
              enUS: 'Automator',
              zhCN: 'Automator',
            })}
          </span>
          <span className={'status'}>
            {formatHighlightedText(
              t(
                {
                  enUS: 'Over [[{{amount}}]] USDT in funds are sharing the profits',
                },
                {
                  amount: amountFormatter(1500000),
                },
              ),
              {
                hightlightedClassName: styles['amount'],
              },
            )}
          </span>
        </div>
      }
      width={1080}
      visible={visible}
      onCancel={() => setVisible(false)}
      footer={
        <>
          <div className={styles['modal-footer']}>
            <div
              className={classNames(styles['btn'], styles['copy-img'])}
              onClick={() =>
                copyImage().catch((e) => Toast.error(getErrorMsg(e)))
              }
            >
              <span className={styles['icon']} />
              {t({
                enUS: 'Copy Image',
              })}
            </div>
            <div
              className={classNames(styles['btn'], styles['copy-link'])}
              onClick={() => alert('TODO')}
            >
              <span className={styles['icon']} />
              {t({
                enUS: 'Copy Link',
              })}
            </div>
          </div>
        </>
      }
      lazyRender
      closeOnEsc={false}
    >
      <div className={styles['header']}>
        <div className={styles['automator-name']}>
          {props.automatorDetail.vaultInfo.name}
        </div>

        <div className={styles['automator-risk']}>
          <IconRisk className={styles['label']} />
          {(() => {
            const ref =
              AutomatorRiskExposureMap[
                props.automatorDetail.vaultInfo.riskExposure!
              ];
            return ref ? (
              <>
                <span
                  style={{
                    color: ref?.color || 'inherit',
                  }}
                >
                  {ref.label} - {ref.desc(t)}
                </span>
                <span className={styles['risk-desc']}>
                  {t({
                    enUS: 'Max Risk Exposure',
                    zhCN: '最大风险敞口',
                  })}
                  : {displayPercentage(ref.value)}
                </span>
              </>
            ) : (
              'R-'
            );
          })()}
        </div>
        <div className={styles['automator-address']}>
          {props.automatorDetail.vaultInfo.vault.toLowerCase() || ''}
        </div>
      </div>
    </Modal>
  );
});

export default AutomatorShareModal;
