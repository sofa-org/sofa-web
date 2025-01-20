import { useNavigate } from 'react-router-dom';
import { Button, Spin } from '@douyinfe/semi-ui';
import { AutomatorVaultInfo } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { PositionsService } from '@sofa/services/positions';
import { ProductType, RiskType } from '@sofa/services/products';
import { joinUrl } from '@sofa/utils/url';
import { useRequest } from 'ahooks';
import classNames from 'classnames';

import CEmpty from '@/components/Empty';
import { useProjectChange, useRiskSelect } from '@/components/ProductSelector';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';

import WonderfulMomentCard from '../WonderfulMomentCard';
import { RuleDescriptions } from '../WonderfulMomentCard/level';

import locale from './locale';

import styles from './index.module.scss';

addI18nResources(locale, 'WonderfulMoment');

const List = (props: {
  riskType?: RiskType;
  productType?: ProductType;
  automator?: AutomatorVaultInfo;
}) => {
  const [t] = useTranslation('WonderfulMoment');
  const navigate = useNavigate();
  const wallet = useWalletStore();
  const address = props.automator?.vault || wallet.address;

  const { data: positions, loading } = useRequest(
    async () =>
      !address
        ? undefined
        : PositionsService.wonderful({
            chainId: wallet.chainId,
            owner: address,
            riskType: props.automator ? undefined : props.riskType,
            productType: props.automator ? undefined : props.productType,
          }),
    {
      refreshDeps: [wallet.chainId, address, props.riskType, props.productType],
      onSuccess: (list) => console.info('WonderfulMoment', list),
    },
  );
  return (
    <>
      <Spin
        wrapperClassName={styles['list']}
        spinning={loading || (!positions && !!address)}
      >
        {positions?.map((it) => (
          <WonderfulMomentCard position={it} key={it.id} />
        ))}
        {!positions?.length && !loading && (
          <CEmpty
            className={styles['empty']}
            style={{ margin: '100px auto 0' }}
          />
        )}
      </Spin>
      <div className={styles['btn-bottom-wrapper']}>
        <Button
          size="large"
          theme="solid"
          type="primary"
          className={classNames(styles['btn-bottom'], styles['btn-txt'])}
          onClick={() => {
            const link = joinUrl(
              '/positions/orders',
              window.location.search,
              `?automator-vault=${!props.automator?.vault ? '' : address}`,
            );
            navigate(link);
          }}
        >
          {t({ enUS: 'All History', zhCN: '全部历史' })}
        </Button>
        <RuleDescriptions />
      </div>
    </>
  );
};

const WonderfulMoment = (props: { automator?: AutomatorVaultInfo }) => {
  const [project] = useProjectChange();
  const [riskType] = useRiskSelect(project);
  return (
    <div className={styles['list-wrapper']}>
      <List riskType={riskType} {...props} />
    </div>
  );
};

export default WonderfulMoment;
