import {
  memo,
  ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '@douyinfe/semi-ui';
import { wait } from '@livelybone/promise-wait';
import { roundWith } from '@sofa/utils/amount';
import { Env } from '@sofa/utils/env.ts';
import { isLegalNum } from '@sofa/utils/fns';
import { useLazyCallback } from '@sofa/utils/hooks';
import { simplePlus } from '@sofa/utils/object.ts';
import { useDebounceEffect } from 'ahooks';
import classNames from 'classnames';
import { nanoid } from 'nanoid';

import ProgressBar from '../ProgressBar';
import { useWalletStore, useWalletUIState } from '../WalletConnector/store.ts';

import { IconMinus } from './assets/icon-minus.tsx';
import { IconPlus } from './assets/icon-plus.tsx';

import styles from './index.module.scss';

export interface AmountInputProps extends BaseInputProps<string | number> {
  placeholder?: string;
  tick?: string | number;
  min?: string | number;
  max?: string | number;
  prefix?: ReactNode;
  suffix?: ReactNode;
  // @default normal; 选择 internal 之后加减按钮会出现在输入框内部
  type?: 'normal' | 'internal';
  onBlur?(e: FocusEvent): void;
  disabledUnlessWalletConnected?: boolean;
}

const AmountInput = memo<AmountInputProps>((props) => {
  const id = useMemo(() => `amount-input-${nanoid()}`, []);
  const ref = useRef<HTMLLabelElement>(null);
  const [tempValue, setTempValue] = useState(props.value ?? '');
  useLayoutEffect(() => {
    setTempValue(props.value ?? '');
  }, [props.value]);

  const round = useLazyCallback((v?: string | number) =>
    roundWith(v, props.tick || 0.0001, props.min || 0, props.max, 'lower'),
  );
  const { address } = useWalletStore();
  const { bringUpConnect } = useWalletUIState();

  // 500 ms 向外同步
  useDebounceEffect(
    () => {
      setTempValue(round(tempValue) ?? '');
      props.onChange?.(round(tempValue));
    },
    [tempValue],
    { wait: 1000, trailing: true, leading: false },
  );

  const percent = useMemo(
    () => Math.min(1, props.max ? +tempValue / Number(props.max) : 0),
    [props.max, tempValue],
  );

  const stop = useRef(false);
  const bump = useLazyCallback((percentOffset: number, n: number = 1) => {
    const signum = percentOffset > 0 ? 1 : -1;
    setTempValue((pre) => {
      if (!Number(props.max))
        return isLegalNum(props.max) ? Number(props.max) : '';
      const val = (() => {
        if (props.type === 'internal') {
          return round(simplePlus(pre, (Number(props.tick) || 1) * signum))!;
        }
        const rate = Math.max(
          1,
          ((Number(props.tick) || 0) / Number(props.max)) * 100,
        );
        const percent = +pre / Number(props.max) + (percentOffset * rate) / 100;
        return round(percent * Number(props.max))!;
      })();
      if (
        !stop.current &&
        !((signum === 1 && percent >= 1) || (signum === -1 && percent <= 0))
      ) {
        setTimeout(
          () => !stop.current && bump(percentOffset + n * signum, n + 1),
          300,
        );
      }
      return val;
    });
  });

  const handleSliderBtnClick = useLazyCallback(
    (initialPercentOffset: 1 | -1) => {
      if (!props.max)
        return (
          props.tick &&
          setTempValue(
            (pre) =>
              round((+pre || 0) + Number(props.tick) * initialPercentOffset)!,
          )
        );
      stop.current = false;
      const handler = () => {
        stop.current = true;
        window.removeEventListener('mouseup', handler, true);
      };
      window.addEventListener('mouseup', handler, true);

      bump(initialPercentOffset);
    },
  );

  return (
    <label
      ref={ref}
      className={classNames(
        styles['amount-input-wrapper'],
        'amount-input-wrapper',
        props.className,
        {
          [styles['amount-input-wrapper-internal']]: props.type === 'internal',
          'amount-input-wrapper-internal': props.type === 'internal',
        },
      )}
      style={props.style}
      htmlFor={!Env.isMobile ? id : ''}
      onClick={() =>
        !Env.isMobile &&
        document.querySelector<HTMLInputElement>(`#${id}`)?.focus()
      }
      onMouseLeave={() =>
        document.querySelector<HTMLInputElement>(`#${id}`)?.blur()
      }
    >
      <div className={styles['input-wrapper']}>
        {props.prefix}
        <input
          id={id}
          type="text"
          placeholder={'0'}
          value={tempValue}
          onChange={(e) =>
            setTempValue(
              e.target.value.match(/(^\d+\.?(\d+)?|^\.(\d+)?)/)?.[1] || '',
            )
          }
          onBlur={async (e) => {
            const event = e.nativeEvent;
            await wait(100);
            const isBlur = !ref.current?.contains(document.activeElement);
            if (isBlur) {
              setTempValue(round(tempValue) ?? '');
              props.onChange?.(round(tempValue));
              await wait(100);
              props.onBlur?.(event);
            }
          }}
          onFocus={(e) => {
            if (props.disabledUnlessWalletConnected && !address) {
              e.preventDefault();
              bringUpConnect();
              e.target.blur();
            }
          }}
        />
        {props.suffix}
        {props.type === 'internal' && (
          <div className={styles['controls']}>
            <Button
              className={styles['btn-minus']}
              onMouseDown={() => handleSliderBtnClick(-1)}
            >
              <IconMinus />
            </Button>
            <Button
              className={styles['btn-plus']}
              onMouseDown={() => handleSliderBtnClick(1)}
            >
              <IconPlus />
            </Button>
          </div>
        )}
      </div>
      {!!props.max && props.type !== 'internal' && (
        <div className={classNames('quick-widget', styles['quick-widget'])}>
          <Button
            className={styles['btn-minus']}
            onMouseDown={() => handleSliderBtnClick(-1)}
          >
            <IconMinus />
          </Button>
          <ProgressBar
            className={styles['progress']}
            percent={percent}
            onPercentChange={(p) => setTempValue(round(p * Number(props.max))!)}
          />
          <Button
            className={styles['btn-plus']}
            onMouseDown={() => handleSliderBtnClick(1)}
          >
            <IconPlus />
          </Button>
          <Button
            className={styles['btn-max']}
            theme={'borderless'}
            onClick={() => {
              const max = round(props.max);
              setTempValue(max || '');
              props.onChange?.(max);
            }}
          >
            Max
          </Button>
        </div>
      )}
    </label>
  );
});

export default AmountInput;
