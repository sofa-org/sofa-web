/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserStorage } from '../storage'; // Adjust the import path to where your UserStorage class is located

declare global {
  // eslint-disable-next-line no-var
  var storage: any;
}

global.storage = {
  get: vi.fn(),
  set: vi.fn(),
};

describe('UserStorage', () => {
  const key = 'user-data';
  const uid = 'user123';
  const userData = { name: 'John Doe', age: 30 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retrieves data for a given user ID', () => {
    const uidGetter = vi.fn().mockReturnValue(uid);
    const userStorage = new UserStorage(key, uidGetter);
    storage.get.mockReturnValue({ [uid]: userData });

    const data = userStorage.get();
    expect(data).toEqual(userData);
    expect(storage.get).toHaveBeenCalledWith(key);
    expect(uidGetter).toHaveBeenCalled();
  });

  it('sets data for a given user ID', () => {
    const uidGetter = vi.fn().mockReturnValue(uid);
    const userStorage = new UserStorage(key, uidGetter);

    userStorage.set(userData);
    expect(storage.set).toHaveBeenCalledWith(key, { [uid]: userData });
    expect(uidGetter).toHaveBeenCalled();
  });

  it('removes data for a given user ID', () => {
    const uidGetter = vi.fn().mockReturnValue(uid);
    const userStorage = new UserStorage(key, uidGetter);

    userStorage.remove();
    expect(storage.set).toHaveBeenCalledWith(key, { [uid]: null });
    expect(uidGetter).toHaveBeenCalled();
  });

  it('does nothing if UID is undefined on get', () => {
    const uidGetter = vi.fn().mockReturnValue(undefined);
    const userStorage = new UserStorage(key, uidGetter);

    const data = userStorage.get();
    expect(data).toBeUndefined();
    expect(storage.get).not.toHaveBeenCalled();
  });

  it('does nothing if UID is undefined on set', () => {
    const uidGetter = vi.fn().mockReturnValue(undefined);
    const userStorage = new UserStorage(key, uidGetter);

    userStorage.set(userData);
    expect(storage.set).not.toHaveBeenCalled();
  });

  it('does nothing if UID is undefined on remove', () => {
    const uidGetter = vi.fn().mockReturnValue(undefined);
    const userStorage = new UserStorage(key, uidGetter);

    userStorage.remove();
    expect(storage.set).not.toHaveBeenCalled();
  });
});
