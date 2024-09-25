import { useMemo, useState } from 'react';
import Table, { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import { TFunction, useTranslation } from '@sofa/services/i18n';
import { PointItem, PointService, PointType } from '@sofa/services/points';
import { displayExpiry } from '@sofa/utils/expiry';
import { objectValCvt } from '@sofa/utils/object';
import { useInfiniteScroll } from 'ahooks';
import classNames from 'classnames';
import dayjs from 'dayjs';

import RadioBtnGroup from '@/components/RadioBtnGroup';
import { useWalletStore } from '@/components/WalletConnector/store';

import styles from './index.module.scss';

export const PointTypeRefs = objectValCvt(
  {
    [PointType.TRADE]: {
      label: (t: TFunction) => t({ enUS: 'Trade', zhCN: '交易' }),
    },
    [PointType.GAME]: {
      label: (t: TFunction) => t({ enUS: 'Game', zhCN: '游戏' }),
    },
    [PointType.TG]: {
      label: (t: TFunction) => t({ enUS: 'Telegram', zhCN: 'Telegram' }),
    },
    [PointType.BURN]: {
      label: (t: TFunction) => t({ enUS: 'Trade', zhCN: '销毁' }),
    },
    [PointType.HOLDER]: {
      label: (t: TFunction) => t({ enUS: 'Holder', zhCN: '持有' }),
    },
    [PointType.OTHER]: {
      label: (t: TFunction) => t({ enUS: 'Other', zhCN: '其它' }),
    },
  },
  (v, k) => ({ ...v, value: k }),
);

export const PointRecords = () => {
  const [t] = useTranslation('PointRecords');

  const wallet = useWalletStore();

  const [type, setType] = useState(PointType.TRADE);
  const options = useMemo(
    () =>
      Object.values(PointTypeRefs).map((it) => ({ ...it, label: it.label(t) })),
    [t],
  );
  const { data, loading: loading } = useInfiniteScroll<
    PageResult<PointItem> & { type: PointType }
  >(
    async (pre) => {
      const limit = 20;
      const offset = pre?.offset ? pre.offset + limit : 0;
      if (!wallet.address) return { type, limit, offset, list: [] };
      return PointService.page({ type, offset, limit });
    },
    {
      reloadDeps: [wallet.address, type],
      target: () => document.querySelector('#root'),
      isNoMore: (d) => d?.hasMore === false,
    },
  );

  const columns = useMemo(() => {
    const tradeColumns = [
      {
        key: 'symbol',
        title: t({ enUS: 'Symbol', zhCN: '产品' }),
        render: (_, it) => {
          if (!it.tradeInfoDTO) return;
          return `${
            {
              DNT: 'Rangebound',
              BULL_TREND: 'Bull Trend',
              BEAR_TREND: 'Bear Trend',
            }[it.tradeInfoDTO.rfqType]
          }_${displayExpiry(
            it.tradeInfoDTO.expiry * 1000,
          )}_${it.tradeInfoDTO.anchorPrices.join('-')}`;
        },
      },
      {
        key: 'product',
        title: t({ enUS: 'Type', zhCN: '类型' }),
        render: (_, it) =>
          `${it.tradeInfoDTO?.depositCcy} ${it.categoryText.toUpperCase()}`,
      },
    ] as ColumnProps<PointItem>[];
    const gameColumns = [
      // {
      //   key: 'type',
      //   title: t({ enUS: 'Type', zhCN: '类型' }),
      //   render: (_, it) => it.categoryText,
      // },
      // {
      //   key: 'type-detail',
      //   title: t({ enUS: 'Type Detail', zhCN: '类型补充' }),
      //   render: (_, it) => it.otherConvertInfoDTO?.type,
      // },
    ] as ColumnProps<PointItem>[];
    const tgColumns = [
      {
        key: 'tg',
        title: 'TG账号',
        render: (_, it) => it.tgConvertInfoDTO?.tgId || '-',
      },
    ] as ColumnProps<PointItem>[];

    return [
      {
        key: 'time',
        title: t({ enUS: 'Time', zhCN: '时间' }),
        render: (_, it) =>
          dayjs(it.generateTimeSeconds * 1000).format('MMM DD YYYY'),
      },
      {
        key: 'points',
        title: t({ enUS: 'Points', zhCN: '积分' }),
        render: (_, it) => (
          <span className={styles['td-points']}>{it.points}</span>
        ),
      },
      ...(type === PointType.TRADE ? tradeColumns : []),
      ...(type === PointType.GAME ? gameColumns : []),
      ...(type === PointType.TG ? tgColumns : []),
    ] as ColumnProps<PointItem>[];
  }, [t, type]);

  return (
    <div className={styles['point-records']}>
      <h3 className={styles['title']} id="point-records">
        {t({ enUS: 'Points Record', zhCN: '积分记录' })}
      </h3>
      <p className={styles['tips']}>
        {t({
          enUS: 'Due to calculation requirements, there may be a delay in points tallying.',
          zhCN: '由于计算需求，积分统计可能会有延迟。',
        })}
      </p>
      <RadioBtnGroup
        className={styles['btns']}
        options={options}
        value={type}
        onChange={(v) => setType(v as PointType)}
      />
      <Table
        className={classNames(styles['table'], 'semi-always-dark')}
        columns={columns}
        dataSource={data?.list}
        pagination={false}
        loading={loading && data?.type != type}
      />
    </div>
  );
};
