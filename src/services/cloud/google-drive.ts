import type { FavoritePhoto } from '../../providers/types';
import type { CloudProvider } from './types';

const FILE_NAME = 'tabr_favorites.json';
const FOLDER = 'appDataFolder';

export class GoogleDriveProvider implements CloudProvider {
  id = 'google-drive';

  private fileId: string | null = null;

  async isAvailable(): Promise<boolean> {
    try {
      const token = await this.getToken(false);
      return !!token;
    } catch {
      return false;
    }
  }

  async pull(): Promise<FavoritePhoto[] | null> {
    const token = await this.getToken(true);
    if (!token) return null;

    const fileId = await this.findFile(token);
    if (!fileId) return null;

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Drive pull failed: ${res.status}`);
    }

    const data = await res.json();
    this.fileId = fileId;
    return Array.isArray(data) ? data : null;
  }

  async push(favorites: FavoritePhoto[]): Promise<void> {
    const token = await this.getToken(true);
    if (!token) return;

    const fileId = this.fileId ?? (await this.findFile(token));
    const body = JSON.stringify(favorites);

    if (fileId) {
      await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body,
        },
      );
      this.fileId = fileId;
    } else {
      const metadata = JSON.stringify({ name: FILE_NAME, parents: [FOLDER] });
      const form = new FormData();
      form.append('metadata', new Blob([metadata], { type: 'application/json' }));
      form.append('file', new Blob([body], { type: 'application/json' }));

      const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        },
      );

      if (res.ok) {
        const created = await res.json();
        this.fileId = created.id;
      }
    }
  }

  private async findFile(token: string): Promise<string | null> {
    const q = encodeURIComponent(`name='${FILE_NAME}' and '${FOLDER}' in parents`);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&spaces=${FOLDER}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok) return null;

    const data = await res.json();
    const file = data.files?.[0];
    return file?.id ?? null;
  }

  private getToken(interactive: boolean): Promise<string | null> {
    return new Promise(resolve => {
      chrome.identity.getAuthToken({ interactive }, token => {
        if (chrome.runtime.lastError || !token) {
          resolve(null);
        } else {
          resolve(token);
        }
      });
    });
  }
}
