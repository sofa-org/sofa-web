import { pre8h } from '@sofa/utils/expiry';

if (!window.mockData) window.mockData = {};

window.mockData.pointTotal = () => ({
  code: 0,
  value: 250123,
});

window.mockData.pointPage = () => ({
  code: 0,
  value: {
    pageCount: 1,
    totalCount: 19,
    values: [...Array(19)].map(() => {
      const forCcy = ['BTC', 'ETH'][Math.floor(Math.random() * 2)];
      return {
        generateTimeSeconds: Date.now() / 1000,
        points: Math.round(Math.random() * 100),
        categoryText: ['earn', 'surge', 'leverage'][
          Math.floor(Math.random() * 3)
        ],
        wallet: 'string',
        categoryId: 1,
        tradeInfoDTO: {
          //	交易类型的才不为空
          depositCcy: ['RCH', 'USDT', 'USDC', 'stETH'][
            Math.floor(Math.random() * 4)
          ],
          forCcy,
          anchorPrices: forCcy == 'ETH' ? ['2000', '3000'] : ['50000', '60000'],
          expiry: pre8h(undefined, Math.floor(Math.random() * 30)) / 1000,
          rfqType: ['DNT', 'BULL_TREND', 'BEAR_TREND'][
            Math.floor(Math.random() * 3)
          ],
        },
      };
    }),
  },
});
