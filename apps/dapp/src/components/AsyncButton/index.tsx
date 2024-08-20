import { MouseEvent, ReactNode, useState } from 'react';
import { Button, Toast } from '@douyinfe/semi-ui';
import { ButtonProps } from '@douyinfe/semi-ui/lib/es/button';
import { calcVal, getErrorMsg } from '@sofa/utils/fns';
import { useLazyCallback } from '@sofa/utils/hooks';
import { useDebounce } from 'ahooks';

import { MsgDisplay } from '../MsgDisplay';

const AsyncButton = (
  props: Omit<ButtonProps, 'children'> & {
    noToast?: boolean;
    children?: ReactNode | ((loading: boolean) => ReactNode);
  },
) => {
  const [loading, setLoading] = useState(false);
  const $loading = useDebounce(loading, { wait: 300 });
  const handleClick = useLazyCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      setLoading(true);
      try {
        await props.onClick?.(e);
      } catch (err) {
        if (err) console.error(err);
        if (!props.noToast && getErrorMsg(err))
          Toast.error({
            content: <MsgDisplay>{getErrorMsg(err)}</MsgDisplay>,
          });
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
