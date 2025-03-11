import { forwardRef, useImperativeHandle, useState } from 'react';
import { Modal, Spin, Toast } from '@douyinfe/semi-ui';
import { AutomatorDetail, AutomatorService } from '@sofa/services/automator';
import { ProjectType } from '@sofa/services/base-type.ts';
import { CCYService } from '@sofa/services/ccy';
import { ChainMap } from '@sofa/services/chains';
import { useTranslation } from '@sofa/services/i18n';
import { amountFormatter, displayPercentage } from '@sofa/utils/amount';
import { getErrorMsg } from '@sofa/utils/fns';
import { formatHighlightedText } from '@sofa/utils/string';
import { useRequest } from 'ahooks';
import classNames from 'classnames';
import { copy } from 'clipboard';

import { Comp as Logo } from '@/assets/logo';
import AmountDisplay from '@/components/AmountDisplay';
import { MsgDisplay } from '@/components/MsgDisplay';
import { ProjectTypeRefs } from '@/components/ProductSelector/enums';
import {
  captureAndCopyImage,
  useAutomatorShareInfo,
} from '@/components/Share/utils';
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
  const { chainId } = useWalletStore();
  const { data: globalAutomatorStatus } = useRequest(() =>
    AutomatorService.automatorShareGlobalStatus(),
  );

  useImperativeHandle(ref, () => ({
    hide: () => setVisible(false),
    show: () => setVisible(true),
  }));

  const { data } = useRequest(() =>
    AutomatorService.topFollowers(props.automatorDetail.vaultInfo),
  );

  const { shareText, shareLink } = useAutomatorShareInfo({
    t,
    vault: props.automatorDetail.vaultInfo,
  });

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
      width={971}
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
              {t({ enUS: 'Copy Link', zhCN: '复制链接' })}
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

        <div className={styles['automator-infos']}>
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
            <a
              className={styles['address']}
              href={
                ChainMap[chainId].explorerUrl +
                '/address/' +
                props.automatorDetail.vaultInfo.vault.toLowerCase()
              }
              target="_blank"
            >
              {props.automatorDetail.vaultInfo.vault.toLowerCase() || ''}
            </a>

            <img
              className={styles['logo']}
              src={ChainMap[props.automatorDetail.vaultInfo.chainId].icon}
              alt=""
            />
          </div>
        </div>

        <div className={styles['automator-desc']}>
          <MsgDisplay>
            <span
              dangerouslySetInnerHTML={{
                __html:
                  props.automatorDetail.vaultInfo.desc?.replace(
                    '\n',
                    '<br />',
                  ) || '...',
              }}
            />
          </MsgDisplay>
        </div>

        <div className={styles['flex-space']}>
          <div className={styles['automator-performance']}>
            <div>
              <span className={styles['label']}>
                {t({ enUS: '7 Day Target Yield', zhCN: '7天年化' })}
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
                  2,
                  true,
                )}
              </span>
            </div>
            <div className={styles['pool-size']}>
              <div className={styles['label']}>
                {t({ enUS: 'Pool Size', zhCN: '规模' })}
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
                <AmountDisplay
                  amount={
                    +props.automatorDetail.aumBySharesToken ||
                    +props.automatorDetail.aumByVaultDepositCcy /
                      +props.automatorDetail.nav
                  }
                  ccy={props.automatorDetail.vaultInfo.depositCcy}
                />
                <span className={styles['unit']}>
                  {props.automatorDetail.vaultInfo.depositCcy}
                </span>
              </div>
            </div>
          </div>
          <div className={styles['display-flex-column']}>
            <div className={styles['automator-size']}>
              <div className={styles['optivisor-info']}>
                <div className={styles['optivisor-funds']}>
                  <div className={styles['label']}>
                    {t({ enUS: `Optivisor's Funds`, zhCN: '主理人份额' })}
                  </div>
                  <div className={styles['value']}>
                    <AmountDisplay
                      amount={
                        props.automatorDetail.creatorAmountByClientDepositCcy ||
                        0
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
                </div>
                <div className={styles['deposit-ccy']}>
                  <div className={styles['label']}>
                    {t({ enUS: 'Followers', zhCN: '关注者' })}
                  </div>
                  <div className={styles['value']}>
                    {props.automatorDetail.participantNum || '-'}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles['automator-follower']}>
              <div className={styles['followers-pnl']}>
                <div className={styles['label']}>
                  {t({ enUS: `Best performance`, zhCN: '最佳表现' })}
                </div>
                {!data ? (
                  <>
                    <div className={styles['empty-line']}>
                      <Spin />
                    </div>
                  </>
                ) : (
                  (data?.length && (
                    <>
                      <div className={styles['first-line']}>
                        <span>{t({ enUS: 'Address', zhCN: '地址' })}</span>
                        <span>{t({ enUS: 'Days', zhCN: '持有时间' })}</span>
                        <span>
                          {t({ enUS: 'APY', zhCN: '年化收益率 (APY)' })}
                        </span>
                      </div>
                      <div className={styles['value']}>
                        {data.map((row) => (
                          <div className={styles['follower']}>
                            <span className={styles['wallet']}>
                              {row.wallet.replace(
                                /^(\w{8})\w+$/,
                                (_, s) => `${s}...`,
                              )}
                            </span>
                            <span className={styles['day']}>
                              {row.followDay} {t({ enUS: 'days', zhCN: '天' })}
                            </span>
                            <span
                              className={styles['percentage']}
                              style={{
                                color:
                                  Number(row.pnlPercentage) >= 0
                                    ? 'var(--color-rise)'
                                    : 'var(--color-fall)',
                              }}
                            >
                              {displayPercentage(
                                Number(row.pnlPercentage) / 100,
                                1,
                                true,
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )) || (
                    <>
                      <div className={styles['empty-line']}>
                        <span>
                          {t({
                            enUS: `No followers yet`,
                            zhCN: '还没有参与者',
                          })}
                        </span>
                      </div>
                    </>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
});

export default AutomatorShareModal;
