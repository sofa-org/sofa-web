import { useEffect, useMemo, useState } from 'react';
import { ProductType, RiskType } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { useTranslation } from '@sofa/services/i18n';
import { ProductsDIYService } from '@sofa/services/products-diy';
import { displayPercentage } from '@sofa/utils/amount';
import { Env } from '@sofa/utils/env';
import { MsIntervals, nearest8h, next8h } from '@sofa/utils/expiry';
import { isNullLike } from '@sofa/utils/fns';
import classNames from 'classnames';

import { MobileOnly, useIsMobileUI } from '@/components/MobileOnly';
import {
  ProductTypeRefs,
  RiskTypeRefs,
} from '@/components/ProductSelector/enums';
import ProgressBar from '@/components/ProgressBar';
import { RadioBtnGroup } from '@/components/RadioBtnGroup';
import { useWalletStore } from '@/components/WalletConnector/store';

import { DIYProductDisplay } from '../ProductDisplay';

import { useDIYConfigState, useDIYState } from './store';

import styles from './index.module.scss';

const BettingOn = () => {
  const [t] = useTranslation('DIY');
  const chainId = useWalletStore((state) => state.chainId);
  const formData = useDIYState((state) => state.formData[chainId]);
  const options = useMemo(
    () =>
      useDIYState
        .getVaultOptions({ chainId, ...formData }, [
          'forCcy',
          'domCcy',
          'trackingSource',
        ])
        .map((it) => ({
          label: t(
            { enUS: '{{forCcy}} Price', zhCN: '{{forCcy}} 价格' },
            { forCcy: it.data.forCcy?.replace(/^w/i, '') },
          ),
          value: it.key,
          disabled: it.disabled,
          data: it.data,
        }))
        .sort((a, b) => {
          const index = (it: typeof a) => {
            if (/BTC/.test(it.data.forCcy!)) return 0;
            if (/ETH/.test(it.data.forCcy!)) return 1;
            return 2;
          };
          return index(a) - index(b);
        }),
    [chainId, formData, t],
  );
  return (
    <div className={styles['form-item']}>
      <div className={styles['label']}>
        {t({ enUS: 'What are you betting on?', zhCN: '你想押注什么？' })}
      </div>
      <div className={styles['input-wrapper']}>
        <RadioBtnGroup
          options={options}
          value={
            formData &&
            `${formData.forCcy}-${formData.domCcy}-${formData.trackingSource}`
          }
          onChange={(_, it) => useDIYState.updateVaultOptions(chainId, it.data)}
        />
      </div>
    </div>
  );
};

const MarketView = () => {
  const [t] = useTranslation('DIY');
  const chainId = useWalletStore((state) => state.chainId);
  const formData = useDIYState((state) => state.formData[chainId]);
  const options = useMemo(() => {
    const options = useDIYState.getVaultOptions({ chainId }, ['productType']);
    return [ProductType.BullSpread, ProductType.BearSpread, ProductType.DNT]
      .filter(
        (productType) =>
          !ProductsDIYService.getSupportMatrix({
            ...formData,
            chainId,
            productType,
          }).skipCurrentOptionValue,
      )
      .map((productType) => ({
        label: (
          <>
            {ProductTypeRefs[productType].icon1}
            {ProductTypeRefs[productType].label1(t)}
          </>
        ),
        value: productType,
        disabled: options.every(
          (it) => it.data.productType !== productType || it.disabled,
        ),
        data: { productType },
      }));
  }, [chainId, t, formData?.forCcy]);
  return (
    <div className={styles['form-item']}>
      <div className={styles['label']}>
        {t({ enUS: 'Market view?', zhCN: '你的市场观点' })}
      </div>
      <div className={styles['input-wrapper']}>
        <RadioBtnGroup
          options={options}
          value={formData?.productType}
          onChange={(_, it) => useDIYState.updateVaultOptions(chainId, it.data)}
        />
      </div>
    </div>
  );
};

const HowLong = () => {
  const [t] = useTranslation('DIY');
  const chainId = useWalletStore((state) => state.chainId);
  const formData = useDIYState((state) => state.formData[chainId]);
  const config = useDIYConfigState((state) => state.configs[chainId]);
  const [min, max] = useMemo(() => {
    if (!formData) return [next8h(undefined, 2), next8h(undefined, 7)];
    const options = useDIYConfigState.getConfig(
      chainId,
      formData,
      config,
    )?.expiryDateTimes;
    if (!options) return [next8h(undefined, 2), next8h(undefined, 7)];
    return [options[0] * 1000, options[options.length - 1] * 1000];
  }, [chainId, config, formData]);
  const term = Math.floor(
    (Number(formData?.expiry) - Date.now()) / MsIntervals.day,
  );

  const percentage = useMemo(
    () => (formData?.expiry ? (formData.expiry - min) / (max - min) : 0),
    [formData?.expiry, max, min],
  );
  return (
    <div className={styles['form-item']}>
      <div className={styles['label']}>
        {t({ enUS: 'How long?', zhCN: '投多久的期限' })}
      </div>
      <div className={styles['input-wrapper']}>
        <ProgressBar
          key={chainId}
          type="2"
          className={styles['progress']}
          percent={percentage}
          onPercentChange={(p) =>
            useDIYState.updateExpiry(chainId, nearest8h(p * (max - min) + min))
          }
        />
        <span className={styles['value']}>
          {term || '-'}{' '}
          <span className={styles['unit']}>
            {term > 1
              ? t({ enUS: 'Days', zhCN: '天' })
              : t({ enUS: 'Day', zhCN: '天' })}
          </span>
        </span>
      </div>
    </div>
  );
};

const DepositToken = () => {
  const [t] = useTranslation('DIY');
  const chainId = useWalletStore((state) => state.chainId);
  const formData = useDIYState((state) => state.formData[chainId]);
  const options = useMemo(
    () =>
      useDIYState
        .getVaultOptions({ chainId, ...formData }, ['depositCcy'])
        .map((it) => ({
          label: (
            <>
              <img src={CCYService.ccyConfigs[it.data.depositCcy!]?.icon} />
              {it.data.depositCcy}
            </>
          ),
          value: it.key,
          disabled: it.disabled,
          data: it.data,
        })),
    [chainId, formData],
  );
  return (
    <div className={styles['form-item']}>
      <div className={styles['label']}>
        {t({ enUS: 'Deposit token', zhCN: '投资币种' })}
      </div>
      <div className={styles['input-wrapper']}>
        <RadioBtnGroup
          options={options}
          value={formData?.depositCcy}
          onChange={(_, it) => useDIYState.updateVaultOptions(chainId, it.data)}
        />
      </div>
    </div>
  );
};

const RiskTolerance = () => {
  const [t] = useTranslation('DIY');
  const chainId = useWalletStore((state) => state.chainId);
  const formData = useDIYState((state) => state.formData[chainId]);
  const options = useMemo(
    () =>
      useDIYState
        .getVaultOptions({ chainId, ...formData }, ['riskType'])
        .map((it) => ({
          label: <>{RiskTypeRefs[it.data.riskType!].desc(t)}</>,
          value: it.key,
          disabled: it.disabled,
          data: it.data,
        })),
    [chainId, formData, t],
  );
  return (
    <div className={styles['form-item']}>
      <div className={styles['label']}>
        {t({ enUS: 'What is your risk tolerance?', zhCN: '你的风险偏好' })}
      </div>
      <div className={styles['input-wrapper']}>
        <RadioBtnGroup
          options={options}
          value={formData?.riskType}
          onChange={(_, it) => useDIYState.updateVaultOptions(chainId, it.data)}
        />
      </div>
    </div>
  );
};

const ApyTarget = () => {
  const [t] = useTranslation('DIY');
  const chainId = useWalletStore((state) => state.chainId);
  const formData = useDIYState((state) => state.formData[chainId]);
  const [min, ...rest] = useDIYState((state) =>
    useDIYState.getApyList(chainId, state),
  );
  const max = rest[rest.length - 1];
  const [logMin, logMax] = useMemo(
    () => [Math.log(min), Math.log(max)],
    [max, min],
  );

  const percentage = useMemo(() => {
    if (isNullLike(formData?.apyTarget)) return 0;
    const log = Math.log(formData.apyTarget);
    return (log - logMin) / (logMax - logMin);
  }, [formData?.apyTarget, logMax, logMin]);

  const selectedQuote = useDIYState((state) => state.selectedQuote[0]);
  const probabilityDesc = useMemo(() => {
    const rchApy = selectedQuote?.convertedCalculatedInfoByDepositBaseCcy
      ? selectedQuote.convertedCalculatedInfoByDepositBaseCcy.apyInfo?.rch
      : selectedQuote?.apyInfo?.rch;
    if (!formData?.apyTarget || !rchApy) return undefined;
    const low = Math.min(min + (max - min) * 0.2, 0.5 + +rchApy);
    const high = Math.min(min + (max - min) * 0.8, 2 + +rchApy);
    if (formData.apyTarget < low)
      return {
        txt: t({ enUS: 'Good likelihood', zhCN: '大概率' }),
        color: '#49AA19',
      };
    if (formData.apyTarget < high)
      return {
        txt: t({ enUS: 'Neutral', zhCN: '中性概率' }),
        color: '#177DDC',
      };
    return {
      txt: t({ enUS: 'Low likelihood', zhCN: '小概率' }),
      color: '#CD8E8E',
    };
  }, [formData?.apyTarget, max, min, t, selectedQuote]);

  return (
    <div className={styles['form-item']}>
      <div className={styles['label']}>
        {t({ enUS: 'APY target', zhCN: '目标年化收益' })}
        {(selectedQuote?.convertedCalculatedInfoByDepositBaseCcy && (
          <>
            {' '}
            <span className={styles['apy-base-ccy']}>
              ({selectedQuote.vault.depositBaseCcy})
            </span>
          </>
        )) ||
          undefined}
      </div>
      <div className={styles['input-wrapper']}>
        <ProgressBar
          type="2"
          key={chainId}
          className={styles['progress']}
          disabled={!max}
          percent={percentage}
          onPercentChange={(p) =>
            useDIYState.updateApyTarget(
              chainId,
              +Math.exp(p * (logMax - logMin) + logMin).toFixed(2),
            )
          }
        />
        <span className={styles['value']}>
          {displayPercentage(formData?.apyTarget, 0)}{' '}
          <span className={styles['unit']}>
            {t({ enUS: 'APY', zhCN: 'APY' })}
          </span>
        </span>
        <span
          className={styles['badge']}
          style={{ color: probabilityDesc?.color }}
        >
          {probabilityDesc?.txt}
        </span>
      </div>
    </div>
  );
};

const OddsTarget = () => {
  const [t] = useTranslation('DIY');
  const chainId = useWalletStore((state) => state.chainId);
  const formData = useDIYState((state) => state.formData[chainId]);
  const [min, ...rest] = useDIYState((state) =>
    useDIYState.getOddsList(chainId, state),
  );
  const max = rest[rest.length - 1];
  const [logMin, logMax] = useMemo(
    () => [Math.log(min), Math.log(max)],
    [max, min],
  );

  const percentage = useMemo(() => {
    if (isNullLike(formData?.oddsTarget)) return 0;
    const log = Math.log(formData.oddsTarget);
    return (log - logMin) / (logMax - logMin);
  }, [formData?.oddsTarget, logMax, logMin]);

  const rchOdds = useDIYState((state) => state.selectedQuote[0]?.oddsInfo?.rch);
  const probabilityDesc = useMemo(() => {
    if (!formData?.oddsTarget || !rchOdds) return undefined;
    const low = Math.min(min + (max - min) * 0.2, 4 + +rchOdds);
    const high = Math.min(min + (max - min) * 0.8, 10 + +rchOdds);
    if (formData?.oddsTarget < low)
      return {
        txt: t({ enUS: 'Good likelihood', zhCN: '大概率' }),
        color: '#49AA19',
      };
    if (formData?.oddsTarget < high)
      return {
        txt: t({ enUS: 'Neutral', zhCN: '中性概率' }),
        color: '#177DDC',
      };
    return {
      txt: t({ enUS: 'Low likelihood', zhCN: '小概率' }),
      color: '#CD8E8E',
    };
  }, [formData?.oddsTarget, max, min, t, rchOdds]);
  return (
    <div className={styles['form-item']}>
      <div className={styles['label']}>
        {t({ enUS: 'Payout multiplier target', zhCN: '目标赔率' })}
      </div>
      <div className={styles['input-wrapper']}>
        <ProgressBar
          key={chainId}
          type="2"
          className={styles['progress']}
          disabled={!max}
          percent={percentage}
          onPercentChange={(p) =>
            useDIYState.updateMultipleTarget(
              chainId,
              +Math.exp(p * (logMax - logMin) + logMin).toFixed(2),
            )
          }
        />
        <span className={styles['value']}>
          {formData?.oddsTarget ?? '-'}
          {t({ enUS: 'x', zhCN: 'x' })}
        </span>
        <span
          className={styles['badge']}
          style={{ color: probabilityDesc?.color }}
        >
          {probabilityDesc?.txt}
        </span>
      </div>
    </div>
  );
};

export const DIY = () => {
  const [t] = useTranslation('DIY');
  const chainId = useWalletStore((state) => state.chainId);
  useEffect(() => {
    useDIYConfigState.fetchConfig(chainId);
  }, [chainId]);

  const formData = useDIYState((state) => state.formData[chainId]);
  const config = useMemo(
    () => useDIYConfigState.getConfig(chainId, formData || {}),
    [chainId, formData],
  );
  const apyList = useDIYState((state) =>
    useDIYState.getApyList(chainId, state),
  );
  const oddsList = useDIYState((state) =>
    useDIYState.getOddsList(chainId, state),
  );
  useEffect(() => {
    useDIYState.initFormData(chainId, config, apyList, oddsList);
  }, [apyList, chainId, config, oddsList]);

  const riskType = formData?.riskType;
  const isMobileUI = useIsMobileUI();
  const [mobileNextStepBtnClickd, setMobileNextStepBtnClicked] =
    useState(false);

  return (
    <div className={styles['defi-mode-wrapper']}>
      <div className={styles['left']}>
        <BettingOn />
        <MarketView />
        <HowLong />
        <DepositToken />
        {ProductsDIYService.getSupportMatrix({
          ...formData,
          chainId,
        }).skipOption?.includes('riskType') ? (
          <></>
        ) : (
          <RiskTolerance />
        )}
        {riskType === RiskType.RISKY ? <OddsTarget /> : <ApyTarget />}
      </div>
      <MobileOnly display="block">
        <a
          className={classNames(styles['mobile-next-step-btn'])}
          onClick={() => setMobileNextStepBtnClicked(true)}
        >
          {t({ enUS: 'Next Step', zhCN: '下一步' })}
        </a>
      </MobileOnly>
      <div
        className={classNames(styles['right'], {
          [styles['mobile-hide-product-display']]:
            !mobileNextStepBtnClickd && isMobileUI,
        })}
      >
        <MobileOnly>
          <div
            className={styles['mobile-next-step-bg']}
            onClick={() => setMobileNextStepBtnClicked(false)}
          />
        </MobileOnly>
        <DIYProductDisplay />
      </div>
    </div>
  );
};
