// Per-node key/value storage. The real plugin uses pluginData; the in-memory
// variant lets the same render code run where pluginData is unavailable
// (the `use_figma` test harness) and in unit tests.

export interface Store {
  get(node: BaseNode, key: string): string;
  set(node: BaseNode, key: string, value: string): void;
}

export const pluginStore: Store = {
  get: (node, key) => node.getPluginData(key),
  set: (node, key, value) => node.setPluginData(key, value),
};

export function memoryStore(): Store {
  const data = new Map<string, string>();
  return {
    get: (node, key) => data.get(`${node.id}\u0000${key}`) ?? '',
    set: (node, key, value) => {
      data.set(`${node.id}\u0000${key}`, value);
    },
  };
}
