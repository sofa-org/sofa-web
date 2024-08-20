import qs from 'qs';
import { describe, expect, it, vi } from 'vitest';

import { currQuery, updateQuery } from '../history'; // Update the import path to your query functions

// Mocking window.location.search and window.$router
vi.stubGlobal('location', {
  search: '?param1=value1&param2=value2',
});
vi.stubGlobal('$router', {
  navigate: vi.fn(),
  state: {
    location: {
      search: '',
    },
  },
});

describe.concurrent('currQuery', () => {
  it('parses the current query string into an object', () => {
    const query = currQuery();
    expect(query).toEqual({
      param1: 'value1',
      param2: 'value2',
    });
  });
});

describe.concurrent('updateQuery', () => {
  it('updates the current query string with provided query object', () => {
    updateQuery({ param3: 'value3' });

    expect(window.$router.navigate).toHaveBeenCalledWith(
      {
        ...window.$router.state.location,
        search: qs.stringify(
          { param1: 'value1', param2: 'value2', param3: 'value3' },
          { arrayFormat: 'repeat' },
        ),
      },
      { replace: true },
    );
  });
});
