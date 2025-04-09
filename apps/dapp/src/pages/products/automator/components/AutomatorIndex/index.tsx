import { useEffect, useMemo, useState } from 'react';
import { Spin, Table } from '@douyinfe/semi-ui';
import { AutomatorDetail, AutomatorInfo } from '@sofa/services/automator';
import { AutomatorVaultInfo, VaultInfo } from '@sofa/services/base-type';
import { CCYService } from '@sofa/services/ccy';
import { ChainMap } from '@sofa/services/chains';
import { useTranslation } from '@sofa/services/i18n';
import { displayPercentage } from '@sofa/utils/amount';
import { Env } from '@sofa/utils/env';
import { MsIntervals } from '@sofa/utils/expiry';
import { useLazyCallback, useQuery } from '@sofa/utils/hooks';
import { formatDurationToDay } from '@sofa/utils/time';
import { usePrevious } from 'ahooks';
import classNames from 'classnames';

import Address from '@/components/Address';
import AmountDisplay from '@/components/AmountDisplay';
import CEmpty from '@/components/Empty';
import { useIsMobileUI } from '@/components/MobileOnly';
import { MsgDisplay } from '@/components/MsgDisplay';
import { useWalletStore } from '@/components/WalletConnector/store';
import { AutomatorRiskExposureMap } from '@/pages/products/automator-create/util';

import { AutomatorCard } from '../../../automator-market/components/Card';
import { useAutomatorMarketSelector } from '../../../automator-market/hooks';
import { ChainList } from '../../../components/AutomatorChainList';
import { useAutomatorModal } from '../../index-modal';
import { useAutomatorStore } from '../../store';

import styles from './index.module.scss';

export const AutomatorIndex = (props: BaseProps) => {
  const [t] = useTranslation('Automator');
  const { tab, v } = useQuery((p) => ({
    tab: p['automator-trade-tab'] as string,
    v: p['automator-vault'] as string,
  }));
  const { address } = useWalletStore((state) => state);
  const isMobileUI = useIsMobileUI();
  const { automator: vault, automators } = useAutomatorMarketSelector();
  const chains = useMemo(
    () =>
      (Env.isDaily ? [421614] : [1, 42161])
        .map((it) => ChainMap[it]?.name)
        .filter(Boolean)
        .join(', '),
    [],
  );

  const [modal, modalController] = useAutomatorModal();
  const wallet = useWalletStore((state) => state);

  useEffect(() => {
    return useAutomatorStore.subscribeVaults(wallet.chainId);
  }, [wallet.chainId]);

  const data = useAutomatorStore((state) => {
    const featuredVaultsByDepositCcy = Object.values(state.vaults || {}).reduce(
      (acc, it) => {
        if (!it) return acc;
        Object.values(it).forEach((element) => {
          const info =
            state.vaultOverviews[
              `${element.chainId}-${element.vault.toLowerCase()}-`
            ];
          if (
            !acc[element.depositCcy]?.yieldPercentage ||
            (info.yieldPercentage &&
              Date.now() - +info.vaultInfo.createTime > 30 * MsIntervals.day &&
              acc[element.depositCcy].yieldPercentage! < info.yieldPercentage)
          ) {
            acc[element.depositCcy] = info;
          }
        });
        return acc;
      },
      {} as Record<
        VaultInfo['depositCcy'],
        AutomatorInfo & Partial<AutomatorDetail>
      >,
    );

    return {
      vaultsOfCurrentChain: Object.values(
        state.vaults[wallet.chainId] || {},
      ).map(
        (it) =>
          state.vaultOverviews[`${it.chainId}-${it.vault.toLowerCase()}-`],
      ),
      featuredVaultsByDepositCcy: Object.values(featuredVaultsByDepositCcy)
        .sort((a, b) => {
          if (/btc/i.test(a.vaultInfo.depositCcy)) return -1;
          else if (/btc/i.test(b.vaultInfo.depositCcy)) return 1;
          if (/eth/i.test(a.vaultInfo.depositCcy)) return -1;
          else if (/eth/i.test(b.vaultInfo.depositCcy)) return 1;
          if (/crvusd/i.test(a.vaultInfo.depositCcy)) return -1;
          else if (/crvusd/i.test(b.vaultInfo.depositCcy)) return 1;
          if (/usd/i.test(a.vaultInfo.depositCcy)) return -1;
          else if (/usd/i.test(b.vaultInfo.depositCcy)) return 1;
          return 0;
        })
        .slice(0, 3),
    };
  });
  const [featuredVaultsByDepositCcy, setfeaturedVaultsByDepositCcy] = useState(
    data.featuredVaultsByDepositCcy,
  );
  useEffect(() => {
    if (featuredVaultsByDepositCcy.length < 3) {
      setfeaturedVaultsByDepositCcy(data.featuredVaultsByDepositCcy);
    }
  }, [data.featuredVaultsByDepositCcy, featuredVaultsByDepositCcy]);
  useEffect(() => {
    if (wallet.address)
      return useAutomatorStore.subscribeUserInfoList(
        wallet.chainId,
        wallet.address,
      );
  }, [wallet.address, wallet.chainId]);

  const handleSuccess = useLazyCallback(() => {
    if (vault && address) {
      useAutomatorStore.updateUserInfo(vault, address);
      useWalletStore.updateBalanceByAutomatorVault(vault);
    }
  });

  return (
    <>
      <div
        className={classNames(
          styles['section'],
          styles['section-top'],
          props.className,
        )}
      >
        {!vault && !automators.length ? (
          <div className={styles['switch-chain-alert']}>
            <CEmpty
              description={
                tab === 'holding'
                  ? undefined
                  : t(
                      {
                        enUS: 'There are no supported Automator contracts on this chain. Please switch to another chain, such as {{chains}}',
                        zhCN: '这条链上没有支持的 Automator 合约，请切换到其它的链，比如 {{chains}}',
                      },
                      { chains },
                    )
              }
            />
          </div>
        ) : (
          <>
            <div className={styles['featured-list']}>
              {featuredVaultsByDepositCcy.map((it) => (
                <div className={styles['featured']}>
                  <AutomatorCard
                    key={it.vaultInfo.vault}
                    modalController={modalController}
                    info={it}
                    showShareBtn={false}
                    onShareClicked={() => {}}
                    mode="featured"
                    switchChain
                  />
                </div>
              ))}
            </div>
            <ChainList />
            <Spin
              wrapperClassName={styles['automators-wrapper']}
              spinning={!data.vaultsOfCurrentChain.length}
            >
              <Table<AutomatorInfo>
                pagination={false}
                columns={[
                  {
                    title: t({ enUS: 'Network', zhCN: '网络' }),
                    render: (_, v) => (
                      <img src={ChainMap[v.vaultInfo.chainId]?.icon} alt="" />
                    ),
                  },
                  {
                    title: t({ enUS: 'Name', zhCN: '名称' }),
                    render: (_, v) => (
                      <div className={styles['header']}>
                        <img
                          src={
                            CCYService.ccyConfigs[v.vaultInfo.depositCcy]?.icon
                          }
                          alt=""
                        />
                        <div className={styles['name']}>
                          <MsgDisplay expandDisabled>
                            {v.vaultInfo.name || v.vaultInfo.depositCcy}
                          </MsgDisplay>
                        </div>
                        <Address
                          address={v.vaultInfo.vault.toLowerCase()}
                          simple
                          linkBtn
                        />
                      </div>
                    ),
                  },
                  {
                    title: t({ enUS: '7D Target Yield', zhCN: '7日年化' }),
                    render: (_, v) => (
                      <div
                        className={styles['apy']}
                        style={{
                          color:
                            +(v as AutomatorDetail).yieldPercentage >= 0
                              ? 'var(--color-rise)'
                              : 'var(--color-fall)',
                        }}
                      >
                        {+(v as AutomatorDetail).yieldPercentage >= 0 && '+'}
                        {displayPercentage(
                          +(v as AutomatorDetail).yieldPercentage / 100,
                        )}
                      </div>
                    ),
                  },
                  {
                    title: t({ enUS: "Pool Size & Optivisor's", zhCN: '持仓' }),
                    render: (_, v) => (
                      <>
                        <div className={styles['pool-size']}>
                          <AmountDisplay
                            amount={+v.aumByClientDepositCcy}
                            ccy={v.vaultInfo.depositCcy}
                          />
                          <span className={styles['unit']}>
                            {v.vaultInfo.depositCcy}
                          </span>
                        </div>
                        <div className={styles['creator']}>
                          <AmountDisplay
                            amount={v.creatorAmountByClientDepositCcy || 0}
                            ccy={v.vaultInfo.depositCcy}
                          />
                          <span className={styles['unit']}>
                            {v.vaultInfo.depositCcy}
                          </span>
                          <span className={styles['percent']}>
                            {displayPercentage(
                              Number(v.creatorAmountByVaultDepositCcy) /
                                Number(v.aumByVaultDepositCcy),
                            )}
                          </span>
                        </div>
                      </>
                    ),
                  },
                  {
                    title: t({ enUS: 'Deposit', zhCN: '存入币种' }),
                    render: (_, v) => (
                      <>
                        <div className={styles['deposit-ccy']}>
                          {CCYService.ccyConfigs[v.vaultInfo.depositCcy]
                            ?.name || v.vaultInfo.depositCcy}
                        </div>
                      </>
                    ),
                  },
                  {
                    title: t({ enUS: 'Risk', zhCN: '风险等级' }),
                    render: (_, v) => (
                      <>
                        <div
                          className={styles['risk']}
                          style={{
                            color:
                              AutomatorRiskExposureMap[
                                v.vaultInfo.riskExposure!
                              ]?.color || 'inherit',
                          }}
                        >
                          {AutomatorRiskExposureMap[v.vaultInfo.riskExposure!]
                            ?.label || 'R-'}
                        </div>
                      </>
                    ),
                  },
                  {
                    title: t({ enUS: 'Running', zhCN: '运行天数' }),
                    render: (_, v) => (
                      <>
                        <div className={styles['runtime']}>
                          {v.vaultInfo.createTime
                            ? formatDurationToDay(
                                Date.now() - +v.vaultInfo.createTime,
                              )
                            : '-'}
                        </div>
                      </>
                    ),
                  },
                  {
                    title: t({ enUS: 'Followers', zhCN: '投资人数' }),
                    render: (_, v) => (
                      <>
                        <div className={styles['people']}>
                          {v.currentParticipantNum || '-'}
                        </div>
                      </>
                    ),
                  },
                  {
                    title: t({ enUS: 'Fee', zhCN: '盈利抽成' }),
                    render: (_, v) => (
                      <>
                        <div className={styles['fee']}>
                          {displayPercentage(v.vaultInfo.creatorFeeRate, 0)}
                          <div className={styles['deposit-btn-mask']}>
                            <div
                              className={styles['deposit-btn']}
                              onClick={(e) => {
                                e.stopPropagation();
                                modalController.open(v.vaultInfo, 'deposit');
                              }}
                            >
                              <span>
                                {t({
                                  enUS: 'Deposit',
                                  zhCN: '存入',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    ),
                  },
                ]}
                dataSource={data.vaultsOfCurrentChain}
              />
            </Spin>
          </>
        )}
      </div>
      {modal}
    </>
  );
};
function ussPrevious(
  arg0: () => (AutomatorInfo & Partial<AutomatorDetail>)[],
  arg1: {
    vaultsOfCurrentChain: (AutomatorInfo & Partial<AutomatorDetail>)[];
    featuredVaultsByDepositCcy: (AutomatorInfo & Partial<AutomatorDetail>)[];
  }[],
) {
  throw new Error('Function not implemented.');
}
