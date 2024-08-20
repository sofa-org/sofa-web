import { fireEvent } from '@testing-library/dom';
import { act, renderHook } from '@testing-library/react-hooks';
import { describe, expect, it, vi } from 'vitest';

import {
  createSuspenseResource,
  useAsyncFn,
  useAsyncMemo,
  useDebounceWithReturnFn,
  useDomAway,
  useDomChange,
  useDomSizeChange,
  useLazyCallback,
  useOldValueWhenEqual,
  useOldValWhen,
  useRefState,
  useScroll,
  useScrollXBehaviorForbidden,
  useSubscribe,
  useSubscribeNoState,
  useTime,
  useValChange,
} from '../hooks';

declare global {
  // eslint-disable-next-line no-var
  var fns: ((...args: unknown[]) => void)[];
}

global.fns = [];
vi.stubGlobal(
  'ResizeObserver',
  class ResizeObserver {
    constructor(public cb: () => void) {
      global.fns.push(cb);
    }

    observe() {}
    disconnect() {
      global.fns = global.fns.filter((it) => it !== this.cb);
    }
  },
);

describe.concurrent('useValChange', () => {
  it('detects value changes', () => {
    const { result, rerender } = renderHook(({ val }) => useValChange(val), {
      initialProps: { val: 'initial' },
    });

    expect(result.current).toBe(true);

    rerender({ val: 'updated' });
    expect(result.current).toBe(true);
  });
});

describe.concurrent('useRefState', () => {
  it('holds and updates a ref state', () => {
    const { result } = renderHook(() => useRefState(0));
    expect(result.current.current).toBe(0);
  });
});

describe.concurrent('useLazyCallback', () => {
  it('returns a memoized callback', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useLazyCallback(callback));

    act(() => result.current());
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe.concurrent('useOldValWhen', () => {
  it('uses old value when condition is met', async () => {
    const { result } = renderHook(() =>
      useOldValWhen(1, (prev) => prev < 2, 100),
    );

    expect(result.current).toBe(1);
  });
});

describe.concurrent('useOldValueWhenEqual', () => {
  it('uses old value when values are equal', () => {
    const { result, rerender } = renderHook(
      ({ val }) => useOldValueWhenEqual(val),
      {
        initialProps: { val: 'test' },
      },
    );

    rerender({ val: 'test' });
    expect(result.current).toBe('test');
  });
});

describe.concurrent('useScrollXBehaviorForbidden', () => {
  it('sets overscroll behavior on body', () => {
    renderHook(() => useScrollXBehaviorForbidden());
    // Assert body style change if necessary
  });
});

describe.concurrent('useDebounceWithReturnFn', () => {
  vi.useFakeTimers();
  it('debounces function execution', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebounceWithReturnFn(fn, 100));

    act(() => {
      result.current.run();
      vi.advanceTimersByTime(100);
    });

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe.concurrent('useAsyncFn', () => {
  it('handles async function execution', async () => {
    const asyncFn = vi.fn().mockResolvedValue('test');
    const { result, waitForNextUpdate } = renderHook(() => useAsyncFn(asyncFn));

    act(() => {
      result.current.run();
    });

    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(asyncFn).toHaveBeenCalled();
  });
});

describe.concurrent('useDomChange', () => {
  it('observes DOM mutations', () => {
    document.body.innerHTML = `<div id="test-div"></div>`;

    const callback = vi.fn();
    renderHook(() =>
      useDomChange(callback, () => document.getElementById('test-div'), {
        childList: true,
      }),
    );

    act(() => {
      const testDiv = document.getElementById('test-div');
      if (testDiv) {
        const newChild = document.createElement('span');
        testDiv.appendChild(newChild);
      }
    });

    expect(callback).toHaveBeenCalled();
  });
});

describe.concurrent('useDomSizeChange', () => {
  it('observes size changes in DOM elements', () => {
    document.body.innerHTML = `<div id="test-div" style="width: 100px; height: 100px;"></div>`;

    const callback = vi.fn();
    renderHook(() =>
      useDomSizeChange(callback, () => document.getElementById('test-div')),
    );

    act(() => {
      const testDiv = document.getElementById('test-div');
      if (testDiv) {
        testDiv.style.width = '200px';
        testDiv.style.height = '200px';
        global.fns.forEach((cb) =>
          cb([{ target: { clientWidth: 200, clientHeight: 200 } }]),
        );
      }
    });

    expect(callback).toHaveBeenCalled();
  });
});

describe.concurrent('useTime', () => {
  vi.useFakeTimers();
  it('updates time at specified intervals', () => {
    const { result } = renderHook(() => useTime({ interval: 1000 }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).not.toBe(0);
  });
});

describe.concurrent('useDomAway', () => {
  it('detects clicks outside specified elements', () => {
    document.body.innerHTML = `<div id="container"></div><div id="outside"></div>`;
    const callback = vi.fn();
    const container = document.getElementById('container')!;

    renderHook(() => useDomAway(callback, () => container, 'mousedown'));

    act(() => {
      fireEvent.mouseDown(document.getElementById('outside')!);
    });

    expect(callback).toHaveBeenCalled();
  });
});

describe.concurrent('useAsyncMemo', () => {
  it('memoizes async operations', async () => {
    const getter = vi.fn().mockResolvedValue('memoized');
    const { result, waitForNextUpdate } = renderHook(() =>
      useAsyncMemo(getter, []),
    );

    await waitForNextUpdate();
    expect(result.current).toBe('memoized');
  });
});

describe.concurrent('useScroll', () => {
  it('handles scroll-related logic', () => {
    document.body.innerHTML = `<div id="scrollable" style="height: 100px; overflow-y: scroll;">
                                 <div style="height: 200px;"></div>
                               </div>`;
    const callback = vi.fn();
    const scrollable = document.getElementById('scrollable')!;

    renderHook(() => useScroll(() => scrollable, callback, 10));

    act(() => {
      scrollable.scrollTop = 50;
      fireEvent.scroll(scrollable);
    });

    expect(callback).toHaveBeenCalled();
  });
});
describe.concurrent('useSubscribeNoState', () => {
  it('subscribes to a source without state management', () => {
    const subscribe = vi.fn((cb) => {
      cb('data');
      return Object.assign(Promise.resolve(), { unsubscribe: vi.fn() });
    });
    const handler = vi.fn();

    renderHook(() => useSubscribeNoState(subscribe, handler));

    expect(subscribe).toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith('data');
  });
});

describe.concurrent('useSubscribe', () => {
  it('manages subscription state', async () => {
    const data = 'subscribed data';
    const subscribe = vi.fn((cb) => {
      cb(data);
      return Object.assign(Promise.resolve(), { unsubscribe: vi.fn() });
    });
    const { result, waitForNextUpdate } = renderHook(() =>
      useSubscribe(subscribe),
    );

    await waitForNextUpdate();

    expect(result.current.data).toBe(data);
    expect(result.current.loading).toBe(false);
    expect(subscribe).toHaveBeenCalled();
  });
});

describe.concurrent('createSuspenseResource', () => {
  it('creates a resource with suspense', async () => {
    const data = 'resource data';
    const creator = vi.fn().mockResolvedValue(data);
    const source = createSuspenseResource(creator);

    try {
      source.read([]);
    } catch (promise) {
      expect(promise).toBeInstanceOf(Promise);
      await promise;
    }

    expect(source.read([])).toBe(data);
    expect(creator).toHaveBeenCalled();
  });
});
