import React, { useState } from 'react';
import { Building2, Plus, Edit3, Save, X, Search, CheckCircle, XCircle, Upload, Download } from 'lucide-react';
import { Client } from '../types';
import ExcelImport from './ExcelImport';

interface ClientMasterProps {
  clients: Client[];
  onAddClient: (client: Omit<Client, 'id' | 'lastUpdated'>) => void;
  onImportClients: (clients: Omit<Client, 'id' | 'lastUpdated'>[]) => void;
  onUpdateClient: (clientId: string, updates: Partial<Client>) => void;
  userRights: string;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep', 'Puducherry'
];

const ClientMaster: React.FC<ClientMasterProps> = ({ clients, onAddClient, onImportClients, onUpdateClient, userRights }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    registrationStatus: 'Unregistered' as 'Registered' | 'Unregistered',
    gstn: '',
    pan: '',
    state: ''
  });

  const [editData, setEditData] = useState({
    name: '',
    registrationStatus: 'Unregistered' as 'Registered' | 'Unregistered',
    gstn: '',
    pan: '',
    state: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.gstn && client.gstn.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.pan && client.pan.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const validateForm = (data: typeof formData, isEdit = false) => {
    const newErrors: Record<string, string> = {};
    
    if (!data.name.trim()) {
      newErrors.name = 'Client name is required';
    } else if (!isEdit) {
      // Check for duplicate names only when adding new client
      const existingClient = clients.find(c => 
        c.name.toLowerCase() === data.name.trim().toLowerCase()
      );
      if (existingClient) {
        newErrors.name = 'Client with this name already exists';
      }
    }
    
    if (!data.state) {
      newErrors.state = 'State is required';
    }
    
    if (data.registrationStatus === 'Registered') {
      if (!data.gstn.trim()) {
        newErrors.gstn = 'GSTN is required for registered clients';
      } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(data.gstn.trim())) {
        newErrors.gstn = 'Please enter a valid GSTN format (15 characters)';
      }
    }
    
    if (data.pan.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.pan.trim())) {
      newErrors.pan = 'Please enter a valid PAN format (10 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(formData)) return;
    
    onAddClient({
      name: formData.name.trim(),
      registrationStatus: formData.registrationStatus,
      gstn: formData.registrationStatus === 'Registered' ? formData.gstn.trim().toUpperCase() : undefined,
      pan: formData.pan.trim().toUpperCase() || undefined,
      state: formData.state
    });
    
    // Reset form
    setFormData({
      name: '',
      registrationStatus: 'Unregistered',
      gstn: '',
      pan: '',
      state: ''
    });
    setShowAddForm(false);
    setErrors({});
  };

  const handleEditClick = (client: Client) => {
    setEditingClient(client.id);
    setEditData({
      name: client.name,
      registrationStatus: client.registrationStatus,
      gstn: client.gstn || '',
      pan: client.pan || '',
      state: client.state
    });
    setErrors({});
  };

  const handleSaveEdit = () => {
    if (!validateForm(editData, true)) return;
    
    onUpdateClient(editingClient!, {
      name: editData.name.trim(),
      registrationStatus: editData.registrationStatus,
      gstn: editData.registrationStatus === 'Registered' ? editData.gstn.trim().toUpperCase() : undefined,
      pan: editData.pan.trim().toUpperCase() || undefined,
      state: editData.state
    });
    
    setEditingClient(null);
    setErrors({});
  };

  const handleCancelEdit = () => {
    setEditingClient(null);
    setErrors({});
  };

  const handleRegistrationChange = (value: 'Registered' | 'Unregistered', isEdit = false) => {
    if (isEdit) {
      setEditData(prev => ({
        ...prev,
        registrationStatus: value,
        gstn: value === 'Unregistered' ? '' : prev.gstn,
        pan: prev.pan
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        registrationStatus: value,
        gstn: value === 'Unregistered' ? '' : prev.gstn,
        pan: prev.pan
      }));
    }
    
    // Clear GSTN error when switching to Unregistered
    if (value === 'Unregistered' && errors.gstn) {
      setErrors(prev => ({ ...prev, gstn: '' }));
    }
  };

  const handleExportClients = () => {
    if (clients.length === 0) {
      alert('No clients to export');
      return;
    }

    const csvContent = [
      ['Client Name', 'Registration Status', 'GSTN', 'PAN', 'State'].join(','),
      ...clients.map(client => [
        `"${client.name}"`,
        client.registrationStatus,
        client.gstn || '',
        client.pan || '',
        `"${client.state}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clients_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Building2 className="h-6 w-6 text-indigo-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Client Master</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <button
              onClick={() => setShowImport(!showImport)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors mr-2"
            >
              <Upload className="h-4 w-4 mr-2" />
              Excel Import
            </button>
            
            <button
              onClick={handleExportClients}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mr-2"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Clients
            </button>
            
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Client</h3>
            
            <form onSubmit={handleAddClient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter client name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Status *
                  </label>
                  <select
                    value={formData.registrationStatus}
                    onChange={(e) => handleRegistrationChange(e.target.value as 'Registered' | 'Unregistered')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  >
                    <option value="Unregistered">Unregistered</option>
                    <option value="Registered">Registered</option>
                  </select>
                </div>

                {formData.registrationStatus === 'Registered' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GSTN *
                    </label>
                    <input
                      type="text"
                      value={formData.gstn}
                      onChange={(e) => setFormData(prev => ({ ...prev, gstn: e.target.value.toUpperCase() }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                        errors.gstn ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter GSTN (15 characters)"
                      maxLength={15}
                    />
                    {errors.gstn && (
                      <p className="mt-1 text-sm text-red-600">{errors.gstn}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={formData.pan}
                    onChange={(e) => setFormData(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                      errors.pan ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter PAN (10 characters)"
                    maxLength={10}
                  />
                  {errors.pan && (
                    <p className="mt-1 text-sm text-red-600">{errors.pan}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                      errors.state ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({
                      name: '',
                      registrationStatus: 'Unregistered',
                      gstn: '',
                      pan: '',
                      state: ''
                    });
                    setErrors({});
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Client
                </button>
              </div>
            </form>
          </div>
        )}

        {showImport && (
          <div className="mb-6">
            <ExcelImport 
              onImportClients={onImportClients}
              existingClients={clients}
            />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GSTN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PAN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingClient === client.id ? (
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                        className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                    )}
                    {editingClient === client.id && errors.name && (
                      <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingClient === client.id ? (
                      <select
                        value={editData.registrationStatus}
                        onChange={(e) => handleRegistrationChange(e.target.value as 'Registered' | 'Unregistered', true)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Unregistered">Unregistered</option>
                        <option value="Registered">Registered</option>
                      </select>
                    ) : (
                      <div className="flex items-center">
                        {client.registrationStatus === 'Registered' ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400 mr-2" />
                        )}
                        <span className="text-sm text-gray-900">{client.registrationStatus}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingClient === client.id ? (
                      editData.registrationStatus === 'Registered' ? (
                        <div>
                          <input
                            type="text"
                            value={editData.gstn}
                            onChange={(e) => setEditData(prev => ({ ...prev, gstn: e.target.value.toUpperCase() }))}
                            className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              errors.gstn ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Enter GSTN"
                            maxLength={15}
                          />
                          {errors.gstn && (
                            <p className="mt-1 text-xs text-red-600">{errors.gstn}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )
                    ) : (
                      <span className="text-sm text-gray-900">{client.gstn || '-'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingClient === client.id ? (
                      <div>
                        <input
                          type="text"
                          value={editData.pan}
                          onChange={(e) => setEditData(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                          className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            errors.pan ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter PAN"
                          maxLength={10}
                        />
                        {errors.pan && (
                          <p className="mt-1 text-xs text-red-600">{errors.pan}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-900">{client.pan || '-'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingClient === client.id ? (
                      <div>
                        <select
                          value={editData.state}
                          onChange={(e) => setEditData(prev => ({ ...prev, state: e.target.value }))}
                          className={`w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            errors.state ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select State</option>
                          {INDIAN_STATES.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                        {errors.state && (
                          <p className="mt-1 text-xs text-red-600">{errors.state}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-900">{client.state}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(client.lastUpdated).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      {editingClient === client.id ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEditClick(client)}
                          disabled={userRights === 'Stage 1 rights'}
                          className={`inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                            userRights === 'Stage 1 rights' 
                              ? 'text-gray-500 bg-gray-100 cursor-not-allowed' 
                              : 'text-indigo-600 bg-indigo-100 hover:bg-indigo-200'
                          }`}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          {userRights === 'Stage 1 rights' ? 'View Only' : 'Edit'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredClients.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No clients found. Add your first client to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientMaster;