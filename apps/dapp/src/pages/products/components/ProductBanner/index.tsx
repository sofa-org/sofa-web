import { ReactNode } from 'react';
import { Carousel } from '@douyinfe/semi-ui';
import { useTranslation } from '@sofa/services/i18n';
import { ProductType, RiskType } from '@sofa/services/products';
import classNames from 'classnames';

import { useProjectChange, useRiskSelect } from '@/components/ProductSelector';
import {
  ProductTypeRefs,
  ProjectTypeRefs,
} from '@/components/ProductSelector/enums';
import { addI18nResources } from '@/locales';

import img1 from './assets/img1.gif';
import img2 from './assets/img2.gif';
import img3 from './assets/img3.gif';
import img4 from './assets/img4.png';
import img5 from './assets/img5.gif';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'ProductBanner');

export interface ProductBriefProps {
  protectedReturnApy?: number;
  productType: ProductType;
  riskType: RiskType;
}

const ProductBanner = (props: { title: ReactNode }) => {
  const [project] = useProjectChange();
  const [riskType] = useRiskSelect(project);
  return (
    <div
      className={classNames(styles['product-banner-wrapper'], {
        [styles['risky']]: riskType === RiskType.RISKY,
      })}
    >
      <div className={styles['content']}>{props.title}</div>
    </div>
  );
};

export const ProductBrief = (props: ProductBriefProps) => {
  const [t] = useTranslation('ProductBanner');
  const [project] = useProjectChange();
  const ref = ProductTypeRefs[props.productType];
  return (
    <div className={styles['product-brief']}>
      <div className={styles['left']}>
        <h2
          className={styles['title']}
          dangerouslySetInnerHTML={{
            __html: t("WHAT IS<br/>{{project}}'s {{product}}", {
              project: ProjectTypeRefs[project].label(t),
              product: ref.label(t),
            }),
          }}
        />
        <p
          className={styles['desc']}
          dangerouslySetInnerHTML={{
            __html: ref.extraDesc(t),
          }}
        />
      </div>
      <div className={styles['right']}>
        <Carousel
          className={styles['carousel']}
          indicatorType="line"
          indicatorPosition="center"
          speed={500}
          autoPlay={{ interval: 5000 }}
          showArrow={false}
          theme="dark"
        >
          {props.productType === ProductType.DNT && <img src={img1} alt="" />}
          {props.productType === ProductType.DNT && <img src={img2} alt="" />}
          {props.productType === ProductType.DNT && <img src={img3} alt="" />}
          {/* <img src={img4} alt="" /> */}
          <img src={img5} alt="" />
        </Carousel>
      </div>
    </div>
  );
};

export default ProductBanner;
