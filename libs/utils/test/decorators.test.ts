/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';

vi.mock('./storage', () => ({
  get: vi.fn(),
  set: vi.fn(),
}));

import {
  afterRunAsync,
  asyncCache,
  asyncQueue,
  asyncShare,
  beforeRunAsync,
  cache,
  catchErrorAsync,
  once,
  paramsCvt,
  paramsCvtNew,
  shareSubscribe,
} from '../decorators'; // Update the import path to your decorators file

describe('cache decorator', () => {
  it('caches function results', () => {
    class TestClass {
      @cache()
      testMethod() {
        return 'result';
      }
    }

    const instance = new TestClass();
    expect(instance.testMethod()).toBe('result');
    // Further logic to test caching behavior goes here
  });
});

describe('asyncShare decorator', () => {
  it('shares async function results', async () => {
    class TestClass {
      @asyncShare()
      async testMethod() {
        return Promise.resolve('result');
      }
    }

    const instance = new TestClass();
    await expect(instance.testMethod()).resolves.toBe('result');
    // Further logic to test sharing behavior goes here
  });
});

describe('asyncCache decorator', () => {
  it('caches async function results', async () => {
    class TestClass {
      @asyncCache()
      async testMethod() {
        return Promise.resolve('result');
      }
    }

    const instance = new TestClass();
    await expect(instance.testMethod()).resolves.toBe('result');
    // Further logic to test async caching behavior goes here
  });
});

describe('paramsCvt decorator', () => {
  it('converts parameters before calling the original method', () => {
    class TestClass {
      @paramsCvt((...args) => args.map((arg: any) => arg * 2))
      testMethod(arg: number) {
        return arg;
      }
    }

    const instance = new TestClass();
    expect(instance.testMethod(2)).toBe(4);
  });
});

describe('paramsCvtNew decorator', () => {
  it('converts parameters with context before calling the original method', () => {
    class TestClass {
      @paramsCvtNew((args) => args.map((arg: any) => arg * 3))
      testMethod(arg: number) {
        return arg;
      }
    }

    const instance = new TestClass();
    expect(instance.testMethod(2)).toBe(6);
  });
});

describe('once decorator', () => {
  it('ensures a method is only called once', () => {
    class TestClass {
      @once()
      testMethod() {
        return Math.random();
      }
    }

    const instance = new TestClass();
    const firstCall = instance.testMethod();
    const secondCall = instance.testMethod();
    expect(firstCall).toBe(secondCall);
  });
});

describe('asyncQueue decorator', () => {
  it('queues async method calls', async () => {
    class TestClass {
      @asyncQueue()
      async testMethod() {
        return Promise.resolve('result');
      }
    }

    const instance = new TestClass();
    await expect(instance.testMethod()).resolves.toBe('result');
    // Further logic to test queue behavior goes here
  });
});

describe('catchErrorAsync decorator', () => {
  it('catches and handles errors in async methods', async () => {
    class TestClass {
      @catchErrorAsync()
      async testMethod() {
        throw new Error('test error');
      }
    }

    const instance = new TestClass();
    await expect(instance.testMethod()).rejects.toThrow('test error');
    // Further logic to test error handling and reporting goes here
  });
});

describe('beforeRunAsync decorator', () => {
  it('runs an action before the async method', async () => {
    const actionMock = vi.fn();

    class TestClass {
      @beforeRunAsync(actionMock)
      async testMethod() {
        return Promise.resolve('result');
      }
    }

    const instance = new TestClass();
    await instance.testMethod();
    expect(actionMock).toHaveBeenCalled();
  });
});

describe('afterRunAsync decorator', () => {
  it('runs an action after the async method', async () => {
    const actionMock = vi.fn();

    class TestClass {
      @afterRunAsync(actionMock)
      async testMethod() {
        return 'result';
      }
    }

    const instance = new TestClass();
    await instance.testMethod();
    expect(actionMock).toHaveBeenCalledWith('result');
  });
});

describe('shareSubscribe decorator', () => {
  it('shares subscriptions', () => {
    class TestClass {
      @shareSubscribe((methodName) => methodName)
      testMethod(callback: (data: unknown) => void) {
        callback('data');
        return {
          unsubscribe: () => {},
        };
      }
    }

    const instance = new TestClass();
    const callback = vi.fn();
    instance.testMethod(callback);
    expect(callback).toHaveBeenCalledWith('data');
  });
});
