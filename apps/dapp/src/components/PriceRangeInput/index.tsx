import {
  FocusEvent,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Popover, Toast } from '@douyinfe/semi-ui';
import { useTranslation } from '@sofa/services/i18n';
import {
  ProductsService,
  ProductType,
  WinningProbabilities,
} from '@sofa/services/products';
import { amountFormatter } from '@sofa/utils/amount';
import { calcVal, isNullLike } from '@sofa/utils/fns';
import {
  useAsyncMemo,
  useIsPortrait,
  useLazyCallback,
} from '@sofa/utils/hooks';
import { useDebounceEffect, useSize } from 'ahooks';
import classNames from 'classnames';
import { isEqual } from 'lodash-es';
import { nanoid } from 'nanoid';

import { addI18nResources } from '@/locales';

import { CheckboxBtnGroup } from '../CheckboxBtnGroup';
import { COverlay } from '../COverlay';
import { useIndexPrices } from '../IndexPrices/store';
import { ProductTypeRefs } from '../ProductSelector/enums';
import { RadioBtnOption } from '../RadioBtnGroup';

import { Comp as IconArrow } from './assets/icon-arrow.svg';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'PriceRangeInput');

export interface PriceRangeInputProps
  extends BaseInputProps<(string | number | undefined)[]> {
  forCcy: CCY;
  // default: ['K1', 'K2']
  prefixes?: [string, string];
  mustIncludeAtm?: boolean;
  productType?: ProductType;
  anchorPrices?: (string | number)[];
  winningProbability?: WinningProbabilities;
}

const toNum = (it?: string | number) => (it ? Number(it) : it);

export const PriceRangeInputEl = (
  props: PriceRangeInputProps & {
    type: '1' | '2';
    autoInitial?: boolean;
    onlyEmitWhenCorrect?: boolean;
    dark?: boolean;
  },
) => {
  const [t] = useTranslation('PriceRangeInput');
  const id = useMemo(() => `range-input-${nanoid()}`, []);
  const atm = useIndexPrices((state) => state.prices[props.forCcy]);
  const size = useSize(() =>
    document.querySelector(`#${id} .${styles['quick-selects']}`),
  );
  const [tempValue, $setTempValue] = useState(() => props.value?.map(toNum));

  const checkRange = useLazyCallback(
    (values?: (string | number | undefined)[]) => {
      if (
        atm &&
        values &&
        props.mustIncludeAtm &&
        (Number(values[0]) - atm) * (Number(values[1]) - atm) > 0
      ) {
        return `Price range should include atm price(${atm})`;
      }
      return '';
    },
  );

  const setTempValue = useLazyCallback(
    (action: SetStateAction<(string | number | undefined)[] | undefined>) => {
      $setTempValue((pre) => {
        const val = calcVal(action, pre);
        const error = checkRange(val);
        if (error) {
          Toast.warning(error);
          return pre;
        }
        return val?.map(toNum);
      });
    },
  );

  const onInputBlur = useLazyCallback(
    (e: FocusEvent<HTMLInputElement, Element>, i: number) => {
      const v = e.target.value;
      const val =
        !v || v === '-'
          ? undefined
          : Math.min(999999, Math.abs(Math.round(+v)));
      setTempValue((pre) => {
        const values = i === 0 ? [val, pre?.[1]] : [pre?.[0], val];
        const error = checkRange(values);
        if (error) {
          Toast.warning(error);
          const input = document.querySelectorAll<HTMLInputElement>(
            `#${id} input`,
          )[i];
          if (input) {
            input.value = (pre?.[i] ?? '') as string;
            input.focus();
          }
          return pre;
        }
        return values;
      });
    },
  );

  useEffect(() => {
    const values = props.value?.map(toNum);
    setTempValue((pre) => (!isEqual(values, pre) ? values : pre));
    setTimeout(() => {
      [...document.querySelectorAll<HTMLInputElement>(`#${id} input`)].forEach(
        (el, i) => {
          el.value = isNullLike(values?.[i]) ? '' : (values[i] as string);
        },
      );
    }, 100);
  }, [id, props.value, setTempValue]);

  useDebounceEffect(
    () => {
      if (!props.onlyEmitWhenCorrect || tempValue?.every(Boolean)) {
        const v = tempValue?.every(Boolean)
          ? tempValue.sort((a, b) => Number(a) - Number(b))
          : tempValue;
        props.onChange?.(v);
      }
    },
    [tempValue?.join('-'), props.onlyEmitWhenCorrect],
    { wait: 300 },
  );

  const $strikeOptions = useAsyncMemo(async () => {
    if (!atm) return undefined;
    const strikes = await ProductsService.genStrikes(
      atm,
      props.forCcy as never,
    );
    const lower = strikes.filter((it) => it <= atm);
    const upper = strikes.filter((it) => it > atm);
    return [
      ...lower.map((value) => ({ label: value, value }) as RadioBtnOption),
      {
        className: styles['atm-el'],
        label: (
          <>
            <span>ATM</span>
            <span>{Number(atm)?.toFixed(0)}</span>
          </>
        ),
        value: 'atm',
        disabled: true,
      },
      ...upper.map((value) => ({ label: value, value }) as RadioBtnOption),
    ];
  }, [atm]);
  const strikeOptions = useMemo(() => {
    if (!size?.width || !$strikeOptions) return $strikeOptions;
    const rowCount = Math.floor((size.width + 4) / (72 + 4));
    const emptyCount = rowCount - ($strikeOptions.length % rowCount);
    return $strikeOptions.concat(
      [...Array(emptyCount)].map(() => ({
        className: styles['empty-el'],
        label: '',
        value: Math.random(),
        disabled: true,
      })),
    );
  }, [$strikeOptions, size]);

  useEffect(() => {
    if (!strikeOptions || !props.autoInitial || props.value) return;
    const index = strikeOptions?.findIndex((it) => it.value === 'atm');
    setTempValue([
      strikeOptions[index - 2].value,
      strikeOptions[index + 2].value,
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!strikeOptions, props.autoInitial, setTempValue]);

  return (
    <div
      id={id}
      className={classNames(styles['inputs-wrapper'], {
        [styles['inputs-wrapper-2']]: props.type === '2',
      })}
    >
      <div className={styles['inputs']}>
        <div className={styles['input']}>
          <div className={styles['prefix']}>{props.prefixes?.[0] || `K1`}</div>
          <input placeholder={t('Lower')} onBlur={(e) => onInputBlur(e, 0)} />
        </div>
        <div className={styles['sep']}>
          <IconArrow />
          {/* <span className={styles['atm']}>ATM {amountFormatter(atm, 2)}</span> */}
        </div>
        <div className={styles['input']}>
          <div className={styles['prefix']}>{props.prefixes?.[1] || `K2`}</div>
          <input placeholder={t('Upper')} onBlur={(e) => onInputBlur(e, 1)} />
        </div>
      </div>
      {props.productType && props.winningProbability && props.anchorPrices && (
        <div className={styles['probabilities']}>
          {ProductTypeRefs[props.productType]
            .probability(t, props.winningProbability, props.anchorPrices)
            .map((it) => (
              <div
                className={styles['probability']}
                key={it}
                dangerouslySetInnerHTML={{ __html: it }}
              />
            ))}
        </div>
      )}
      <div className={styles['quick-selects']}>
        <div>
          <CheckboxBtnGroup
            className={styles['checkbox-btn-group']}
            options={strikeOptions}
            value={tempValue as never}
            onChange={($v) => {
              const v = $v.filter(Boolean);
              if (v.length === 2) setTempValue([v[0], v[1]]);
              else setTempValue([v[v.length - 1], undefined]);
            }}
          />
        </div>
      </div>
    </div>
  );
};

const PriceRangeInput = (props: PriceRangeInputProps) => {
  const [t] = useTranslation('PriceRangeInput');
  const isPortrait = useIsPortrait();

  const [visible, setVisible] = useState(false);

  const content = (
    <div
      className={styles['price-range-input']}
      style={{
        borderColor: visible ? 'var(--semi-color-focus-border)' : 'transparent',
      }}
      onClick={() => setVisible(true)}
    >
      {props.value?.[0] ? (
        <span className={styles['value']}>
          {amountFormatter(props.value[0], 0)}
        </span>
      ) : (
        <span className={classNames(styles['value'], styles['placeholder'])}>
          {t('Lower')}
        </span>
      )}
      <span className={styles['sep']}>-</span>
      {props.value?.[0] ? (
        <span className={styles['value']}>
          {amountFormatter(props.value[1], 0)}
        </span>
      ) : (
        <span className={classNames(styles['value'], styles['placeholder'])}>
          {t('Upper')}
        </span>
      )}
    </div>
  );

  if (isPortrait) {
    return (
      <>
        {content}
        <COverlay
          visible={visible}
          onVisibleChange={setVisible}
          className={styles['price-range-input-overlay']}
        >
          <PriceRangeInputEl type="1" onlyEmitWhenCorrect {...props} />
        </COverlay>
      </>
    );
  }

  return (
    <Popover
      trigger="click"
      onVisibleChange={(v) => setVisible(v)}
      contentClassName={styles['popover']}
      content={<PriceRangeInputEl type="1" onlyEmitWhenCorrect {...props} />}
      margin={-12}
    >
      {content}
    </Popover>
  );
};

export default PriceRangeInput;
