import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@douyinfe/semi-ui';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { Env } from '@sofa/utils/env';
import { updateQuery } from '@sofa/utils/history';
import { useQuery } from '@sofa/utils/hooks';
import classNames from 'classnames';
import { parse, stringify } from 'qs';

import { useAutomatorMarketSelector } from '../automator-market/hooks';
import ProductDesc from '../components/ProductDesc';

import { Comp as IconArrow } from './assets/icon-arrow.svg';
import { AutomatorProjectDesc } from './components/ProjectDesc';
import { AutomatorEl } from '.';

import styles from './index.module.scss';

const AutomatorModal = (props: BaseInputProps<boolean>) => {
  const [t] = useTranslation('Automator');
  const { v } = useQuery((p) => ({ v: p['automator-vault'] as string }));
  const { automator: vault } = useAutomatorMarketSelector();

  const [expanded, setExpanded] = useState(false);

  return (
    <Modal
      footer={null}
      width={1080}
      visible={props.value}
      onCancel={() => props.onChange?.(false)}
      className={styles['automator-modal']}
    >
      <div className={styles['modal-form']}>
        <AutomatorEl />
        <div
          className={classNames(styles['expand-widget'], {
            [styles['expanded']]: expanded,
          })}
          onClick={() => setExpanded((pre) => !pre)}
        >
          {t('details')} <IconArrow />
        </div>
      </div>
      {expanded && (
        <ProductDesc
          noMoreInfo
          // dark={isMobileUI}
          className={styles['product-desc-wrapper']}
          prefixTabs={[
            {
              itemKey: 'more',
              tab: t({ enUS: 'More Info', zhCN: '更多信息' }),
              element: <AutomatorProjectDesc vault={vault} />,
            },
          ]}
        />
      )}
    </Modal>
  );
};

export function useAutomatorModal() {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  return [
    <AutomatorModal value={visible} onChange={(v) => setVisible(!!v)} />,
    {
      open: (vault: AutomatorVaultInfo, type?: 'deposit' | 'redeem') => {
        const query = type
          ? {
              'automator-vault': vault.vault,
              'automator-trade-tab': type,
            }
          : {
              'automator-vault': vault.vault,
            };
        if (!Env.isMobile) {
          updateQuery(query);
          setVisible(true);
        } else {
          navigate({
            pathname: '/products/automator',
            search: stringify(
              {
                ...parse(location.search, { ignoreQueryPrefix: true }),
                ...query,
              },
              { addQueryPrefix: true },
            ),
          });
        }
      },
      close: () => setVisible(false),
    },
  ] as const;
}
