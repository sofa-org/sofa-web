import { http } from '@sofa/utils/http';

export interface CampaignLotteryInfo {
  wallet: string;
  unDrawnTimes: number;
  notify: boolean;
}

export interface CampaignJokerInfo {
  undrawn: string;
  pending: number;
  drawnList: { card: string; num: number }[];
}

export class CampaignService {
  static getLotteryInfo(wallet: string) {
    return http
      .get<unknown, HttpResponse<CampaignLotteryInfo>>(
        `${import.meta.env.VITE_LIMOS_BACKEND}/sf/game/wheel/num`,
        { params: { wallet } },
      )
      .then((res) => res.value);
  }

  static getJokerInfo(wallet: string) {
    return http
      .get<unknown, HttpResponse<CampaignJokerInfo>>(
        `${import.meta.env.VITE_LIMOS_BACKEND}/sf/competition/gacha/draw-num`,
        { params: { wallet } },
      )
      .then((res) => res.value);
  }
}
