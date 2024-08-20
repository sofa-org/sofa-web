import { ProductType, RiskType } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';

import { ProductTypeRefs } from '@/components/ProductSelector/enums';

import styles from './index.module.scss';

export const QuoteExplain = (props: {
  riskType: RiskType;
  productType: ProductType;
}) => {
  const [t] = useTranslation('QuoteExplain');
  const ref = ProductTypeRefs[props.productType];
  return (
    <div
      className={styles['quote-explain']}
      dangerouslySetInnerHTML={{
        __html: ref?.quoteExplain(t, props.riskType),
      }}
    />
  );
};
