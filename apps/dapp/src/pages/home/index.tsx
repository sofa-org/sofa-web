import { HomeCooperation } from './components/Cooperation';
import { HomeDescriptions } from './components/Descriptions';
import { HomeFeatures } from './components/Features';
import { FirstScreen } from './components/FirstScreen';
import { Timeline } from './components/Timeline';

const Index = () => {
  return (
    <>
      <FirstScreen />
      <HomeCooperation />
      <HomeFeatures />
      <HomeDescriptions />
      <Timeline />
    </>
  );
};

export default Index;
