import { ProjectType } from '@sofa/services/base-type';

import { useProjectChange } from '@/components/ProductSelector';
import { addI18nResources } from '@/locales';

import DefiMode from '../defi-mode';

import AutomatorMarket from './automator-market';
import locale from './locale';

addI18nResources(locale, 'Products');

const Comp = () => {
  const [project] = useProjectChange();
  return project === ProjectType.Automator ? <AutomatorMarket /> : <DefiMode />;
};
export default Comp;
