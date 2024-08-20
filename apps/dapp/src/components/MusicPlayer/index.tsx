import { Comp as IconMusic } from '@/assets/icon-music.svg';

import styles from './index.module.scss';

const MusicPlayer = () => {
  return (
    <>
      <div className={styles['music-player']}>
        <IconMusic color="#fff" />
      </div>
    </>
  );
};

export default MusicPlayer;
