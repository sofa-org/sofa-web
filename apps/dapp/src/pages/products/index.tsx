import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ProjectType } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { ContractsService, VaultInfo } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import { ProductsService, ProductType } from '@sofa/services/products';
import { joinUrl } from '@sofa/utils/url';
import classNames from 'classnames';
import { color } from 'echarts/core';

import CEmpty from '@/components/Empty';
import {
  useProductSelect,
  useProjectChange,
  useRiskSelect,
} from '@/components/ProductSelector';
import {
  ProductTypeRefs,
  ProjectTypeRefs,
} from '@/components/ProductSelector/enums';
import TopTabs from '@/components/TopTabs';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';

import { ProductsFixedNav } from './components/FixedNav';
import { FlowEarn } from './components/FlowEarn';
import { FlowSurge } from './components/FlowSurge';
import RecommendedCard from './components/RecommendedCard';
import { Automator } from './automator';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'Products');

const Index = () => {
  const [t] = useTranslation('Products');

  const chainId = useWalletStore((state) => state.chainId);
  const [project] = useProjectChange();
  const [riskType] = useRiskSelect(project);
  const [productType, setProductType] = useProductSelect();
  const tabs = useMemo(
    () =>
      Object.values(ProductTypeRefs)
        .map((it) => ({
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
        }))
        .filter((it) =>
          ProductsService.findVault(ContractsService.vaults, {
            chainId,
            riskType,
            productType: it.value,
          }),
        ),
    [chainId, riskType, t],
  );
  useEffect(() => {
    if (tabs.every((it) => it.value !== productType)) {
      setProductType(tabs[0]?.value);
    }
  }, [productType, setProductType, tabs]);

  const depositCcyList = useMemo(() => {
    const vaults = ProductsService.filterVaults(ContractsService.vaults, {
      chainId,
      riskType,
      productType: productType,
    });
    return vaults.reduce(
      (pre, it) => {
        if (!pre.includes(it.depositCcy)) pre.push(it.depositCcy);
        return pre;
      },
      [] as VaultInfo['depositCcy'][],
    );
  }, [chainId, riskType, productType]);

  return (
    <TopTabs
      type={'banner-expandable'}
      banner={project === ProjectType.Earn ? <FlowEarn /> : <FlowSurge />}
      options={tabs}
      value={productType}
      dark
      onChange={(v) => setProductType(v as ProductType)}
      prefix={t('Product')}
      extraTopContent={
        <>
          <div
            id="global-tips-container"
            className={styles['global-tips-container']}
          />
          {depositCcyList.length > 0 && (
            <div className={styles['title']}>
              {ProjectTypeRefs[project].icon}
              {t('Choose Your Product')}
            </div>
          )}
        </>
      }
      sticky
    >
      <ProductsFixedNav depositCcyList={depositCcyList} />
      {depositCcyList.length < 1 && (
        <CEmpty
          className="semi-always-dark"
          description={t({
            enUS: 'There are no supported vaults on this chain. Please switch to another chain.',
            zhCN: '这条链上没有支持的合约，请切换到其它的链',
          })}
        />
      )}
      {depositCcyList.map((ccy) => {
        const config = CCYService.ccyConfigs[ccy];
        const ticketMeta = ProductsService.TicketTypeOptions.find(
          (it) => it.value === ccy,
        );
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
            <div className={styles['section-title']}>
              <div className={styles['left']}>
                <span className={styles['ccy']} id={`recommend-${ccy}`}>
                  {t('Deposit')} <span className={styles['bold']}>{ccy}</span>
                </span>
                <div className={styles['icon']}>
                  <img
                    className={ccy.toLowerCase()}
                    src={config?.icon}
                    alt=""
                  />{' '}
                </div>
                {project === ProjectType.Surge && ticketMeta && (
                  <div className={styles['per-ticket']}>
                    <span
                      className={classNames('txt-gradient', styles['amount'])}
                    >
                      {ticketMeta.per} {ticketMeta.ccy}
                    </span>
                    {t('Per Ticket')}
                  </div>
                )}
              </div>
              <div className={styles['customize']}>
                <Link
                  className={styles['btn-link']}
                  to={joinUrl(
                    `/products/customize`,
                    window.location.search,
                    `?deposit-ccy=${ccy}&product-type=${productType}&expanded=`,
                  )}
                >
                  <span className="txt-gradient">
                    {t('CUSTOMIZE')}&nbsp;&nbsp;{'>'}
                  </span>
                </Link>
              </div>
            </div>
            <div className={styles['recommended-list']}>
              <RecommendedCard forCcy="BTC" depositCcy={ccy} />
              <RecommendedCard forCcy="ETH" depositCcy={ccy} />
            </div>
          </div>
        );
      })}
    </TopTabs>
  );
};

const Comp = () => {
  const [project] = useProjectChange();
  return project === ProjectType.Automator ? <Automator /> : <Index />;
};
export default Comp;
