interface CachedEntry<T> {
  data: T;
  timestamp: number;
}

export class CacheLayer {
  async get<T>(key: string, maxAgeMs: number): Promise<T | null> {
    return new Promise(resolve => {
      chrome.storage.local.get([key], result => {
        const entry: CachedEntry<T> | undefined = result[key];
        if (entry && Date.now() - entry.timestamp < maxAgeMs) {
          resolve(entry.data);
        } else {
          resolve(null);
        }
      });
    });
  }

  async set<T>(key: string, data: T): Promise<void> {
    const entry: CachedEntry<T> = { data, timestamp: Date.now() };
    chrome.storage.local.set({ [key]: entry });
  }

  async remove(key: string): Promise<void> {
    chrome.storage.local.remove([key]);
  }

  async getRaw<T>(key: string): Promise<T | null> {
    return new Promise(resolve => {
      chrome.storage.local.get([key], result => {
        resolve(result[key] ?? null);
      });
    });
  }

  async setRaw<T>(key: string, data: T): Promise<void> {
    chrome.storage.local.set({ [key]: data });
  }
}
