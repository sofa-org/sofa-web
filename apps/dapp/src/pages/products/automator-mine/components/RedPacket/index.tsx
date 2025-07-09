import { useEffect, useState } from 'react';
import { Modal, Toast } from '@douyinfe/semi-ui';
import { AutomatorUserService } from '@sofa/services/automator-user';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { amountFormatter } from '@sofa/utils/amount';
import { getErrorMsg } from '@sofa/utils/fns';
import classNames from 'classnames';

import AmountInput from '@/components/AmountInput';
import AsyncButton from '@/components/AsyncButton';
import { useWalletStore } from '@/components/WalletConnector/store';

import styles from './index.module.scss';

export const RedPacket = (props: { automator: AutomatorVaultInfo }) => {
  const [t] = useTranslation('AutomatorCreatorCard');
  const [visible, setVisible] = useState(false);
  const [amount, setAmount] = useState<string | number>();

  const wallet = useWalletStore();
  useEffect(() => {
    if (props.automator) {
      useWalletStore.updateBalanceByAutomatorVault(props.automator);
    }
  }, [props.automator, wallet.address]);

  const balance = wallet.balance?.[props.automator.depositCcy];

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <AsyncButton
        className={classNames(styles['btn'], 'btn-ghost')}
        onClick={() => {
          setVisible(true);
        }}
      >
        {t({ enUS: 'Send Bonus', zhCN: '发红包' })}
      </AsyncButton>
      <Modal
        title={t({ enUS: 'Send Bonus to Followers', zhCN: '向订阅用户发红包' })}
        visible={visible}
        onCancel={() => {
          setVisible(false);
          setAmount(undefined);
        }}
        onOk={() => {
          if (!Number(amount) || Number(amount) < 0)
            Toast.error(t({ enUS: 'Invalid amount', zhCN: '金额不对' }));
          if (Number(amount) > Number(balance))
            Toast.error(t({ enUS: 'Insufficient balance', zhCN: '金额不足' }));
          else
            return AutomatorUserService.sendRedPacket(props.automator, amount!)
              .then(() => {
                Toast.info(
                  t({ enUS: 'Bonus has been recharged', zhCN: '发送成功' }),
                );
                setVisible(false);
              })
              .catch((err) => Toast.error(getErrorMsg(err)));
        }}
      >
        <p className="desc">
          {t({
            enUS: 'Thank your followers for their support by sending them a bonus. The bonus will be split based on how much each user has invested.',
            zhCN: '向订阅你的 Automator 的用户发红包表达感谢。红包奖金将按照大家的份额分配',
          })}
        </p>
        <AmountInput
          className={styles['amount-input']}
          value={amount}
          onChange={setAmount}
          prefix={t({ enUS: 'Bonus', zhCN: '金额' })}
          suffix={props.automator.depositCcy}
          placeholder={t({ enUS: 'Amount', zhCN: '输入金额' })}
        />
        <div className={styles['balance']}>
          <span className={styles['label']}>
            {t({ enUS: 'Wallet Balance', zhCN: '钱包余额' })}
          </span>
          <span className={styles['value']}>
            {amountFormatter(balance, 2)} {props.automator.depositCcy}
          </span>
        </div>
      </Modal>
    </div>
  );
};
