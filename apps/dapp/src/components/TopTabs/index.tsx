import { ReactNode } from 'react';
import { RiskType } from '@sofa/services/base-type';
import { useIsPortrait } from '@sofa/utils/hooks';
import classNames from 'classnames';

import { C_Select } from '../CSelect';
import { useProjectChange, useRiskSelect } from '../ProductSelector';

import styles from './index.module.scss';

export interface TopTabsProps extends BaseInputProps<string | number> {
  banner: ReactNode;
  extraTopContent?: ReactNode;
  options: { label: ReactNode; value: string | number }[];
  type?: 'tab' | 'btn' | 'banner-expandable' | 'banner-expandable-tab';
  dark?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  bannerClassName?: string;
  tabClassName?: string;
  contentDecorationClassName?: string;
  sticky?: boolean;
}

const TopTabs = (props: TopTabsProps) => {
  const [project] = useProjectChange();
  const [riskType] = useRiskSelect(project);
  const isPortrait = useIsPortrait();

  return (
    <>
      {props.banner && (
        <div
          className={classNames(
            'banner',
            styles['banner'],
            props.bannerClassName,
            {
              [styles['dark']]: props.dark,
              [styles['risky']]: riskType === RiskType.RISKY,
              risky: riskType === RiskType.RISKY,
              'banner-expandable': props.type === 'banner-expandable',
              [styles['banner-expandable']]: props.type === 'banner-expandable',
              'banner-expandable-tab': props.type === 'banner-expandable-tab',
              [styles['banner-expandable-tab']]:
                props.type === 'banner-expandable-tab',
            },
          )}
        >
          {props.banner}
        </div>
      )}
      <div
        className={classNames(
          'top-tabs',
          styles['top-tabs'],
          props.tabClassName,
          {
            'top-btn-tabs': props.type === 'btn',
            [styles['top-btn-tabs']]: props.type === 'btn',
            'banner-expandable': props.type === 'banner-expandable',
            [styles['banner-expandable']]: props.type === 'banner-expandable',
            'banner-expandable-tab': props.type === 'banner-expandable-tab',
            [styles['banner-expandable-tab']]:
              props.type === 'banner-expandable-tab',
            [styles['dark']]: props.dark,
            [styles['sticky']]: props.sticky,
          },
        )}
      >
        {props.extraTopContent && (
          <div className={styles['extra-top-content']}>
            {props.extraTopContent}
          </div>
        )}
        <div className={classNames(styles['tabs'], 'tabs')}>
          {!isPortrait
            ? props.options.map((it) => (
                <div
                  key={it.value}
                  className={classNames(
                    'top-tabs-tab',
                    styles['top-tabs-tab'],
                    {
                      [styles['active']]: it.value === props.value,
                      active: it.value === props.value,
                    },
                  )}
                  onClick={() => !props.disabled && props.onChange?.(it.value)}
                >
                  {it.label}
                </div>
              ))
            : !!props.options.length && (
                <C_Select
                  prefix={props.prefix}
                  suffix={props.suffix}
                  className={classNames({ 'semi-always-dark': props.dark })}
                  optionList={props.options}
                  value={props.value}
                  onChange={(v) => props.onChange?.(v as never)}
                />
              )}
        </div>
      </div>
      <div
        className={classNames(
          'top-tabs-content-decoration',
          styles['top-tabs-content-decoration'],
          props.contentDecorationClassName,
          {
            'top-btn-tabs-content-decoration': props.type === 'btn',
            [styles['top-btn-tabs-content-decoration']]: props.type === 'btn',
            'banner-expandable': props.type === 'banner-expandable',
            [styles['banner-expandable']]: props.type === 'banner-expandable',
            'banner-expandable-tab': props.type === 'banner-expandable-tab',
            [styles['banner-expandable-tab']]:
              props.type === 'banner-expandable-tab',
            [styles['dark']]: props.dark,
          },
        )}
      />
      <div
        className={classNames(
          'top-tabs-content',
          styles['top-tabs-content'],
          {
            'top-btn-tabs-content': props.type === 'btn',
            [styles['top-btn-tabs-content']]: props.type === 'btn',
            'banner-expandable': props.type === 'banner-expandable',
            [styles['banner-expandable']]: props.type === 'banner-expandable',
            'banner-expandable-tab': props.type === 'banner-expandable-tab',
            [styles['banner-expandable-tab']]:
              props.type === 'banner-expandable-tab',
            [styles['dark']]: props.dark,
          },
          props.className,
        )}
        style={props.style}
      >
        {props.children}
      </div>
    </>
  );
};

export default TopTabs;
