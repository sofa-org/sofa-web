import { ReactNode, useMemo } from 'react';
import { amountFormatter } from '@sofa/utils/amount';
import classNames from 'classnames';

import { RadioBtnGroup } from '../RadioBtnGroup';

import styles from './index.module.scss';

export interface StrikeSelectorVal {
  strike: string | number;
}

export interface StrikeSelectorProps {
  atm?: number;
  value?: StrikeSelectorVal;
  onChange?(val: StrikeSelectorVal): void;
  options?: { label: ReactNode; value: string | number }[];
  disableStrikes?: number[];
}

export function StrikeSelector(props: StrikeSelectorProps) {
  const lowerPrices = useMemo(
    () =>
      props.options
        ?.filter((it) => +it.value <= (props.atm || 0))
        .sort((a, b) => +a.value - +b.value) || [],
    [props.options, props.atm],
  );
  const upperPrices = useMemo(
    () =>
      props.options
        ?.filter((it) => +it.value > (props.atm || 0))
        .sort((a, b) => +a.value - +b.value) || [],
    [props.options, props.atm],
  );
  const prices = useMemo(() => {
    if (!props.atm) return [...lowerPrices, ...upperPrices];
    return [
      ...lowerPrices,
      { label: 'ATM', value: props.atm, disabled: true },
      ...upperPrices,
    ];
  }, [lowerPrices, props.atm, upperPrices]);
  return (
    <div className={classNames(styles['strike-selector'])}>
      <div className={classNames(styles.strikes)}>
        <RadioBtnGroup
          className={classNames(styles['strike-price-radio-btn-group'])}
          options={prices}
          value={props.value?.strike}
          renderLabel={(option) =>
            option.label === 'ATM' ? (
              <div className={styles['strike-selector-atm']}>
                <span>ATM</span>
                <span>{amountFormatter(+option.value, 2)}</span>
              </div>
            ) : (
              option.label
            )
          }
          onChange={(v) => props.onChange?.({ strike: v })}
        />
      </div>
    </div>
  );
}
