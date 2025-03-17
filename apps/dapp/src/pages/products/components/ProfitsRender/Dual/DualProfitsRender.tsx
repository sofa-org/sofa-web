import { useMemo } from 'react';
import { ProductQuoteResult } from '@sofa/services/products';

import { addI18nResources } from '@/locales';

import {
  DualProfitScenarios,
  getDualProfitRenderProps,
} from '../../ProjectedReturns/Dual/DualProjectReturns';
import locale from '../locale';
addI18nResources(locale, 'ProfitsRenders');

export const DualProfitsRender = (
  props: BaseProps & {
    data: ProductQuoteResult;
    baseCcy?: CCY | USDS;
  },
) => {
  const data = props.data;

  const profitsProps = useMemo(() => getDualProfitRenderProps(data), [data]);
  if (!profitsProps) {
    return <></>;
  }
  return (
    <>
      <DualProfitScenarios {...profitsProps} />
    </>
  );
};
