import { applyMock } from '@sofa/utils/decorators';
import { http } from '@sofa/utils/http';

export enum PointType {
  TRADE = 'TRADE',
  GAME = 'GAME',
  TG = 'TELEGRAM',
  BURN = 'BURN',
  HOLDER = 'HOLDER',
  OTHER = 'OTHER',
}

export interface PointItem {
  generateTimeSeconds: number; // 时间戳，精确到秒
  points: string; // 积分数量
  categoryText: string; // earn surge leverage GAME-RANK GAME-DRAW
  wallet: string; // 钱包地址
  categoryId: number; //
  tradeInfoDTO?: {
    //	交易类型的才不为空
    depositCcy: string; // 币种 RCH USDT
    forCcy: string; // 标的币种 BTC/ETH
    anchorPrices: (string | number)[]; // 价格列表
    expiry: number; // 到期时间
    rfqType: 'DNT' | 'BULL_TREND' | 'BEAR_TREND';
  };
  tgConvertInfoDTO?: {
    // TG 交易
    tgId: string; // telegram id
    type: 'Convert';
  };
  otherConvertInfoDTO?: {
    // 其他交易
    type: string;
  };
}

export class PointService {
  @applyMock('pointTotal')
  static $total() {
    return http.get<unknown, HttpResponse<string>>(
      `${import.meta.env.VITE_LIMOS_BACKEND}/sf/points/balance`,
    );
  }
  static total() {
    return PointService.$total().then((res) => res.value);
  }

  @applyMock('pointPage')
  static $page(params: { type: PointType; pageSize: number; pageNum: number }) {
    return http.get<
      unknown,
      HttpResponse<{
        pageCount: number;
        totalCount: number;
        values: PointItem[];
      }>
    >(`${import.meta.env.VITE_LIMOS_BACKEND}/sf/points/page`, {
      params: params,
    });
  }
  static page(
    params: Pick<PageParams, 'offset' | 'limit'> & { type: PointType },
  ) {
    const pageSize = params.limit || 20;
    const pageNum = (params.offset! / pageSize || 0) + 1;
    return PointService.$page({ type: params.type, pageNum, pageSize }).then(
      (res) =>
        ({
          limit: pageSize,
          offset: params.offset || (pageNum - 1) * pageSize,
          list: res.value.values,
          hasMore: res.value.totalCount > (pageNum + 1) * pageSize,
        }) as PageResult<PointItem> & { type: PointType },
    );
  }
}
