import { Dispatch, ReactNode, useState } from 'react';
import { useTranslation } from '@sofa/services/i18n';
import { ProductQuoteResult } from '@sofa/services/products';
import classNames from 'classnames';

import { addI18nResources } from '@/locales';

import ProductDesc from '../ProductDesc';

import { Comp as IconArrow } from './assets/icon-arrow.svg';
import locale from './locale';

import styles from './ModalWrapper.module.scss';

addI18nResources(locale, 'InvestModal');

export const ModalWrapper = (props: {
  children: ReactNode;
  setVisible: Dispatch<boolean>;
  product: PartialRequired<ProductQuoteResult, 'vault'>;
}) => {
  const [t] = useTranslation('InvestModal');

  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className={styles['form']}>
        {props.children}
        <div
          className={classNames(styles['expand-widget'], {
            [styles['expanded']]: expanded,
          })}
          onClick={() => setExpanded((pre) => !pre)}
        >
          {t('details')} <IconArrow />
        </div>
      </div>
      {expanded && <ProductDesc product={props.product} />}
    </>
  );
};
