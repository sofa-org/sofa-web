import { parse, stringify } from 'qs';

export function parseUrl(url: string) {
  const res = url.match(/^((\w+:?\/\/)([^/?#]+))?([^?#]+)?(\?[^#]+)?(#.*)?$/);
  if (!res) {
    throw new Error(`Parse failed: Invalid url - ${url}`);
  }
  const [, origin, protocol, host, pathname = '', search, hash] = res;
  return { protocol, host, origin, pathname, search, hash, url };
}

export function stringifyUrl(
  url: Omit<ReturnType<typeof parseUrl>, 'url' | 'protocol' | 'host'>,
) {
  return `${url.origin}${url.pathname || '/'}${url.search}${url.hash}`;
}

export function joinUrl(...urls: (string | undefined)[]) {
  if (urls.length <= 1) return urls[0] || '';
  const url = urls.filter(Boolean).reduce(
    (pre, url) => {
      if (!url) return pre;
      try {
        const { origin, pathname, search, hash } = parseUrl(url);
        if (origin) pre.origin = origin;
        if (/^(https?:)?\/\//.test(pathname)) {
          pre.pathname = pathname;
        } else {
          pre.pathname = `${pre.pathname}///${pathname}`
            .replace(/\/{3,}/, '/')
            .replace(/\/+$/, '');
        }
        pre.search = {
          ...pre.search,
          ...parse(search, { ignoreQueryPrefix: true }),
        };
        if (hash) pre.hash = hash;
        return pre;
      } catch (err) {
        return pre;
      }
    },
    { origin: '', pathname: '', search: {}, hash: '' },
  );
  return stringifyUrl({
    ...url,
    search: stringify(url.search, { addQueryPrefix: true }),
  });
}
