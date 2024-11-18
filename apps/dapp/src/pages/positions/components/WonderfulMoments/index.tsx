import { Button, Spin } from '@douyinfe/semi-ui';
import { useTranslation } from '@sofa/services/i18n';
import { PositionsService } from '@sofa/services/positions';
import { ProductType, RiskType } from '@sofa/services/products';
import { useRequest } from 'ahooks';
import classNames from 'classnames';

import CEmpty from '@/components/Empty';
import { useProjectChange } from '@/components/ProductSelector';
import { useWalletStore } from '@/components/WalletConnector/store';
import { addI18nResources } from '@/locales';

import WonderfulMomentCard from '../WonderfulMomentCard';
import { RuleDescriptions } from '../WonderfulMomentCard/level';

import locale from './locale';

addI18nResources(locale, 'WonderfulMoment');
import styles from './index.module.scss';

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
          className={styles['btn-bottom']}
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
  const [riskType] = useProjectChange();
  return (
    <div className={styles['list-wrapper']}>
      <List riskType={riskType} />
    </div>
  );
};

export default WonderfulMoment;
