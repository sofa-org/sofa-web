import { useMemo } from 'react';
import { getDualProfitRenderProps } from '@sofa/services/dual';
import { PositionInfo } from '@sofa/services/positions';
import { ProductQuoteResult, VaultInfo } from '@sofa/services/products';

import { addI18nResources } from '@/locales';

import { DualProfitScenarios } from '../../ProjectedReturns/Dual/DualProjectReturns';
import locale from '../locale';
addI18nResources(locale, 'ProfitsRenders');

export const DualProfitsRender = (
  props: BaseProps & {
    data:
      | ProductQuoteResult
      | (PositionInfo & {
          vault: VaultInfo;
        });
    baseCcy?: CCY | USDS;
    scenario: 'quote' | 'position';
  },
) => {
  const data = props.data;

  const profitsProps = useMemo(() => getDualProfitRenderProps(data), [data]);
  if (!profitsProps) {
    return <></>;
  }
  return (
    <>
      <DualProfitScenarios {...profitsProps} scenario={props.scenario} />
    </>
  );
};
