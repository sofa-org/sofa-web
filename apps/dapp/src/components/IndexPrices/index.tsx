import { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { Rnd } from 'react-rnd';
import { amountFormatter } from '@sofa/utils/amount';
import { useLocalStorageState, usePrevious } from 'ahooks';
import classNames from 'classnames';
import { Autoplay } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { Comp as IconArrowDown } from '@/assets/icon-arrow-down.svg';
import { Comp as IconArrowUp } from '@/assets/icon-arrow-up.svg';
import { Comp as IconBTC } from '@/assets/icon-btc.svg';
import { Comp as IconETH } from '@/assets/icon-eth.svg';
import IconRCH from '@/assets/icon-rch.png';
import img from '@/assets/img.png';

import 'swiper/css';

import SplineModel from '../SplineModel';

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
        Number(price) >= Number(prePrice) ? styles['up'] : styles['down'],
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

  return ReactDOM.createPortal(
    <Rnd
      className={classNames(styles['index-prices'], props.className)}
      style={props.style}
      size={{ width: 195, height: 'auto' }}
      position={position}
      onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
      enableResizing={false}
    >
      <img src={img} alt="img" />
      <SplineModel id="discoball" />
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
    </Rnd>,
    document.querySelector('.main-content') || document.body,
  );
};

export default IndexPrices;
