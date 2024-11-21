import { useMemo } from 'react';
import { amountFormatter } from '@sofa/utils/amount';

import styles from './index.module.scss';

export interface AmountDisplayProps {
  amount: string | number | undefined;
  thresholdCount?: number; // default: 5
  precision?: number;
  signed?: boolean; // 是否显示 + 符号
}

const AmountDisplay = (props: AmountDisplayProps) => {
  const [val, zeroCount] = useMemo(() => {
    const [v, exponential] = Number(props.amount).toExponential().split('e-');
    return [v, +exponential - 1];
  }, [props.amount]);

  const sign = useMemo(() => {
    if (!Number(props.amount)) return '';
    if (Number(props.amount) > 0) return !props.signed ? '' : '+';
    return '-';
  }, [props.amount, props.signed]);

  return (
    <span className={styles['amount-display']}>
      {sign && <span className={styles['sign']}>{sign}</span>}
      {zeroCount >= 5 ? (
        <>
          0.0<span className={styles['subscript']}>{zeroCount}</span>
          {val
            .replace(/[-.]/g, '')
            .substring(0, Math.max(1, (props.precision ?? 4) - 1))}
        </>
      ) : (
        amountFormatter(props.amount, props.precision).replace(/[-]/, '') || '-'
      )}
    </span>
  );
};

export default AmountDisplay;
