import { useState } from 'react';
import { Select, Tooltip } from '@douyinfe/semi-ui';
import { Button } from '@douyinfe/semi-ui';
import { AutomatorService } from '@sofa/services/automator';
import { ProjectType } from '@sofa/services/base-type';
import { ChainMap } from '@sofa/services/chains';
import { TFunction, useTranslation } from '@sofa/services/i18n';
import { useLazyCallback } from '@sofa/utils/hooks';
import { useRequest } from 'ahooks';
import classNames from 'classnames';
import { uniq } from 'lodash-es';

import { ProjectTypeRefs } from '@/components/ProductSelector/enums';
import TopTabs from '@/components/TopTabs';
import {
  useWalletStore,
  useWalletUIState,
} from '@/components/WalletConnector/store';

import { Comp as IconPoints } from './assets/icon-points.svg';
import { Comp as IconShare } from './assets/icon-share.svg';
import { Comp as IconZero } from './assets/icon-zero.svg';
import { AutomatorCreateModel } from './index-model';
import { useAutomatorCreateStore } from './store';

import styles from './index.module.scss';

const FAQ = (t: TFunction) => {
  return [
    {
      title: t({
        enUS: 'What is Automator & AutoMator Leader?',
      }),
      desc: t({
        enUS: 'What is Automator & AutoMator Leader What is Automator & AutoMator Leader What is Automator & AutoMator Leader?What is Automator & AutoMator Leader What is Automator & AutoMator Leader What is Automator & AutoMator Leader What is Automator & AutoMator LeaderWhat is Automator & AutoMator LeaderWhat is Automator & AutoMator LeaderWhat is Automator & AutoMator AutoMator LeaderWhat is Automator & AutoMatorAutoMator LeaderWhat is Automator & AutoMatorAutoMator',
      }),
    },

    {
      title: t({
        enUS: 'What are the benefits of becoming Automator Leader?',
      }),
      desc: t({
        enUS: 'What are the benefits of becoming Automator Leader? Leader What is Automator & AutoMator Leader What is Automator & AutoMator Leader?What is Automator & AutoMator Leader What is Automator & AutoMator Leader What is Automator & AutoMator Leader What is Automator & AutoMator LeaderWhat is Automator & AutoMator LeaderWhat is Automator & AutoMator LeaderWhat is Automator & AutoMator AutoMator LeaderWhat is Automator & AutoMatorAutoMator LeaderWhat is Automator & AutoMatorAutoMator',
      }),
    },
    {
      title: t({
        enUS: 'What does Automator Leader need to do?',
      }),
      desc: t({
        enUS: 'What does Automator Leader need to do? What is Automator & AutoMator Leader What is Automator & AutoMator Leader?What is Automator & AutoMator Leader What is Automator & AutoMator Leader What is Automator & AutoMator Leader What is Automator & AutoMator LeaderWhat is Automator & AutoMator LeaderWhat is Automator & AutoMator LeaderWhat is Automator & AutoMator AutoMator LeaderWhat is Automator & AutoMatorAutoMator LeaderWhat is Automator & AutoMatorAutoMator',
      }),
    },
    {
      title: t({
        enUS: 'How to create Automator?',
      }),
      desc: t({
        enUS: 'How to create Automator? What is Automator & AutoMator Leader What is Automator & AutoMator Leader?What is Automator & AutoMator Leader What is Automator & AutoMator Leader What is Automator & AutoMator Leader What is Automator & AutoMator LeaderWhat is Automator & AutoMator LeaderWhat is Automator & AutoMator LeaderWhat is Automator & AutoMator AutoMator LeaderWhat is Automator & AutoMatorAutoMator LeaderWhat is Automator & AutoMatorAutoMator',
      }),
    },
    {
      title: t({
        enUS: 'How to use Automator for trading and position management?',
      }),
      desc: t({
        enUS: 'How to use Automator for trading and position management? What is Automator & AutoMator Leader What is Automator & AutoMator Leader?What is Automator & AutoMator Leader What is Automator & AutoMator Leader What is Automator & AutoMator Leader What is Automator & AutoMator LeaderWhat is Automator & AutoMator LeaderWhat is Automator & AutoMator LeaderWhat is Automator & AutoMator AutoMator LeaderWhat is Automator & AutoMatorAutoMator LeaderWhat is Automator & AutoMatorAutoMator',
      }),
    },
  ];
};

const AutomatorCreate = () => {
  const [t] = useTranslation('AutomatorCreate');
  const wallet = useWalletStore((state) => state);
  const { bringUpConnect } = useWalletUIState();
  const [modelVisible, setModelVisible] = useState(false);
  const { payload, updatePayload, updateConfig } = useAutomatorCreateStore();
  const [faqExpanded, setFaqExpanded] = useState<Record<number, boolean>>({
    [0]: true,
  });
  const onFaqTitleClicked = useLazyCallback((idx: number) => {
    setFaqExpanded({ [idx]: true });
  });
  const { data, loading } = useRequest(
    async () => AutomatorService.getCreateConfigs(),
    {
      refreshDeps: [wallet.address, wallet.chainId],
    },
  );
  return (
    <>
      <TopTabs
        type={'banner-expandable'}
        className={styles['container']}
        tabClassName={styles['tabs']}
        banner={
          <>
            <h1 className={styles['head-title']}>
              {ProjectTypeRefs[ProjectType.Automator].icon}
              {t({
                enUS: 'Create A Automator, Showcase Your Strategy',
              })}
            </h1>
          </>
        }
        dark
        options={[]}
      >
        <div className={classNames(styles['form'], styles['intro'])}>
          <Select
            className={styles['select-chain']}
            insetLabel={
              <span className={styles['select-label']}>
                {t({
                  enUS: 'Automator Chain',
                })}
              </span>
            }
            loading={loading}
            onChange={(v) =>
              updatePayload({
                chainId: v as number,
              })
            }
          >
            {data &&
              uniq(data.configs.map((c) => c.chainId)).map((chainId) => (
                <Select.Option value={chainId}>
                  <img
                    className={styles['logo']}
                    src={ChainMap[wallet.chainId!].icon}
                    alt=""
                  />
                  <span>{ChainMap[chainId].name}</span>
                </Select.Option>
              ))}
          </Select>
          <Tooltip
            key={payload.chainId ? 'chain-selected' : 'chain-not-selected'}
            trigger={payload.chainId ? 'custom' : undefined}
            visible={!payload.chainId}
            content={
              payload.chainId
                ? undefined
                : t({
                    enUS: 'Please select Automator Chain first',
                  })
            }
          >
            <Select
              className={styles['select-deposit-token']}
              insetLabel={
                <span className={styles['select-label']}>
                  {t({
                    enUS: 'Deposit Token',
                  })}
                </span>
              }
              loading={loading}
              disabled={!payload?.chainId}
              onChange={(v) =>
                updatePayload({
                  depositCcy: v as string,
                })
              }
            >
              {data &&
                uniq(
                  data.configs
                    .filter((c) => c.chainId == payload?.chainId)
                    .map((c) => c.depositCcy),
                ).map((depositCcy) => (
                  <Select.Option value={depositCcy}>
                    <span>{depositCcy}</span>
                  </Select.Option>
                ))}
            </Select>
          </Tooltip>
          <Button
            size="large"
            className={classNames(styles['btn-create'], 'btn-primary')}
            disabled={
              (wallet.address && !(payload.chainId && payload.depositCcy)) ||
              false
            }
            onClick={() => {
              if (!wallet.address) {
                bringUpConnect();
                return;
              }
              if (!data) {
                return;
              }
              const config = data.configs.find(
                (c) =>
                  c.depositCcy == payload.depositCcy &&
                  c.chainId == payload.chainId,
              );
              if (!config) {
                return;
              }
              useAutomatorCreateStore.getState().reset();
              updateConfig(config);
              setModelVisible(true);
            }}
          >
            {!wallet.address
              ? t({
                  enUS: 'Connect Wallet',
                })
              : t({
                  enUS: 'Burn RCH & Create Your Automator',
                })}
          </Button>
          <ul className={styles['features']}>
            <li>
              <IconZero />
              <div className={styles['title']}>{t('Zero Trading Fees')}</div>
              <div className={styles['desc']}>
                {t(
                  'Enjoy 0 trading fees when executing trades through your AutoMator.',
                )}
              </div>
            </li>
            <li>
              <IconShare />
              <div className={styles['title']}>{t('Share Profits')}</div>
              <div className={styles['desc']}>
                {t(
                  'Earn up to 15% profit share from the users who subscribe to your AutoMator.',
                )}
              </div>
            </li>
            <li>
              <IconPoints />
              <div className={styles['title']}>{t('SOFA Points')}</div>
              <div className={styles['desc']}>
                {t('Get More SOFA Points BALABALA BALA')}
              </div>
            </li>
          </ul>
        </div>
        <div className={classNames(styles['form'], styles['faq'])}>
          <h2>{t('FAQ')}</h2>
          <ol className={styles['faq-ol']}>
            {FAQ(t).map((faq, idx) => (
              <li
                className={
                  faqExpanded[idx] ? styles['expended'] : styles['folded']
                }
              >
                <div
                  className={styles['title']}
                  onClick={() => onFaqTitleClicked(idx)}
                >
                  {faq.title}
                </div>
                {faqExpanded[idx] ? (
                  <div className={styles['desc']}>{faq.desc}</div>
                ) : undefined}
              </li>
            ))}
          </ol>
        </div>
      </TopTabs>
      <AutomatorCreateModel
        value={modelVisible}
        onChange={(v) => setModelVisible(v || false)}
      />
    </>
  );
};

export default AutomatorCreate;
