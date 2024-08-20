import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

dayjs.extend(utc);

// https://zh.wikipedia.org/zh-sg/%E6%97%B6%E5%8C%BA%E5%88%97%E8%A1%A8
export enum Timezone {
  IDLW = -12, // UTC-12 国际换日线）
  SST = -11, // UTC-11 美属萨摩亚标准时间）
  HST = -10, // UTC-10 夏威夷－阿留申标准时间）
  MIT = -9.5, // UTC-9:30 马克萨斯群岛标准时间）
  AKST = -9, // UTC-9 阿拉斯加标准时间）
  PST = -8, // UTC-8 太平洋标准时间）
  MST = -7, // UTC-7 北美山区标准时间）
  CST = -6, // UTC-6 北美中部标准时间）
  EST = -5, // UTC-5 北美东部标准时间）
  AST = -4, // UTC-4 大西洋标准时间）
  NST = -3.5, // UTC-3:30 纽芬兰岛标准时间）
  BRT = -3, // UTC-3 巴西利亚标准时间）
  FNT = -2, // UTC-2 费尔南多·迪诺罗尼亚群岛标准时间）
  CVT = -1, // UTC-1 佛得角标准时间）
  WET = 0, // UTC 欧洲西部时区，GMT：格林尼治标准时间）
  CET = +1, // UTC+1 欧洲中部时区）
  EET = +2, // UTC+2 欧洲东部时区）
  MSK = +3, // UTC+3 欧洲极东时间／莫斯科时区）
  IRST = +3.5, // UTC+3:30 伊朗标准时间）
  GST = +4, // UTC+4 海湾标准时间）
  AFT = +4.5, // UTC+4:30 阿富汗标准时间）
  PKT = +5, // UTC+5 巴基斯坦标准时间）
  IST = +5.5, // UTC+5:30 印度标准时间）
  NPT = +5.75, // UTC+5:45 尼泊尔标准时间）
  BHT = +6, // UTC+6 孟加拉标准时间）
  MMT = +6.5, // UTC+6:30 缅甸标准时间）
  ICT = +7, // UTC+7 中南半岛标准时间）
  CT_CST = +8, // UTC+8 中原标准时间）
  JST = +9, // UTC+9 日本标准时间）
  ACST = +9.5, // UTC+9:30 澳洲中部标准时间）
  AEST = +10, // UTC+10 澳洲东部标准时间）
  LHST = +10.5, // UTC+10:30 豪勋爵群岛标准时间）
  VUT = +11, // UTC+11 瓦努阿图标准时间）
  NZST = +12, // UTC+12 纽西兰标准时间）
  CHAST = +12.75, // UTC+12:45 查塔姆群岛标准时间）
  PHOT = +13, // UTC+13 菲尼克斯群岛标准时间）
  LINT = +14, // UTC+14 莱恩群岛标准时间）
}

export const TimezoneOptions = (
  Object.values(Timezone).filter((v) => typeof v === 'number') as number[]
).map((v) => {
  if (!v) return { value: v, label: 'UTC' };
  const [int, decimal] = String(Math.abs(v)).split('.');
  const minute = decimal ? `:${60 * +`0.${decimal}`}` : '';
  return {
    value: v,
    label: `UTC${v > 0 ? '+' : '-'}${int}${minute}`,
  };
});

export const useTimezone = Object.assign(
  createWithEqualityFn(
    persist(
      () => ({
        timezone: new Date().getTimezoneOffset() / -60, // 方法返回的是本地时间减去 UTC 时间的分钟数
      }),
      {
        name: 'timezone',
        storage: createJSONStorage(() => localStorage),
      },
    ),
  ),
  {
    setTimezone: (t: Timezone) =>
      useTimezone.setState((pre) => ({ ...pre, timezone: t })),
  },
);

export function formatTime(ms: number, format: string) {
  const utcOffset = useTimezone.getState().timezone * 60;
  return dayjs(ms).utcOffset(utcOffset).format(format); // utcOffset 方法接收的是 UTC 时间减去本地时间的分钟数
}
