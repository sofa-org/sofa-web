import { SetStateAction, useEffect, useMemo } from 'react';
import { ProductType, ProjectType, RiskType } from '@sofa/services/base-type';
import { ContractsService } from '@sofa/services/contracts.ts';
import { useTranslation } from '@sofa/services/i18n';
import { Env } from '@sofa/utils/env';
import { calcVal } from '@sofa/utils/fns';
import { updateQuery } from '@sofa/utils/history';
import { useLazyCallback, useQuery } from '@sofa/utils/hooks';
import classNames from 'classnames';
import { uniq } from 'lodash-es';

import { Comp as Logo } from '@/assets/logo';
import { useWalletStore } from '@/components/WalletConnector/store.ts';
import { EnvLinks } from '@/env-links';
import { addI18nResources } from '@/locales';

import { CSelect } from '../CSelect';

import { ProductTypeRefs, ProjectTypeRefs } from './enums';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'ProjectProductSelector');

export interface ProductSelectorProps extends BaseProps {
  dropdownClassName?: string;
}

export function useProjectChange(defaultVal = ProjectType.Earn) {
  const val = useQuery().project;
  const project = useMemo(() => {
    if (ProjectType[val as ProjectType]) return val as ProjectType;

    // 兼容旧的 riskType 类型：PROTECTED -> Earn; LEVERAGE -> Earn
    if (val === RiskType.PROTECTED) return ProjectType.Earn;
    if (val === RiskType.LEVERAGE) return ProjectType.Earn;
    // 兼容旧的 riskType 类型：RISKY -> Surge
    if (val === RiskType.RISKY) return ProjectType.Surge;

    const project = Object.values(ProjectTypeRefs).find((it) => {
      if (Env.isDev) return false;
      return (
        it.link.match(/(https?:\/\/[^/?#]*)/)?.[1] === window.location.origin
      );
    });
    return project?.value || defaultVal;
  }, [defaultVal, val]);
  const setProject = useLazyCallback(
    (action: SetStateAction<ProjectType | undefined>) => {
      const nextProject = calcVal(action, project) || defaultVal;
      const link = ProjectTypeRefs[nextProject].link;
      window.location.href = link;
    },
  );
  return [project, setProject] as const;
}

export function useProductSelect() {
  const val = useQuery()['product-type'];
  const productType = useMemo(() => {
    if (ProductType[val as ProductType]) return val as ProductType;
    return ProductType.BullSpread;
  }, [val]);
  const setProductType = useLazyCallback(
    (action: SetStateAction<ProductType>) => {
      const nextProductType = calcVal(action, productType);
      updateQuery({ 'product-type': nextProductType });
    },
  );
  return [productType, setProductType] as const;
}

export function useRiskSelect(project: ProjectType) {
  const defaultVal = useMemo(
    () => (project === ProjectType.Surge ? RiskType.RISKY : RiskType.PROTECTED),
    [project],
  );
  const val = useQuery()['risk-type'];
  const riskType = useMemo(() => {
    if (RiskType[val as RiskType]) return val as RiskType;
    return defaultVal;
  }, [defaultVal, val]);
  const setRiskType = useLazyCallback((action: SetStateAction<RiskType>) => {
    const nextRiskType = calcVal(action, riskType);
    updateQuery({ 'risk-type': nextRiskType });
  });
  return [riskType, setRiskType] as const;
}

export const ProjectSelector = (props: ProductSelectorProps) => {
  const [t] = useTranslation('ProjectProductSelector');
  const [project, setProject] = useProjectChange();
  const options = useMemo(() => {
    return Object.values(ProjectTypeRefs).map((it) => ({
      label: (
        <span className={styles['risk-item']} style={{ gap: 12 }}>
          {it.icon}
          {it.label(t)}
        </span>
      ),
      value: it.value,
    }));
  }, [t]);
  return (
    <CSelect
      className={classNames(styles['product-selector'], props.className)}
      style={props.style}
      dropdownClassName={classNames(
        styles['product-dropdown'],
        props.dropdownClassName,
      )}
      optionList={options}
      value={project}
      onSelect={(v) => setProject(v as ProjectType)}
      renderSelectedItem={(v: Record<string, unknown>) => (
        <>
          <Logo
            className={styles['logo']}
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = EnvLinks.config.VITE_SOFA_LINK;
            }}
          />
          {v.label}
        </>
      )}
    />
  );
};

export const ProductTypeSelector = (
  props: BaseProps & {
    dropdownClassName?: string;
  },
) => {
  const [t] = useTranslation('ProjectProductSelector');
  const chainId = useWalletStore((state) => state.chainId);
  const [product, setProduct] = useProductSelect();
  const options = useMemo(() => {
    const vaults = ContractsService.vaults.filter(
      (it) => it.chainId === chainId && !it.tradeDisable,
    );
    const productTypes = uniq(vaults.map((it) => it.productType));
    return Object.values(ProductTypeRefs)
      .filter((it) => productTypes.includes(it.value))
      .map((it) => ({
        label: (
          <span className={classNames(styles['product-item'], 'product-item')}>
            {it.img}
            {it.label(t)}
          </span>
        ),
        value: it.value,
      }));
  }, [chainId, t]);

  useEffect(() => {
    if (options.length && !options.some((it) => it.value === product)) {
      setProduct(options[0].value);
    }
  }, [options, product, setProduct]);

  return (
    <CSelect
      prefix={t('Product')}
      className={classNames(styles['product-type-selector'], props.className)}
      dropdownClassName={classNames(
        styles['product-type-dropdown'],
        props.dropdownClassName,
      )}
      style={props.style}
      optionList={options}
      value={product}
      onChange={(v) => setProduct(v as ProductType)}
    />
  );
};
