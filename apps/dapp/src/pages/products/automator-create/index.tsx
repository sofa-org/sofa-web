import { useEffect, useMemo, useState } from 'react';
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
import { addI18nResources } from '@/locales';

import { Comp as IconInfo } from './assets/icon-info.svg';
import { Comp as IconPoints } from './assets/icon-points.svg';
import { Comp as IconShare } from './assets/icon-share.svg';
import { Comp as IconZero } from './assets/icon-zero.svg';
import { AutomatorCreateModel } from './index-model';
import locale from './locale';
import { useAutomatorCreateStore } from './store';

addI18nResources(locale, 'AutomatorCreate');

import { useAutomatorCreatorStore } from '../automator-mine/store';

import styles from './index.module.scss';

const FAQ = (t: TFunction) => {
  // const [t] = useTranslation('AutomatorCreate');
  return [
    {
      title: t({
        enUS: 'How does Automator work?',
      }),
      desc: t({
        enUS: `Automator involves three key participants: <b>Users</b>, <b>Optivisors</b>, and <b>Market Makers</b>.

1. <b>Users</b>
Users can select their preferred Automator and deposit tokens. Under the Optivisor’s expertise, the Automator generates returns, which are distributed among participating users. Additionally, users benefit from incentive $RCH token airdrops as part of their participation.

2. <b>Optivisors</b>
Optivisors are responsible for creating Automators and executing trading strategies—such as bullish and bearish positions—by interacting with SOFA Vaults. As a reward f inor their expertise, Optivisors earn a share of the profits.

3. <b>Market Makers</b>
Similar to other SOFA products, Market Makers provide pricing for SOFA Vaults. Optivisors managers leverage these quotes to allocate Automator funds and participate in SOFA Vault strategies. Once these strategies are settled, profits are distributed accordingly.
Automator is an evolution of the SOFA protocol, offering a streamlined and cost-efficient way for users to participate while maximizing their potential returns.`,
      }),
    },

    {
      title: t({
        enUS: 'What fees will I be charged?',
      }),
      desc: t({
        enUS: `The protocol charges a 15% service fee on the profits generated by Automators. If no profit is generated, no service fees are charged.

Optivisors can also set a management fee when creating an Automator. This fee applies only to profits but is recorded as a liability during periods of losses. <b>The Optivisor can only collect management fees again once the Automator’s cumulative profits turn positive.</b>`,
      }),
    },
    {
      title: t({
        enUS: 'How to become an Optivisor and create an Automator?',
      }),
      desc: t(
        {
          enUS: `Anyone can create an Automator as an Optivisor. However, each address is limited to creating one Automator per chain and deposit token type. To unlock the strategy quota, the Optivisor must burn {{burnAmount}} $RCH tokens.`,
        },
        {
          burnAmount: AutomatorCreatorService.rchAmountForBurning,
        },
      ),
    },
    {
      title: t({
        enUS: 'How about the gas fees within the Automator?',
      }),
      desc: t({
        enUS: 'The Optivisor is responsible for covering all gas fees related to transactions executed within the Automator.',
      }),
    },
    {
      title: t({
        enUS: 'How can I withdraw my funds after depositing into an Automator?',
      }),
      desc: t({
        enUS: `Automators operate similarly to funds, incorporating a redemption lock-up period to manage liquidity and ensure effective strategy execution. You can initiate a withdrawal at any time, but you must wait for the <u>Redemption Lock-up period</u> to end before completing the <b>Claim</b> process.

The redemption lock-up period is determined by the Optivisor during the Automator's creation and can vary based on the specific setup, with a maximum duration of 30 days.`,
      }),
    },
    {
      title: t({
        enUS: 'What kinds of returns can I expect with an Automator?',
      }),
      desc: t({
        enUS: `Automator returns are composed of three key components:

1. <b>Interest</b>
- Funds deposited into the Automator are automatically staked in low-risk protocols like Aave or Curve, generating passive interest.
- These returns are updated in real-time and distributed to users based on their share when withdrawing.

2. <b>Trading PNL</b>
- Returns generated from the Optivisor’s trading strategies
- These returns are reflected only after the trading strategy expires, allowing the Optivisor to claim the positions. Users receive their share upon withdrawal.

3. <b>$RCH incentive</b>
- $RCH token airdrops earned through the Optivisor’s trading activities.
- Airdrops are distributed daily based on the current holders of the Automator and their respective ownership shares. Users can claim their $RCH tokens directly from the Claim $RCH page.`,
      }),
    },
    {
      title: t({
        enUS: 'What are the risks associated with using an Automator?',
      }),
      desc: t({
        enUS: `Automator involves risks, as the Optivisor manages the funds deposited by users to execute options trading strategies and allocate them to low-risk protocols for earning interest. The Optivisor’s decisions play a crucial role in shaping the Automator’s risk and return profile.

Specifically, the Optivisor decides how to allocate funds between generating returns in low-risk protocols and using either the interest earned or the principal for options trading. The higher the proportion of principal allocated to options trading—rather than relying primarily on interest earnings—the greater the associated risk.

When creating an Automator, Optivisors must set a buffer limit for the total funds they manage. For example, if the buffer is set at 10%, the Optivisor can use up to 90% of the total pool for options trading. This buffer acts as a safeguard and ensures disciplined fund allocation. Users can see this buffer percentage for each Automator, enabling them to choose based on their risk preferences—different buffers reflect different risk levels.

SOFA does not enforce risk-free trading, and there is a possibility of losing your principal depending on the Optivisor’s chosen strategy. Please evaluate your risk tolerance carefully before participating and proceed with caution.`,
      }),
    },
    {
      title: t({
        enUS: "How is the $RCH airdrop generated and distributed to user's account?",
      }),
      desc: t({
        enUS: `$RCH tokens are earned through the Optivisor's trading activities and can be claimed by users afterward, just like in other SOFA Vaults. You can check the $RCH airdrop info here: <a href="_blank" href="https://docs.sofa.org/tokenomics/">https://docs.sofa.org/tokenomics/</a>`,
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
  const { vaults } = useAutomatorCreatorStore();
  useEffect(() => {
    if (wallet.address)
      useAutomatorCreatorStore.list(wallet.chainId, wallet.address);
  }, [wallet.address, wallet.chainId]);

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
            disabled={
              !!(
                wallet.address &&
                (!(chainId && token) || vaults[`${chainId}-${wallet.address}`])
              )
            }
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
              <div className={styles['title']}>
                {t('Earn Risk-Free Interest')}
              </div>
              <div className={styles['desc']}>
                {t(
                  'Funds in your Automator grow passively through AAVE/CRV, earning stable returns with zero risk.',
                )}
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
                  <div
                    className={styles['desc']}
                    dangerouslySetInnerHTML={{
                      __html: faq.desc.replace(/\n/g, '<br />'),
                    }}
                  />
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
