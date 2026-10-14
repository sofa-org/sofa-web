import { useEffect, useMemo, useState } from 'react';
import { HorizontalTicker } from 'react-infinite-ticker';
import { Rnd } from 'react-rnd';
import { useTranslation } from '@sofa/services/i18n';
import { amountFormatter } from '@sofa/utils/amount';
import { useLazyCallback } from '@sofa/utils/hooks';
import { useLocalStorageState, usePrevious } from 'ahooks';
import classNames from 'classnames';
import { escapeRegExp } from 'lodash-es';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { Comp as IconArrowDown } from '@/assets/icon-arrow-down.svg';
import { Comp as IconArrowUp } from '@/assets/icon-arrow-up.svg';
import { Comp as IconBTC } from '@/assets/icon-btc.svg';
import { Comp as IconETH } from '@/assets/icon-eth.svg';
import IconRCH from '@/assets/icon-rch.png';
import { addI18nResources } from '@/locales';

import 'swiper/css';

import { MobileOnly, useIsMobileUI } from '../MobileOnly';

import locale from './locale';
import { useIndexPrices } from './store';

import styles from './index.module.scss';

addI18nResources(locale, 'IndexPrices');

const ccyList = [
  { ccy: 'BTC' as CCY, icon: IconBTC, precision: 2 },
  { ccy: 'ETH' as CCY, icon: IconETH, precision: 2 },
  {
    ccy: 'RCH' as CCY,
    icon: (props: BaseProps) => <img src={IconRCH} alt="" {...props} />,
    precision: 4,
  },
];

export const IndexPrice = (props: { ccy: CCY }) => {
  const [t] = useTranslation('IndexPrices');
  const quote = useIndexPrices((state) => state.quotes[props.ccy]);
  const price = quote?.price;
  const ccyInfo = useMemo(
    () => ccyList.find((it) => it.ccy === props.ccy),
    [props.ccy],
  );
  const prePrice = usePrevious(price);
  const direction =
    price !== undefined &&
    prePrice !== undefined &&
    !quote?.error &&
    price !== prePrice
      ? price > prePrice
        ? 'up'
        : 'down'
      : undefined;
  return (
    <div
      className={classNames(
        styles['index-price'],
        'index-price',
        direction && styles[direction],
        price === undefined ? styles['loading'] : undefined,
      )}
    >
      {ccyInfo?.icon && <ccyInfo.icon className={styles['icon-ccy']} />}
      {ccyInfo?.ccy}
      <span className={styles['price']}>
        {price === undefined
          ? '--'
          : `$${amountFormatter(price, ccyInfo?.precision)}`}
      </span>
      {price !== undefined && quote?.error && (
        <span
          className={styles['stale-label']}
          role="status"
          title={t('Not updated')}
        >
          {t('Not updated')}
        </span>
      )}
      {direction === 'up' && <IconArrowUp />}
      {direction === 'down' && <IconArrowDown />}
    </div>
  );
};

const IndexPrices = (props: BaseProps) => {
  useEffect(() => {
    const subscription = useIndexPrices.subscribePrices();
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  const [$position, setPosition] = useLocalStorageState(
    'index-prices-position',
    {
      defaultValue: () => ({
        x: window.innerWidth - 207,
        y: 60,
      }),
    },
  );

  const position = useMemo(
    () =>
      $position && {
        x: Math.max(30, Math.min(window.innerWidth - 207, $position.x)),
        y: Math.max(
          12,
          Math.min(
            Number(
              document.querySelector<HTMLDivElement>('#root')?.scrollHeight,
            ) - 76,
            $position.y,
          ),
        ),
      },
    [$position],
  );

  const [stopMobileTicker, setStopMobileTicker] = useState(true);
  const isMobileUI = useIsMobileUI();
  const highlightTicker = useLazyCallback(() => {
    if (!isMobileUI) {
      return;
    }
    const tickerElement = document.querySelector('.index-prices-ticker');
    if (!tickerElement || !tickerElement.checkVisibility?.()) {
      return;
    }
    // Current ticker implementation(react-infinite-ticker) is using **2** horizontal element and do the rotation
    // (one horizontal_element_width = all index prices element's width added up)
    // so, if the total window width > 2 * horizontal_element_width, the page will looks weird
    // Solution:
    // - If the screen width < 540px, disable the ticker;
    // - Otherwise, enable the ticker and auto focus to the left most index price as the design;
    const focusingElement = document.querySelectorAll(
      `.index-prices-ticker .index-price.${styles['focused']}`,
    );
    if (window.innerWidth > 540) {
      setStopMobileTicker(true);
      if (focusingElement.length) {
        for (const ele of focusingElement) {
          ele.className = ele.className.replace(
            new RegExp(
              /\b/.source + escapeRegExp(styles['focused']) + /\b/.source,
              'g',
            ),
            '',
          );
        }
      }
      return;
    }
    setStopMobileTicker(false);
    let newFocusElement: HTMLDivElement | undefined = undefined;
    let newFocusElementBox: DOMRect | undefined = undefined;

    for (const indexPriceElement of document.querySelectorAll<HTMLDivElement>(
      '.index-prices-ticker .index-price',
    )) {
      const box = indexPriceElement.getBoundingClientRect();
      if (!newFocusElement || !newFocusElementBox) {
        newFocusElement = indexPriceElement;
        newFocusElementBox = box;
        continue;
      }
      if (
        (!focusingElement.length || box.left >= -30) &&
        (box.left < newFocusElementBox.left || newFocusElementBox.left < 0)
      ) {
        newFocusElementBox = box;
        newFocusElement = indexPriceElement;
        continue;
      }
    }
    if (newFocusElement) {
      if (focusingElement.length) {
        if (
          focusingElement.length == 1 &&
          newFocusElement == focusingElement[0]
        ) {
          return;
        }
        for (const ele of focusingElement) {
          ele.className = ele.className.replace(
            new RegExp(
              /\b/.source + escapeRegExp(styles['focused']) + /\b/.source,
              'g',
            ),
            '',
          );
        }
      }
      newFocusElement.className += ' ' + styles['focused'];
    }
  });

  useEffect(() => {
    const i = setInterval(highlightTicker, 1000);
    highlightTicker();
    return () => clearInterval(i);
  }, []);

  return (
    <>
      <MobileOnly
        className={classNames(
          styles['index-prices-ticker'],
          'index-prices-ticker',
          props.className,
        )}
        display="block"
      >
        <HorizontalTicker
          key={`HorizontalTicker-${stopMobileTicker ? 0 : 1}`}
          duration={stopMobileTicker ? 0 : 25000}
        >
          <IndexPrice ccy="BTC" />
          <IndexPrice ccy="ETH" />
          <IndexPrice ccy="RCH" />
        </HorizontalTicker>
      </MobileOnly>
      <Rnd
        className={classNames(styles['index-prices'], props.className)}
        style={{
          ...props.style,
          display: isMobileUI ? 'none' : undefined,
        }}
        size={{ width: 195, height: 'auto' }}
        position={position}
        onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
        enableResizing={false}
      >
        <Swiper
          direction="vertical"
          slidesPerView={2}
          pagination={false}
          modules={[Autoplay]}
          className={styles['content']}
          autoplay
          loop
        >
          <SwiperSlide>
            <IndexPrice ccy="BTC" />
          </SwiperSlide>
          <SwiperSlide>
            <IndexPrice ccy="ETH" />
          </SwiperSlide>
          <SwiperSlide>
            <IndexPrice ccy="RCH" />
          </SwiperSlide>
        </Swiper>
      </Rnd>
    </>
  );
};

export default IndexPrices;
