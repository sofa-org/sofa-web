declare const storage: Global['storage'];

export class UserStorage<T> {
  key!: string;
  uidGetter!: () => string | undefined;

  constructor(key: string, uidGetter: () => string | undefined) {
    this.key = key;
    this.uidGetter = uidGetter;
  }

  get(uid = this.uidGetter()) {
    if (!uid) return undefined;
    const whole = storage.get(this.key) as Record<string, unknown> | null;
    return whole?.[uid] as T;
  }

  set(val: T | null | undefined, uid = this.uidGetter()) {
    if (!uid) return void 0;
    const whole = (storage.get(this.key) || {}) as Record<string, unknown>;
    whole[uid] = val;
    return storage.set(this.key, whole);
  }

  remove(uid = this.uidGetter()) {
    this.set(null, uid);
  }
}
