import { useEffect, useMemo } from 'react';
import { ProductType, RiskType } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { useTranslation } from '@sofa/services/i18n';
import { displayPercentage } from '@sofa/utils/amount';
import { MsIntervals, nearest8h, next8h } from '@sofa/utils/expiry';
import Big from 'big.js';

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
        })),
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
    return [
      ProductType.BullSpread,
      ProductType.BearSpread,
      ProductType.DNT,
    ].map((productType) => ({
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
  }, [chainId, t]);
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
    const options = useDIYConfigState.getConfig(chainId, formData, config)
      ?.expiryDateTimes;
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
        {term || '-'}{' '}
        {term > 1
          ? t({ enUS: 'Days', zhCN: '天' })
          : t({ enUS: 'Day', zhCN: '天' })}
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
  const config = useDIYConfigState((state) => state.configs[chainId]);
  const [min, ...rest] = useMemo(() => {
    if (!formData) return [0, 1];
    return (
      useDIYConfigState
        .getConfig(chainId, formData, config)
        ?.apyPercentages?.map((it) => +Big(it).div(100)) || [0, 1]
    );
  }, [chainId, config, formData]);
  const middle = rest.slice(0, rest.length - 1);
  const max = rest[rest.length - 1];

  const percentage = useMemo(
    () => (formData?.apyTarget ? (formData.apyTarget - min) / (max - min) : 0),
    [formData?.apyTarget, max, min],
  );
  const probabilityDesc = useMemo(() => {
    if (!formData?.apyTarget) return undefined;
    if (formData?.apyTarget < 0.15)
      return t({ enUS: 'Good likelihood', zhCN: '大概率' });
    if (formData?.apyTarget < 0.5)
      return t({ enUS: 'Neutral', zhCN: '中性概率' });
    return t({ enUS: 'Low likelihood', zhCN: '小概率' });
  }, [formData?.apyTarget, t]);
  return (
    <div className={styles['form-item']}>
      <div className={styles['label']}>
        {t({ enUS: 'APY target', zhCN: '目标年化收益' })}
      </div>
      <div className={styles['input-wrapper']}>
        <ProgressBar
          type="2"
          key={chainId}
          className={styles['progress']}
          percent={percentage}
          onPercentChange={(p) =>
            useDIYState.updateApyTarget(
              chainId,
              Math.round((p * (max - min) + min) * 100) / 100,
            )
          }
        />
        {displayPercentage(formData?.apyTarget)}{' '}
        {t({ enUS: 'APY', zhCN: 'APY' })}
        <span className={styles['badge']}>{probabilityDesc}</span>
      </div>
    </div>
  );
};

const MultiplierTarget = () => {
  const [t] = useTranslation('DIY');
  const chainId = useWalletStore((state) => state.chainId);
  const formData = useDIYState((state) => state.formData[chainId]);
  const config = useDIYConfigState((state) => state.configs[chainId]);
  const [min, ...rest] = useMemo(() => {
    if (!formData) return [0, 10];
    return (
      useDIYConfigState.getConfig(chainId, formData, config)
        ?.payoutMultiples || [0, 10]
    );
  }, [chainId, config, formData]);
  const middle = rest.slice(0, rest.length - 1);
  const max = rest[rest.length - 1];

  const percentage = useMemo(
    () =>
      formData?.multiplierTarget
        ? (formData.multiplierTarget - min) / (max - min)
        : 0,
    [formData?.multiplierTarget, max, min],
  );
  const probabilityDesc = useMemo(() => {
    if (!formData?.multiplierTarget) return undefined;
    if (formData?.multiplierTarget < 1.5)
      return t({ enUS: 'Good likelihood', zhCN: '大概率' });
    if (formData?.multiplierTarget < 3)
      return t({ enUS: 'Neutral', zhCN: '中性概率' });
    return t({ enUS: 'Low likelihood', zhCN: '小概率' });
  }, [formData?.multiplierTarget, t]);
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
          percent={percentage}
          onPercentChange={(p) =>
            useDIYState.updateMultipleTarget(
              chainId,
              Math.round(p * (max - min) + min),
            )
          }
        />
        {formData?.multiplierTarget ?? '-'}
        {t({ enUS: 'x', zhCN: 'x' })}
        <span className={styles['badge']}>{probabilityDesc}</span>
      </div>
    </div>
  );
};

export const DIY = () => {
  const chainId = useWalletStore((state) => state.chainId);

  useEffect(() => {
    useDIYConfigState.fetchConfig(chainId);
    useDIYState.initFormData(chainId);
  }, [chainId]);

  const formData = useDIYState((state) => state.formData[chainId]);

  const riskType = formData?.riskType;
  return (
    <div className={styles['defi-mode-wrapper']}>
      <div className={styles['left']}>
        <BettingOn />
        <MarketView />
        <HowLong />
        <DepositToken />
        <RiskTolerance />
        {riskType === RiskType.RISKY ? <MultiplierTarget /> : <ApyTarget />}
      </div>
      <div className={styles['right']}>
        <DIYProductDisplay />
      </div>
    </div>
  );
};
