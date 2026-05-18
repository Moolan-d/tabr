export interface Photo {
  url: string;
  photographerName: string;
  photographerLink: string;
  originalLink: string;
  source: string;
}

export interface FavoritePhoto {
  url: string;
  photoName: string;
  source: string;
}

export interface PhotoSource {
  id: string;
  fetchRandom(): Promise<Photo>;
}
