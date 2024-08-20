import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CCYService } from '@sofa/services/ccy';
import { ContractsService, VaultInfo } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import {
  ProductsService,
  ProductType,
  RiskType,
} from '@sofa/services/products';
import { joinUrl } from '@sofa/utils/url';
import { color } from 'echarts/core';

import {
  useProductSelect,
  useProjectChange,
} from '@/components/ProductSelector';
import {
  ProductTypeRefs,
  RiskTypeRefs,
} from '@/components/ProductSelector/enums';
import TopTabs from '@/components/TopTabs';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';

import { ProductsFixedNav } from './components/FixedNav';
import { FlowEarn } from './components/FlowEarn';
import { FlowSurge } from './components/FlowSurge';
import RecommendedCard from './components/RecommendedCard';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'Products');

const Index = () => {
  const [t] = useTranslation('Products');

  const chainId = useWalletStore((state) => state.chainId);
  const [project] = useProjectChange();
  const [productType, setProductType] = useProductSelect();
  const tabs = useMemo(
    () =>
      Object.values(ProductTypeRefs).map((it) => ({
        label: (
          <div className={styles['product-type']}>
            {it.img}
            <span>{it.label(t)}</span>
            <span className={styles['tag']} style={it.tagStyle}>
              {it.tag}
            </span>
          </div>
        ),
        value: it.value,
      })),
    [t],
  );

  const depositCcyList = useMemo(() => {
    const vaults = ProductsService.filterVaults(ContractsService.vaults, {
      chainId,
      riskType: project,
      productType: productType,
    });
    return vaults.reduce(
      (pre, it) => {
        if (!pre.includes(it.depositCcy)) pre.push(it.depositCcy);
        return pre;
      },
      [] as VaultInfo['depositCcy'][],
    );
  }, [chainId, project, productType]);

  return (
    <TopTabs
      type={'banner-expandable'}
      banner={project !== RiskType.RISKY ? <FlowEarn /> : <FlowSurge />}
      options={tabs}
      value={productType}
      dark
      onChange={(v) => setProductType(v as ProductType)}
      prefix={t('Product')}
      extraTopContent={
        <div className={styles['title']}>
          {RiskTypeRefs[project].icon}
          {t('Choose Your Product')}
        </div>
      }
    >
      <ProductsFixedNav depositCcyList={depositCcyList} />
      {depositCcyList.map((ccy) => {
        const config = CCYService.ccyConfigs[ccy];
        return (
          <div
            className={styles['recommend-section']}
            style={
              config &&
              ({
                background: `linear-gradient(
                  to bottom,#0000 5%,
                  ${color.modifyAlpha(config.color, 0.04)} 10%,
                  ${color.modifyAlpha(config.color, 0.3)} 30%,
                  ${color.modifyAlpha(config.color, 0.3)} 60%,
                  #000
                )`,
                '--color-line': config.color,
              } as never)
            }
            key={ccy}
          >
            {depositCcyList.length > 1 && (
              <div className={styles['section-title']}>
                <span style={{ color: config?.color }} id={`recommend-${ccy}`}>
                  {t('Deposit')} {ccy}
                </span>
                <div className={styles['icon']}>
                  <svg
                    width="106"
                    height="36"
                    viewBox="0 0 106 36"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M32.1218 25.7863C42.8075 39.2028 63.1925 39.2028 73.8782 25.7863C78.9802 19.3803 85.2179 13.9683 92.2795 9.82075L104.47 2.66068C105.726 1.92324 105.203 0 103.746 0H2.25358C0.797483 0 0.274451 1.92324 1.53 2.66068L13.7205 9.82074C20.782 13.9683 27.0198 19.3803 32.1218 25.7863Z"
                      fill={config?.color}
                    />
                  </svg>
                  <img
                    className={ccy.toLowerCase()}
                    src={config?.icon}
                    alt=""
                  />{' '}
                </div>
              </div>
            )}
            <div className={styles['recommended-list']}>
              <RecommendedCard forCcy="BTC" depositCcy={ccy} />
              <RecommendedCard forCcy="ETH" depositCcy={ccy} />
            </div>
          </div>
        );
      })}

      <div className={styles['customize']}>
        <Link
          className={styles['btn-link']}
          to={joinUrl(
            `/products/customize`,
            window.location.search,
            '?expanded=',
          )}
        >
          <span className="txt-gradient">{t('CUSTOMIZE')}</span>
        </Link>
      </div>
    </TopTabs>
  );
};

export default Index;
