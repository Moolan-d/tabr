export interface Photo {
  url: string;
  photographerName: string;
  photographerLink: string;
  originalLink: string;
  source: string;
}

export interface FavoritePhoto extends Photo {
  savedAt: number;
}

export interface PhotoSource {
  id: string;
  fetchRandom(): Promise<Photo>;
}
