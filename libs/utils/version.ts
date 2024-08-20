import { ReactNode } from 'react';

import { MsIntervals } from './expiry';
import { UserStorage } from './storage';

function getSiteVersion(siteHtml: string) {
  return siteHtml.match(/Site\sVersion:\s*([\w_]+)/)?.[1] || 'unknown';
}

async function hasNewerVersion() {
  const { origin } = window.location;
  const currVersion = getSiteVersion(document.head.innerHTML);
  const latestVersion = getSiteVersion(
    await fetch(`${origin}/index.html?_t=${Date.now()}`).then((res) =>
      res.text(),
    ),
  );
  console.info('Site Version', { latestVersion, currVersion });
  return !!latestVersion && currVersion !== latestVersion;
}

const LastCheckTimeStorage = new UserStorage<number>(
  'version-check',
  () => 'curr',
);
const LastRefreshTime = new UserStorage<number>(
  'version-refresh',
  () => 'curr',
);

function refresh(
  modal: {
    confirm(option: {
      icon: ReactNode;
      content: ReactNode;
      cancelText: string;
      okText: string;
      onOk(): void;
      onCancel(): void;
    }): void;
  },
  t: (txt: string) => string,
) {
  const lastRefreshTime = LastRefreshTime.get();
  if (lastRefreshTime && Date.now() - lastRefreshTime < MsIntervals.day) {
    // 24 小时内只弹一次
    return undefined;
  }
  LastRefreshTime.set(Date.now());
  return new Promise<void>((res) => {
    modal.confirm({
      icon: null,
      content: t('A new version is ready, please reload the page'),
      cancelText: t('Ignore, and not display it for 30 minutes'),
      okText: t('Reload'),
      onOk: () => window.location.reload(),
      onCancel: () => {
        LastCheckTimeStorage.set(Date.now() + MsIntervals.min * 30);
        res();
      },
    });
  });
}

export function versionGuardian(...args: Parameters<typeof refresh>) {
  const guardian = async () => {
    const lastCheckTime = LastCheckTimeStorage.get();
    if (
      (!lastCheckTime || Date.now() > lastCheckTime) &&
      (await hasNewerVersion().catch(() => false))
    ) {
      await refresh(...args);
    }
    setTimeout(guardian, MsIntervals.min);
  };
  return guardian();
}
