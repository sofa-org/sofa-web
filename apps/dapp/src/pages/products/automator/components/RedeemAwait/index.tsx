import { RefObject, useMemo } from 'react';
import { Popover } from '@douyinfe/semi-ui';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { amountFormatter } from '@sofa/utils/amount';
import { updateQuery } from '@sofa/utils/history';
import { formatDuration } from '@sofa/utils/time';
import { useCountDown } from 'ahooks';
import classNames from 'classnames';
import dayjs from 'dayjs';

import AsyncButton from '@/components/AsyncButton';
import { useWalletStore } from '@/components/WalletConnector/store';
import { ProgressRef } from '@/pages/products/components/InvestProgress';

import { Comp as IconInfo } from '../../assets/icon-info.svg';
import { useAutomatorStore } from '../../store';

import styles from './index.module.scss';

const useAutomatorRedeemAwaitEl = (props: {
  vault?: AutomatorVaultInfo;
  redemptionInfo:
    | {
        pendingSharesWithDecimals: number;
        createTime: number;
      }
    | undefined;
  claimableStartAt?: number;
  claimableEndAt?: number;
  tip: string;
}) => {
  const [t] = useTranslation('Automator');
  const vault = props.vault;
  const wallet = useWalletStore();
  const redemptionInfo = props.redemptionInfo;

  const shareInfo = useAutomatorStore(
    (state) =>
      vault &&
      state.userInfos[`${vault.chainId}-${vault.vault}-${wallet.address}`]
        ?.shareInfo,
  );
  const decimals = shareInfo?.shareDecimals || 6;
  const pricePerShare = shareInfo?.pricePerShare || 1;
  const pendingShares =
    Number(redemptionInfo?.pendingSharesWithDecimals) / 10 ** decimals;

  const claimableStartAt = useMemo(() => {
    if (props.claimableStartAt) return props.claimableStartAt;
    if (!redemptionInfo || !vault) return undefined;
    return dayjs(
      redemptionInfo.createTime * 1000 + Number(vault.redeemWaitPeriod),
    ).valueOf();
  }, [props.claimableStartAt, redemptionInfo, vault]);
  const claimableEndAt = useMemo(() => {
    if (props.claimableEndAt) return props.claimableEndAt;
    if (!claimableStartAt || !vault) return undefined;
    return dayjs(claimableStartAt).add(Number(vault.claimPeriod)).valueOf();
  }, [props.claimableEndAt, claimableStartAt, vault]);

  return [
    <>
      <h5 className={styles['title']}>
        {t({ enUS: 'Redemption', zhCN: '赎回申请' })}
      </h5>
      <div className={styles['shares']}>
        <span className={styles['value']}>
          {amountFormatter(pendingShares, decimals)}
        </span>{' '}
        <span className={styles['unit']}>{vault?.positionCcy}</span>
        <span className={styles['decorative']}>
          ≈{amountFormatter(pendingShares * pricePerShare, 2)}{' '}
          <span className={styles['unit']}>{vault?.depositCcy}</span>
        </span>
      </div>
    </>,
    <div className={styles['separator']}>
      <div />
    </div>,
    <>
      <div className={styles['items']}>
        <div className={styles['item']}>
          <div className={styles['label']}>
            {t({ enUS: 'Redemption Submitted', zhCN: '赎回提交时间' })}
          </div>
          <div className={styles['value']}>
            {dayjs(Number(redemptionInfo?.createTime) * 1000).format(
              'MMM DD, YYYY HH:mm',
            )}
          </div>
        </div>
        <div className={styles['item']}>
          <div className={classNames(styles['label'], 'highlight')}>
            {t({ enUS: 'Available For Claim', zhCN: '可领取时间' })}
            {/* {vault?.claimPeriod && (
              <span className={styles['badge']}>
                {formatDuration(vault.claimPeriod, 1, true)}
              </span>
            )} */}
          </div>
          <div className={styles['value']}>
            {dayjs(Number(claimableStartAt)).format('MMM DD, YYYY HH:mm')} -{' '}
            {dayjs(Number(claimableEndAt)).format('MMM DD, YYYY HH:mm')}
          </div>
        </div>
      </div>
      <div className={styles['tips']}>
        <p
          className={styles['tip']}
          dangerouslySetInnerHTML={{
            __html: props.tip,
          }}
        />
      </div>
    </>,
  ];
};

export const AutomatorRedeemAwaitEl = (
  props: Parameters<typeof useAutomatorRedeemAwaitEl>[0],
) => {
  const [el1, el2, el3] = useAutomatorRedeemAwaitEl(props);
  return (
    <>
      {el1}
      {el2}
      {el3}
    </>
  );
};

export const AutomatorRedeemAwait = (props: {
  vault?: AutomatorVaultInfo;
  progressRef: RefObject<ProgressRef>;
  claimableStartAt?: number;
  claimableEndAt?: number;
  onSuccess?: () => void;
}) => {
  const [t] = useTranslation('Automator');
  const vault = props.vault;
  const wallet = useWalletStore();

  const redemptionInfo = useAutomatorStore(
    (state) =>
      vault &&
      state.userInfos[`${vault.chainId}-${vault.vault}-${wallet.address}`]
        ?.redemptionInfo,
  );

  const [el1, el2, el3] = useAutomatorRedeemAwaitEl({
    vault: vault,
    redemptionInfo: redemptionInfo,
    claimableStartAt: props.claimableStartAt,
    claimableEndAt: props.claimableEndAt,
    tip: t(
      {
        enUS: 'Once claimable, you\'ll have <span class="highlight">{{duration}}</span> to claim this redemption. If not claimed in time, you\'ll need to re-initiate the redemption.',
        zhCN: '一旦可赎回，您将有 <span class="highlight">{{duration}}</span> 时间赎回。如未及时赎回，您将需要重新申请赎回。',
      },
      {
        duration:
          vault?.claimPeriod && formatDuration(vault?.claimPeriod, 1, true),
      },
    ),
  });

  const leftTime = useMemo(
    () => (!props.claimableStartAt ? 0 : props.claimableStartAt - Date.now()),
    [props.claimableStartAt],
  );
  const [time] = useCountDown({ leftTime });

  return (
    <>
      <div className={styles['content']}>{el1}</div>
      <AsyncButton
        className={classNames(styles['button'], styles['cancel-button'])}
        onClick={async () => {
          // if (!vault) return;
          // await new Promise((resolve, reject) =>
          //   Modal.confirm({
          //     icon: null,
          //     title: null,
          //     centered: true,
          //     className: styles['modal'],
          //     content: (
          //       <span
          //         className={styles['cancel-warning']}
          //         dangerouslySetInnerHTML={{
          //           __html: t(
          //             {
          //               enUS: 'If you cancel this redemption, you will need to <span class="highlight">wait {{duration}}</span> to claim if you initiate another redemption. Do you confirm the cancellation of this redemption?',
          //               zhCN: '一旦取消赎回，您将需要 <span class="highlight">等待 {{duration}}</span> 才能发起新的赎回。您确认取消赎回吗？',
          //             },
          //             {
          //               duration: formatDuration(vault.redeemWaitPeriod, 1, true),
          //             },
          //           ),
          //         }}
          //       />
          //     ),
          //     cancelText: t({ enUS: 'Cancel', zhCN: '取消' }),
          //     okText: t({ enUS: 'Confirm', zhCN: '确认' }),
          //     onOk: resolve,
          //     onCancel: () => reject(),
          //   }),
          // );
          // return AutomatorService.redeem(
          //   (it) => {
          //     props.progressRef.current?.update(it);
          //     if (it.status === 'Success') {
          //       props.onSuccess?.();
          //     }
          //   },
          //   vault,
          //   0,
          // );
        }}
      >
        {t({ enUS: 'Awaiting Claim', zhCN: '等待赎回' })}
        <>
          <span className={classNames('txt-gradient', styles['duration'])}>
            {formatDuration(time)}
          </span>
          <Popover
            content={
              <div className={styles['tooltip']}>
                {el2}
                {el3}
              </div>
            }
            style={{
              width: 'min(500px, 90vw)',
              maxWidth: 'none',
              background: '#fff',
              boxShadow: '0 0 0 0 5px rgba(0,0,0,0.5)',
            }}
            // trigger="click"
            position="left"
          >
            <IconInfo />
          </Popover>
        </>
      </AsyncButton>
      <div
        className={styles['change-redemption']}
        onClick={() => updateQuery({ step: 'redeem-apply' })}
      >
        {t({ enUS: 'Change Redemption Amount', zhCN: '修改申请' })}
      </div>
    </>
  );
};
