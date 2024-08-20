import styles from './index.module.scss';

const Index = () => {
  return (
    <div className={styles['container']}>
      <img
        style={{ width: '100vw', height: '100vh' }}
        src="/404.svg"
        alt="404"
      />
    </div>
  );
};

export default Index;
