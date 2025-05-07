export function createCache(ttl = 60000) {
  const store = new Map();

  return {
    get(key) {
      if (!store.has(key)) {
        return undefined;
      }

      const item = store.get(key);

      if (item.expiry < Date.now()) {
        store.delete(key);
        return undefined;
      }

      return item.value;
    },

    set(key, value, customTTL) {
      const itemTTL = customTTL || ttl;

      store.set(key, {
        value,
        expiry: Date.now() + itemTTL,
      });
    },

    delete(key) {
      return store.delete(key);
    },

    clear() {
      store.clear();
    },
  };
}
