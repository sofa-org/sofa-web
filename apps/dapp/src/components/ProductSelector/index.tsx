import { SetStateAction, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Radio, RadioGroup } from '@douyinfe/semi-ui';
import {
  ProductType,
  ProjectType,
  RiskType,
  VaultInfo,
} from '@sofa/services/base-type';
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
  const location = useLocation();
  const $val = useQuery((q) => q.project as string | null);
  const val = location.pathname.includes('automator')
    ? ProjectType.Automator
    : $val || defaultVal;

  useEffect(() => {
    if (/products|positions|transactions/.test(location.pathname)) {
      updateQuery({
        project:
          location.pathname.includes('automator') &&
          val === ProjectType.Automator
            ? undefined
            : val,
      });
    }
  }, [location.pathname, val]);

  const project = useMemo(() => {
    if (ProjectType[val as ProjectType]) return val as ProjectType;

    // 兼容旧的 riskType 类型：PROTECTED -> Earn; LEVERAGE -> Earn
    if (val === RiskType.PROTECTED) return ProjectType.Earn;
    if (val === RiskType.LEVERAGE) return ProjectType.Earn;
    // 兼容旧的 riskType 类型：RISKY -> Surge
    if (val === RiskType.RISKY) return ProjectType.Surge;
    if (val == RiskType.DUAL) return ProjectType.Dual;

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
      updateQuery({ project: nextProject });
    },
  );
  return [project, setProject] as const;
}

export function useProductSelect(params?: {
  acceptance?: ProductType[] | ((productType: ProductType) => boolean);
  default?: ProductType;
}) {
  const val = useQuery()['product-type'];
  const accept = useLazyCallback((productType: ProductType) => {
    if (!params?.acceptance) {
      return ProductType[val as ProductType];
    }
    if (typeof params.acceptance == 'function') {
      return params.acceptance(productType);
    }
    return params.acceptance.includes(productType);
  });
  const productType = useMemo(() => {
    if (accept(val as ProductType)) return val as ProductType;
    return params?.default || ProductType.BullSpread;
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
    () =>
      project == ProjectType.Dual
        ? RiskType.DUAL
        : [ProjectType.Surge, ProjectType.Automator].includes(project)
          ? RiskType.RISKY
          : RiskType.PROTECTED,
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
    dark?: boolean;
    localState?: ReturnType<typeof useProductSelect>;
    useRadioCard?: boolean;
    radioClassName?: string;
    optionFilter?: (t: ProductType) => boolean;
    optionDisabled?: (v: ProductType) => boolean;
    label?: (
      v: (typeof ProductTypeRefs)[ProductType],
    ) => JSX.Element[] | JSX.Element | string;
  },
) => {
  const [t] = useTranslation('ProjectProductSelector');
  const chainId = useWalletStore((state) => state.chainId);
  const globalState = useProductSelect();
  const [product, setProduct] = props.localState || globalState;
  const options = useMemo(() => {
    const vaults = ContractsService.vaults.filter(
      (it) => it.chainId === chainId && !it.tradeDisable,
    );
    const productTypes = uniq(vaults.map((it) => it.productType));
    return Object.values(ProductTypeRefs)
      .filter(
        (it) =>
          productTypes.includes(it.value) &&
          (!props.optionFilter || props.optionFilter(it.value)),
      )
      .map((it) => ({
        label: props.label ? (
          props.label(it)
        ) : (
          <span className={classNames(styles['product-item'], 'product-item')}>
            {it.img}
            {it.label(t)}
          </span>
        ),
        value: it.value,
        disabled: props.optionDisabled
          ? props.optionDisabled(it.value)
          : undefined,
      }));
  }, [chainId, t, props.optionDisabled, props.optionFilter]);

  useEffect(() => {
    if (options.length && !options.some((it) => it.value === product)) {
      setProduct(options[0].value);
    }
  }, [options, product, setProduct]);
  if (props.useRadioCard) {
    return (
      <>
        <RadioGroup
          type="pureCard"
          value={product}
          direction="horizontal"
          onChange={(v) => setProduct(v.target.value as ProductType)}
        >
          {options.map((o) => (
            <Radio key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </Radio>
          ))}
        </RadioGroup>
      </>
    );
  }

  return (
    <CSelect
      prefix={t('Product')}
      className={classNames(
        styles['product-type-selector'],
        { [styles['dark']]: props.dark },
        props.className,
      )}
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
