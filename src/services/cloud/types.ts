import type { FavoritePhoto } from '../../providers/types';

export interface CloudProvider {
  id: string;
  isAvailable(): Promise<boolean>;
  pull(): Promise<FavoritePhoto[] | null>;
  push(favorites: FavoritePhoto[]): Promise<void>;
}
