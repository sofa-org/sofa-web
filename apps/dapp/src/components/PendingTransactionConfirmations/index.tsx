import { useEffect, useState } from 'react';
import { Button, Toast } from '@douyinfe/semi-ui';
import { TransactionStatus } from '@sofa/services/base-type';
import { ChainMap } from '@sofa/services/chains';
import { useTranslation } from '@sofa/services/i18n';
import {
  getPendingTransactionConfirmations,
  PendingTransactionConfirmation,
  subscribePendingTransactionConfirmations,
} from '@sofa/services/transaction-confirmation';
import { WalletService } from '@sofa/services/wallet';

import { HashDisplay } from '@/components/HashDisplay';
import { addI18nResources } from '@/locales';

import locale from './locale';

addI18nResources(locale, 'PendingTransactionConfirmations');

export const PendingTransactionConfirmations = ({
  visible,
}: {
  visible: boolean;
}) => {
  const [t] = useTranslation('PendingTransactionConfirmations');
  const [items, setItems] = useState<PendingTransactionConfirmation[]>([]);
  const [checking, setChecking] = useState<string>();
  const refresh = () => setItems(getPendingTransactionConfirmations());
  useEffect(() => {
    if (!visible) return;
    const unsubscribe = subscribePendingTransactionConfirmations(refresh);
    refresh();
    return unsubscribe;
  }, [visible]);
  if (!visible || !items.length) return null;
  return (
    <section
      style={{
        margin: '16px 0',
        padding: 12,
        border: '1px solid rgba(255,255,255,.16)',
        borderRadius: 8,
      }}
    >
      <strong>{t('Transactions awaiting confirmation')}</strong>
      <p>
        {t(
          'A transaction is awaiting confirmation. Check its status before trying again.',
        )}
      </p>
      <p>{t('Checking status does not resume the original action.')}</p>
      {items.map((item) => {
        const key = `${item.chainId}-${item.hash}`;
        return (
          <div key={key} style={{ marginTop: 12 }}>
            <div>
              {ChainMap[item.chainId]?.name ??
                t('Chain {{chainId}}', { chainId: item.chainId })}{' '}
              · <HashDisplay chainId={item.chainId}>{item.hash}</HashDisplay>
            </div>
            <div>{t('Awaiting confirmation')}</div>
            <Button
              size="small"
              loading={checking === key}
              disabled={!!checking}
              onClick={async () => {
                setChecking(key);
                try {
                  const result = await WalletService.transactionResult(
                    item.hash,
                    item.chainId,
                  );
                  if (result.status === TransactionStatus.SUCCESS) {
                    Toast.success(t('Confirmed successful'));
                  } else {
                    Toast.error(t('Confirmed failed'));
                  }
                } catch {
                  // A status check never resumes the original action.
                  refresh();
                } finally {
                  setChecking(undefined);
                }
              }}
            >
              {t('Check status')}
            </Button>
          </div>
        );
      })}
    </section>
  );
};
