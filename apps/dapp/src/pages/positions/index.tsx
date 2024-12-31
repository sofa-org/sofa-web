import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectType } from '@sofa/services/base-type';
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

addI18nResources(locale, 'Positions');

const Positions = () => {
  const [t] = useTranslation('Positions');
  const navigate = useNavigate();
  const [project, setProject] = useProjectChange();
  const projects = useMemo(
    () =>
      [ProjectType.Earn, ProjectType.Surge].map((it) => ({
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

  const query = useQuery();
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

  useEffect(() => {
    if (project === ProjectType.Automator) {
      navigate(`/transactions${window.location.search}`, { replace: true });
    }
  }, [navigate, project]);
  if (project === ProjectType.Automator) {
    return <></>;
  }

  return (
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
      <div className={styles['content']}>
        <RadioBtnGroup
          className={styles['btn-group']}
          options={tabs}
          value={tab}
          onChange={(v) => updateQuery({ tab: v })}
        />
        {tab === '1' ? <PositionList /> : <WonderfulMoments />}
      </div>
    </TopTabs>
  );
};

export default Positions;
