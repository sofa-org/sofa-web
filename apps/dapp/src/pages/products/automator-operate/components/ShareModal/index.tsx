import { Dispatch, forwardRef, useImperativeHandle, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Toast } from '@douyinfe/semi-ui';
import { AutomatorDetail, AutomatorService } from '@sofa/services/automator';
import { CCYService } from '@sofa/services/ccy';
import { ChainMap } from '@sofa/services/chains';
import { useTranslation } from '@sofa/services/i18n';
import { ProductQuoteResult } from '@sofa/services/products';
import { amountFormatter, displayPercentage } from '@sofa/utils/amount';
import { getErrorMsg } from '@sofa/utils/fns';
import { useLazyCallback } from '@sofa/utils/hooks';
import { formatHighlightedText } from '@sofa/utils/string';
import { useRequest } from 'ahooks';
import classNames from 'classnames';
import { copy } from 'clipboard';
import * as htmlToImage from 'html-to-image';
import { resolve } from 'path';

import AmountDisplay from '@/components/AmountDisplay';
import { MsgDisplay } from '@/components/MsgDisplay';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';
import { AutomatorRiskExposureMap } from '@/pages/products/automator-create/util';

import { Comp as IconRisk } from '../../../automator-mine/assets/icon-risk.svg';
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

  const { data } = useRequest(() =>
    AutomatorService.topFollowers(props.automatorDetail.vaultInfo),
  );

  const shareLink = `${location.protocol}//${location.host}/a?v=${props.automatorDetail.vaultInfo.vault}`;

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
            <a
              className={classNames(styles['btn'], styles['copy-img'])}
              onClick={() =>
                copyImage().catch((e) => Toast.error(getErrorMsg(e)))
              }
            >
              <span className={styles['icon']} />
              {t({
                enUS: 'Copy Image',
              })}
            </a>
            <a
              className={classNames(styles['btn'], styles['copy-link'])}
              href={shareLink}
              onClick={(e) => {
                e.preventDefault();
                Promise.resolve()
                  .then(() => copy(shareLink))
                  .then(() =>
                    Toast.success(
                      t({
                        enUS: 'Copy successful',
                        zhCN: '复制成功',
                      }),
                    ),
                  );
              }}
            >
              <span className={styles['icon']} />
              {t({
                enUS: 'Copy Link',
              })}
            </a>
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

          <img
            className={styles['logo']}
            src={ChainMap[props.automatorDetail.vaultInfo.chainId].icon}
            alt=""
          />
        </div>

        <div className={styles['automator-desc']}>
          <MsgDisplay>
            {/* vaultInfo.desc is from user, better not to use dangerouslySetInnerHTML (prevent XSS attack) */}
            {(props.automatorDetail.vaultInfo.desc || '...')
              .split('\n')
              .map((line, idx) => (
                <>
                  {idx > 0 ? <br key={`lb-${idx}`} /> : undefined}
                  {line}
                </>
              ))}
          </MsgDisplay>
        </div>
        <div className={styles['automator-performance']}>
          <span className={styles['label']}>
            {t({ enUS: '7D Yield', zhCN: '7天年化' })}
          </span>
          <span
            className={styles['value']}
            style={{
              color:
                Number(props.automatorDetail.yieldPercentage) >= 0
                  ? 'var(--color-rise)'
                  : 'var(--color-fall)',
            }}
          >
            {displayPercentage(
              Number(props.automatorDetail.yieldPercentage) / 100,
            )}
          </span>
        </div>
        <div className={styles['automator-size']}>
          <div className={styles['pool-size']}>
            <div className={styles['label']}>
              {t({ enUS: 'Pool Size', zhCN: '规模' })}
            </div>
            <div className={styles['value']}>
              <AmountDisplay
                amount={
                  +props.automatorDetail.aumBySharesToken ||
                  +props.automatorDetail.aumByVaultDepositCcy /
                    +props.automatorDetail.nav
                }
                ccy={props.automatorDetail.vaultInfo.depositCcy}
              />
            </div>
          </div>

          <div className={styles['optivisor-funds']}>
            <div className={styles['label']}>
              {t({ enUS: `Optivisor's Funds`, zhCN: '主理人份额' })}
            </div>
            <div className={styles['value']}>
              <AmountDisplay
                amount={
                  props.automatorDetail.creatorAmountByClientDepositCcy || 0
                }
                ccy={props.automatorDetail.vaultInfo.depositCcy}
              />
              <span className={styles['unit']}>
                {props.automatorDetail.vaultInfo.depositCcy}
              </span>
              <span className={styles['percent']}>
                {displayPercentage(
                  Number(
                    props.automatorDetail?.creatorAmountByVaultDepositCcy,
                  ) / Number(props.automatorDetail?.aumByVaultDepositCcy),
                )}
              </span>
            </div>

            <div className={styles['bar-bg']}>
              <div
                className={styles['bar']}
                style={{
                  width: `${
                    props.automatorDetail?.creatorAmountByVaultDepositCcy ===
                      undefined || !props.automatorDetail?.aumByVaultDepositCcy
                      ? 0
                      : (Number(
                          props.automatorDetail?.creatorAmountByVaultDepositCcy,
                        ) /
                          Number(props.automatorDetail?.aumByVaultDepositCcy)) *
                        100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className={styles['automator-follower']}>
          <div className={styles['deposit-ccy']}>
            <div className={styles['label']}>
              {t({ enUS: 'Deposit', zhCN: '存入' })}
            </div>
            <div className={styles['value']}>
              <img
                className={styles['logo']}
                src={
                  CCYService.ccyConfigs[
                    props.automatorDetail.vaultInfo.depositCcy
                  ]?.icon
                }
                alt=""
              />
            </div>
          </div>

          <div className={styles['deposit-ccy']}>
            <div className={styles['label']}>
              {t({ enUS: 'Participating Investor', zhCN: '参与钱包数' })}
            </div>
            <div className={styles['value']}>
              {props.automatorDetail.participantNum || '-'}
            </div>
          </div>

          {data && (
            <div className={styles['followers-pnl']}>
              <div className={styles['label']}>
                {t({ enUS: `Followers' PnL`, zhCN: '参与者 PnL' })}
              </div>
              <div className={styles['value']}>
                {data.map((row) => (
                  <div className={styles['follower']}>
                    <span className={styles['wallet']}>
                      {row.wallet.replace(/^(\w{8})\w+$/, (_, s) => `${s}...`)}
                    </span>
                    <span className={styles['day']}>{row.followDay}</span>
                    <span className={styles['percentage']}>
                      {displayPercentage(Number(row.pnlPercentage) / 100, 1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
});

export default AutomatorShareModal;
