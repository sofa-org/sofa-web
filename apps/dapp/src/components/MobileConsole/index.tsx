import { useEffect, useState } from 'react';
import { Modal } from '@douyinfe/semi-ui';
import { Console, Hook, Unhook } from 'console-feed';
import { nanoid } from 'nanoid';

import styles from './index.module.scss';

export const MobileConsole = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = useState<any[]>(() => [
    {
      method: 'log',
      id: nanoid(),
      data: [
        'User Agent: ',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        window.navigator.userAgent || navigator.vendor || window.opera,
      ],
    },
  ]);

  useEffect(() => {
    const hookedConsole = Hook(
      window.console,
      (log) => setLogs((currLogs) => [...currLogs, log]),
      false,
    );
    window.addEventListener('error', (event) => {
      console.error('Global Error', event);
    });
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled Rejection', event.reason);
    });
    return () => {
      Unhook(hookedConsole);
    };
  }, []);

  const [visible, setVisible] = useState(false);

  return (
    <>
      <Modal
        title={'Console'}
        visible={visible}
        centered
        className={styles['test-infos-modal']}
        onCancel={() => setVisible(false)}
        footer={null}
      >
        <Console logs={logs} />
      </Modal>
      <div
        className={styles['test-infos-trigger']}
        onClick={() => setVisible(true)}
      />
    </>
  );
};
