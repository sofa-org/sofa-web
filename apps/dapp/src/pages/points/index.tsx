import { Spin } from '@douyinfe/semi-ui';
import { scrollToElement } from '@livelybone/scroll-get';
import { ChainMap, defaultChain } from '@sofa/services/chains';
import { TFunction, useTranslation } from '@sofa/services/i18n';
import { PointService } from '@sofa/services/points';
import { amountFormatter } from '@sofa/utils/amount';
import { isNullLike } from '@sofa/utils/fns';
import { useRequest } from 'ahooks';
import classNames from 'classnames';

import logoUniswap from '@/assets/logo-uniswap.svg?url';
import WalletConnector from '@/components/WalletConnector';
import {
  useCheckServerAuth,
  useWalletStore,
} from '@/components/WalletConnector/store';
import { EnvLinks } from '@/env-links';

import gif from './assets/bg.gif';
import bgCloud from './assets/bg-cloud.png';
import icon1 from './assets/icon-1.png';
import icon2 from './assets/icon-2.png';
import icon3 from './assets/icon-3.png';
import icon4 from './assets/icon-4.png';
import iconDiscord from './assets/icon-discord.png';
import { Comp as IconMore } from './assets/icon-more.svg';
import iconPoints from './assets/icon-points.png';
import iconTelegram from './assets/icon-telegram.png';
import iconX from './assets/icon-x.png';
import img1 from './assets/img-1.png';
import img2 from './assets/img-2.png';
import { PointRecords } from './components/Records';

import styles from './index.module.scss';

const cards = [
  {
    icon: icon1,
    edge: (t: TFunction) => t({ enUS: 'Holder', zhCN: '持有者' }),
    title: (t: TFunction) =>
      t({ enUS: 'Hold RCH like a diamond', zhCN: '像钻石一样持有的 RCH' }),
    desc: (t: TFunction) =>
      t({
        enUS: 'Distributed according to the final snapshot data.',
        zhCN: '根据最终快照数据进行分发。',
      }),
    btns: [
      {
        icon: logoUniswap,
        txt: (t: TFunction) => t({ enUS: 'Purchase Now', zhCN: '去购买' }),
        onClick: () =>
          (window.location.href = ChainMap[
            defaultChain.chainId
          ].uniswapUrl.replace(
            '{address}',
            ChainMap[defaultChain.chainId].rchAddress,
          )),
      },
    ],
  },
  {
    icon: icon2,
    edge: (t: TFunction) => t({ enUS: 'SOFA Interaction', zhCN: 'SOFA 交互' }),
    title: (t: TFunction) =>
      t({
        enUS: 'Interact with Sofa products',
        zhCN: '与 Sofa 产品进行互动。',
      }),
    desc: (t: TFunction) =>
      t({
        enUS: 'Including but not limited to trading, gaming, and burning.',
        zhCN: '包括但不限于交易、游戏和销毁。',
      }),
    btns: [
      {
        icon: undefined,
        txt: (t: TFunction) => t({ enUS: 'Trade', zhCN: '交易' }),
        onClick: () => (window.location.href = EnvLinks.config.VITE_EARN_LINK),
      },
    ],
  },
  {
    icon: icon3,
    edge: (t: TFunction) => t({ enUS: 'Community', zhCN: '社区' }),
    title: (t: TFunction) =>
      t({
        enUS: "Participating in Sofa's community",
        zhCN: '参与 Sofa 的社区活动。',
      }),
    desc: (t: TFunction) =>
      t({
        enUS: 'Join in official social media accounts, engage in various community activities.',
        zhCN: '加入官方社交媒体账户，参与各种社区活动。',
      }),
    links: [
      { icon: iconX, link: 'https://x.com/SOFAorgDAO' },
      { icon: iconDiscord, link: 'https://discord.gg/sofaorg' },
      { icon: iconTelegram, link: 'https://t.me/SOFAorg' },
    ],
  },
  {
    icon: icon4,
    edge: (t: TFunction) => t({ enUS: 'One More Thing', zhCN: '更多' }),
    title: (t: TFunction) =>
      t({ enUS: 'Stay tuned to Sofa', zhCN: '持续关注 Sofa。​' }),
    desc: (t: TFunction) =>
      t({
        enUS: 'More Sofa ecosystem products are coming soon.',
        zhCN: '更多 Sofa 生态系统产品即将推出。​',
      }),
  },
];

const Points = () => {
  const [t] = useTranslation('Points');
  const wallet = useWalletStore();

  useCheckServerAuth();

  const { data: total, loading: totalLoading } = useRequest(
    async () => (!wallet.address ? undefined : PointService.total()),
    { refreshDeps: [wallet.address], pollingInterval: 10000 },
  );

  return (
    <>
      <section className={styles['section']}>
        <div className={styles['content']}>
          <h1 className={styles['title']}>
            {t({ enUS: 'SOFA Point', zhCN: 'SOFA 积分' })}
          </h1>
          <p className={styles['desc']}>
            {t({
              enUS: 'Are you ready for Sofa Airdrop?',
              zhCN: '准备好获取 SOFA 空投了吗？',
            })}
          </p>
          <WalletConnector
            className={styles['wallet-connector']}
            enableServerAuth
          />
        </div>
        <div className={styles['img-wrapper']}>
          <img className={styles['bg-gif']} src={gif} alt="" />
          <img className={styles['img-1']} src={img1} alt="" />
        </div>
      </section>
      <section className={styles['section']}>
        <div className={styles['img-wrapper-1']}>
          <img className={styles['bg-cloud']} src={bgCloud} alt="" />
          <img className={styles['img-2']} src={img2} alt="" />
        </div>
        <div className={styles['content']}>
          <h2 className={styles['title-1']}>
            {t({
              enUS: 'What can SOFA Points be used for?',
              zhCN: 'SOFA 积分有什么用？',
            })}
          </h2>
          <p className={styles['desc-1']}>
            {t({
              enUS: 'SOFA Points will later serve as the basis for our governance token <span style="color:yellow;font-weight:bold">SOFA Airdrop</span>.\nThere will also be some other points-related activities to participate in, please stay tuned.',
              zhCN: 'SOFA 积分将作为我们治理代币<span style="color:yellow;font-weight:bold"> SOFA 空投</span>的基础。\n之后还会有一些与积分相关的活动，敬请关注。',
            })
              .split(/\n/)
              .map((it) => (
                <span
                  key={it}
                  className={styles['desc-item']}
                  dangerouslySetInnerHTML={{ __html: it }}
                />
              ))}
          </p>
        </div>
        {wallet.address && (
          <Spin
            spinning={totalLoading && isNullLike(total)}
            wrapperClassName={styles['my-points']}
          >
            <h3>{t({ enUS: 'My Points', zhCN: '我的积分' })}</h3>
            <div className={styles['points-content']}>
              <div>
                <img src={iconPoints} alt="" />
                {amountFormatter(total)}
              </div>
              <span
                className={styles['card-btn']}
                onClick={() =>
                  scrollToElement(document.querySelector('#point-records')!, {
                    offset: -80,
                  })
                }
              >
                {t({ enUS: 'Details', zhCN: '详细' })}
              </span>
            </div>
          </Spin>
        )}
      </section>
      <section
        className={classNames(styles['section'], styles['section-column'])}
      >
        <h2 className={styles['title-2']}>
          <span>
            {t({ enUS: 'Ways to earn points', zhCN: '如何获得积分' })}
          </span>
          <a
            className={styles['btn-link']}
            href="https://docs.sofa.org/sofa-point/"
          >
            {t({ enUS: 'View the specific rules', zhCN: '查看规则' })}
            <IconMore />
          </a>
        </h2>
        <div className={styles['cards']}>
          {cards.map((it) => (
            <div className={styles['card']} key={it.icon}>
              <div className={styles['card-header']}>
                <img src={it.icon} alt="" />
                <div className={styles['card-header-right']}>
                  {it.btns?.map((btn) => (
                    <span
                      className={styles['card-btn']}
                      key={btn.txt(t)}
                      onClick={btn.onClick}
                    >
                      {btn.icon && <img src={btn.icon} alt="" />}
                      {btn.txt(t)}
                    </span>
                  ))}
                  {it.links?.map((link) => (
                    <a
                      className={styles['card-link']}
                      key={link.icon}
                      href={link.link}
                      target="__blank"
                    >
                      <img src={link.icon} alt="" />
                    </a>
                  ))}
                </div>
              </div>
              <div className={styles['card-content']}>
                <div className={styles['card-edge']}>{it.edge(t)}</div>
                <div className={styles['card-title']}>{it.title(t)}</div>
                <div className={styles['card-desc']}>{it.desc(t)}</div>
              </div>
            </div>
          ))}
        </div>
        {wallet.address && <PointRecords />}
      </section>
    </>
  );
};

export default Points;
