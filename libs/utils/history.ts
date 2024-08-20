import { omitBy } from 'lodash-es';
import qs from 'qs';

export function currQuery() {
  return qs.parse(window.location.search, {
    ignoreQueryPrefix: true,
  }) as Record<string, string>;
}

export function updateQuery(query: Record<string, unknown>) {
  const newQuery = omitBy({ ...currQuery(), ...query }, (it) => !it);
  window.$router.navigate(
    {
      ...window.$router.state.location,
      search: qs.stringify(newQuery, { arrayFormat: 'repeat' }),
    },
    { replace: true },
  );
}
