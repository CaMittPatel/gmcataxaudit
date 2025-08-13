import React, { useState, useEffect } from 'react';
import { 
  Edit, 
  Save, 
  X, 
  Plus, 
  FileText, 
  Calendar, 
  User, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Upload,
  Shield,
  Building2,
  Search,
  Star,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import { Client, TaskEntry, DisallowanceEntry, ResubmissionEntry, RepreparationEntry, RecheckEntry } from '../types';
import { PDFDownloadLink } from '@react-pdf/renderer';
import DashboardPDF from './DashboardPDF';

interface ClientDashboardProps {
  clients: Client[];
  entries: TaskEntry[];
  onUpdateQueryStatus: (entryId: string, newStatus: TaskEntry['queriesSolved'], solvedBy?: string) => void;
  onUpdateDisallowances: (entryId: string, disallowances: DisallowanceEntry[]) => void;
  onUpdateResubmissions: (entryId: string, resubmissions: ResubmissionEntry[]) => void;
  onUpdateRepreparations: (entryId: string, repreparations: RepreparationEntry[]) => void;
  onUpdateRecheckHistory: (entryId: string, recheckHistory: RecheckEntry[]) => void;
  onUpdateEntry: (entryId: string, updates: Partial<TaskEntry>) => void;
  userRights: string;
}

interface ClientStatus {
  id: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  status: 'Completed' | 'In Progress' | 'Not Started' | 'Issues Found';
}

const REGULAR_TASKS = [
  'Opening Balance Verification',
  'Audit Queries Status Checking',
  'Ledger Scrutiny',
  '26AS Checking',
  'AIS Checking',
  'GST Verification',
  'Data feeding in Software'
] as const;

const SPECIAL_TASKS = [
  'Dis-allowances in 3CD',
  'Check and Approved by (Level 1)',
  'Copy to Rehan Sir',
  '3CD Prepared by',
  'Computation of Total Income Checking',
  'Final Verification before Upload to IT Portal',
  'UDIN Number'
] as const;

const ALL_TASKS = [...REGULAR_TASKS, ...SPECIAL_TASKS];

// Simple error boundary to prevent full crash if PDF render fails
class PDFBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    // You can log the error to monitoring here if needed
  }
  render() {
    if (this.state.hasError) {
      return (
        <button
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-500"
          disabled
          title="PDF render failed"
        >
          PDF unavailable
        </button>
      );
    }
    return this.props.children as any;
  }
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({
  clients,
  entries,
  onUpdateQueryStatus,
  onUpdateDisallowances,
  onUpdateResubmissions,
  onUpdateRepreparations,
  onUpdateRecheckHistory,
  onUpdateEntry,
  userRights
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [tempStatus, setTempStatus] = useState<TaskEntry['queriesSolved']>('No');
  const [tempSolvedBy, setTempSolvedBy] = useState('');
  const [tempUpdatedBy, setTempUpdatedBy] = useState('');
  const [tempPendency, setTempPendency] = useState('');

  // UDIN Number specific states
  const [tempUdinNumber, setTempUdinNumber] = useState('');
  const [tempUdinPreparedUnder, setTempUdinPreparedUnder] = useState('');
  const [tempAuditReportSignedBy, setTempAuditReportSignedBy] = useState('');
  const [tempAuditReportDate, setTempAuditReportDate] = useState('');
  const [tempUdinGeneratedBy, setTempUdinGeneratedBy] = useState('');

  // Modal states
  const [showResubmissionsModal, setShowResubmissionsModal] = useState(false);
  const [showRepreparationsModal, setShowRepreparationsModal] = useState(false);
  const [showRecheckModal, setShowRecheckModal] = useState(false);
  const [showDisallowancesModal, setShowDisallowancesModal] = useState(false);
  const [showPendencyModal, setShowPendencyModal] = useState(false);
  const [showUdinModal, setShowUdinModal] = useState(false);
  const [currentTaskType, setCurrentTaskType] = useState<TaskEntry['taskType'] | ''>('');

  // Temp states for modals
  const [tempResubmissions, setTempResubmissions] = useState<ResubmissionEntry[]>([]);
  const [tempRepreparations, setTempRepreparations] = useState<RepreparationEntry[]>([]);
  const [tempRecheckHistory, setTempRecheckHistory] = useState<RecheckEntry[]>([]);
  const [tempDisallowances, setTempDisallowances] = useState<DisallowanceEntry[]>([]);
  const [tempUpdatedNames, setTempUpdatedNames] = useState<{name: string, date: string}[]>([]);
  const [currentUser, setCurrentUser] = useState<string>('');

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(savedUser);
    }
  }, []);

  // Calculate client statuses
  const calculateClientStatus = (client: Client): ClientStatus => {
    const clientEntries = entries.filter(e => 
      e.clientName.toLowerCase() === client.name.toLowerCase()
    );
    
    const totalTasks = ALL_TASKS.length;
    let completedTasks = 0;
    let hasIssues = false;
    
    ALL_TASKS.forEach(taskType => {
      const taskEntries = clientEntries.filter(entry => entry.taskType === taskType);
      if (taskEntries.length > 0) {
        const allCompleted = taskEntries.every(entry => entry.queriesSolved === 'Yes');
        const hasPartial = taskEntries.some(entry => entry.queriesSolved === 'Partial');
        const hasProblems = taskEntries.some(entry => entry.queriesSolved === 'No');
        
        if (allCompleted) completedTasks++;
        if (hasProblems) hasIssues = true;
      }
    });
    
    let status: ClientStatus['status'] = 'Not Started';
    if (completedTasks === totalTasks) {
      status = 'Completed';
    } else if (completedTasks > 0) {
      status = hasIssues ? 'Issues Found' : 'In Progress';
    }
    
    return {
      id: client.id,
      name: client.name,
      totalTasks,
      completedTasks,
      status
    };
  };

  const clientsStatus = clients.map(client => calculateClientStatus(client));

  const handleClosePendency = (entryId: string, pendencyIndex: number) => {
    const entry = entries.find(e => e.id === entryId);
    if (entry && entry.pendencies) {
      const updatedPendencies = entry.pendencies.filter((_, index) => index !== pendencyIndex);
      onUpdateEntry(entryId, { 
        pendencies: updatedPendencies,
        preparationStatus: updatedPendencies.length === 0 ? 'Done' : 'Partial',
        queriesSolved: updatedPendencies.length === 0 ? 'Yes' : 'Partial'
      });
    }
  };

  const handleMarkAsCompleted = (taskType: TaskEntry['taskType']) => {
    const taskEntries = getTaskEntries(taskType);
    if (taskEntries.length > 0) {
      onUpdateEntry(taskEntries[0].id, {
        preparationStatus: 'Done',
        queriesSolved: 'Yes',
        pendencies: []
      });
    }
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const clientEntries = selectedClient ? entries.filter(e => 
    e.clientName.toLowerCase() === selectedClient.name.toLowerCase()
  ) : [];

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClientSearch = (value: string) => {
    setSearchTerm(value);
    setShowSuggestions(value.length > 0 && filteredClients.length > 0);
  };

  const selectClient = (client: Client) => {
    setSelectedClientId(client.id);
    setSearchTerm(client.name);
    setShowSuggestions(false);
  };

  const getTaskEntries = (taskType: TaskEntry['taskType']) => {
    return clientEntries.filter(entry => entry.taskType === taskType);
  };

  const getTaskStatus = (taskType: TaskEntry['taskType']) => {
    const taskEntries = getTaskEntries(taskType);
    if (taskEntries.length === 0) return 'Not Started';
    
    const hasIssues = taskEntries.some(entry => entry.queriesSolved === 'No');
    const hasPartial = taskEntries.some(entry => entry.queriesSolved === 'Partial');
    const allCompleted = taskEntries.every(entry => entry.queriesSolved === 'Yes');
    
    if (hasIssues) return 'Issues Found';
    if (hasPartial) return 'In Progress';
    if (allCompleted) return 'Completed';
    return 'In Progress';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Issues Found': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isSpecialTask = (taskType: TaskEntry['taskType']) => {
    return SPECIAL_TASKS.includes(taskType as any);
  };

  const handleEditStatus = (entry: TaskEntry) => {
    setEditingEntry(entry.id);
    setTempStatus(entry.queriesSolved);
    setTempSolvedBy(entry.queriesSolvedBy || '');
  };

  const handleSaveStatus = () => {
    if (editingEntry) {
      onUpdateQueryStatus(editingEntry, tempStatus, tempSolvedBy);
      setEditingEntry(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setTempStatus('No');
    setTempSolvedBy('');
  };

  const handleAddUpdatedBy = (entry: TaskEntry) => {
    if (tempUpdatedBy.trim() && tempUpdatedNames.length < 5) {
      const newUpdatedNames = [
        ...tempUpdatedNames,
        {
          name: tempUpdatedBy,
          date: new Date().toLocaleDateString()
        }
      ];
      setTempUpdatedNames(newUpdatedNames);
      onUpdateEntry(entry.id, {
        updatedBy: [...(entry.updatedBy || []), { name: tempUpdatedBy, date: new Date().toLocaleDateString() }]
      });
      setTempUpdatedBy('');
    }
  };

  const handleAddPendency = (entry: TaskEntry) => {
    if (tempPendency.trim() && entry.pendencies && entry.pendencies.length < 10) {
      const newPendencies = [...entry.pendencies, tempPendency];
      onUpdateEntry(entry.id, {
        pendencies: newPendencies,
        preparationStatus: 'Partial',
        queriesSolved: 'Partial'
      });
      setTempPendency('');
      setShowPendencyModal(false);
    }
  };

  const handleSaveUdinDetails = (entry: TaskEntry) => {
    if (tempUdinNumber.trim() && tempUdinPreparedUnder.trim() && 
        tempAuditReportSignedBy.trim() && tempAuditReportDate && tempUdinGeneratedBy.trim()) {
      onUpdateEntry(entry.id, {
        udinNumber: tempUdinNumber,
        udinPreparedUnder: tempUdinPreparedUnder,
        auditReportSignedBy: tempAuditReportSignedBy,
        auditReportDate: tempAuditReportDate,
        udinGeneratedBy: tempUdinGeneratedBy,
        verifiedBy: `UDIN prepared by ${tempUdinGeneratedBy}`,
        queriesSolved: 'Yes'
      });
      setShowUdinModal(false);
    }
  };

  // Modal handlers
  const openResubmissionsModal = (taskType: TaskEntry['taskType']) => {
    setCurrentTaskType(taskType);
    const taskEntries = getTaskEntries(taskType);
    const existingResubmissions = taskEntries[0]?.resubmissions || [];
    setTempResubmissions(existingResubmissions);
    setShowResubmissionsModal(true);
  };

  const openRepreparationsModal = (taskType: TaskEntry['taskType']) => {
    setCurrentTaskType(taskType);
    const taskEntries = getTaskEntries(taskType);
    const existingRepreparations = taskEntries[0]?.repreparations || [];
    setTempRepreparations(existingRepreparations);
    setShowRepreparationsModal(true);
  };

  const openRecheckModal = (taskType: TaskEntry['taskType']) => {
    setCurrentTaskType(taskType);
    const taskEntries = getTaskEntries(taskType);
    const existingRecheck = taskEntries[0]?.recheckHistory || [];
    setTempRecheckHistory(existingRecheck);
    setShowRecheckModal(true);
  };

  const openDisallowancesModal = (taskType: TaskEntry['taskType']) => {
    setCurrentTaskType(taskType);
    const taskEntries = getTaskEntries(taskType);
    const existingDisallowances = taskEntries[0]?.disallowances || [];
    setTempDisallowances(existingDisallowances.length > 0 ? existingDisallowances : [{ section: '', disallowance: '' }]);
    setTempUpdatedNames(taskEntries[0]?.updatedBy || []);
    setShowDisallowancesModal(true);
  };

  const openPendencyModal = (taskType: TaskEntry['taskType']) => {
    setCurrentTaskType(taskType);
    setShowPendencyModal(true);
  };

  const openUdinModal = (taskType: TaskEntry['taskType']) => {
    setCurrentTaskType(taskType);
    const taskEntries = getTaskEntries(taskType);
    const entry = taskEntries[0];
    
    if (entry) {
      setTempUdinNumber(entry.udinNumber || '');
      setTempUdinPreparedUnder(entry.udinPreparedUnder || '');
      setTempAuditReportSignedBy(entry.auditReportSignedBy || '');
      setTempAuditReportDate(entry.auditReportDate || '');
      setTempUdinGeneratedBy(entry.udinGeneratedBy || '');
    } else {
      setTempUdinNumber('');
      setTempUdinPreparedUnder('');
      setTempAuditReportSignedBy('');
      setTempAuditReportDate('');
      setTempUdinGeneratedBy('');
    }
    
    setShowUdinModal(true);
  };

  const renderSpecialTaskSection = (taskType: TaskEntry['taskType']) => {
    const taskEntries = getTaskEntries(taskType);
    const status = getTaskStatus(taskType);

    return (
      <div key={taskType} className="rounded-lg shadow-md p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-600 mr-2" />
            <h3 className="text-md font-semibold text-yellow-900">
              {taskType}
            </h3>
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-200 text-yellow-800 rounded-full">
              Special Task
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
              {status}
            </span>
            <span className="text-xs text-gray-500">
              {taskEntries.length} {taskEntries.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
        </div>

        {/* Task Entries */}
        {taskEntries.length > 0 ? (
          <div className="space-y-2">
            {taskEntries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-md p-3 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <div>
                    <p className="text-xs font-medium text-gray-900">{entry.verifiedBy}</p>
                    <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()}</p>
                  </div>
                  
                  {taskType !== 'Dis-allowances in 3CD' && taskType !== 'Check and Approved by (Level 1)' && taskType !== 'UDIN Number' && (
                    <div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        entry.queriesSolved === 'Yes' ? 'bg-green-100 text-green-800' :
                        entry.queriesSolved === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {entry.queriesSolved}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-1 justify-end">
                    <button
                      onClick={() => {
                        if (taskType === 'Dis-allowances in 3CD' || taskType === 'Check and Approved by (Level 1)') {
                          setTempUpdatedNames(entry.updatedBy || []);
                          setEditingEntry(entry.id);
                        } else if (taskType === 'UDIN Number') {
                          openUdinModal(taskType);
                        } else {
                          handleEditStatus(entry);
                        }
                      }}
                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Special Task Details */}
                <div className="mt-2 pt-2 border-t border-gray-200">
                  {taskType === 'Dis-allowances in 3CD' && entry.disallowances && entry.disallowances.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-900 mb-1">Disallowances:</h4>
                      <div className="space-y-1">
                        {entry.disallowances.map((disallowance, index) => (
                          <div key={index} className="flex justify-between items-start p-2 bg-red-50 rounded border-l-4 border-red-400">
                            <div className="flex-1">
                              <span className="font-medium text-red-800">{disallowance.section}:</span>
                              <span className="text-red-700 ml-2">{disallowance.disallowance}</span>
                              <div className="text-xs text-red-600 mt-1">
                                Added by: {disallowance.addedBy || 'Unknown'}
                                {disallowance.timestamp && (
                                  <span className="ml-2">
                                    on {new Date(disallowance.timestamp).toLocaleDateString()}
                                  </span>
                                )}
                                {disallowance.updatedBy && disallowance.updatedBy !== disallowance.addedBy && (
                                  <div>
                                    Updated by: {disallowance.updatedBy}
                                    {disallowance.lastUpdated && (
                                      <span className="ml-2">
                                        on {new Date(disallowance.lastUpdated).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(taskType === 'Dis-allowances in 3CD' || taskType === 'Check and Approved by (Level 1)') && (
                    <div className="mt-2">
                      <h4 className="text-xs font-medium text-gray-900 mb-1">Updated By:</h4>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600 bg-blue-50 p-1 rounded">
                          <span className="font-medium">Original:</span> {entry.verifiedBy} ({new Date(entry.date).toLocaleDateString()})
                        </div>
                        {(entry.updatedBy || []).map((update, index) => (
                          <div key={index} className="text-xs text-gray-600 bg-blue-50 p-1 rounded">
                            <span className="font-medium">Update {index + 1}:</span> {update.name} ({update.date})
                          </div>
                        ))}
                      </div>
                      {editingEntry === entry.id && (
                        <div className="mt-2 flex items-center space-x-2">
                          <input
                            type="text"
                            value={tempUpdatedBy}
                            onChange={(e) => setTempUpdatedBy(e.target.value)}
                            placeholder="Enter name"
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                          <button
                            onClick={() => handleAddUpdatedBy(entry)}
                            disabled={!tempUpdatedBy.trim() || (entry.updatedBy || []).length >= 5}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded disabled:bg-gray-300"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setEditingEntry(null)}
                            className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {taskType === 'Copy to Rehan Sir' && entry.resubmissions && entry.resubmissions.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-xs font-medium text-gray-900 mb-1">Resubmission History:</h4>
                      <div className="space-y-1">
                        {entry.resubmissions.map((resubmission, index) => (
                          <div key={index} className="text-xs text-gray-600 bg-blue-50 p-1 rounded">
                            <span className="font-medium">{resubmission.status}:</span> 
                            {resubmission.resubmittedBy && ` By ${resubmission.resubmittedBy}`}
                            {resubmission.receivedBy && ` Received by ${resubmission.receivedBy}`}
                            {resubmission.date && ` (${new Date(resubmission.date).toLocaleDateString()})`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {taskType === '3CD Prepared by' && entry.pendencies && entry.pendencies.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-xs font-medium text-gray-900 mb-1">Pendencies:</h4>
                      <div className="space-y-1">
                        {entry.pendencies.map((pendency, index) => (
                          <div key={index} className="flex items-center justify-between bg-yellow-50 p-1 rounded text-xs">
                            <span className="flex-1">📋 {pendency}</span>
                            <button
                              onClick={() => handleClosePendency(entry.id, index)}
                              className="ml-2 text-xs px-2 py-0.5 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Close
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {taskType === 'UDIN Number' && (
                    <div className="mt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {entry.udinNumber && (
                          <div className="text-xs text-gray-600 bg-green-50 p-1 rounded">
                            <span className="font-medium">UDIN Number:</span> {entry.udinNumber}
                          </div>
                        )}
                        {entry.udinPreparedUnder && (
                          <div className="text-xs text-gray-600 bg-green-50 p-1 rounded">
                            <span className="font-medium">Prepared Under:</span> {entry.udinPreparedUnder}
                          </div>
                        )}
                        {entry.auditReportSignedBy && (
                          <div className="text-xs text-gray-600 bg-green-50 p-1 rounded">
                            <span className="font-medium">Audit Report Signed By:</span> {entry.auditReportSignedBy}
                          </div>
                        )}
                        {entry.auditReportDate && (
                          <div className="text-xs text-gray-600 bg-green-50 p-1 rounded">
                            <span className="font-medium">Date of Audit Report:</span> {new Date(entry.auditReportDate).toLocaleDateString()}
                          </div>
                        )}
                        {entry.udinGeneratedBy && (
                          <div className="text-xs text-gray-600 bg-green-50 p-1 rounded">
                            <span className="font-medium">Generated By:</span> {entry.udinGeneratedBy}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(taskType === 'Computation of Total Income Checking' || 
                    taskType === 'Final Verification before Upload to IT Portal') && 
                    entry.recheckHistory && entry.recheckHistory.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-xs font-medium text-gray-900 mb-1">Re-check History:</h4>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600 bg-purple-50 p-1 rounded">
                          <span className="font-medium">Original:</span> {entry.verifiedBy} ({new Date(entry.date).toLocaleDateString()})
                        </div>
                        {entry.recheckHistory.map((recheck, index) => (
                          <div key={index} className="text-xs text-gray-600 bg-purple-50 p-1 rounded">
                            <span className="font-medium">Re-check {index + 1}:</span> {recheck.checkedBy} ({new Date(recheck.date).toLocaleDateString()})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 text-xs">
            <Clock className="h-4 w-4 mx-auto mb-1 text-gray-400" />
            <p>No entries for this task yet</p>
          </div>
        )}

        {/* Action Buttons for Special Tasks */}
        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="flex flex-wrap gap-1">
            {taskType === 'Copy to Rehan Sir' && (
              <button
                onClick={() => openResubmissionsModal(taskType)}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Manage Resubmissions
              </button>
            )}

            {taskType === '3CD Prepared by' && (
              <>
                <button
                  onClick={() => openRepreparationsModal(taskType)}
                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-orange-600 hover:bg-orange-700"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Manage Re-preparations
                </button>
                <button
                  onClick={() => handleMarkAsCompleted(taskType)}
                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Mark as Completed
                </button>
                <button
                  onClick={() => openPendencyModal(taskType)}
                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Pendency
                </button>
              </>
            )}

            {(taskType === 'Computation of Total Income Checking' || 
              taskType === 'Final Verification before Upload to IT Portal') && (
              <button
                onClick={() => openRecheckModal(taskType)}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Re-check {taskType === 'Computation of Total Income Checking' ? 'Computation' : 'Final Verification'}
              </button>
            )}

            {taskType === 'Dis-allowances in 3CD' && (
              <button
                onClick={() => openDisallowancesModal(taskType)}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit Disallowances
              </button>
            )}

            {taskType === 'UDIN Number' && (
              <button
                onClick={() => openUdinModal(taskType)}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
              >
                <Edit className="h-3 w-3 mr-1" />
                {getTaskEntries(taskType).length > 0 ? 'Edit UDIN Details' : 'Add UDIN Details'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Building2 className="h-5 w-5 text-indigo-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Client-wise Task Dashboard</h2>
          </div>
          {selectedClient && clientEntries.length > 0 && (
            <PDFBoundary>
              <PDFDownloadLink 
                document={<DashboardPDF client={selectedClient} entries={clientEntries} />}
                fileName={`${selectedClient.name}_dashboard.pdf`}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Download className="h-4 w-4 mr-1" />
                Download PDF
              </PDFDownloadLink>
            </PDFBoundary>
          )}
        </div>

        {/* Client Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Client
          </label>
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search and select client..."
                value={searchTerm}
                onChange={(e) => handleClientSearch(e.target.value)}
                onFocus={() => {
                  if (searchTerm.length > 0 && filteredClients.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            {showSuggestions && filteredClients.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-md max-h-60 overflow-y-auto">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectClient(client);
                    }}
                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-sm text-gray-900">{client.name}</div>
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      <span>{client.state}</span>
                      {client.gstn && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{client.gstn}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Client Status Overview */}
        {!selectedClient && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Client Compliance Status</h3>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientsStatus.map((clientStatus) => (
                    <tr 
                      key={clientStatus.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => selectClient(clients.find(c => c.id === clientStatus.id)!)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {clientStatus.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(clientStatus.status)}`}>
                          {clientStatus.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${
                                clientStatus.status === 'Completed' ? 'bg-green-500' :
                                clientStatus.status === 'In Progress' ? 'bg-yellow-500' :
                                clientStatus.status === 'Issues Found' ? 'bg-red-500' : 'bg-gray-300'
                              }`}
                              style={{ width: `${(clientStatus.completedTasks / clientStatus.totalTasks) * 100}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-xs text-gray-500">
                            {clientStatus.completedTasks}/{clientStatus.totalTasks}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!selectedClient ? (
          <div className="text-center py-8">
            <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Select a client from the list above to view detailed dashboard</p>
          </div>
        ) : (
          <div>
            <div className="mb-4 p-3 bg-indigo-50 rounded-md">
              <h3 className="text-md font-semibold text-indigo-900">
                {selectedClient.name}
              </h3>
              <p className="text-xs text-indigo-700">
                {selectedClient.state} • {selectedClient.registrationStatus}
                {selectedClient.gstn && ` • ${selectedClient.gstn}`}
              </p>
            </div>

            {/* Regular Tasks Table */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="flex items-center mb-4">
                <FileText className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-bold text-gray-900">Regular Tasks</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task Type
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Verified By
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Queries Solved
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Solved By
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {REGULAR_TASKS.map((taskType) => {
                      const taskEntries = getTaskEntries(taskType);
                      const status = getTaskStatus(taskType);
                      
                      if (taskEntries.length === 0) {
                        return (
                          <tr key={taskType} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="text-xs font-medium text-gray-900">{taskType}</div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                Not Started
                              </span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">-</td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">-</td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">-</td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">-</td>
                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">-</td>
                          </tr>
                        );
                      }
                      
                      return taskEntries.map((entry, index) => (
                        <tr key={`${taskType}-${entry.id}`} className="hover:bg-gray-50">
                          {index === 0 && (
                            <td className="px-4 py-2 whitespace-nowrap" rowSpan={taskEntries.length}>
                              <div className="text-xs font-medium text-gray-900">{taskType}</div>
                            </td>
                          )}
                          {index === 0 && (
                            <td className="px-4 py-2 whitespace-nowrap" rowSpan={taskEntries.length}>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                                {status}
                              </span>
                            </td>
                          )}
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{entry.verifiedBy}</div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{new Date(entry.date).toLocaleDateString()}</div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {editingEntry === entry.id ? (
                              <select
                                value={tempStatus}
                                onChange={(e) => setTempStatus(e.target.value as TaskEntry['queriesSolved'])}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                              >
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="Partial">Partial</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                entry.queriesSolved === 'Yes' ? 'bg-green-100 text-green-800' :
                                entry.queriesSolved === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {entry.queriesSolved}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {editingEntry === entry.id && tempStatus === 'Yes' ? (
                              <input
                                type="text"
                                value={tempSolvedBy}
                                onChange={(e) => setTempSolvedBy(e.target.value)}
                                placeholder="Solved by"
                                className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                              />
                            ) : (
                              <span className="text-xs text-gray-600">{entry.queriesSolvedBy || '-'}</span>
                            )}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="flex items-center space-x-1">
                              {editingEntry === entry.id ? (
                                <>
                                  <button
                                    onClick={handleSaveStatus}
                                    className="p-0.5 text-green-600 hover:bg-green-50 rounded"
                                  >
                                    <Save className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="p-0.5 text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleEditStatus(entry)}
                                  className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Special Tasks - Individual Sections */}
            {userRights !== 'Stage 1 rights' && (
              <div className="space-y-4">
                {SPECIAL_TASKS.map(taskType => renderSpecialTaskSection(taskType))}
              </div>
            )}
            
            {userRights === 'Stage 1 rights' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    <strong>Stage 1 Rights:</strong> You have access to Regular Tasks only. Special Tasks require higher permissions.
                  </p>
                </div>
              </div>
            )}

            {/* Manual Signature Section - Check and Approved by (Level 2) */}
            <div className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-dashed border-purple-300 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Shield className="h-4 w-4 text-purple-600 mr-2" />
                <h3 className="text-md font-semibold text-purple-900">Check and Approved by (Level 2 - Final)</h3>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-purple-200 text-purple-800 rounded-full">
                  Manual Signature Required
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-purple-700 mb-1">Date:</label>
                  <div className="border-b border-dashed border-purple-300 h-6"></div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-purple-700 mb-1">Approved By:</label>
                  <div className="border-b border-dashed border-purple-300 h-6"></div>
                </div>
              </div>
              
              <div className="mt-3">
                <label className="block text-xs font-medium text-purple-700 mb-1">Signature:</label>
                <div className="border border-dashed border-purple-300 h-12 rounded-md"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resubmissions Modal */}
      {showResubmissionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold">Manage Resubmissions - {currentTaskType}</h3>
              <button
                onClick={() => setShowResubmissionsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {tempResubmissions.map((resubmission, index) => (
                <div key={resubmission.id} className="border border-gray-200 rounded-md p-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={resubmission.status}
                        onChange={(e) => {
                          const updated = [...tempResubmissions];
                          updated[index] = { 
                            ...updated[index], 
                            status: e.target.value as ResubmissionEntry['status']
                          };
                          setTempResubmissions(updated);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                      >
                        <option value="Resubmission Required">Resubmission Required</option>
                        <option value="Resubmitted">Resubmitted</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={resubmission.date}
                        onChange={(e) => {
                          const updated = [...tempResubmissions];
                          updated[index] = { ...updated[index], date: e.target.value };
                          setTempResubmissions(updated);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => setTempResubmissions(tempResubmissions.filter((_, i) => i !== index))}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-md text-xs"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {resubmission.status === 'Resubmitted' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Resubmitted By</label>
                        <input
                          type="text"
                          value={resubmission.resubmittedBy || ''}
                          onChange={(e) => {
                            const updated = [...tempResubmissions];
                            updated[index] = { ...updated[index], resubmittedBy: e.target.value };
                            setTempResubmissions(updated);
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                          placeholder="Enter name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Received By</label>
                        <input
                          type="text"
                          value={resubmission.receivedBy || ''}
                          onChange={(e) => {
                            const updated = [...tempResubmissions];
                            updated[index] = { ...updated[index], receivedBy: e.target.value };
                            setTempResubmissions(updated);
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                          placeholder="Enter name"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={() => {
                  const newResubmission: ResubmissionEntry = {
                    id: Date.now().toString(),
                    status: 'Resubmission Required',
                    date: new Date().toISOString().split('T')[0],
                    timestamp: new Date().toISOString()
                  };
                  setTempResubmissions([...tempResubmissions, newResubmission]);
                }}
                className="w-full px-3 py-2 border border-dashed border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 text-xs"
              >
                <Plus className="h-3 w-3 inline mr-1" />
                Add Resubmission Entry
              </button>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowResubmissionsModal(false)}
                className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const taskEntries = getTaskEntries(currentTaskType);
                  if (taskEntries.length > 0) {
                    onUpdateResubmissions(taskEntries[0].id, tempResubmissions);
                  }
                  setShowResubmissionsModal(false);
                }}
                className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Re-preparations Modal */}
      {showRepreparationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold">Manage Re-preparations - {currentTaskType}</h3>
              <button
                onClick={() => setShowRepreparationsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {tempRepreparations.map((repreparation, index) => (
                <div key={repreparation.id} className="border border-gray-200 rounded-md p-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={repreparation.status}
                        onChange={(e) => {
                          const updated = [...tempRepreparations];
                          updated[index] = { 
                            ...updated[index], 
                            status: e.target.value as RepreparationEntry['status']
                          };
                          setTempRepreparations(updated);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                      >
                        <option value="Re-preparation Required">Re-preparation Required</option>
                        <option value="Re-prepared By">Re-prepared By</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={repreparation.date}
                        onChange={(e) => {
                          const updated = [...tempRepreparations];
                          updated[index] = { ...updated[index], date: e.target.value };
                          setTempRepreparations(updated);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => setTempRepreparations(tempRepreparations.filter((_, i) => i !== index))}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-md text-xs"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {repreparation.status === 'Re-prepared By' && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Re-prepared By</label>
                      <input
                        type="text"
                        value={repreparation.repreparedBy || ''}
                        onChange={(e) => {
                          const updated = [...tempRepreparations];
                          updated[index] = { ...updated[index], repreparedBy: e.target.value };
                          setTempRepreparations(updated);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                        placeholder="Enter name"
                      />
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={() => {
                  const newRepreparation: RepreparationEntry = {
                    id: Date.now().toString(),
                    status: 'Re-preparation Required',
                    date: new Date().toISOString().split('T')[0],
                    timestamp: new Date().toISOString()
                  };
                  setTempRepreparations([...tempRepreparations, newRepreparation]);
                }}
                className="w-full px-3 py-2 border border-dashed border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 text-xs"
              >
                <Plus className="h-3 w-3 inline mr-1" />
                Add Re-preparation Entry
              </button>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowRepreparationsModal(false)}
                className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const taskEntries = getTaskEntries(currentTaskType);
                  if (taskEntries.length > 0) {
                    onUpdateRepreparations(taskEntries[0].id, tempRepreparations);
                  }
                  setShowRepreparationsModal(false);
                }}
                className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recheck History Modal */}
      {showRecheckModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold">Recheck History - {currentTaskType}</h3>
              <button
                onClick={() => setShowRecheckModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {tempRecheckHistory.map((recheck, index) => (
                <div key={recheck.id} className="border border-gray-200 rounded-md p-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Checked By</label>
                      <input
                        type="text"
                        value={recheck.checkedBy}
                        onChange={(e) => {
                          const updated = [...tempRecheckHistory];
                          updated[index] = { ...updated[index], checkedBy: e.target.value };
                          setTempRecheckHistory(updated);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                        placeholder="Enter name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={recheck.date}
                        onChange={(e) => {
                          const updated = [...tempRecheckHistory];
                          updated[index] = { ...updated[index], date: e.target.value };
                          setTempRecheckHistory(updated);
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => setTempRecheckHistory(tempRecheckHistory.filter((_, i) => i !== index))}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-md text-xs"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => {
                  const newRecheck: RecheckEntry = {
                    id: Date.now().toString(),
                    checkedBy: '',
                    date: new Date().toISOString().split('T')[0],
                    timestamp: new Date().toISOString()
                  };
                  setTempRecheckHistory([...tempRecheckHistory, newRecheck]);
                }}
                className="w-full px-3 py-2 border border-dashed border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 text-xs"
              >
                <Plus className="h-3 w-3 inline mr-1" />
                Add Recheck Entry
              </button>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowRecheckModal(false)}
                className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const taskEntries = getTaskEntries(currentTaskType);
                  if (taskEntries.length > 0) {
                    onUpdateRecheckHistory(taskEntries[0].id, tempRecheckHistory);
                  }
                  setShowRecheckModal(false);
                }}
                className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disallowances Modal */}
      {showDisallowancesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold">Edit Disallowances - {currentTaskType}</h3>
              <button
                onClick={() => setShowDisallowancesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {tempDisallowances.map((disallowance, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Section</label>
                    <input
                      type="text"
                      value={disallowance.section}
                      onChange={(e) => {
                        const updated = [...tempDisallowances];
                        updated[index] = { ...updated[index], section: e.target.value };
                        setTempDisallowances(updated);
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g., 40(a)(ia)"
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                      <input
                        type="text"
                        value={disallowance.disallowance}
                        onChange={(e) => {
                          const updated = [...tempDisallowances];
                          updated[index] = { ...updated[index], disallowance: e.target.value };
                          setTempDisallowances(updated);
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g., ₹50,000"
                      />
                    </div>
                    {tempDisallowances.length > 1 && (
                      <button
                        onClick={() => {
                          const updated = tempDisallowances.filter((_, i) => i !== index);
                          setTempDisallowances(updated);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {(disallowance.addedBy || disallowance.updatedBy) && (
                    <div className="col-span-2 text-xs text-gray-500 mt-1">
                      {disallowance.addedBy && (
                        <span>Added by: {disallowance.addedBy}</span>
                      )}
                      {disallowance.updatedBy && disallowance.updatedBy !== disallowance.addedBy && (
                        <span className="ml-4">Last updated by: {disallowance.updatedBy}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              <button
                onClick={() => {
                  if (tempDisallowances.length < 10) {
                    setTempDisallowances([...tempDisallowances, { section: '', disallowance: '' }]);
                  }
                }}
                className="inline-flex items-center px-3 py-2 border border-dashed border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                disabled={tempDisallowances.length >= 10}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Disallowance ({tempDisallowances.length}/10)
              </button>
            </div>
            
            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                onClick={() => setShowDisallowancesModal(false)}
                className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const taskEntries = getTaskEntries(currentTaskType);
                  if (taskEntries.length > 0) {
                    const validDisallowances = tempDisallowances.filter(d => d.section.trim() && d.disallowance.trim());
                    
                    // Add user tracking to new/updated disallowances
                    const disallowancesWithTracking = validDisallowances.map(d => ({
                      ...d,
                      updatedBy: currentUser || 'Unknown',
                      lastUpdated: new Date().toISOString(),
                      addedBy: d.addedBy || currentUser || 'Unknown',
                      timestamp: d.timestamp || new Date().toISOString()
                    }));
                    
                    if (validDisallowances.length > 0) {
                      onUpdateDisallowances(taskEntries[0].id, disallowancesWithTracking);
                    }
                  }
                  setShowDisallowancesModal(false);
                }}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pendency Modal */}
      {showPendencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold">Add Pendency - {currentTaskType}</h3>
              <button
                onClick={() => setShowPendencyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Pendency Description</label>
              <input
                type="text"
                value={tempPendency}
                onChange={(e) => setTempPendency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                placeholder="Enter pendency details"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowPendencyModal(false)}
                className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const taskEntries = getTaskEntries(currentTaskType);
                  if (taskEntries.length > 0 && tempPendency.trim()) {
                    handleAddPendency(taskEntries[0]);
                  }
                }}
                disabled={!tempPendency.trim()}
                className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 text-xs"
              >
                Add Pendency
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UDIN Number Modal */}
      {showUdinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold">UDIN Number Details</h3>
              <button
                onClick={() => setShowUdinModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">UDIN Number *</label>
                <input
                  type="text"
                  value={tempUdinNumber}
                  onChange={(e) => setTempUdinNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  placeholder="Enter UDIN number"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">UDIN Prepared Under *</label>
                <input
                  type="text"
                  value={tempUdinPreparedUnder}
                  onChange={(e) => setTempUdinPreparedUnder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  placeholder="e.g., 44AB(a)"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Audit Report Signed By *</label>
                <select
                  value={tempAuditReportSignedBy}
                  onChange={(e) => setTempAuditReportSignedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                >
                  <option value="">Select Signing Person</option>
                  <option value="CA Mitt S. Patel">CA Mitt S. Patel</option>
                  <option value="CA Amin G. Shaikh">CA Amin G. Shaikh</option>
                  <option value="CA G M Shaikh">CA G M Shaikh</option>
                  <option value="CA Chahana P Vora">CA Chahana P Vora</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date of Audit Report *</label>
                <input
                  type="date"
                  value={tempAuditReportDate}
                  onChange={(e) => setTempAuditReportDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Person who generated UDIN *</label>
                <input
                  type="text"
                  value={tempUdinGeneratedBy}
                  onChange={(e) => setTempUdinGeneratedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  placeholder="Enter name"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowUdinModal(false)}
                className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const taskEntries = getTaskEntries(currentTaskType);
                  if (taskEntries.length > 0) {
                    handleSaveUdinDetails(taskEntries[0]);
                  } else {
                    // Create a new entry if none exists
                    const newEntry: Partial<TaskEntry> = {
                      taskType: currentTaskType,
                      clientName: selectedClient?.name || '',
                      verifiedBy: `UDIN prepared by ${tempUdinGeneratedBy}`,
                      date: new Date().toISOString(),
                      udinNumber: tempUdinNumber,
                      udinPreparedUnder: tempUdinPreparedUnder,
                      auditReportSignedBy: tempAuditReportSignedBy,
                      auditReportDate: tempAuditReportDate,
                      udinGeneratedBy: tempUdinGeneratedBy,
                      queriesSolved: 'Yes'
                    };
                    onUpdateEntry(Date.now().toString(), newEntry);
                    setShowUdinModal(false);
                  }
                }}
                disabled={!tempUdinNumber || !tempUdinPreparedUnder || !tempAuditReportSignedBy || !tempAuditReportDate || !tempUdinGeneratedBy}
                className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 text-xs"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;