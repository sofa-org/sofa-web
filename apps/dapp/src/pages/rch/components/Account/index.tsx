import { useEffect, useRef } from 'react';
import { Button, Toast } from '@douyinfe/semi-ui';
import { ChainMap, defaultChain } from '@sofa/services/chains';
import { ContractsService } from '@sofa/services/contracts';
import { useTranslation } from '@sofa/services/i18n';
import { amountFormatter } from '@sofa/utils/amount';
import { Env } from '@sofa/utils/env';
import classNames from 'classnames';

import Address from '@/components/Address';
import AsyncButton from '@/components/AsyncButton';
import { useIndexPrices } from '@/components/IndexPrices/store';
import SplineModel from '@/components/SplineModel';
import WalletConnector from '@/components/WalletConnector';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';

import { useRCHState } from '../../store';
import { RCHHistory, RCHHistoryRef } from '../RCHHistory';

import ChestPng from './assets/chest.png';
import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'Account');

const Account = () => {
  const [t] = useTranslation('Account');
  const ref = useRef<RCHHistoryRef>(null);
  const wallet = useWalletStore();
  useEffect(() => {
    useWalletStore.updateBalanceByTokenContract(
      ContractsService.rchAddress(),
      defaultChain.chainId,
    );
  }, [wallet.address]);

  const prices = useIndexPrices((state) => state.prices);

  const claimableList = useRCHState((state) => state.claimableList());
  const claimableAmount = useRCHState((state) => state.claimableAmount());
  const totalAmount = useRCHState((state) => state.totalAmount());

  const selectedClaimableList = useRCHState(
    (state) =>
      state
        .claimableList()
        ?.filter((it) => state.selectedAirdropKeys.includes(it.timestamp)),
  );

  return (
    <div className={styles['account']}>
      <div className={styles['left']}>
        <div className={styles['avatar']}>
          <SplineModel id="flower" />
        </div>
        <div className={styles['info-item']}>
          <div className={styles['label']}>{t('Contract Address')}</div>
          <div className={styles['value']}>
            {wallet?.address ? (
              <Address
                address={ContractsService.rchAddress()}
                prefix={
                  <>
                    <img
                      className={styles['logo']}
                      src={ChainMap[wallet.chainId!].icon}
                      alt=""
                    />
                    {wallet.icon && (
                      <img
                        className={styles['logo']}
                        src={wallet.icon}
                        alt=""
                      />
                    )}
                  </>
                }
              />
            ) : (
              <WalletConnector>{t('Connect Wallet')}</WalletConnector>
            )}
          </div>
        </div>
        <div className={styles['info-item']}>
          <div className={styles['label']}>{t('My RCH')}</div>
          <div className={styles['value']}>
            <div className={styles['rch-amount']}>
              {amountFormatter(wallet.balance?.RCH, 4)}
            </div>
            <div className={styles['cvt-value']}>
              ≈ $
              {amountFormatter(
                Number(wallet.balance?.RCH) * Number(prices.RCH),
                4,
              )}
            </div>
          </div>
        </div>
        <Button
          className={classNames(styles['btn'], 'btn-ghost')}
          onClick={() => {
            const link = ChainMap[defaultChain.chainId].uniswapUrl.replace(
              '{address}',
              ChainMap[defaultChain.chainId].rchAddress,
            );
            window.open(link, 'uniswap');
          }}
        >
          {wallet.icon && (
            <img className={styles['logo']} src={wallet.icon} alt="" />
          )}
          <span>{t('Buy on Uniswap')}</span>
        </Button>
        <a
          className={classNames(styles['btn'], styles['btn-game-center'])}
          href="/rch-game-center"
        >
          <img src={ChestPng} />
          <span>
            {t({
              enUS: 'RCH Game Center',
              zhCN: 'RCH 游戏中心',
            })}
          </span>
          <i />
        </a>
        <span className={classNames(styles['desc-game-center'])}>
          {t({
            enUS: 'Click To Join Now and Win RCH',
            zhCN: '点击参与赢 RCH',
          })}
        </span>
      </div>
      <div className={styles['right']}>
        <div className={styles['claimable-infos']}>
          <div className={styles['label']}>{t('Claimable RCH')}</div>
          <div className={styles['value']}>
            {amountFormatter(claimableAmount, 4)}
          </div>
          <div className={styles['cvt-value']}>
            ≈ $
            {amountFormatter(Number(claimableAmount) * Number(prices?.RCH), 2)}
          </div>
          <a
            className={styles['link']}
            href="https://docs.sofa.org/tokenomics/"
            target={Env.isMetaMaskAndroid ? undefined : '_blank'}
          >
            {t('How to get RCH airdrop?')}
          </a>
          <div className={styles['btns']}>
            {!!claimableList?.length && (
              <AsyncButton
                theme="solid"
                type="primary"
                onClick={() =>
                  useRCHState.claimBatch().then(() => {
                    Toast.info(t('Claim successful'));
                    useWalletStore.updateBalanceByTokenContract(
                      ContractsService.rchAddress(),
                      defaultChain.chainId,
                    );
                    ref.current?.refresh();
                  })
                }
              >
                {t({ enUS: 'Claim All', zhCN: '领取全部' })}
              </AsyncButton>
            )}
            {!!claimableList?.length && (
              <AsyncButton
                theme="solid"
                type="primary"
                onClick={() =>
                  useRCHState.claimBatch(true).then(() => {
                    Toast.info(t('Claim successful'));
                    useWalletStore.updateBalanceByTokenContract(
                      ContractsService.rchAddress(),
                      defaultChain.chainId,
                    );
                    ref.current?.refresh();
                  })
                }
              >
                {t({ enUS: 'Claim Selected', zhCN: '领取选中的' })}(
                {selectedClaimableList?.length || 0})
              </AsyncButton>
            )}
          </div>
        </div>
        <div className={styles['history']}>
          <div className={styles['total']}>
            <div className={styles['label']}>
              {t('Cumulative RCH Airdrops Received')}
            </div>
            <div className={styles['value']}>
              {amountFormatter(totalAmount, 4)} RCH
              <span className={styles['cvt-value']}>
                ≈ $
                {amountFormatter(Number(totalAmount) * Number(prices.RCH), 4)}
              </span>
            </div>
          </div>
          <RCHHistory ref={ref} />
        </div>
      </div>
    </div>
  );
};

export default Account;
