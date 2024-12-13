import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Toast } from '@douyinfe/semi-ui';
import { RiskType } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { amountFormatter, displayPercentage } from '@sofa/utils/amount';
import { displayExpiry, MsIntervals } from '@sofa/utils/expiry';
import { getErrorMsg } from '@sofa/utils/fns';
import { simplePlus } from '@sofa/utils/object';
import { useRequest } from 'ahooks';
import classNames from 'classnames';

import AsyncButton from '@/components/AsyncButton';
import {
  ProductTypeRefs,
  RiskTypeRefs,
} from '@/components/ProductSelector/enums';
import { useWalletStore } from '@/components/WalletConnector/store';
import InvestModal, {
  InvestModalPropsRef,
} from '@/pages/products/components/InvestModal';
import {
  handleRecommendCardClick,
  RecommendedCardItem,
} from '@/pages/products/components/RecommendedCard';

import { Comp as IconExpand } from '../../assets/icon-expand.svg';
import { Comp as IconRefresh } from '../../assets/icon-refresh.svg';
import { useDIYState } from '../DIY/store';

import styles from './index.module.scss';

export const DIYProductDisplay = () => {
  const [t] = useTranslation('DIY');
  const navigate = useNavigate();

  const chainId = useWalletStore((state) => state.chainId);
  const formData = useDIYState((state) => state.formData[chainId]);

  const quote = useDIYState((state) => state.selectedQuote[0]);

  useRequest(() => useDIYState.fetchRecommendedList(chainId), {
    refreshDeps: [chainId, formData],
    pollingInterval: 5 * MsIntervals.min,
    debounceWait: 500,
    onError: (err) => Toast.error(`Fetch error: ${getErrorMsg(err)}`),
  });

  const riskRef = quote?.vault.riskType && RiskTypeRefs[quote.vault.riskType];
  const productRef =
    quote?.vault.productType && ProductTypeRefs[quote.vault.productType];
  const anchorPrices = quote?.anchorPrices;
  const term = useMemo(
    () =>
      quote?.expiry &&
      Math.floor(
        (quote.expiry * 1000 - quote.timestamp * 1000) / MsIntervals.day,
      ),
    [quote?.expiry, quote?.timestamp],
  );

  const investModalRef = useRef<InvestModalPropsRef>(null);

  const [expanded, setExpanded] = useState(false);

  return (
    <Spin
      wrapperClassName={classNames(styles['diy-product'], {
        [styles['expanded']]: expanded,
      })}
      spinning={!quote}
    >
      <div className={styles['title']}>
        <span>{t({ enUS: 'Optimizer', zhCN: '产品' })}</span>
        <span
          className={styles['apy']}
          onClick={() => setExpanded((pre) => !pre)}
        >
          {displayPercentage(
            simplePlus(quote?.apyInfo?.rch, quote?.apyInfo?.max),
          )}
          <IconExpand className={styles['icon-expand']} />
        </span>
      </div>
      <div className={styles['risk-type']}>
        {riskRef?.icon}
        {riskRef?.label3(t) || '-'}
        {riskRef?.value === RiskType.LEVERAGE && (
          <span className={styles['badge-leverage']}>Lev.</span>
        )}
      </div>
      <div className={styles['product']}>
        {productRef?.label(t)}{' '}
        {quote?.expiry && displayExpiry(quote.expiry * 1000)}{' '}
        {anchorPrices?.join('-') || '-'}
        <span className={styles['badge']}>
          {term || '-'}{' '}
          {term && term > 1
            ? t({ enUS: 'Days', zhCN: '天' })
            : t({ enUS: 'Day', zhCN: '天' })}
        </span>
      </div>
      <div className={styles['charts']}>
        {quote && (
          <RecommendedCardItem
            it={quote}
            className={styles['quote-infos']}
            hideTerm
            noHover
            extraPayoffProps={{ displayRchYield: true }}
          />
        )}
      </div>
      <div className={styles['btn-wrapper']}>
        <AsyncButton
          onClick={async () => {
            if (quote)
              await handleRecommendCardClick(investModalRef, quote, navigate);
          }}
        >
          {t({ enUS: 'BUY', zhCN: '买' })}
        </AsyncButton>
        <AsyncButton onClick={() => useDIYState.selectQuote(chainId)}>
          <IconRefresh />
          {t({ enUS: 'Re-Generate', zhCN: '重新推荐' })}
        </AsyncButton>
        {quote && <InvestModal ref={investModalRef} product={quote} />}
      </div>
    </Spin>
  );
};
