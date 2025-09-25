import { useEffect, useMemo } from 'react';
import { AutomatorVaultInfo, ProjectType } from '@sofa/services/base-type';
import { useTranslation } from '@sofa/services/i18n';
import { updateQuery } from '@sofa/utils/history';
import { useQuery } from '@sofa/utils/hooks';

import { useProjectChange } from '@/components/ProductSelector';
import { ProjectTypeRefs } from '@/components/ProductSelector/enums';
import { RadioBtnGroup } from '@/components/RadioBtnGroup';
import TopTabs from '@/components/TopTabs';
import { addI18nResources } from '@/locales';

import { Comp as IconMoment } from './assets/icon-moment.svg';
import { Comp as IconPosition } from './assets/icon-position.svg';
import PositionList from './components/PositionList';
import { PositionTips } from './components/Tips';
import WonderfulMoments from './components/WonderfulMoments';
import locale from './locale';

import styles from './index.module.scss';
import { Helmet } from 'react-helmet-async';

addI18nResources(locale, 'Positions');

export const PositionsEl = (props: { automator?: AutomatorVaultInfo }) => {
  const [t] = useTranslation('Positions');
  const query = useQuery();
  const [project] = useProjectChange();
  const tab = (query.tab as string) || '1';
  const tabs = [
    {
      label: (
        <>
          <IconPosition width="1.2em" />
          {t('POSITION')}
        </>
      ),
      value: '1',
    },
    {
      label: (
        <>
          <IconMoment width="1.2em" />
          {t('WONDERFUL MOMENT')}
        </>
      ),
      value: '2',
    },
  ];

  return (
    <div className={styles['content']}>
      <RadioBtnGroup
        className={styles['btn-group']}
        options={tabs}
        value={tab}
        onChange={(v) => updateQuery({ tab: v })}
      />
      {tab === '1' ? (
        <PositionList {...props} />
      ) : (
        <WonderfulMoments {...props} />
      )}
    </div>
  );
};

const Positions = () => {
  const [t] = useTranslation('Positions');
  const [project, setProject] = useProjectChange();
  const projects = useMemo(
    () =>
      [ProjectType.Earn, ProjectType.Surge, ProjectType.Dual].map((it) => ({
        label: (
          <>
            {ProjectTypeRefs[it].icon}
            {ProjectTypeRefs[it].label(t)}
          </>
        ),
        value: it,
      })),
    [t],
  );

  useEffect(() => {
    if (project === ProjectType.Automator) {
      setProject(ProjectType.Earn);
    }
  }, [project, setProject]);

  if (project === ProjectType.Automator) {
    return <></>;
  }

  return (
    <>
      <Helmet>
        <title>Position - SOFA.org</title>
        <meta name="description" content="" />
      </Helmet> 
      <TopTabs
        type="banner-expandable-tab"
        tabClassName={styles['tabs']}
        banner={
          <div className={styles['banner']}>
            <span className={styles['banner-txt']}>
              {t("{{project}}'s Position", {
                project: ProjectTypeRefs[project].label(t),
              })}
            </span>
            <PositionTips project={project} />
          </div>
        }
        value={project}
        onChange={(v) => setProject(v as ProjectType)}
        options={projects}
        dark
      >
        <PositionsEl />
      </TopTabs>
    </>
  );
};

export default Positions;
