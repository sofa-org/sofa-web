import { useMemo } from 'react';
import { CCYService } from '@sofa/services/ccy';
import { amountFormatter } from '@sofa/utils/amount';
import classNames from 'classnames';

import styles from './index.module.scss';

export interface AmountDisplayProps extends BaseProps {
  amount: string | number | undefined;
  thresholdCount?: number; // default: 5
  precision?: number;
  ccy?: string; // 用于默认的 precision 逻辑
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

  const precision = useMemo(() => {
    if (!props.ccy) return props.precision ?? 4;
    return CCYService.ccyConfigs[props.ccy]?.precision ?? 4;
  }, [props.ccy, props.precision]);

  return (
    <span
      className={classNames(styles['amount-display'], props.className)}
      style={props.style}
    >
      {sign && <span className={styles['sign']}>{sign}</span>}
      {zeroCount >= 5 ? (
        <>
          0.0<span className={styles['subscript']}>{zeroCount}</span>
          {val.replace(/[-.]/g, '').substring(0, Math.max(1, precision - 1))}
        </>
      ) : (
        amountFormatter(props.amount, precision).replace(/[-]/, '') || '-'
      )}
    </span>
  );
};

export default AmountDisplay;
