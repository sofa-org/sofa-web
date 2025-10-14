import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { routes } from './src/routes';

export function multiPagePlugin() {
  return {
    name: 'multi-page-plugin',
    writeBundle: () => {
      // Read base HTML once from dist
      const distRoot = fileURLToPath(new URL('./dist', import.meta.url));
      const distIndexPath = path.join(distRoot, 'index.html');
      if (!fs.existsSync(distIndexPath)) return;

      const baseHtml = fs.readFileSync(distIndexPath, 'utf-8');

      const escapeHtml = (str: string) =>
        String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');

      const setTitle = (html: string, title?: string) => {
        if (!title) return html;
        const safe = escapeHtml(title);
        const titleRe = /<title>[\s\S]*?<\/title>/i;
        if (titleRe.test(html))
          return html.replace(titleRe, `<title>${safe}</title>`);
        return html.replace(/<\/head>/i, `  <title>${safe}</title>\n</head>`);
      };

      const setMeta = (
        html: string,
        name: 'description' | 'keywords',
        content?: string,
      ) => {
        if (!content) return html;
        const safe = escapeHtml(content);
        const metaRe = new RegExp(
          `<meta\\s+[^>]*name=["']${name}["'][^>]*>`,
          'i',
        );
        const newTag = `<meta name="${name}" content="${safe}" />`;
        if (metaRe.test(html)) return html.replace(metaRe, newTag);
        return html.replace(/<\/head>/i, `  ${newTag}\n</head>`);
      };

      routes.forEach((it) => {
        // Normalize route path to a relative folder under dist
        const cleaned = it.path.replace(/^\//, '');
        const targetDir = path.join(distRoot, cleaned);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        let html = baseHtml;
        const calcVal = (d: unknown) => (typeof d === 'function' ? d() : d);
        html = setTitle(html, calcVal(it.title));
        html = setMeta(html, 'description', calcVal(it.description));
        html = setMeta(html, 'keywords', calcVal(it.keywords));

        fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf-8');
      });
    },
  };
}
