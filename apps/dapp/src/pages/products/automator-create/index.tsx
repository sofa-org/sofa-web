import { useEffect, useState } from 'react';
import { Select, Toast, Tooltip } from '@douyinfe/semi-ui';
import { Button } from '@douyinfe/semi-ui';
import { AutomatorCreatorService } from '@sofa/services/automator-creator';
import { AutomatorFactory, ProjectType } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { ChainMap } from '@sofa/services/chains';
import { TFunction, useTranslation } from '@sofa/services/i18n';
import { Env } from '@sofa/utils/env';
import { getErrorMsg } from '@sofa/utils/fns';
import { useLazyCallback } from '@sofa/utils/hooks';
import { useRequest } from 'ahooks';
import classNames from 'classnames';
import { uniq } from 'lodash-es';

import { useIsMobileUI } from '@/components/MobileOnly';
import { ProjectTypeRefs } from '@/components/ProductSelector/enums';
import TopTabs from '@/components/TopTabs';
import {
  useWalletStore,
  useWalletUIState,
} from '@/components/WalletConnector/store';

import { Comp as IconInfo } from './assets/icon-info.svg';
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
  const isMobileUI = useIsMobileUI();
  const [modelVisible, setModelVisible] = useState(false);
  const { updatePayload, reset } = useAutomatorCreateStore();
  const [chainId, setChainId] = useState(0);
  const [token, setToken] = useState('');

  const [faqExpanded, setFaqExpanded] = useState<Record<number, boolean>>({
    [0]: true,
  });
  const onFaqTitleClicked = useLazyCallback((idx: number) => {
    setFaqExpanded({ [idx]: true });
  });
  useEffect(() => {
    if (!wallet.address && modelVisible) {
      setModelVisible(false);
    }
  }, [wallet.address, modelVisible]);
  const { data, loading } = useRequest(
    async () =>
      AutomatorCreatorService.automatorFactories({
        chainId: wallet.chainId,
        wallet: wallet.address!,
      }),
    {
      refreshDeps: [wallet.address, wallet.chainId],
      onError: (e) => {
        console.error(e);
        Toast.error(getErrorMsg(e));
      },
    },
  );
  const onStartClick = useLazyCallback(() => {
    if (!wallet.address) {
      bringUpConnect();
      return;
    }
    if (!data) {
      return;
    }
    const factory = data.find(
      (c) => c.clientDepositCcy == token && c.chainId == chainId,
    );
    if (!factory) {
      return;
    }
    reset();
    updatePayload({
      factory,
    });
    setModelVisible(true);
  });
  return (
    <>
      <TopTabs
        type={'banner-expandable'}
        className={styles['container']}
        tabClassName={styles['tabs']}
        banner={
          <>
            <h1 className={styles['head-title']}>
              {ProjectTypeRefs[ProjectType.Automator]?.icon}
              {t({
                enUS: 'Create A Automator, Showcase Your Strategy',
              })}
            </h1>
          </>
        }
        dark
        options={[]}
      >
        <div
          className={classNames(styles['form'], styles['intro'], {
            [styles['mobile-ui']]: isMobileUI,
          })}
        >
          <div className={classNames(styles['chain-and-ccy'])}>
            <Select
              className={styles['select-chain']}
              insetLabel={
                <span className={styles['select-label']}>
                  {t({
                    enUS: 'Automator Chain',
                  })}
                </span>
              }
              suffix={
                chainId ? undefined : (
                  <span className={styles['select-label']}>
                    {t({
                      enUS: 'Select',
                    })}
                  </span>
                )
              }
              loading={loading}
              onChange={(v) => setChainId(v as number)}
            >
              {data &&
                uniq(data.map((c) => c.chainId)).map((chainId) => (
                  <Select.Option value={chainId}>
                    <img
                      className={styles['logo']}
                      src={ChainMap[chainId]?.icon}
                      alt=""
                    />
                    <span>{ChainMap[chainId]?.name}</span>
                  </Select.Option>
                ))}
            </Select>
            <Tooltip
              key={chainId ? 'chain-selected' : 'chain-not-selected'}
              trigger={chainId ? 'custom' : undefined}
              visible={!chainId}
              content={
                chainId
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
                suffix={
                  token ? undefined : (
                    <span className={styles['select-label']}>
                      {t({
                        enUS: 'Select',
                      })}
                    </span>
                  )
                }
                loading={loading}
                disabled={!chainId}
                onChange={(v) => setToken(v as string)}
              >
                {data &&
                  uniq(
                    data
                      .filter((c) => c.chainId == chainId)
                      .map((c) => c.clientDepositCcy),
                  ).map((depositCcy) => (
                    <Select.Option value={depositCcy}>
                      <img
                        className={styles['logo']}
                        src={CCYService.ccyConfigs[depositCcy]?.icon}
                        alt=""
                      />
                      <span>
                        {CCYService.ccyConfigs[depositCcy]?.name || depositCcy}
                      </span>
                    </Select.Option>
                  ))}
              </Select>
            </Tooltip>
          </div>
          <Button
            size="large"
            className={classNames(styles['btn-create'], 'btn-primary')}
            disabled={(wallet.address && !(chainId && token)) || false}
            onClick={onStartClick}
          >
            {!wallet.address
              ? t({
                  enUS: 'Connect Wallet',
                })
              : t({
                  enUS: 'Burn RCH & Create Your Automator',
                })}
          </Button>
          <div className={styles['tips']}>
            <IconInfo className={styles['icon-info']} />
            {t({
              enUS: 'Note: Each wallet address can create only one Automator per chain and deposit token combination.',
            })}
          </div>
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
