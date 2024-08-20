import { CSSProperties, memo, ReactNode, useState } from 'react';
import { useLazyCallback } from '@sofa/utils/hooks';
import classNames from 'classnames';

import styles from './index.module.scss';

export interface CheckboxBtnOption {
  label: ReactNode;
  value: string | number;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

export interface CheckboxBtnGroupProps {
  className?: string;
  style?: CSSProperties;
  checkboxStyle?: CSSProperties;
  options?: CheckboxBtnOption[];
  defaultValue?: (string | number)[];
  value?: (string | number)[];
  onChange?: (value: (string | number)[]) => void;
  renderLabel?(props: CheckboxBtnOption): ReactNode;
  children?: ReactNode;
}

export const CheckboxBtnGroup = memo<CheckboxBtnGroupProps>((props) => {
  const { options, defaultValue, onChange } = props;
  const [$value, setValue] = useState(defaultValue);
  const value = 'value' in props ? props.value : $value;
  const handleClick = useLazyCallback((__value: string | number) => {
    const _value = value?.includes(__value)
      ? value?.filter((it) => it !== __value)
      : (value || []).concat(__value);
    setValue(_value);
    if (onChange) {
      onChange(_value || []);
    }
  });
  return (
    <div
      className={classNames(
        styles['checkbox-btn-group'],
        'checkbox-btn-group',
        props.className,
      )}
      style={props.style}
    >
      {options?.map((item) => {
        return (
          <div
            className={classNames(
              styles['checkbox-btn'],
              'checkbox-btn',
              item.className,
              {
                'checkbox-active': value?.includes(item.value),
                [styles['checkbox-active']]: value?.includes(item.value),
                [styles.disabled]: item.disabled,
                disabled: item.disabled,
              },
            )}
            key={String(item.value)}
            style={{ ...props.checkboxStyle, ...item.style }}
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
