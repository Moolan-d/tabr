import { PhotoSource } from './types';
import { UnsplashSource } from './unsplash';

class SourceRegistry {
  private sources = new Map<string, PhotoSource>();
  private currentId = 'unsplash';

  constructor() {
    this.register(new UnsplashSource());
  }

  register(source: PhotoSource): void {
    this.sources.set(source.id, source);
  }

  getCurrent(): PhotoSource {
    const source = this.sources.get(this.currentId);
    if (!source) {
      throw new Error(`PhotoSource "${this.currentId}" not registered`);
    }
    return source;
  }

  setCurrent(id: string): void {
    if (!this.sources.has(id)) {
      throw new Error(`PhotoSource "${id}" not registered`);
    }
    this.currentId = id;
  }

  list(): PhotoSource[] {
    return Array.from(this.sources.values());
  }
}

export const sourceRegistry = new SourceRegistry();
