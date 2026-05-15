import type { FavoritePhoto } from '../../providers/types';
import type { CloudProvider } from './types';

export class NoneProvider implements CloudProvider {
  id = 'none';

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async pull(): Promise<FavoritePhoto[] | null> {
    return null;
  }

  async push(_favorites: FavoritePhoto[]): Promise<void> {}
}
