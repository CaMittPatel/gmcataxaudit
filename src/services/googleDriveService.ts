// Google Drive API service for data storage
class GoogleDriveService {
  private accessToken: string | null = null;
  private readonly FOLDER_NAME = 'Tax Audit Data';
  private folderId: string | null = null;

  // Initialize Google API
  async initialize(): Promise<boolean> {
    try {
      await this.loadGoogleAPI();
      return await this.authenticate();
    } catch (error) {
      console.error('Failed to initialize Google Drive:', error);
      return false;
    }
  }

  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('auth2,client', resolve);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  private async authenticate(): Promise<boolean> {
    try {
      await window.gapi.client.init({
        apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: 'https://www.googleapis.com/auth/drive.file'
      });

      // Explicitly load the Drive API client
      await window.gapi.client.load('drive', 'v3');

      const authInstance = window.gapi.auth2.getAuthInstance();
      
      if (!authInstance.isSignedIn.get()) {
        await authInstance.signIn();
      }

      this.accessToken = authInstance.currentUser.get().getAuthResponse().access_token;
      await this.ensureDataFolder();
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  private async ensureDataFolder(): Promise<void> {
    try {
      // Search for existing folder
      const response = await window.gapi.client.drive.files.list({
        q: `name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)'
      });

      if (response.result.files && response.result.files.length > 0) {
        this.folderId = response.result.files[0].id;
      } else {
        // Create folder
        const createResponse = await window.gapi.client.drive.files.create({
          resource: {
            name: this.FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder'
          },
          fields: 'id'
        });
        this.folderId = createResponse.result.id;
      }
    } catch (error) {
      console.error('Failed to ensure data folder:', error);
      throw error;
    }
  }

  async saveFile(fileName: string, data: any): Promise<boolean> {
    try {
      if (!this.folderId) {
        await this.ensureDataFolder();
      }

      const fileContent = JSON.stringify(data, null, 2);
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      // Check if file exists
      const existingFile = await this.findFile(fileName);
      
      let metadata = {
        name: fileName,
        parents: [this.folderId]
      };

      let requestBody = delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) + delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent + close_delim;

      const request = new XMLHttpRequest();
      const url = existingFile 
        ? `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`
        : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      
      return new Promise((resolve, reject) => {
        request.open(existingFile ? 'PATCH' : 'POST', url);
        request.setRequestHeader('Authorization', `Bearer ${this.accessToken}`);
        request.setRequestHeader('Content-Type', `multipart/related; boundary="${boundary}"`);
        
        request.onload = () => {
          if (request.status === 200) {
            resolve(true);
          } else {
            console.error('Failed to save file:', request.responseText);
            resolve(false);
          }
        };
        
        request.onerror = () => {
          console.error('Network error while saving file');
          resolve(false);
        };
        
        request.send(requestBody);
      });
    } catch (error) {
      console.error('Error saving file:', error);
      return false;
    }
  }

  async loadFile(fileName: string): Promise<any> {
    try {
      const file = await this.findFile(fileName);
      if (!file) {
        return null;
      }

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (response.ok) {
        const text = await response.text();
        return JSON.parse(text);
      }
      return null;
    } catch (error) {
      console.error('Error loading file:', error);
      return null;
    }
  }

  private async findFile(fileName: string): Promise<any> {
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `name='${fileName}' and parents in '${this.folderId}' and trashed=false`,
        fields: 'files(id, name)'
      });

      return response.result.files && response.result.files.length > 0 
        ? response.result.files[0] 
        : null;
    } catch (error) {
      console.error('Error finding file:', error);
      return null;
    }
  }

  async createBackup(): Promise<boolean> {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const backupData = {
        timestamp: new Date().toISOString(),
        taskEntries: JSON.parse(localStorage.getItem('taxAuditEntries') || '[]'),
        clients: JSON.parse(localStorage.getItem('taxAuditClients') || '[]'),
        users: JSON.parse(localStorage.getItem('taxAuditUsers') || '[]')
      };

      return await this.saveFile(`backup_${timestamp}.json`, backupData);
    } catch (error) {
      console.error('Error creating backup:', error);
      return false;
    }
  }

  async listBackups(): Promise<any[]> {
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `name contains 'backup_' and parents in '${this.folderId}' and trashed=false`,
        fields: 'files(id, name, createdTime)',
        orderBy: 'createdTime desc'
      });

      return response.result.files || [];
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  async restoreBackup(backupId: string): Promise<any> {
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${backupId}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (response.ok) {
        const text = await response.text();
        return JSON.parse(text);
      }
      return null;
    } catch (error) {
      console.error('Error restoring backup:', error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && window.gapi?.auth2?.getAuthInstance()?.isSignedIn?.get();
  }

  async signOut(): Promise<void> {
    if (window.gapi?.auth2) {
      await window.gapi.auth2.getAuthInstance().signOut();
      this.accessToken = null;
      this.folderId = null;
    }
  }
}

export const googleDriveService = new GoogleDriveService();