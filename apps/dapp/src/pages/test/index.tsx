import { useState } from 'react';
import { AutoBg } from '@sofa/effects/AutoBg';
import { FloatingBorder } from '@sofa/effects/FloatingBorder';
import { FloatingText } from '@sofa/effects/FloatingText';
import { MouseRotate3D } from '@sofa/effects/MouseRotate3D';
import { RotateText } from '@sofa/effects/RotateText';
import { SFXText } from '@sofa/effects/SFXText';

import AmountInput from '@/components/AmountInput';
import { useIndexPrices } from '@/components/IndexPrices/store';
import KLine from '@/components/KLine';
import Payoff from '@/components/Payoff';
import SplineModel from '@/components/SplineModel';
import { StrikeSelector } from '@/components/StrikeSelector';

import styles from './index.module.scss';

const Doc = () => {
  const atm = useIndexPrices((state) => state.prices.BTC);
  const [strike, setStrike] = useState<{ strike: string | number }>();
  const [amount, setAmount] = useState<string | number>();

  return (
    <div className={styles['doc']}>
      {/* <AutoBg type="particle" /> */}
      {/* <MouseRotate3D
        style={{
          width: 300,
          height: 300,
          margin: '0 auto',
          background: '#000',
        }}
      /> */}
      <div style={{ background: '#000', padding: 100 }}>
        {/* <FloatingBorder
          borderWidth={1}
          borderRadius={10}
          // style={{ width: 500, height: 500 }}
          padding={'20px 0 0'}
        >
          <SFXText
            className="boundary-for-floating-text"
            style={{ background: '#000', fontSize: 100, height: '3em' }}
          >
            <tspan x="50%" dy="-1em">
              HOW
            </tspan>
            <tspan x="50%" dy="1em">
              IT
            </tspan>
            <tspan x="50%" dy="1em">
              WORKS
            </tspan>
          </SFXText>
        </FloatingBorder> */}

        <RotateText fontSize={12} color="#fff" radius={300}>
          HOW IT WORKS HOW IT WORKS HOW IT WORKS HOW IT WORKS HOW IT WORKS HOW
          IT WORKS HOW IT WORKS HOW IT WORKS HOW IT WORKS HOW IT WORKS HOW IT
          WORKS HOW IT WORKS HOW IT WORKS HOW IT WORKS HOW IT WORKS HOW IT WORKS
        </RotateText>
      </div>
      {/* <FloatingText
        style={{
          width: '100vw',
          height: '100vh',
          fontSize: 20,
          background: '#000',
          color: '#fff',
        }}
        filterType="distortion"
        direction="right"
        scrollParent={() => document.querySelector('#root')}
        dStartOffset={800}
        alignBoundaryEl={() =>
          document.querySelector('.boundary-for-floating-text')
        }
      >
        {'Supports various structured products'.toUpperCase()}
      </FloatingText>
      <Payoff
        forCcy={'BTC'}
        depositCcy={'USDT'}
        depositAmount={1000}
        positionAmount={20}
        refMs={Date.now()}
        expMs={Date.now() + 100000000}
        lowerBarrier={36000}
        upperBarrier={50000}
        nonTouchYield={0.625}
        lowerBarrierYield={0.02}
        upperBarrierYield={0.02}
      />
      <StrikeSelector
        atm={atm}
        value={strike}
        onChange={setStrike}
        options={[...Array(30)].map((_, i) => ({
          label: (i + 1) * 1500,
          value: (i + 1) * 1500,
        }))}
      />
      <AmountInput
        value={amount}
        onChange={setAmount}
        max={10000}
        tick={1}
        suffix={
          <span
            style={{
              display: 'block',
              padding: '0 20px 0 16px',
              margin: '0 -16px 0 0',
              fontSize: 14,
              lineHeight: '48px',
              color: 'var(--primary)',
              background: '#D7D7D7',
            }}
          >
            USDT
          </span>
        }
      />
      <div style={{ height: '100vh' }} /> */}
      {/* <div style={{ padding: 200 }}>
        <KLine
          forCcy="ETH"
          anchorPrices={[2000, 3000]}
          relateElPositions={[
            { left: 100, top: 0 },
            { left: 100, top: 100 },
          ]}
        />
      </div>
      <div style={{ padding: 200 }}>
        <KLine
          forCcy="BTC"
          anchorPrices={[40000, 50000]}
          relateElPositions={[
            { left: 100, top: 0 },
            { left: 100, top: 100 },
          ]}
        />
      </div> */}
      <SplineModel id="bee" />
      <SplineModel id="discoball" />
    </div>
  );
};

export default Doc;
