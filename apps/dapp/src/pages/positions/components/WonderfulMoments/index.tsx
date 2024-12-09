import { Button, Spin } from '@douyinfe/semi-ui';
import { useTranslation } from '@sofa/services/i18n';
import { PositionsService } from '@sofa/services/positions';
import { ProductType, RiskType } from '@sofa/services/products';
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

const List = (props: { riskType?: RiskType; productType?: ProductType }) => {
  const [t] = useTranslation('WonderfulMoment');
  const wallet = useWalletStore();
  const { data: positions, loading } = useRequest(
    async () =>
      !wallet.address
        ? undefined
        : PositionsService.wonderful({
            chainId: wallet.chainId,
            owner: wallet.address,
            riskType: props.riskType,
            productType: props.productType,
          }),
    {
      refreshDeps: [
        wallet.chainId,
        wallet.address,
        props.riskType,
        props.productType,
      ],
      onSuccess: (list) => console.info('WonderfulMoment', list),
    },
  );
  return (
    <>
      <Spin
        wrapperClassName={styles['list']}
        spinning={loading || (!positions && !!wallet.address)}
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
            const link = `/positions/orders${window.location.search}`;
            window.location.href = link;
          }}
        >
          {t('ALL HISTORY')}
        </Button>
        <RuleDescriptions />
      </div>
    </>
  );
};

const WonderfulMoment = () => {
  const [project] = useProjectChange();
  const [riskType] = useRiskSelect(project);
  return (
    <div className={styles['list-wrapper']}>
      <List riskType={riskType} />
    </div>
  );
};

export default WonderfulMoment;
