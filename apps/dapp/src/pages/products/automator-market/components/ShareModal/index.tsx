import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Modal, Toast } from '@douyinfe/semi-ui';
import { AutomatorInfo, AutomatorService } from '@sofa/services/automator';
import { ProjectType } from '@sofa/services/base-type.ts';
import { CCYService } from '@sofa/services/ccy';
import { ChainMap } from '@sofa/services/chains';
import { useTranslation } from '@sofa/services/i18n';
import {
  amountFormatter,
  cvtAmountsInCcy,
  displayPercentage,
} from '@sofa/utils/amount';
import { getErrorMsg } from '@sofa/utils/fns';
import { formatHighlightedText } from '@sofa/utils/string';
import { useRequest } from 'ahooks';
import classNames from 'classnames';
import { copy } from 'clipboard';

import { Comp as Logo } from '@/assets/logo';
import AmountDisplay from '@/components/AmountDisplay';
import { useIndexPrices } from '@/components/IndexPrices/store';
import { ProjectTypeRefs } from '@/components/ProductSelector/enums';
import {
  captureAndCopyImage,
  useAutomatorShareInfo,
} from '@/components/Share/utils';
import { useWalletStore } from '@/components/WalletConnector/store';
import { useAutomatorStore } from '@/pages/products/automator/store';
import { AutomatorRiskExposureMap } from '@/pages/products/automator-create/util';

import { Comp as IconRisk } from '../../../automator-mine/assets/icon-risk.svg';

import styles from './index.module.scss';

export interface AutomatorUserShareModalPropsRef {
  hide(): void;
  show(): void;
}

export interface AutomatorUserShareModalProps {
  automatorInfo: AutomatorInfo;
}

const AutomatorUserShareModal = forwardRef<
  AutomatorUserShareModalPropsRef,
  AutomatorUserShareModalProps
>((props, ref) => {
  const [t] = useTranslation('AutomatorCard');
  const [visible, setVisible] = useState(false);
  const { address } = useWalletStore();
  const { data: globalAutomatorStatus } = useRequest(() =>
    AutomatorService.automatorShareGlobalStatus(),
  );

  const prices = useIndexPrices((s) => s.prices);
  const data = useAutomatorStore((state) =>
    props.automatorInfo && address
      ? state.userInfos[
          `${props.automatorInfo.vaultInfo.chainId}-${props.automatorInfo.vaultInfo.vault.toLowerCase()}-${address}`
        ]
      : undefined,
  );
  useImperativeHandle(ref, () => ({
    hide: () => setVisible(false),
    show: () => setVisible(true),
  }));
  const { shareText, shareLink } = useAutomatorShareInfo({
    t,
    vault: props.automatorInfo.vaultInfo,
  });

  useEffect(() => {
    if (props.automatorInfo && address)
      return useAutomatorStore.subscribeUserInfo(
        props.automatorInfo.vaultInfo,
        address,
      );
  }, [props.automatorInfo, address]);
  return (
    <Modal
      modalContentClass={styles['automator-share-modal']}
      title={
        <div className={styles['modal-title']}>
          <Logo className={styles['sofa-icon']} />
          <span className={styles['automator']}>
            {ProjectTypeRefs[ProjectType.Automator].icon}
            {t({
              enUS: 'Automator',
              zhCN: 'Automator',
            })}
          </span>
          {(globalAutomatorStatus && (
            <>
              <span className={'segmentation'}>|</span>
              <span className={'status'}>
                {formatHighlightedText(
                  t(
                    {
                      enUS: 'Over [[{{amount}}]] {{crypto}} in funds are sharing the profits',
                      zhCN: '和超过 [[{{amount}}]] {{crypto}} 的资金共享利润',
                    },
                    {
                      amount: amountFormatter(
                        globalAutomatorStatus.totalDepositAmount,
                      ),
                      crypto: globalAutomatorStatus.crypto,
                    },
                  ),
                  {
                    hightlightedClassName: styles['amount'],
                  },
                )}
              </span>
            </>
          )) ||
            undefined}
        </div>
      }
      width={1024}
      visible={visible}
      onCancel={() => setVisible(false)}
      footer={
        <>
          <div className={styles['footer-line']} />
          <div className={styles['modal-footer']}>
            <a
              className={classNames(styles['btn'], styles['copy-img'])}
              onClick={() =>
                captureAndCopyImage({
                  selector: '.semi-modal',
                  capturingClassName: styles['modal-capturing'],
                  maskElementClassName: styles['modal-capturing-mask'],
                  filter: (e) => {
                    return e.getAttribute?.('aria-label') != 'close';
                  },
                  getCapturingElement: () => {
                    const res =
                      document.querySelector<HTMLElement>('.semi-modal')!;
                    const portal =
                      document.querySelector<HTMLElement>('.semi-portal')!;
                    portal.setAttribute('origin-z-index', portal.style.zIndex);
                    portal.style.zIndex = '-1';
                    return res;
                  },
                  onCaptured: () => {
                    const portal =
                      document.querySelector<HTMLElement>('.semi-portal')!;
                    portal.style.zIndex =
                      portal.getAttribute('origin-z-index')!;
                  },
                })
                  .then(() =>
                    Toast.success(
                      t({
                        enUS: 'Copy successful',
                        zhCN: '复制成功',
                      }),
                    ),
                  )
                  .catch((e) => Toast.error(getErrorMsg(e)))
              }
            >
              <span className={styles['icon']} />
              {t({ enUS: 'Copy Image', zhCN: '复制图片' })}
            </a>
            <a
              className={classNames(styles['btn'], styles['copy-link'])}
              href={shareLink}
              onClick={(e) => {
                e.preventDefault();
                Promise.resolve()
                  .then(() => copy(shareText))
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
              {t({ enUS: 'Share Automator', zhCN: '分享Automator' })}
            </a>
          </div>
        </>
      }
      lazyRender
      closeOnEsc={false}
    >
      <div className={styles['header']}>
        <div className={styles['share-info']}>
          <div className={styles['title']}>
            <div className={styles['label']}>
              {t({ enUS: 'My PnL', zhCN: '我的PnL' })}
            </div>
            <div className={styles['address']}>{address}</div>
          </div>
          <div className={styles['value']}>
            <AmountDisplay
              amount={cvtAmountsInCcy(
                [
                  [
                    props.automatorInfo.vaultInfo.vaultDepositCcy,
                    data?.server?.totalPnlByClientDepositCcy,
                  ],
                ],
                prices,
                props.automatorInfo.vaultInfo.depositCcy,
              )}
            />
            <span className={styles['unit']}>
              {props.automatorInfo.vaultInfo.realDepositCcy ??
                props.automatorInfo.vaultInfo.depositCcy}
            </span>
            <span className={styles['operator']}>+</span>
            <span style={{ color: 'var(--color-rch)' }}>
              <AmountDisplay amount={data?.server?.totalRchAmount} />
              <span className={classNames(styles['unit'])}>RCH</span>
            </span>
          </div>
        </div>

        <div className={styles['automator-info']}>
          <div className={styles['left']}>
            <div className={styles['automator-risk']}>
              <span className={styles['name']}>
                {props.automatorInfo.vaultInfo.name}
              </span>
              <IconRisk className={styles['label']} />
              {(() => {
                const ref =
                  AutomatorRiskExposureMap[
                    props.automatorInfo.vaultInfo.riskExposure!
                  ];
                return ref ? (
                  <>
                    <span
                      style={{
                        color: ref?.color || 'inherit',
                      }}
                    >
                      {ref.label}
                    </span>
                  </>
                ) : (
                  'R-'
                );
              })()}
            </div>
            <div className={styles['automator-performance']}>
              <span
                className={styles['value']}
                style={{
                  color:
                    Number(props.automatorInfo.yieldPercentage) >= 0
                      ? 'var(--color-rise)'
                      : 'var(--color-fall)',
                }}
              >
                {displayPercentage(
                  Number(props.automatorInfo.yieldPercentage) / 100,
                  2,
                  true,
                )}
              </span>
              <span className={styles['label']}>
                {t({ enUS: '7 Day Target Yield', zhCN: '7天年化' })}
              </span>
            </div>
          </div>

          <div className={styles['right']}>
            <div className={styles['pool-size']}>
              <div className={styles['label']}>
                {t({ enUS: 'Pool Size:', zhCN: '规模:' })}
              </div>
              <div className={styles['value']}>
                <AmountDisplay
                  amount={
                    +props.automatorInfo.aumBySharesToken ||
                    +props.automatorInfo.aumByVaultDepositCcy /
                      +props.automatorInfo.nav
                  }
                  ccy={props.automatorInfo.vaultInfo.depositCcy}
                />
                <span className={styles['unit']}>
                  {props.automatorInfo.vaultInfo.realDepositCcy ??
                    props.automatorInfo.vaultInfo.depositCcy}
                </span>
              </div>
            </div>

            <div className={styles['deposit-ccy']}>
              <div className={styles['label']}>
                {t({ enUS: 'Followers:', zhCN: '粉丝数：' })}
              </div>
              <div className={styles['value']}>
                {props.automatorInfo.currentParticipantNum || '-'}
              </div>
            </div>

            <div className={styles['optivisor']}>
              <div className={styles['label']}>
                {t({ enUS: `Optivisor:`, zhCN: '主理人:' })}
              </div>
              <div className={styles['value']}>
                {props.automatorInfo.vaultInfo.creator}
                <img
                  className={classNames(styles['logo'], styles['deposit-ccy'])}
                  src={
                    CCYService.ccyConfigs[
                      props.automatorInfo.vaultInfo.depositCcy
                    ]?.icon
                  }
                  alt=""
                />
                <img
                  className={classNames(styles['logo'], styles['chain'])}
                  src={ChainMap[props.automatorInfo.vaultInfo.chainId]?.icon}
                  alt=""
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
});

export default AutomatorUserShareModal;
