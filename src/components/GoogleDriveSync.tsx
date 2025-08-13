import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, Download, Upload, Shield, AlertCircle, CheckCircle, Clock, Database } from 'lucide-react';
import { googleDriveService } from '../services/googleDriveService';

interface GoogleDriveSyncProps {
  onDataLoad: (data: { entries: any[], clients: any[], users: any[] }) => void;
  onSyncStatusChange: (status: { isOnline: boolean; lastSync: string | null }) => void;
}

const GoogleDriveSync: React.FC<GoogleDriveSyncProps> = ({ onDataLoad, onSyncStatusChange }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(localStorage.getItem('lastGoogleDriveSync'));
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [showBackups, setShowBackups] = useState(false);

  useEffect(() => {
    checkConnection();
    // Auto-sync every 5 minutes when connected
    const interval = setInterval(() => {
      if (isConnected) {
        syncToGoogleDrive();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    onSyncStatusChange({ isOnline: isConnected, lastSync });
  }, [isConnected, lastSync, onSyncStatusChange]);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const connected = googleDriveService.isAuthenticated();
      setIsConnected(connected);
      if (connected) {
        await loadBackups();
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const connectToGoogleDrive = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await googleDriveService.initialize();
      if (success) {
        setIsConnected(true);
        setSyncStatus('success');
        await loadFromGoogleDrive();
        await loadBackups();
      } else {
        setError('Failed to connect to Google Drive. Please check your credentials.');
        setSyncStatus('error');
      }
    } catch (error) {
      setError((error as Error).message);
      setSyncStatus('error');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const syncToGoogleDrive = async () => {
    if (!isConnected) return;
    
    setSyncStatus('syncing');
    setError(null);
    
    try {
      const taskEntries = JSON.parse(localStorage.getItem('taxAuditEntries') || '[]');
      const clients = JSON.parse(localStorage.getItem('taxAuditClients') || '[]');
      const users = JSON.parse(localStorage.getItem('taxAuditUsers') || '[]');

      const results = await Promise.all([
        googleDriveService.saveFile('taskEntries.json', taskEntries),
        googleDriveService.saveFile('clients.json', clients),
        googleDriveService.saveFile('users.json', users)
      ]);

      if (results.every(r => r)) {
        const now = new Date().toISOString();
        setLastSync(now);
        localStorage.setItem('lastGoogleDriveSync', now);
        setSyncStatus('success');
      } else {
        throw new Error('Some files failed to sync');
      }
    } catch (error) {
      setError((error as Error).message);
      setSyncStatus('error');
    }
  };

  const loadFromGoogleDrive = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [taskEntries, clients, users] = await Promise.all([
        googleDriveService.loadFile('taskEntries.json'),
        googleDriveService.loadFile('clients.json'),
        googleDriveService.loadFile('users.json')
      ]);

      // Update local storage and notify parent
      if (taskEntries) localStorage.setItem('taxAuditEntries', JSON.stringify(taskEntries));
      if (clients) localStorage.setItem('taxAuditClients', JSON.stringify(clients));
      if (users) localStorage.setItem('taxAuditUsers', JSON.stringify(users));

      onDataLoad({
        entries: taskEntries || [],
        clients: clients || [],
        users: users || []
      });

      const now = new Date().toISOString();
      setLastSync(now);
      localStorage.setItem('lastGoogleDriveSync', now);
      setSyncStatus('success');
    } catch (error) {
      setError((error as Error).message);
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const createBackup = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    try {
      const success = await googleDriveService.createBackup();
      if (success) {
        await loadBackups();
        setSyncStatus('success');
      } else {
        throw new Error('Failed to create backup');
      }
    } catch (error) {
      setError((error as Error).message);
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBackups = async () => {
    if (!isConnected) return;
    
    try {
      const backupList = await googleDriveService.listBackups();
      setBackups(backupList);
    } catch (error) {
      console.error('Error loading backups:', error);
    }
  };

  const restoreBackup = async (backupId: string, backupName: string) => {
    if (!isConnected) return;
    
    const confirmed = window.confirm(`Are you sure you want to restore from backup "${backupName}"? This will overwrite all current data.`);
    if (!confirmed) return;
    
    setIsLoading(true);
    try {
      const backupData = await googleDriveService.restoreBackup(backupId);
      if (backupData) {
        // Restore to local storage
        localStorage.setItem('taxAuditEntries', JSON.stringify(backupData.taskEntries || []));
        localStorage.setItem('taxAuditClients', JSON.stringify(backupData.clients || []));
        localStorage.setItem('taxAuditUsers', JSON.stringify(backupData.users || []));

        // Notify parent component
        onDataLoad({
          entries: backupData.taskEntries || [],
          clients: backupData.clients || [],
          users: backupData.users || []
        });

        setSyncStatus('success');
        alert('Backup restored successfully! Please refresh the page to see the changes.');
      } else {
        throw new Error('Failed to restore backup');
      }
    } catch (error) {
      setError((error as Error).message);
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    await googleDriveService.signOut();
    setIsConnected(false);
    setLastSync(null);
    setSyncStatus('idle');
    setError(null);
    localStorage.removeItem('lastGoogleDriveSync');
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing': return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'syncing': return 'Syncing...';
      case 'success': return 'Synced';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Database className="h-6 w-6 text-indigo-600 mr-3" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Google Drive Storage</h2>
            <p className="text-sm text-gray-600">Sync your data to Google Drive (2TB Plan)</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-700">{getStatusText()}</span>
        </div>
      </div>

      {!isConnected ? (
        <div className="text-center py-8">
          <CloudOff className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connect to Google Drive</h3>
          <p className="text-gray-600 mb-6">
            Store your tax audit data securely in your Google Drive with automatic sync
          </p>
          <button
            onClick={connectToGoogleDrive}
            disabled={isLoading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Cloud className="h-5 w-5 mr-2" />
                Connect to Google Drive
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-green-900">Connected to Google Drive</h4>
                <p className="text-sm text-green-700">
                  Data folder: "Tax Audit Data" | 
                  {lastSync && ` Last sync: ${new Date(lastSync).toLocaleString()}`}
                </p>
              </div>
              <button
                onClick={disconnect}
                className="text-sm text-green-700 hover:text-green-900 underline"
              >
                Disconnect
              </button>
            </div>
          </div>

          {/* Sync Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={syncToGoogleDrive}
              disabled={isLoading || syncStatus === 'syncing'}
              className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="h-4 w-4 mr-2" />
              Sync to Drive
            </button>

            <button
              onClick={loadFromGoogleDrive}
              disabled={isLoading}
              className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              Load from Drive
            </button>

            <button
              onClick={createBackup}
              disabled={isLoading}
              className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shield className="h-4 w-4 mr-2" />
              Create Backup
            </button>
          </div>

          {/* Backup Management */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Backup Management</h3>
              <button
                onClick={() => setShowBackups(!showBackups)}
                className="text-sm text-indigo-600 hover:text-indigo-900"
              >
                {showBackups ? 'Hide' : 'Show'} Backups ({backups.length})
              </button>
            </div>

            {showBackups && (
              <div className="bg-gray-50 rounded-lg p-4">
                {backups.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No backups found</p>
                ) : (
                  <div className="space-y-2">
                    {backups.slice(0, 10).map((backup) => (
                      <div key={backup.id} className="flex items-center justify-between bg-white p-3 rounded border">
                        <div>
                          <div className="font-medium text-gray-900">{backup.name}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(backup.createdTime).toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => restoreBackup(backup.id, backup.name)}
                          disabled={isLoading}
                          className="text-sm text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-red-900">Sync Error</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Auto-sync Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <RefreshCw className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Auto-Sync Enabled</h4>
                <p className="text-sm text-blue-700">
                  Your data automatically syncs to Google Drive every 5 minutes when connected.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleDriveSync;