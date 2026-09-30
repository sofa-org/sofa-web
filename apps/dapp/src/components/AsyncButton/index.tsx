import { MouseEvent, ReactNode, useState } from 'react';
import { Button, Toast } from '@douyinfe/semi-ui';
import { ButtonProps } from '@douyinfe/semi-ui/lib/es/button';
import { useDebounce } from 'ahooks';
import { useTranslation } from '@sofa/services/i18n';
import { isTransactionConfirmationPendingError } from '@sofa/services/transaction-confirmation';
import { calcVal, getErrorMsg } from '@sofa/utils/fns';
import { useLazyCallback } from '@sofa/utils/hooks';

import { HashDisplay } from '../HashDisplay';
import { MsgDisplay } from '../MsgDisplay';
import { addI18nResources } from '@/locales';
import pendingLocale from '../PendingTransactionConfirmations/locale';

addI18nResources(pendingLocale, 'PendingTransactionConfirmations');

const AsyncButton = (
  props: Omit<ButtonProps, 'children'> & {
    noToast?: boolean;
    children?: ReactNode | ((loading: boolean) => ReactNode);
  },
) => {
  const [t] = useTranslation('PendingTransactionConfirmations');
  const [loading, setLoading] = useState(false);
  const $loading = useDebounce(loading, { wait: 300 });
  const handleClick = useLazyCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      setLoading(true);
      try {
        await props.onClick?.(e);
      } catch (err) {
        if (err) console.error(err);
        if (isTransactionConfirmationPendingError(err) && !props.noToast) {
          Toast.warning({
            content: (
              <MsgDisplay>
                {t(
                  'A transaction is awaiting confirmation. Check its status before trying again.',
                )}{' '}
                <HashDisplay chainId={err.chainId}>{err.hash}</HashDisplay>
              </MsgDisplay>
            ),
            duration: 8,
          });
        } else if (!props.noToast && getErrorMsg(err))
          Toast.error({ content: <MsgDisplay>{getErrorMsg(err)}</MsgDisplay> });
      }
      setLoading(false);
    },
  );
  return (
    <Button
      {...props}
      loading={$loading || props.loading}
      onClick={handleClick}
    >
      {calcVal(props.children, $loading)}
    </Button>
  );
};

export default AsyncButton;
