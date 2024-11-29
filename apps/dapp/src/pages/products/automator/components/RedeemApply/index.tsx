import { RefObject, useEffect } from 'react';
import { Modal } from '@douyinfe/semi-ui';
import { wait } from '@livelybone/promise-wait';
import { AutomatorService } from '@sofa/services/automator';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { amountFormatter } from '@sofa/utils/amount';
import { updateQuery } from '@sofa/utils/history';
import { formatDuration } from '@sofa/utils/time';
import Big from 'big.js';
import classNames from 'classnames';
import dayjs from 'dayjs';

import AmountInput from '@/components/AmountInput';
import AsyncButton from '@/components/AsyncButton';
import { useWalletStore } from '@/components/WalletConnector/store';
import { BaseInvestButton } from '@/pages/products/components/InvestButton';
import { ProgressRef } from '@/pages/products/components/InvestProgress';

import { useAutomatorStore } from '../../store';
import { AutomatorRedeemAwaitEl } from '../RedeemAwait';

import styles from './index.module.scss';

export const AutomatorRedeemApply = (props: {
  vault?: AutomatorVaultInfo;
  progressRef: RefObject<ProgressRef>;
  onSuccess?: () => void;
  claimableStartAt?: number;
  pendingSharesWithDecimals?: number;
}) => {
  const [t] = useTranslation('Automator');
  const vault = props.vault;

  const wallet = useWalletStore();

  const shareInfo = useAutomatorStore(
    (state) =>
      vault &&
      state.userInfos[`${vault.chainId}-${vault.vault}-${wallet.address}`]
        ?.shareInfo,
  );
  const shareDecimals = shareInfo?.shareDecimals ?? 6;
  const tick = 1 / 10 ** shareDecimals;
  const balance = shareInfo?.shares;

  const redeemData = useAutomatorStore(
    (state) =>
      vault &&
      state.redeemData[`${vault.chainId}-${vault.vault}-${wallet.address}`],
  );

  const hasRedemption =
    !!props.claimableStartAt &&
    !!props.pendingSharesWithDecimals &&
    Date.now() < props.claimableStartAt;

  useEffect(() => {
    if (hasRedemption && vault && wallet.address)
      useAutomatorStore.updateRedeemData(
        vault,
        {
          shares: +Big(props.pendingSharesWithDecimals!).div(
            10 ** shareDecimals,
          ),
        },
        wallet.address,
      );
  }, [
    hasRedemption,
    props.pendingSharesWithDecimals,
    shareDecimals,
    vault,
    wallet.address,
  ]);

  return (
    <>
      <div className={styles['form-item']}>
        <div className={styles['label']}>
          {t({ enUS: 'Redemption Amount', zhCN: '赎回份额' })}
        </div>
        <div className={styles['input-wrapper']}>
          <AmountInput
            max={balance || undefined}
            min={tick}
            tick={tick}
            value={redeemData?.shares}
            onChange={(v) =>
              vault &&
              wallet.address &&
              useAutomatorStore.updateRedeemData(
                vault,
                { shares: v },
                wallet.address,
              )
            }
            suffix={
              <span className={styles['suffix']}>{vault?.balanceCcy}</span>
            }
          />
        </div>
        <div className={styles['balance']}>
          <span className={styles['label']}>
            {t({ enUS: 'Redeemable', zhCN: '可赎回' })}
          </span>
          <span className={styles['value']}>
            {amountFormatter(balance, shareDecimals)} {vault?.balanceCcy}
            <span className={styles['equals']}>
              ≈ {amountFormatter(shareInfo?.amount, 2)} {vault?.depositCcy}
            </span>
          </span>
        </div>
      </div>
      <div className={styles['buttons']}>
        {hasRedemption && (
          <AsyncButton
            className={classNames(styles['button'], styles['cancel-button'])}
            onClick={() => updateQuery({ step: undefined })}
          >
            {t({ enUS: 'Cancel Change', zhCN: '取消修改' })}
          </AsyncButton>
        )}
        <BaseInvestButton
          className={styles['button']}
          preparing={!vault}
          prepareText={t({ enUS: 'No vault', zhCN: '未找到产品' })}
          insufficient={!!balance && balance < Number(redeemData?.shares)}
          onSubmit={async () => {
            await wait(100);
            if (!vault) return;
            if (!redeemData?.shares)
              throw new Error(
                t({
                  enUS: 'Please input shares',
                  zhCN: '请输入申请金额',
                }),
              );
            if (Number(redeemData.shares) > Number(balance))
              throw new Error(
                t({ enUS: 'No need apply', zhCN: '无需提交申请' }),
              );
            const sharesWithDecimals = Big(redeemData.shares)
              .times(10 ** shareDecimals)
              .toString();
            if (hasRedemption) {
              const pendingSharesWithDecimals =
                useAutomatorStore.getState().userInfos[
                  `${vault.chainId}-${vault.vault}-${wallet.address}`
                ]?.redemptionInfo?.pendingSharesWithDecimals;
              if (Number(pendingSharesWithDecimals) === +sharesWithDecimals) {
                throw new Error(
                  t({
                    enUS: 'The input shares is the same as the shares of pending redemption. No need to apply again!',
                    zhCN: '输入的份额数量与待赎回的份额数量相同，无需重复申请！',
                  }),
                );
              }
            }
            await new Promise((resolve, reject) =>
              Modal.confirm({
                icon: null,
                title: null,
                width: 600,
                centered: true,
                className: styles['modal'],
                content: (
                  <AutomatorRedeemAwaitEl
                    vault={vault}
                    tip={t(
                      {
                        enUS: `Once claimable, you'll have <span class="highlight">{{waitDuration}}</span> to claim  your redemption. If it is not claimed on time, you'll need to re-initiate the request.`,
                        zhCN: '一旦可领取，您有<span class="highlight">{{waitDuration}}</span>时间完成赎回。如果未在规定时间内领取，您需要重新发起请求。',
                      },
                      {
                        waitDuration:
                          vault?.redeemWaitPeriod &&
                          formatDuration(vault?.redeemWaitPeriod, 1),
                        claimDuration:
                          vault?.claimPeriod &&
                          formatDuration(vault?.claimPeriod, 1),
                      },
                    )}
                    redemptionInfo={
                      redeemData.shares
                        ? {
                            pendingSharesWithDecimals: +sharesWithDecimals,
                            createTime: Date.now() / 1000,
                          }
                        : undefined
                    }
                  />
                ),
                okText: t({ enUS: 'Continue', zhCN: '继续' }),
                cancelText: t({ enUS: 'Cancel', zhCN: '取消' }),
                onOk: resolve,
                onCancel: () => reject(),
              }),
            );
            return AutomatorService.redeem(
              (it) => {
                props.progressRef.current?.update(it);
                if (it.status === 'Success') {
                  props.onSuccess?.();
                }
              },
              vault,
              sharesWithDecimals,
            );
          }}
        >
          {t({ enUS: 'Redeem', zhCN: '赎回申请' })}
        </BaseInvestButton>
      </div>
      {!hasRedemption ? (
        <span className={styles['redeem-info']}>
          {t(
            {
              enUS: 'Redemptions can be claimed on {{time}}',
              zhCN: '现在提交预计在 {{time}} 可赎回',
            },
            {
              time: dayjs(Date.now() + Number(vault?.redeemWaitPeriod)).format(
                'MMM DD, YYYY HH:mm',
              ),
            },
          )}
        </span>
      ) : (
        <span className={styles['redeem-info']}>
          {t(
            {
              enUS: 'Changing your redemption amount will reset the claimable period. Expected claimable on {{time}}.',
              zhCN: '更改您的赎回金额将重置可领取期限。预计可领取时间为 {{time}}。',
            },
            {
              time: dayjs(Date.now() + Number(vault?.redeemWaitPeriod)).format(
                'MMM DD, YYYY HH:mm',
              ),
            },
          )}
        </span>
      )}
    </>
  );
};
