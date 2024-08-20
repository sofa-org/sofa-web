import { ComponentProps } from 'react';
import { Empty } from '@douyinfe/semi-ui';

import imgEmpty from './assets/empty.png';

import './index.scss';

const CEmpty = (props: ComponentProps<typeof Empty>) => {
  return (
    <Empty
      {...props}
      style={{ margin: '0 auto', padding: '40px 0', ...props.style }}
      image={
        props.image || (
          <img src={imgEmpty} width={100 / window.winScale} alt="" />
        )
      }
      darkModeImage={
        props.darkModeImage || (
          <img src={imgEmpty} width={100 / window.winScale} alt="" />
        )
      }
      description={props.description || 'No Results'}
    />
  );
};

export default CEmpty;
