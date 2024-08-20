import { useMemo, useState } from 'react';
import { Select } from '@douyinfe/semi-ui';
import {
  RenderSingleSelectedItemFn,
  SelectProps,
} from '@douyinfe/semi-ui/lib/es/select';
import { useIsPortrait } from '@sofa/utils/hooks';
import classNames from 'classnames';

import { Comp as IconDropdown } from '@/assets/icon-dropdown.svg';

import { COverlay } from '../COverlay';

import './index.scss';

export const C_Select = (
  props: XRequired<Omit<SelectProps, 'children'>, 'optionList'>,
) => {
  const [visible, setVisible] = useState(props.defaultOpen);
  const selectedItem = useMemo(
    () => props.optionList.find((it) => it.value === props.value),
    [props.optionList, props.value],
  );
  const renderSelectedItem = (option?: (typeof props.optionList)[0]) => {
    if (!props.renderSelectedItem)
      return <div className="semi-select-selection-text">{option?.label}</div>;
    return (props.renderSelectedItem as RenderSingleSelectedItemFn)(
      option as never,
    );
  };
  return (
    <>
      <div
        className={classNames(
          'semi-select semi-select-portrait',
          {
            'semi-select-with-prefix': props.prefix,
            'semi-select-with-suffix': props.suffix,
          },
          props.className,
        )}
        style={props.style}
        onClick={() => setVisible((pre) => !pre)}
      >
        {props.prefix && (
          <div className="semi-select-prefix semi-select-prefix-text">
            {props.prefix}
          </div>
        )}
        <div className="semi-select-selection">
          {renderSelectedItem(selectedItem)}
        </div>
        {props.suffix && (
          <div className="semi-select-suffix semi-select-suffix-text">
            {props.suffix}
          </div>
        )}
        <div className="semi-select-arrow" x-semi-prop="arrowIcon">
          {props.arrowIcon || <IconDropdown />}
        </div>
      </div>
      <COverlay
        visible={visible}
        onVisibleChange={setVisible}
        className={classNames('c-select-overlay', props.dropdownClassName)}
      >
        {props.optionList.map((it) => (
          <div
            className={classNames('c-select-option', {
              'c-select-option-selected': it.value === props.value,
            })}
            onClick={() => {
              props.onChange?.(it.value);
              setVisible(false);
            }}
            key={it.value}
          >
            <span>{it.label}</span>
          </div>
        ))}
      </COverlay>
    </>
  );
};

export const CSelect = (
  props: XRequired<Omit<SelectProps, 'children'>, 'optionList'>,
) => {
  // const isPortrait = useIsPortrait();
  // if (!isPortrait) {
  return <Select {...props} arrowIcon={props.arrowIcon || <IconDropdown />} />;
  // }
  // return <C_Select {...props} />;
};
