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
  /** Optional: only present for favorites saved after v1.3 (older entries predate these fields). */
  photographerLink?: string;
  originalLink?: string;
}

export interface PhotoSource {
  id: string;
  fetchRandom(): Promise<Photo>;
}
