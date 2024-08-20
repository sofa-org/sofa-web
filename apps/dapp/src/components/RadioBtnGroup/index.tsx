import { CSSProperties, memo, ReactNode, useState } from 'react';
import { useLazyCallback } from '@sofa/utils/hooks';
import classNames from 'classnames';

import styles from './index.module.scss';

export interface RadioBtnOption {
  label: ReactNode;
  value: string | number;
  disabled?: boolean;
}

export interface RadioBtnGroupProps {
  className?: string;
  style?: CSSProperties;
  radioStyle?: CSSProperties;
  options?: RadioBtnOption[];
  defaultValue?: string | number;
  value?: string | number;
  onChange?: (value: string | number) => void;
  renderLabel?(props: RadioBtnOption): ReactNode;
  children?: ReactNode;
}

const RadioBtnGroup = memo<RadioBtnGroupProps>((props) => {
  const { options, defaultValue, onChange } = props;
  const [$value, setValue] = useState(defaultValue);
  const value = 'value' in props ? props.value : $value;
  const handleClick = useLazyCallback((_value: string | number) => {
    setValue(_value);
    if (onChange) {
      onChange(_value);
    }
  });
  return (
    <div
      className={classNames(
        styles['radio-btn-group'],
        'radio-btn-group',
        props.className,
      )}
      style={props.style}
    >
      {options?.map((item) => {
        return (
          <div
            className={classNames(styles['radio-btn'], 'radio-btn', {
              'radio-active': value === item.value,
              [styles['radio-active']]: value === item.value,
              [styles.disabled]: item.disabled,
            })}
            key={String(item.value)}
            style={props.radioStyle}
            onClick={() => !item.disabled && handleClick(item.value)}
          >
            {props.renderLabel ? props.renderLabel(item) : item.label}
          </div>
        );
      })}
      {props.children}
    </div>
  );
});

export default RadioBtnGroup;
