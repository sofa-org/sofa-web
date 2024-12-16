import { useEffect, useMemo, useState } from 'react';
import { HorizontalTicker } from 'react-infinite-ticker';
import { Rnd } from 'react-rnd';
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

import 'swiper/css';

import { useIndexPrices } from './store';

import styles from './index.module.scss';

const ccyList = [
  { ccy: 'BTC' as CCY, icon: IconBTC, precision: 2 },
  { ccy: 'ETH' as CCY, icon: IconETH, precision: 2 },
  {
    ccy: 'RCH' as CCY,
    icon: (props: BaseProps) => <img src={IconRCH} alt="" {...props} />,
    precision: 4,
  },
];

const IndexPrice = (props: { ccy: CCY }) => {
  const price = useIndexPrices((state) => state.prices[props.ccy]);
  const ccyInfo = useMemo(
    () => ccyList.find((it) => it.ccy === props.ccy),
    [props.ccy],
  );
  const prePrice = usePrevious(price);
  return (
    <div
      className={classNames(
        styles['index-price'],
        'index-price',
        Number(price) >= Number(prePrice) ? styles['up'] : styles['down'],
        price === undefined ? styles['loading'] : undefined,
      )}
    >
      {ccyInfo?.icon && <ccyInfo.icon className={styles['icon-ccy']} />}
      {ccyInfo?.ccy}
      <span className={styles['price']}>
        ${amountFormatter(price, ccyInfo?.precision)}
      </span>
      {Number(price) >= Number(prePrice) ? <IconArrowUp /> : <IconArrowDown />}
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
            document.querySelector<HTMLDivElement>('#root')!.scrollHeight - 76,
            $position.y,
          ),
        ),
      },
    [$position],
  );

  const [stopMobileTicker, setStopMobileTicker] = useState(true);

  const highlightTicker = useLazyCallback(() => {
    const tickerElement = document.querySelector('.index-prices-ticker');
    if (!tickerElement || !tickerElement.checkVisibility?.()) {
      return;
    }
    // Current ticker implementation(react-infinite-ticker) is using **2** horizontal element and do the rotation
    // (one horizontal_element_width = all index prices element's width added up)
    // so, if the total window width > 2 * horizontal_element_width, the page will looks weird
    // Solution:
    // - If the screen width < 1.2 * horizontal_element_width, disable the ticker;
    // - Otherwise, enable the ticker and auto focus to the left most index price as the design;

    const horizontalElementContainer = document.querySelector(
      '.index-prices-ticker>div',
    );
    const horizontalElement =
      horizontalElementContainer &&
      horizontalElementContainer.childElementCount == 2 &&
      horizontalElementContainer.childNodes[0]?.nodeName?.toLowerCase?.() ==
        'div'
        ? (horizontalElementContainer.childNodes[0] as HTMLDivElement)
        : undefined;
    if (!horizontalElement) {
      return;
    }
    const focusingElement = document.querySelectorAll(
      `.index-prices-ticker .index-price.${styles['focused']}`,
    );
    if (window.innerWidth > 1.2 * horizontalElement.clientWidth) {
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
      <div
        className={classNames(
          styles['index-prices-ticker'],
          'index-prices-ticker',
          props.className,
        )}
      >
        <HorizontalTicker
          key={`HorizontalTicker-${stopMobileTicker ? 0 : 1}`}
          duration={stopMobileTicker ? 0 : 25000}
        >
          <IndexPrice ccy="BTC" />
          <IndexPrice ccy="ETH" />
          <IndexPrice ccy="RCH" />
        </HorizontalTicker>
      </div>
      <Rnd
        className={classNames(styles['index-prices'], props.className)}
        style={props.style}
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
