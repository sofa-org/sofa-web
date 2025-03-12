import { useMemo } from 'react';
import { ProductType } from '@sofa/services/base-type';
import { ProductQuoteResult } from '@sofa/services/products';

import { addI18nResources } from '@/locales';

import {
  DualProfitRenderProps,
  DualProfitScenarios,
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

  const profitsProps = useMemo(() => {
    if (!data || !data.amounts) {
      return undefined;
    }
    const res = {
      productType: data.vault.productType,
    } as DualProfitRenderProps;
    if (data.vault.productType == ProductType.BullSpread) {
      res.forCcy = data.vault.forCcy;
      // TODO:
      res.forCcyAmountWhenSuccessfulExecuted = 1000;
      res.forCcyExtraRewardWhenSuccessfulExecuted = 100;
      res.depositCcy = data.vault.depositCcy;
      res.depositAmount = Number(data.amounts.own || 0);
      res.depositCcyExtraRewardWhenNoExecuted = 100;
      res.rchReturnAmount = Number(data.amounts.rchAirdrop || 0);
    } else {
      res.forCcy = data.vault.domCcy;
      // TODO
      res.forCcyAmountWhenSuccessfulExecuted = 1000;
      res.forCcyExtraRewardWhenSuccessfulExecuted = 100;
      res.depositCcy = data.vault.forCcy;
      res.depositAmount = Number(data.amounts.own || 0);
      res.depositCcyExtraRewardWhenNoExecuted = 100;
      res.rchReturnAmount = Number(data.amounts.rchAirdrop || 0);
    }
    return res;
  }, [data]);
  if (!profitsProps) {
    return <></>;
  }
  return (
    <>
      <DualProfitScenarios {...profitsProps} />
    </>
  );
};
