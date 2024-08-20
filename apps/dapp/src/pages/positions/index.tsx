import { useTranslation } from '@sofa/services/i18n';
import { updateQuery } from '@sofa/utils/history';
import { useQuery } from '@sofa/utils/hooks';

import { useProjectChange } from '@/components/ProductSelector';
import { RiskTypeRefs } from '@/components/ProductSelector/enums';
import TopTabs from '@/components/TopTabs';
import { addI18nResources } from '@/locales';

import { Comp as IconMoment } from './assets/icon-moment.svg';
import { Comp as IconPosition } from './assets/icon-position.svg';
import PositionList from './components/PositionList';
import { PositionTips } from './components/Tips';
import WonderfulMoments from './components/WonderfulMoments';
import locale from './locale';

addI18nResources(locale, 'Positions');
import styles from './index.module.scss';

const Positions = () => {
  const [t] = useTranslation('Positions');
  const query = useQuery();
  const tab = (query.tab as string) || '1';
  const tabs = [
    {
      label: (
        <span className={styles['tab']}>
          <IconPosition width="1.2em" />
          {t('POSITION')}
        </span>
      ),
      value: '1',
    },
    {
      label: (
        <span className={styles['tab']}>
          <IconMoment width="1.2em" />
          {t('WONDERFUL MOMENT')}
        </span>
      ),
      value: '2',
    },
  ];

  const [project] = useProjectChange();

  return (
    <TopTabs
      banner={
        <div className={styles['banner']}>
          <span className={styles['banner-txt']}>
            {t("{{project}}'s Position", {
              project: RiskTypeRefs[project].label(t),
            })}
          </span>
          <PositionTips project={project} />
        </div>
      }
      type="banner-expandable"
      value={tab}
      onChange={(v) => updateQuery({ tab: v })}
      options={tabs}
      dark
    >
      <div className={styles['content']}>
        {tab === '1' ? <PositionList /> : <WonderfulMoments />}
      </div>
    </TopTabs>
  );
};

export default Positions;
