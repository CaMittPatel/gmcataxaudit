import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Users, ClipboardList, Download, Plus, Eye, Search, Calendar, Building2, LogOut, User, Database, X } from 'lucide-react';
import LoginForm from './components/LoginForm';
import TaskEntryForm from './components/TaskEntryForm';
import ClientDashboard from './components/ClientDashboard';
import ClientMaster from './components/ClientMaster';
import TaskFilterDashboard from './components/TaskFilterDashboard';
import GoogleDriveSync from './components/GoogleDriveSync';
import { useGoogleDriveStorage } from './hooks/useGoogleDriveStorage';
import { TaskEntry, Client, User as UserType } from './types';

function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentUserRights, setCurrentUserRights] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'entry' | 'dashboard' | 'clients' | 'filter' | 'sync'>('entry');
  const [entries, setEntries] = useState<TaskEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [showUserManagement, setShowUserManagement] = useState<boolean>(false);
  
  // Google Drive integration
  const { syncStatus, syncToGoogleDrive, loadFromGoogleDrive, createBackup, listBackups } = useGoogleDriveStorage();

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedUserRights = localStorage.getItem('currentUserRights');
    const savedEntries = localStorage.getItem('taxAuditEntries');
    const savedClients = localStorage.getItem('taxAuditClients');
    const savedUsers = localStorage.getItem('taxAuditUsers');
    
    if (savedUser) {
      setCurrentUser(savedUser);
    }
    
    if (savedUserRights) {
      setCurrentUserRights(savedUserRights);
    }
    
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
    
    if (savedClients) {
      setClients(JSON.parse(savedClients));
    }
    
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      // Initialize with default admin user if no users exist
      const defaultUsers: UserType[] = [{
        id: '1',
        username: 'admin',
        password: 'admin123',
        rights: 'Top Level Rights',
        createdAt: new Date().toISOString()
      }];
      setUsers(defaultUsers);
      localStorage.setItem('taxAuditUsers', JSON.stringify(defaultUsers));
    }
  }, []);

  // Save data to localStorage whenever entries or clients change
  useEffect(() => {
    localStorage.setItem('taxAuditEntries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('taxAuditClients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('taxAuditUsers', JSON.stringify(users));
  }, [users]);

  // Handle data loading from Google Drive
  const handleDataLoad = (data: { entries: TaskEntry[], clients: Client[], users: UserType[] }) => {
    setEntries(data.entries);
    setClients(data.clients);
    setUsers(data.users);
  };

  // Handle sync status changes
  const handleSyncStatusChange = (status: { isOnline: boolean; lastSync: string | null }) => {
    // You can add UI feedback here if needed
    console.log('Sync status:', status);
  };

  const handleLogin = (username: string, rights: string) => {
    setCurrentUser(username);
    setCurrentUserRights(rights);
    localStorage.setItem('currentUser', username);
    localStorage.setItem('currentUserRights', rights);
  };

  const handleAddUser = (user: Omit<UserType, 'id'>) => {
    const newUser = { ...user, id: Date.now().toString() };
    setUsers(prev => [...prev, newUser]);
  };

  const handleUpdateUser = (userId: string, updates: Partial<UserType>) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, ...updates }
        : user
    ));
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCurrentUserRights('');
    localStorage.removeItem('currentUserRights');
    setActiveTab('entry');
  };

  const addEntry = (entry: TaskEntry) => {
    // Normalize client name to prevent case-sensitive duplicates
    // Find the exact client name from the master list (case-insensitive search)
    const masterClient = clients.find(c => 
      c.name.toLowerCase() === entry.clientName.trim().toLowerCase()
    );
    
    // Use the exact name from master client list to maintain consistency
    const normalizedClientName = masterClient ? masterClient.name : entry.clientName.trim();
    
    const newEntry = {
      ...entry,
      verifiedBy: entry.verifiedBy || currentUser || 'Unknown',
      clientName: normalizedClientName,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    
    setEntries(prev => [...prev, newEntry]);
    
    // Update the client's lastUpdated timestamp
    setClients(prev => prev.map(client => 
      client.name.toLowerCase() === normalizedClientName.toLowerCase()
        ? { ...client, lastUpdated: new Date().toISOString() }
        : client
    ));
  };

  const addClient = (clientData: Omit<Client, 'id' | 'lastUpdated'>) => {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(),
      lastUpdated: new Date().toISOString(),
    };
    
    setClients(prev => [...prev, newClient]);
  };

  const updateClient = (clientId: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(client => 
      client.id === clientId 
        ? { ...client, ...updates, lastUpdated: new Date().toISOString() }
        : client
    ));
  };

  const importClients = (clientsData: Omit<Client, 'id' | 'lastUpdated'>[]) => {
    const updatedClients = [...clients];
    
    clientsData.forEach(clientData => {
      // Check if client exists by name or GSTN
      const existingByName = updatedClients.findIndex(c => 
        c.name.toLowerCase() === clientData.name.toLowerCase()
      );
      const existingByGSTN = clientData.gstn ? updatedClients.findIndex(c => 
        c.gstn && c.gstn.toLowerCase() === clientData.gstn.toLowerCase()
      ) : -1;
      
      const existingIndex = existingByName !== -1 ? existingByName : existingByGSTN;
      
      if (existingIndex !== -1) {
        // Update existing client
        updatedClients[existingIndex] = {
          ...updatedClients[existingIndex],
          ...clientData,
          lastUpdated: new Date().toISOString()
        };
      } else {
        // Add new client
        const newClient: Client = {
          ...clientData,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          lastUpdated: new Date().toISOString(),
        };
        updatedClients.push(newClient);
      }
    });
    
    setClients(updatedClients);
  };

  const updateEntry = (entryId: string, updates: Partial<TaskEntry>) => {
    setEntries(prev => prev.map(entry => 
      entry.id === entryId 
        ? { ...entry, ...updates, lastStatusUpdate: new Date().toISOString() }
        : entry
    ));
    
    // Update client's last updated timestamp
    const entry = entries.find(e => e.id === entryId);
    if (entry) {
      setClients(prev => prev.map(c => 
        c.name.toLowerCase() === entry.clientName.toLowerCase()
          ? { ...c, lastUpdated: new Date().toISOString() }
          : c
      ));
    }
  };

  const updateQueryStatus = (entryId: string, newStatus: TaskEntry['queriesSolved'], solvedBy?: string) => {
    setEntries(prev => prev.map(entry => 
      entry.id === entryId 
        ? { 
            ...entry, 
            queriesSolved: newStatus, 
            queriesSolvedBy: newStatus === 'Yes' ? solvedBy : undefined,
            checkedBy: solvedBy === 'CA Mitt Patel' ? 'CA Mitt Patel' : entry.checkedBy,
            lastStatusUpdate: new Date().toISOString() 
          }
        : entry
    ));
    
    // Update client's last updated timestamp
    const entry = entries.find(e => e.id === entryId);
    if (entry) {
      setClients(prev => prev.map(c => 
        c.name.toLowerCase() === entry.clientName.toLowerCase()
          ? { ...c, lastUpdated: new Date().toISOString() }
          : c
      ));
    }
  };

  const updateDisallowances = (entryId: string, disallowances: TaskEntry['disallowances']) => {
    setEntries(prev => prev.map(entry => 
      entry.id === entryId 
        ? { 
            ...entry, 
            disallowances: disallowances,
            lastStatusUpdate: new Date().toISOString() 
          }
        : entry
    ));
    
    // Update client's last updated timestamp
    const entry = entries.find(e => e.id === entryId);
    if (entry) {
      setClients(prev => prev.map(c => 
        c.name.toLowerCase() === entry.clientName.toLowerCase()
          ? { ...c, lastUpdated: new Date().toISOString() }
          : c
      ));
    }
  };

  const updateResubmissions = (entryId: string, resubmissions: TaskEntry['resubmissions']) => {
    setEntries(prev => prev.map(entry => 
      entry.id === entryId 
        ? { 
            ...entry, 
            resubmissions: resubmissions,
            lastStatusUpdate: new Date().toISOString() 
          }
        : entry
    ));
    
    // Update client's last updated timestamp
    const entry = entries.find(e => e.id === entryId);
    if (entry) {
      setClients(prev => prev.map(c => 
        c.name.toLowerCase() === entry.clientName.toLowerCase()
          ? { ...c, lastUpdated: new Date().toISOString() }
          : c
      ));
    }
  };

  const updateRepreparations = (entryId: string, repreparations: TaskEntry['repreparations']) => {
    setEntries(prev => prev.map(entry => 
      entry.id === entryId 
        ? { 
            ...entry, 
            repreparations: repreparations,
            lastStatusUpdate: new Date().toISOString() 
          }
        : entry
    ));
    
    // Update client's last updated timestamp
    const entry = entries.find(e => e.id === entryId);
    if (entry) {
      setClients(prev => prev.map(c => 
        c.name.toLowerCase() === entry.clientName.toLowerCase()
          ? { ...c, lastUpdated: new Date().toISOString() }
          : c
      ));
    }
  };

  const updateRecheckHistory = (entryId: string, recheckHistory: TaskEntry['recheckHistory']) => {
    setEntries(prev => prev.map(entry => 
      entry.id === entryId 
        ? { 
            ...entry, 
            recheckHistory: recheckHistory,
            lastStatusUpdate: new Date().toISOString() 
          }
        : entry
    ));
    
    // Update client's last updated timestamp
    const entry = entries.find(e => e.id === entryId);
    if (entry) {
      setClients(prev => prev.map(c => 
        c.name.toLowerCase() === entry.clientName.toLowerCase()
          ? { ...c, lastUpdated: new Date().toISOString() }
          : c
      ));
    }
  };

  const exportToExcel = () => {
    const csvContent = [
      ['Client Name', 'Task Type', 'Verified By', 'Date', 'Queries Solved', 'Queries Solved By', 'Disallowances', 'Timestamp'],
      ...entries.map(entry => [
        entry.clientName,
        entry.taskType,
        entry.verifiedBy,
        entry.date,
        entry.queriesSolved,
        entry.queriesSolvedBy || '',
        entry.disallowances ? entry.disallowances.map(d => `${d.section}: ${d.disallowance}`).join('; ') : '',
        new Date(entry.timestamp).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tax-audit-entries-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Show login form if user is not authenticated
  if (!currentUser) {
    return (
      <LoginForm 
        onLogin={handleLogin} 
        users={users} 
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        currentUser={currentUser}
        currentUserRights={currentUserRights}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tax Audit Practice Management</h1>
                <p className="text-sm text-gray-600">Welcome, {currentUser}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-indigo-50 rounded-lg">
                <User className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-700">{currentUser}</span>
                {syncStatus?.isOnline && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600">Synced</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
              
              <button
                onClick={() => setShowUserManagement(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </button>
              
              <button
                onClick={exportToExcel}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </button>
              
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('entry')}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'entry' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Task Entry
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'dashboard' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('filter')}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'filter' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Filter Tasks
                </button>
                <button
                  onClick={() => setActiveTab('clients')}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'clients' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Client Master
                </button>
                <button
                  onClick={() => setActiveTab('sync')}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'sync' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Google Drive
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'entry' && (
          <TaskEntryForm 
            onAddEntry={addEntry} 
            existingEntries={entries} 
            existingClients={clients}
            currentUser={currentUser}
            userRights={currentUserRights}
          />
        )}
        
        {activeTab === 'dashboard' && (
          <ClientDashboard 
            entries={entries} 
            clients={clients} 
            onUpdateQueryStatus={updateQueryStatus}
            onUpdateDisallowances={updateDisallowances}
            onUpdateResubmissions={updateResubmissions}
            onUpdateRepreparations={updateRepreparations}
            onUpdateRecheckHistory={updateRecheckHistory}
            onUpdateEntry={updateEntry}
            userRights={currentUserRights}
          />
        )}
        
        {activeTab === 'filter' && (
          <TaskFilterDashboard 
            entries={entries} 
            clients={clients} 
          />
        )}
        
        {activeTab === 'clients' && (
          <ClientMaster 
            clients={clients} 
            onAddClient={addClient}
            onImportClients={importClients}
            onUpdateClient={updateClient}
            userRights={currentUserRights}
          />
        )}
        
        {activeTab === 'sync' && (
          <GoogleDriveSync 
            onDataLoad={handleDataLoad}
            onSyncStatusChange={handleSyncStatusChange}
          />
        )}
      </div>

      {/* User Management Modal */}
      {showUserManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">User Management</h2>
              <button
                onClick={() => setShowUserManagement(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <LoginForm 
              onLogin={() => {}} 
              users={users} 
              onAddUser={(user) => {
                handleAddUser(user);
                setShowUserManagement(false);
              }}
              onUpdateUser={(userId, updates) => {
                handleUpdateUser(userId, updates);
                setShowUserManagement(false);
              }}
              onDeleteUser={handleDeleteUser}
              currentUser={currentUser}
              currentUserRights={currentUserRights}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;