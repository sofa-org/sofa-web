import { PositionInfo } from '@sofa/services/positions';
import { amountFormatter } from '@sofa/utils/amount';

import { Comp as ImgWin } from './assets/img1.svg';
import { Comp as ImgLose } from './assets/img2.svg';

import styles from './index.module.scss';

export const RangeboundImg = (props: {
  data: Partial<PositionInfo>;
  type: 'lose' | 'win';
}) => {
  const product = props.data?.product;
  if (!product) return <div className={styles['trend-img']} />;
  return (
    <div className={styles['rangebound-img']}>
      {props.type === 'win' ? (
        <ImgWin className={styles['highlight-line']} />
      ) : (
        <ImgLose className={styles['highlight-line']} />
      )}
      {(product.anchorPrices || [NaN, undefined]).map((it, i) => (
        <span className={styles['barrier']} key={`${it}-${i}`}>
          {amountFormatter(it, 0)}
        </span>
      ))}
    </div>
  );
};
