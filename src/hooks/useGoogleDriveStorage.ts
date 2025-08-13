import { useState, useEffect, useCallback } from 'react';
import { googleDriveService } from '../services/googleDriveService';
import { TaskEntry, Client, User } from '../types';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: string | null;
  error: string | null;
}

export const useGoogleDriveStorage = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: localStorage.getItem('lastGoogleDriveSync'),
    error: null
  });

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true, error: null }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync every 5 minutes when online
  useEffect(() => {
    if (!syncStatus.isOnline) return;

    const interval = setInterval(() => {
      syncToGoogleDrive();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [syncStatus.isOnline]);

  const syncToGoogleDrive = useCallback(async () => {
    if (!syncStatus.isOnline || syncStatus.isSyncing) return;

    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      // Get local data
      const taskEntries = JSON.parse(localStorage.getItem('taxAuditEntries') || '[]');
      const clients = JSON.parse(localStorage.getItem('taxAuditClients') || '[]');
      const users = JSON.parse(localStorage.getItem('taxAuditUsers') || '[]');

      // Save to Google Drive
      const success = await Promise.all([
        googleDriveService.saveFile('taskEntries.json', taskEntries),
        googleDriveService.saveFile('clients.json', clients),
        googleDriveService.saveFile('users.json', users)
      ]);

      if (success.every(s => s)) {
        const now = new Date().toISOString();
        localStorage.setItem('lastGoogleDriveSync', now);
        setSyncStatus(prev => ({ 
          ...prev, 
          isSyncing: false, 
          lastSync: now,
          error: null 
        }));
      } else {
        throw new Error('Failed to sync some files');
      }
    } catch (error) {
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        error: (error as Error).message 
      }));
    }
  }, [syncStatus.isOnline, syncStatus.isSyncing]);

  const loadFromGoogleDrive = useCallback(async () => {
    if (!syncStatus.isOnline) return false;

    setSyncStatus(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      // Load from Google Drive
      const [taskEntries, clients, users] = await Promise.all([
        googleDriveService.loadFile('taskEntries.json'),
        googleDriveService.loadFile('clients.json'),
        googleDriveService.loadFile('users.json')
      ]);

      // Update local storage if data exists
      if (taskEntries) localStorage.setItem('taxAuditEntries', JSON.stringify(taskEntries));
      if (clients) localStorage.setItem('taxAuditClients', JSON.stringify(clients));
      if (users) localStorage.setItem('taxAuditUsers', JSON.stringify(users));

      const now = new Date().toISOString();
      localStorage.setItem('lastGoogleDriveSync', now);
      
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        lastSync: now,
        error: null 
      }));

      return true;
    } catch (error) {
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        error: (error as Error).message 
      }));
      return false;
    }
  }, [syncStatus.isOnline]);

  const createBackup = useCallback(async () => {
    if (!syncStatus.isOnline) return false;

    try {
      const taskEntries = JSON.parse(localStorage.getItem('taxAuditEntries') || '[]');
      const clients = JSON.parse(localStorage.getItem('taxAuditClients') || '[]');
      const users = JSON.parse(localStorage.getItem('taxAuditUsers') || '[]');

      return await googleDriveService.createBackup();
    } catch (error) {
      console.error('Error creating backup:', error);
      return false;
    }
  }, [syncStatus.isOnline]);

  const listBackups = useCallback(async () => {
    if (!syncStatus.isOnline) return [];

    try {
      const files = await googleDriveService.listBackups();
      return files;
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }, [syncStatus.isOnline]);

  return {
    syncStatus,
    syncToGoogleDrive,
    loadFromGoogleDrive,
    createBackup,
    listBackups
  };
};