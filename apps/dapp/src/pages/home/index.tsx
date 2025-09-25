import { HomeCooperation } from './components/Cooperation';
import { HomeDescriptions } from './components/Descriptions';
import { HomeFeatures } from './components/Features';
import { FirstScreen } from './components/FirstScreen';
import { Timeline } from './components/Timeline';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>SOFA.org</title>
        <meta name="description" content="SOFA.org is a decentralized, nonprofit, open-source technology organization offering protocols for crypto products, especially options. Earn $RCH via protocol use, liquidity provision, and governance. $SOFA enables holders to vote on proposals that shape SOFA.org's future." />
      </Helmet>
      <FirstScreen />
      <HomeCooperation />
      <HomeFeatures />
      <HomeDescriptions />
      <Timeline />
    </>
  );
};

export default Index;
