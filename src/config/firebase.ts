import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Filter, X, CheckCircle, XCircle, Clock, AlertTriangle, Search, Download, FileText, ChevronDown, Check } from 'lucide-react';
import { TaskEntry, Client } from '../types';

interface TaskFilterDashboardProps {
  entries: TaskEntry[];
  clients: Client[];
}

const TASK_TYPES = [
  'Opening Balance Verification',
  'Audit Queries Status Checking',
  'Ledger Scrutiny',
  '26AS Checking',
  'AIS Checking',
  'GST Verification',
  'Data feeding in Software',
  'Dis-allowances in 3CD',
  'Check and Approved by (Level 1)',
  'Copy to Rehan Sir',
  '3CD Prepared by',
  'Computation of Total Income Checking',
  'Final Verification before Upload to IT Portal',
  'UDIN Number'
];

type StatusType = 'completed' | 'partial' | 'pending' | 'not-started';

interface FilterDropdownProps {
  taskType: string;
  isOpen: boolean;
  onToggle: () => void;
  selectedStatuses: StatusType[];
  onStatusChange: (statuses: StatusType[]) => void;
  statusCounts: Record<StatusType, number>;
  onClose: () => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  taskType,
  isOpen,
  onToggle,
  selectedStatuses,
  onStatusChange,
  statusCounts,
  onClose
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const allStatuses: StatusType[] = ['completed', 'partial', 'pending', 'not-started'];
  const isAllSelected = allStatuses.every(status => selectedStatuses.includes(status));

  const handleSelectAll = () => {
    onStatusChange(isAllSelected ? [] : allStatuses);
  };

  const handleStatusToggle = (status: StatusType) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter(s => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  const getStatusIcon = (status: StatusType) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'pending': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'not-started': return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: StatusType) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'partial': return 'Partial';
      case 'pending': return 'Pending';
      case 'not-started': return 'Not Started';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-300 rounded-lg shadow-xl z-50"
    >
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-900">Filter Options</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`select-all-${taskType}`}
            checked={isAllSelected}
            onChange={handleSelectAll}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
          />
          <label
            htmlFor={`select-all-${taskType}`}
            className="text-sm font-medium text-gray-700 cursor-pointer select-none"
          >
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </label>
        </div>
      </div>

      <div className="p-2 max-h-64 overflow-y-auto">
        {allStatuses.map(status => (
          <div 
            key={status} 
            className="flex items-center space-x-3 p-2 hover:bg-blue-50 rounded cursor-pointer"
            onClick={() => handleStatusToggle(status)}
          >
            <input
              type="checkbox"
              id={`${taskType}-${status}`}
              checked={selectedStatuses.includes(status)}
              onChange={() => handleStatusToggle(status)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <div className="flex items-center space-x-2 flex-1">
              {getStatusIcon(status)}
              <span className="text-sm text-gray-700 font-medium">{getStatusText(status)}</span>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full min-w-[2rem] text-center">
              {statusCounts[status] || 0}
            </span>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between text-xs text-gray-600">
          <span className="font-medium">Total Records: {Object.values(statusCounts).reduce((sum, count) => sum + count, 0)}</span>
          <span className="font-medium">Active Filters: {selectedStatuses.length}</span>
        </div>
      </div>
    </div>
  );
};

const TaskFilterDashboard: React.FC<TaskFilterDashboardProps> = ({ entries, clients }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, StatusType[]>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [masterFilter, setMasterFilter] = useState<StatusType | null>(null);

  const getTaskStatus = (clientName: string, taskType: string): StatusType => {
    const clientEntries = entries.filter(e => 
      e.clientName.toLowerCase() === clientName.toLowerCase() && 
      e.taskType === taskType
    );

    if (clientEntries.length === 0) {
      return 'not-started';
    }

    const latestEntry = clientEntries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    if (taskType === '3CD Prepared by') {
      if (latestEntry.preparationStatus === 'Done') return 'completed';
      if (latestEntry.preparationStatus === 'Partial') return 'partial';
      return 'pending';
    }

    if (latestEntry.queriesSolved === 'Yes') return 'completed';
    if (latestEntry.queriesSolved === 'Partial') return 'partial';
    if (latestEntry.queriesSolved === 'No') return 'pending';
    return 'pending';
  };

  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending': return 'bg-red-100 text-red-800 border-red-200';
      case 'not-started': return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: StatusType) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'partial': return <Clock className="h-3 w-3" />;
      case 'pending': return <XCircle className="h-3 w-3" />;
      case 'not-started': return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const getStatusText = (status: StatusType) => {
    switch (status) {
      case 'completed': return 'Done';
      case 'partial': return 'Partial';
      case 'pending': return 'Pending';
      case 'not-started': return 'Not Started';
    }
  };

  const getColumnStatusCounts = (taskType: string) => {
    let clientsToCheck = clients;
    
    if (searchTerm) {
      clientsToCheck = clientsToCheck.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.gstn && client.gstn.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return clientsToCheck.reduce((acc, client) => {
      const status = getTaskStatus(client.name, taskType);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<StatusType, number>);
  };

  const filteredClients = useMemo(() => {
    let filtered = clients;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.gstn && client.gstn.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply master filter
    if (masterFilter) {
      filtered = filtered.filter(client => {
        return TASK_TYPES.some(taskType => {
          const status = getTaskStatus(client.name, taskType);
          return status === masterFilter;
        });
      });
    }

    // Apply column filters with AND logic
    const activeColumnFilters = Object.entries(columnFilters).filter(([_, statuses]) => statuses.length > 0);
    
    if (activeColumnFilters.length > 0) {
      filtered = filtered.filter(client => {
        // Client must satisfy ALL column filter conditions (AND logic)
        return activeColumnFilters.every(([taskType, allowedStatuses]) => {
          const status = getTaskStatus(client.name, taskType);
          return allowedStatuses.includes(status);
        });
      });
    }

    return filtered;
  }, [clients, searchTerm, columnFilters, masterFilter, entries]);

  const handleColumnFilterChange = (taskType: string, statuses: StatusType[]) => {
    setColumnFilters(prev => ({
      ...prev,
      [taskType]: statuses
    }));
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setSearchTerm('');
    setMasterFilter(null);
    setOpenDropdown(null);
  };

  const hasActiveFilters = Object.values(columnFilters).some(statuses => statuses.length > 0) || searchTerm.length > 0 || masterFilter !== null;

  const exportFilteredData = () => {
    if (filteredClients.length === 0) {
      alert('No data to export');
      return;
    }

    const csvContent = [
      ['Client Name', 'State', 'GSTN', ...TASK_TYPES].join(','),
      ...filteredClients.map(client => [
        `"${client.name}"`,
        `"${client.state}"`,
        client.gstn || '',
        ...TASK_TYPES.map(taskType => {
          const status = getTaskStatus(client.name, taskType);
          return getStatusText(status);
        })
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `task-matrix-filtered-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActiveFilterCount = () => {
    const columnFilterCount = Object.values(columnFilters).reduce((count, statuses) => count + (statuses.length > 0 ? 1 : 0), 0);
    const masterFilterCount = masterFilter ? 1 : 0;
    return columnFilterCount + masterFilterCount;
  };

  const getMasterFilterCounts = () => {
    return (['completed', 'partial', 'pending', 'not-started'] as StatusType[]).reduce((acc, status) => {
      acc[status] = clients.filter(client => {
        return TASK_TYPES.some(taskType => getTaskStatus(client.name, taskType) === status);
      }).length;
      return acc;
    }, {} as Record<StatusType, number>);
  };

  const masterFilterCounts = getMasterFilterCounts();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Filter className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Task Matrix Dashboard</h2>
              <p className="text-sm text-gray-600 mt-1">Excel-like filtering for comprehensive task management</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {hasActiveFilters && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                  {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
                </span>
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All Filters
                </button>
              </div>
            )}
            
            <button
              onClick={exportFilteredData}
              disabled={filteredClients.length === 0}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white transition-colors ${
                filteredClients.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
              }`}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Results ({filteredClients.length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients by name, state, or GSTN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Master Filters */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Filter className="h-5 w-5 text-blue-600 mr-2" />
              Master Filters
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Show clients that have <strong>at least one task</strong> with the selected status
            </p>
            <div className="flex flex-wrap gap-3">
              {(['completed', 'partial', 'pending', 'not-started'] as StatusType[]).map(status => {
                const isActive = masterFilter === status;
                const count = masterFilterCounts[status];
                
                return (
                  <button
                    key={status}
                    onClick={() => setMasterFilter(isActive ? null : status)}
                    className={`inline-flex items-center px-4 py-3 rounded-lg text-sm font-medium border-2 transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg transform scale-105'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
                    }`}
                  >
                    {getStatusIcon(status)}
                    <span className="ml-2 font-semibold">{getStatusText(status)}</span>
                    <span className={`ml-2 text-xs px-2 py-1 rounded-full font-bold ${
                      isActive 
                        ? 'bg-white text-blue-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Task Matrix Table */}
        <div className="overflow-x-auto border-2 border-gray-200 rounded-lg shadow-sm">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 sticky left-0 bg-gradient-to-r from-gray-50 to-gray-100 z-20 border-r-2 border-gray-200 min-w-[250px]">
                  <div className="flex items-center space-x-2">
                    <span>Client Information</span>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-bold">
                      {filteredClients.length} clients
                    </span>
                  </div>
                </th>
                {TASK_TYPES.map((taskType) => {
                  const statusCounts = getColumnStatusCounts(taskType);
                  const activeFilter = columnFilters[taskType] || [];
                  const hasFilter = activeFilter.length > 0 && activeFilter.length < 4;
                  
                  return (
                    <th key={taskType} className="px-4 py-4 text-center text-sm font-bold text-gray-900 border-r border-gray-200 min-w-[160px] relative bg-gradient-to-b from-gray-50 to-white">
                      <div className="space-y-3">
                        <div className="font-bold text-xs leading-tight text-gray-800">
                          {taskType.split(' ').map((word, i) => (
                            <div key={i}>{word}</div>
                          ))}
                        </div>
                        
                        {/* Excel-like Filter Button */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === taskType ? null : taskType)}
                            className={`inline-flex items-center px-3 py-2 text-xs font-semibold rounded-md border-2 transition-all duration-200 ${
                              hasFilter
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                            }`}
                          >
                            <Filter className="h-3 w-3 mr-1" />
                            Filter
                            <ChevronDown className="h-3 w-3 ml-1" />
                            {hasFilter && (
                              <span className="ml-1 bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-bold">
                                {activeFilter.length}
                              </span>
                            )}
                          </button>
                          
                          <FilterDropdown
                            taskType={taskType}
                            isOpen={openDropdown === taskType}
                            onToggle={() => setOpenDropdown(openDropdown === taskType ? null : taskType)}
                            selectedStatuses={activeFilter}
                            onStatusChange={(statuses) => handleColumnFilterChange(taskType, statuses)}
                            statusCounts={statusCounts}
                            onClose={() => setOpenDropdown(null)}
                          />
                        </div>
                        
                        {/* Column Statistics */}
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex justify-center space-x-2">
                            <span className="text-green-600 font-semibold">✓{statusCounts.completed || 0}</span>
                            <span className="text-yellow-600 font-semibold">⚠{statusCounts.partial || 0}</span>
                            <span className="text-red-600 font-semibold">✗{statusCounts.pending || 0}</span>
                            <span className="text-gray-500 font-semibold">◯{statusCounts['not-started'] || 0}</span>
                          </div>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client, index) => (
                <tr key={client.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-6 py-4 whitespace-nowrap border-r-2 border-gray-200 sticky left-0 bg-white z-10 min-w-[250px]">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-600 flex items-center">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">{client.state}</span>
                      </div>
                      {client.gstn && (
                        <div className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                          {client.gstn}
                        </div>
                      )}
                    </div>
                  </td>
                  {TASK_TYPES.map((taskType) => {
                    const status = getTaskStatus(client.name, taskType);
                    
                    return (
                      <td key={taskType} className="px-4 py-4 text-center border-r border-gray-200">
                        <div className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-bold border-2 shadow-sm ${getStatusColor(status)}`}>
                          {getStatusIcon(status)}
                          <span className="ml-1">{getStatusText(status)}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredClients.length === 0 && (
            <div className="text-center py-16 bg-gray-50">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-xl font-semibold">No clients match your filters</p>
              <p className="text-gray-400 text-sm mt-2">
                {hasActiveFilters ? 'Try adjusting your filters or search terms' : 'Add clients to get started'}
              </p>
            </div>
          )}
        </div>

        {/* Enhanced Summary Statistics */}
        {filteredClients.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200 shadow-sm">
              <div className="text-3xl font-bold text-blue-700">{filteredClients.length}</div>
              <div className="text-sm font-semibold text-blue-800">Clients Displayed</div>
              <div className="text-xs text-blue-600 mt-1">of {clients.length} total</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border-2 border-green-200 shadow-sm">
              <div className="text-3xl font-bold text-green-700">
                {TASK_TYPES.reduce((acc, taskType) => {
                  return acc + filteredClients.filter(client => 
                    getTaskStatus(client.name, taskType) === 'completed'
                  ).length;
                }, 0)}
              </div>
              <div className="text-sm font-semibold text-green-800">Completed Tasks</div>
              <div className="text-xs text-green-600 mt-1">across all clients</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border-2 border-yellow-200 shadow-sm">
              <div className="text-3xl font-bold text-yellow-700">
                {TASK_TYPES.reduce((acc, taskType) => {
                  return acc + filteredClients.filter(client => 
                    getTaskStatus(client.name, taskType) === 'partial'
                  ).length;
                }, 0)}
              </div>
              <div className="text-sm font-semibold text-yellow-800">Partial Tasks</div>
              <div className="text-xs text-yellow-600 mt-1">need attention</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border-2 border-red-200 shadow-sm">
              <div className="text-3xl font-bold text-red-700">
                {TASK_TYPES.reduce((acc, taskType) => {
                  return acc + filteredClients.filter(client => 
                    ['pending', 'not-started'].includes(getTaskStatus(client.name, taskType))
                  ).length;
                }, 0)}
              </div>
              <div className="text-sm font-semibold text-red-800">Pending Tasks</div>
              <div className="text-xs text-red-600 mt-1">require action</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskFilterDashboard;