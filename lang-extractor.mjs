import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const i18nKeyReg = /^[\dA-Z]{12}$/;
const langReg =
  /(\{|\s+)t\(\s*['"`]([\s\S]*?)['"`]\s*(\)|,\s*\)|,\s*\{[\s\S]*?\}\))/g;

/*
 * 1. 提取语言到同目录的 locale.ts 中
 * 2. 源文件中的语言替换成 locale.ts 的 key (hash 值)
 */
async function extractLang(filename) {
  if (!/\.tsx/.test(filename)) return;

  const dir = path.dirname(filename).split(path.sep).pop();
  const localePath = path.resolve(filename, '../locale.ts');

  const hasLocale = await fs.promises
    .stat(localePath)
    .then((stat) => stat.isFile())
    .catch(() => false);

  if (hasLocale) return;

  const fileContent = await fs.promises.readFile(filename, {
    encoding: 'utf-8',
  });

  if (
    !/useTranslation\(['"`]/.test(fileContent) ||
    /addI18nResources/.test(fileContent)
  ) {
    return;
  }

  const ns = (() => {
    const matches = /useTranslation\(['"`]([\w-_]+)['"`]\)/.exec(fileContent);
    return (matches && matches[1]) || dir;
  })();

  const sentences = {};
  const newFileContent = fileContent
    .replace(langReg, (entire, _, sentence) => {
      // 替换语句
      if (i18nKeyReg.test(sentence)) return entire;
      sentences[sentence] = sentence;
      return entire;
    })
    .replace(
      /([\r\n]import\s+[^\r\n]+)(?![\S\s]*[\r\n]import\s+[\S\s]*)/,
      `$1
       import { addI18nResources } from '@/locales';
       import locale from './locale';

       addI18nResources(locale, '${ns}');
      `,
    );

  if (!Object.keys(sentences).length) {
    console.info('--- No sentences to extract', filename);
    return;
  }

  const entireSentences = { 'en-US': sentences };

  await fs.promises.writeFile(
    localePath,
    `export default ${JSON.stringify(entireSentences)}`,
  );
  await fs.promises.writeFile(filename, newFileContent);
}

function traverse(dir) {
  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error(`无法读取目录: ${dir}`, err);
      return;
    }
    files.forEach((file) => {
      if (/node_modules/.test(file)) return;

      // 构建完整的文件或文件夹路径
      const fullPath = path.join(dir, file);

      // 获取文件或文件夹的状态
      fs.stat(fullPath, (err, stats) => {
        if (err) {
          console.error(`无法获取文件状态: ${fullPath}`, err);
          return;
        }

        // 如果是文件夹，递归遍历
        if (stats.isDirectory()) {
          traverse(fullPath);
        }

        // 执行回调函数
        extractLang(fullPath);
      });
    });
  });
}

traverse(__dirname);
