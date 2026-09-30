import { useEffect, useState } from 'react';
import { Button } from '@douyinfe/semi-ui';
import { TransactionStatus } from '@sofa/services/base-type';
import { ChainMap } from '@sofa/services/chains';
import { useTranslation } from '@sofa/services/i18n';
import {
  getPendingTransactionConfirmations,
  PendingTransactionConfirmation,
  removePendingTransactionConfirmation,
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
  const [confirmed, setConfirmed] = useState<Record<string, 'success' | 'failed'>>(
    {},
  );
  const refresh = () => setItems(getPendingTransactionConfirmations());
  useEffect(() => {
    if (visible) refresh();
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
            <div>
              {confirmed[key]
                ? t(
                    confirmed[key] === 'success'
                      ? 'Confirmed successful'
                      : 'Confirmed failed',
                  )
                : t('Awaiting confirmation')}
            </div>
            {!confirmed[key] && (
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
                    removePendingTransactionConfirmation(
                      item.hash,
                      item.chainId,
                    );
                    setConfirmed((pre) => ({
                      ...pre,
                      [key]:
                        result.status === TransactionStatus.SUCCESS
                          ? 'success'
                          : 'failed',
                    }));
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
            )}
          </div>
        );
      })}
    </section>
  );
};
