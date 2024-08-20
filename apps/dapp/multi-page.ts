import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { routes } from './src/routes';

export function multiPagePlugin() {
  return {
    name: 'multi-page-plugin',
    writeBundle: () => {
      routes.forEach((it) => {
        const targetDir = fileURLToPath(
          new URL(`./dist/${it.path}`.replace(/\/+/g, '/'), import.meta.url),
        );
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.copyFileSync(
          fileURLToPath(new URL('./dist/index.html', import.meta.url)),
          path.join(targetDir, 'index.html'),
        );
      });
    },
  };
}
