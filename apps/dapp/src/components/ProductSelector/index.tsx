import { ReactNode, SetStateAction, useMemo } from 'react';
import { ProductType, RiskType } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { Env } from '@sofa/utils/env';
import { calcVal } from '@sofa/utils/fns';
import { updateQuery } from '@sofa/utils/history';
import { useLazyCallback, useQuery } from '@sofa/utils/hooks';
import classNames from 'classnames';

import { Comp as Logo } from '@/assets/logo';
import { addI18nResources } from '@/locales';

import { CSelect } from '../CSelect';

import { ProductTypeRefs, RiskTypeRefs } from './enums';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'ProjectProductSelector');

export interface ProductSelectorProps extends BaseProps {
  renderValue?(
    value: { riskType: RiskType; productType: ProductType },
    riskRef: (typeof RiskTypeRefs)[RiskType],
    productRef: (typeof ProductTypeRefs)[ProductType],
  ): ReactNode;
  dropdownClassName?: string;
}

export function useProjectChange() {
  const query = useQuery();
  const project = useMemo(() => {
    const project = Object.values(RiskTypeRefs).find((it) => {
      if (Env.isDev) return false;
      return (
        it.link.match(/(https?:\/\/[^/?#]*)/)?.[1] === window.location.origin
      );
    });
    if (project) return project.value;
    return (query.project as RiskType) || RiskType.PROTECTED;
  }, [query.project]);
  const setProject = useLazyCallback(
    (action: SetStateAction<RiskType | undefined>) => {
      const nextProject = calcVal(action, project) || RiskType.PROTECTED;
      const link = RiskTypeRefs[nextProject].link;
      window.location.href = link;
    },
  );
  return [project, setProject] as const;
}

export function useProductSelect() {
  const query = useQuery();
  const productType = (query['product-type'] as ProductType) || ProductType.DNT;
  const setProductType = useLazyCallback(
    (action: SetStateAction<ProductType>) => {
      const nextProductType = calcVal(action, productType);
      updateQuery({ 'product-type': nextProductType });
    },
  );
  return [productType, setProductType] as const;
}

export const ProjectSelector = (props: ProductSelectorProps) => {
  const [t] = useTranslation('ProjectProductSelector');
  const [project, setProject] = useProjectChange();
  const options = useMemo(() => {
    return Object.values(RiskTypeRefs)
      .filter((it) => it.value !== RiskType.LEVERAGE)
      .map((it) => ({
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
      value={project === RiskType.RISKY ? RiskType.RISKY : RiskType.PROTECTED}
      onSelect={(v) => setProject(v as RiskType)}
      renderSelectedItem={(v: Record<string, unknown>) => (
        <>
          <Logo
            className={styles['logo']}
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = import.meta.env.VITE_SOFA_LINK;
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
  const [product, setProduct] = useProductSelect();
  const options = useMemo(() => {
    return Object.values(ProductTypeRefs).map((it) => ({
      label: (
        <span className={classNames(styles['product-item'], 'product-item')}>
          {it.img}
          {it.label(t)}
        </span>
      ),
      value: it.value,
    }));
  }, [t]);
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
