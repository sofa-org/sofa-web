import { useMemo, useState } from 'react';
import { Spin } from '@douyinfe/semi-ui';
import { Button } from '@douyinfe/semi-ui';
import {
  AutomatorDepositStatus,
  AutomatorInfo,
  AutomatorService,
} from '@sofa/services/automator';
import { AutomatorVaultInfo, ProjectType } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { ChainMap } from '@sofa/services/chains';
import { ContractsService } from '@sofa/services/contracts';
import { TFunction, useTranslation } from '@sofa/services/i18n';
import { updateQuery } from '@sofa/utils/history';
import { useLazyCallback, useQuery } from '@sofa/utils/hooks';
import { arrToDict } from '@sofa/utils/object';
import { formatHighlightedText } from '@sofa/utils/string';
import { useRequest } from 'ahooks';
import classNames from 'classnames';

import CEmpty from '@/components/Empty';
import { ProjectTypeRefs } from '@/components/ProductSelector/enums';
import TopTabs from '@/components/TopTabs';
import { useWalletStore } from '@/components/WalletConnector/store';

import { Comp as IconPoints } from './assets/icon-points.svg';
import { Comp as IconShare } from './assets/icon-share.svg';
import { Comp as IconZero } from './assets/icon-zero.svg';
import { AutomatorCreateModel } from './index-model';
import {
  automatorCreateConfigs,
  getNameForChain,
  useAutomatorCreateStore,
} from './store';

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
  const [modelVisible, setModelVisible] = useState(false);

  const [faqExpanded, setFaqExpanded] = useState<Record<number, boolean>>({
    [0]: true,
  });
  const onFaqTitleClicked = useLazyCallback((idx: number) => {
    setFaqExpanded({ [idx]: true });
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
          <ol className={styles['steps']}>
            <li>
              <span className={styles['step']}>
                {t({
                  enUS: 'Step 1',
                })}
              </span>
              <span>
                {formatHighlightedText(
                  t(
                    {
                      enUS: 'Burn {{amount}} RCH on [[{{chainName}}]]',
                    },
                    {
                      amount: automatorCreateConfigs.rchAmountToBurn,
                      chainName: getNameForChain(
                        automatorCreateConfigs.chainIdToBurnRch,
                        t,
                      ),
                    },
                  ),
                  {
                    hightlightedClassName: styles['highlighted'],
                  },
                )}
              </span>
            </li>
            <li>
              <span className={styles['step']}>
                {t({
                  enUS: 'Step 2',
                })}
              </span>
              <span>
                {formatHighlightedText(
                  t({
                    enUS: 'Enter Automator Details & Pay Gas Fees to Deploy Automator Contract on [[You Selected Chain]]',
                  }),
                  {
                    hightlightedClassName: styles['highlighted'],
                  },
                )}
              </span>
            </li>
          </ol>
          <Button
            size="large"
            className={classNames(styles['btn-create'], 'btn-primary')}
            onClick={() => {
              useAutomatorCreateStore.getState().reset();
              setModelVisible(true);
            }}
          >
            {t({
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
