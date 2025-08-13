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
  const isNoneSelected = selectedStatuses.length === 0;

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
      className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50"
    >
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-900">Filter Options</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Select All/None */}
        <div className="flex items-center space-x-2 mb-3">
          <input
            type="checkbox"
            id={`select-all-${taskType}`}
            checked={isAllSelected}
            onChange={handleSelectAll}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label
            htmlFor={`select-all-${taskType}`}
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </label>
        </div>
      </div>

      <div className="p-3 max-h-48 overflow-y-auto">
        {allStatuses.map(status => (
          <div key={status} className="flex items-center space-x-2 mb-2">
            <input
              type="checkbox"
              id={`${taskType}-${status}`}
              checked={selectedStatuses.includes(status)}
              onChange={() => handleStatusToggle(status)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label
              htmlFor={`${taskType}-${status}`}
              className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer flex-1"
            >
              {getStatusIcon(status)}
              <span>{getStatusText(status)}</span>
              <span className="text-gray-500">({statusCounts[status] || 0})</span>
            </label>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Total: {Object.values(statusCounts).reduce((sum, count) => sum + count, 0)}</span>
          <span>Selected: {selectedStatuses.length} filters</span>
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
    
    // Apply search filter
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

    // Apply master filter first
    if (masterFilter) {
      filtered = filtered.filter(client => {
        // Check if client has at least one task with the master filter status
        return TASK_TYPES.some(taskType => {
          const status = getTaskStatus(client.name, taskType);
          return status === masterFilter;
        });
      });
    }

    // Apply column filters with AND logic (must match ALL selected criteria)
    const activeColumnFilters = Object.entries(columnFilters).filter(([_, statuses]) => statuses.length > 0);
    
    if (activeColumnFilters.length > 0) {
      filtered = filtered.filter(client => {
        // Client must satisfy ALL column filter conditions
        return activeColumnFilters.every(([taskType, allowedStatuses]) => {
          const status = getTaskStatus(client.name, taskType);
          return allowedStatuses.includes(status);
        });
      });
    }

    return filtered;
  }, [clients, searchTerm, columnFilters, entries]);

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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Filter className="h-6 w-6 text-indigo-600 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Task Matrix Dashboard</h2>
              <p className="text-sm text-gray-600 mt-1">Excel-like filtering for task management</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {hasActiveFilters && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
                </span>
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
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
              Export ({filteredClients.length})
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients by name, state, or GSTN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Master Filters */}
        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Master Filters</h3>
            <div className="flex flex-wrap gap-2">
              {(['completed', 'partial', 'pending', 'not-started'] as StatusType[]).map(status => {
                const isActive = masterFilter === status;
                const statusCounts = clients.reduce((acc, client) => {
                  const hasStatus = TASK_TYPES.some(taskType => getTaskStatus(client.name, taskType) === status);
                  return hasStatus ? acc + 1 : acc;
                }, 0);
                
                return (
                  <button
                    key={status}
                    onClick={() => setMasterFilter(isActive ? null : status)}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {getStatusIcon(status)}
                    <span className="ml-2">{getStatusText(status)}</span>
                    <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                      {statusCounts}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Master filters show clients that have <strong>at least one task</strong> with the selected status.
            </p>
          </div>
        </div>

        {/* Task Matrix Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 sticky left-0 bg-gray-50 z-20 border-r border-gray-200">
                  <div className="flex items-center space-x-2">
                    <span>Client Details</span>
                    <span className="text-xs text-gray-500">({filteredClients.length})</span>
                  </div>
                </th>
                {TASK_TYPES.map((taskType) => {
                  const statusCounts = getColumnStatusCounts(taskType);
                  const activeFilter = columnFilters[taskType] || [];
                  const hasFilter = activeFilter.length > 0 && activeFilter.length < 4;
                  
                  return (
                    <th key={taskType} className="px-4 py-4 text-center text-sm font-medium text-gray-900 border-r border-gray-200 min-w-[140px] relative">
                      <div className="space-y-2">
                        <div className="font-semibold text-xs leading-tight">
                          {taskType.split(' ').map((word, i) => (
                            <div key={i}>{word}</div>
                          ))}
                        </div>
                        
                        {/* Excel-like Filter Button */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === taskType ? null : taskType)}
                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded border transition-colors ${
                              hasFilter
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <Filter className="h-3 w-3 mr-1" />
                            Filter
                            <ChevronDown className="h-3 w-3 ml-1" />
                            {hasFilter && (
                              <span className="ml-1 bg-indigo-600 text-white rounded-full px-1 text-xs">
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
                        
                        {/* Column Stats */}
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex justify-center space-x-2">
                            <span className="text-green-600">✓{statusCounts.completed || 0}</span>
                            <span className="text-yellow-600">⚠{statusCounts.partial || 0}</span>
                            <span className="text-red-600">✗{statusCounts.pending || 0}</span>
                            <span className="text-gray-500">◯{statusCounts['not-started'] || 0}</span>
                          </div>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200 sticky left-0 bg-white z-10">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-500">{client.state}</div>
                      {client.gstn && (
                        <div className="text-xs text-gray-400 font-mono">{client.gstn}</div>
                      )}
                    </div>
                  </td>
                  {TASK_TYPES.map((taskType) => {
                    const status = getTaskStatus(client.name, taskType);
                    
                    return (
                      <td key={taskType} className="px-4 py-4 text-center border-r border-gray-200">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
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
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No clients found</p>
              <p className="text-gray-400 text-sm mt-2">
                {hasActiveFilters ? 'Try adjusting your filters or search terms' : 'Add clients to get started'}
              </p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {filteredClients.length > 0 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{filteredClients.length}</div>
              <div className="text-sm text-blue-800">Clients Shown</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {TASK_TYPES.reduce((acc, taskType) => {
                  return acc + filteredClients.filter(client => 
                    getTaskStatus(client.name, taskType) === 'completed'
                  ).length;
                }, 0)}
              </div>
              <div className="text-sm text-green-800">Completed Tasks</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">
                {TASK_TYPES.reduce((acc, taskType) => {
                  return acc + filteredClients.filter(client => 
                    getTaskStatus(client.name, taskType) === 'partial'
                  ).length;
                }, 0)}
              </div>
              <div className="text-sm text-yellow-800">Partial Tasks</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">
                {TASK_TYPES.reduce((acc, taskType) => {
                  return acc + filteredClients.filter(client => 
                    ['pending', 'not-started'].includes(getTaskStatus(client.name, taskType))
                  ).length;
                }, 0)}
              </div>
              <div className="text-sm text-red-800">Pending Tasks</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskFilterDashboard;