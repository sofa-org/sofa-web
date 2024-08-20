import { parse, stringify } from 'qs';

export function joinUrl(...urls: string[]) {
  if (urls.length <= 1) return urls[0] || '';
  const url = urls.reduce(
    (pre, url) => {
      const res = url.match(
        /^((https?:)?\/\/[^/?#]+)?([^?#]+)?(\?[^#]+)?(#.*)?$/,
      );
      if (!res) return pre;
      const [, origin, , pathname = '', search, hash] = res;
      if (origin) pre.origin = origin;
      if (/^(https?:)?\/\//.test(pathname)) {
        pre.pathname = pathname;
      } else {
        pre.pathname = `${pre.pathname}///${pathname}`.replace(/\/{3,}/, '/');
      }
      pre.search = {
        ...pre.search,
        ...parse(search, { ignoreQueryPrefix: true }),
      };
      if (hash) pre.hash = hash;
      return pre;
    },
    { origin: '', pathname: '', search: {}, hash: '' },
  );
  return `${url.origin}${url.pathname}${stringify(url.search, {
    addQueryPrefix: true,
  })}${url.hash}`;
}
