import { applyMock } from '@sofa/utils/decorators';
import { http } from '@sofa/utils/http';

import { ContractsService, ProductType, VaultInfo } from './contracts';
import { OriginProductQuoteResult, ProductsService } from './products';

export interface ProductsDIYConfigRequest {
  chainId: number;
}

export interface ProductsDIYConfig {
  chainId: number;
  vault: string;
  expiryDateTimes: number[]; // 推荐支持的到期日时间 秒
  apyPercentages: number[]; // 年化百分比，例：[25,50,75,100]，对Earn和Leverage
  payoutMultiples: number[]; // 对Surge类适用 每投入一块钱最后的Payout是几个x
}

export interface ProductsDIYRecommendRequest {
  chainId: number; // 链ID
  vaults: string; // 合约组合，以","区分
  apyPercentage?: number; // 年化百分比
  payoutMultiple?: number; // surge必填
  expiryDateTime: number; // 选择的到期日 秒
}

export class ProductsDIYService {
  @applyMock('diyConfig')
  static config(params: ProductsDIYConfigRequest) {
    return http
      .get<unknown, HttpResponse<ProductsDIYConfig[]>>(
        '/rfq/diy/configuration',
        { params },
      )
      .then((res) => res.value);
  }

  @applyMock('diyRecommendedList')
  static async recommendList(params: ProductsDIYRecommendRequest) {
    const vaultInfoList = params.vaults
      .split(',')
      .map((vault) =>
        ProductsService.findVault(ContractsService.vaults, {
          ...params,
          vault,
        }),
      )
      .filter(Boolean) as VaultInfo[];
    if (!vaultInfoList.length) throw new Error('Invalid vault');
    const fetch = (vaultInfo: VaultInfo) => {
      const urls = {
        [ProductType.DNT]: '/rfq/diy/dnt/recommended-list',
        [ProductType.BearSpread]: '/rfq/diy/smart-trend/recommended-list',
        [ProductType.BullSpread]: '/rfq/diy/smart-trend/recommended-list',
      };
      return http
        .get<unknown, HttpResponse<OriginProductQuoteResult[]>>(
          urls[vaultInfo.productType],
          { params },
        )
        .then((res) =>
          res.value.map((it) => ProductsService.dealOriginQuote(it)),
        );
    };
    return Promise.all(vaultInfoList.map((it) => fetch(it))).then((res) =>
      res.flat(),
    );
  }
}
