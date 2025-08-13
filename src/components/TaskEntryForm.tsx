import React, { useState, useEffect } from 'react';
import { Calendar, User, FileText, CheckCircle, AlertCircle, Clock, ChevronDown, Plus, X, Hash, Shield } from 'lucide-react';
import { TaskEntry, Client, DisallowanceEntry } from '../types';

const DATABASE_USERS = [
  'Mitt',
  'Monal', 
  'Rushda',
  'Sanket',
  'Govind',
  'CA Mitt Patel',
  'CA Amin G. Shaikh',
  'CA G M Shaikh',
  'CA Chahana P Vora'
];

const UDIN_PREPARED_UNDER_OPTIONS = [
  'Clause 44AB(a)- Total sales/turnover/gross receipts of business exceeding specified limits',
  'Clause 44AB(b)- Gross receipts of profession exceeding specified limits',
  'Clause 44AB(d)- Profits and gains lower than deemed profit u/s 44ADA',
  'Third Proviso to sec 44AB : Audited under any other law',
  'Clause 44AB(e)- When provisions of section 44AD(4) are applicable'
];

interface TaskEntryFormProps {
  onAddEntry: (entry: TaskEntry) => void;
  existingEntries: TaskEntry[];
  existingClients: Client[];
  currentUser?: string;
  userRights?: string;
  userRights?: string;
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
] as const;

const REGULAR_TASKS = [
  'Opening Balance Verification',
  'Audit Queries Status Checking',
  'Ledger Scrutiny',
  '26AS Checking',
  'AIS Checking',
  'GST Verification',
  'Data feeding in Software',
  'Dis-allowances in 3CD'
] as const;

const TaskEntryForm: React.FC<TaskEntryFormProps> = ({ onAddEntry, existingEntries, existingClients, currentUser, userRights }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    taskType: '' as TaskEntry['taskType'],
    verifiedBy: currentUser || '',
    date: '',
    queriesSolved: '' as TaskEntry['queriesSolved'],
    queriesSolvedBy: currentUser || '',
    approvedBy: currentUser || '',
    copyGivenBy: currentUser || '',
    receivedBy: currentUser || '',
    preparedBy: currentUser || '',
    preparationStatus: '' as 'Done' | 'Partial' | '',
    pendencies: [] as string[],
    udinNumber: '',
    udinPreparedUnder: '',
    udinGeneratedBy: currentUser || '',
    udinSignedBy: currentUser || '',
    auditReportDate: ''
  });

  const [disallowances, setDisallowances] = useState<DisallowanceEntry[]>([
    { section: '', disallowance: '' }
  ]);

  const [pendencies, setPendencies] = useState<string[]>([
    ''
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [availableTaskTypes, setAvailableTaskTypes] = useState<typeof TASK_TYPES[number][]>([...TASK_TYPES]);
  
  // User selection states
  const [showUserSuggestions, setShowUserSuggestions] = useState<Record<string, boolean>>({});
  const [filteredUsers, setFilteredUsers] = useState<Record<string, string[]>>({});

  // Update form data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        verifiedBy: prev.verifiedBy || currentUser,
        queriesSolvedBy: prev.queriesSolvedBy || currentUser,
        approvedBy: prev.approvedBy || currentUser,
        copyGivenBy: prev.copyGivenBy || currentUser,
        receivedBy: prev.receivedBy || currentUser,
        preparedBy: prev.preparedBy || currentUser,
        udinGeneratedBy: prev.udinGeneratedBy || currentUser,
        udinSignedBy: prev.udinSignedBy || currentUser
      }));
    }
  }, [currentUser]);

  // Update available task types based on client selection and completed tasks
  useEffect(() => {
    if (!formData.clientName.trim()) {
      // Filter based on user rights
      let filteredTypes = [...TASK_TYPES];
      
      if (userRights === 'Stage 1 rights') {
        // Only regular tasks
        filteredTypes = REGULAR_TASKS.slice();
      } else if (userRights === 'Stage 2 rights') {
        // All tasks except Level 1 approval
        filteredTypes = TASK_TYPES.filter(task => task !== 'Check and Approved by (Level 1)');
      }
      // Top Level Rights gets all tasks
      
      setAvailableTaskTypes(filteredTypes);
      return;
    }

    const clientEntries = existingEntries.filter(entry => 
      entry.clientName.toLowerCase() === formData.clientName.trim().toLowerCase()
    );

    // Check if all regular tasks are completed successfully
    const completedRegularTasks = REGULAR_TASKS.filter(taskType => {
      const taskEntries = clientEntries.filter(entry => entry.taskType === taskType);
      if (taskEntries.length === 0) return false;
      
      const latestEntry = taskEntries.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
      
      return latestEntry.queriesSolved === 'Yes';
    });

    const allRegularTasksCompleted = completedRegularTasks.length === REGULAR_TASKS.length;

    // Filter available task types
    let filteredTaskTypes = [...TASK_TYPES];
    
    // Apply user rights filtering first
    if (userRights === 'Stage 1 rights') {
      // Only regular tasks
      filteredTaskTypes = REGULAR_TASKS.slice();
    } else if (userRights === 'Stage 2 rights') {
      // All tasks except Level 1 approval
      filteredTaskTypes = TASK_TYPES.filter(task => task !== 'Check and Approved by (Level 1)');
    }
    // Top Level Rights gets all tasks
    
    // Then apply workflow-based filtering
    if (!allRegularTasksCompleted) {
      filteredTaskTypes = filteredTaskTypes.filter(taskType => 
        taskType !== 'Check and Approved by (Level 1)'
      );
    }

    setAvailableTaskTypes(filteredTaskTypes);

    // Reset task type if it's no longer available
    if (formData.taskType === 'Check and Approved by (Level 1)' && !allRegularTasksCompleted) {
      setFormData(prev => ({ ...prev, taskType: '' as TaskEntry['taskType'] }));
    }
  }, [formData.clientName, existingEntries, userRights]);

  const handleClientNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, clientName: value }));
    
    if (value.length > 0) {
      const filtered = existingClients.filter(client =>
        client.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredClients(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectClient = (clientName: string) => {
    setFormData(prev => ({ ...prev, clientName }));
    setShowSuggestions(false);
  };

  const handleUserFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    if (value.length > 0) {
      const filtered = DATABASE_USERS.filter(user =>
        user.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredUsers(prev => ({ ...prev, [fieldName]: filtered }));
      setShowUserSuggestions(prev => ({ ...prev, [fieldName]: true }));
    } else {
      setShowUserSuggestions(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const selectUser = (fieldName: string, userName: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: userName }));
    setShowUserSuggestions(prev => ({ ...prev, [fieldName]: false }));
  };

  const validateUserField = (fieldName: string, value: string) => {
    if (!value.trim()) return true; // Empty is valid for optional fields
    return DATABASE_USERS.includes(value.trim());
  };

  const addDisallowance = () => {
    if (disallowances.length < 10) {
      setDisallowances([...disallowances, { section: '', disallowance: '' }]);
    }
  };

  const removeDisallowance = (index: number) => {
    if (disallowances.length > 1) {
      setDisallowances(disallowances.filter((_, i) => i !== index));
    }
  };

  const updateDisallowance = (index: number, field: 'section' | 'disallowance', value: string) => {
    const updated = [...disallowances];
    updated[index] = { ...updated[index], [field]: value };
    setDisallowances(updated);
  };

  const addPendency = () => {
    if (pendencies.length < 10) {
      setPendencies([...pendencies, '']);
    }
  };

  const removePendency = (index: number) => {
    if (pendencies.length > 1) {
      setPendencies(pendencies.filter((_, i) => i !== index));
    }
  };

  const updatePendency = (index: number, value: string) => {
    const updated = [...pendencies];
    updated[index] = value;
    setPendencies(updated);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }

    if (!formData.taskType) {
      newErrors.taskType = 'Task type is required';
    } else {
      // Check if Level 1 approval is allowed
      if (formData.taskType === 'Check and Approved by (Level 1)') {
        const clientEntries = existingEntries.filter(entry => 
          entry.clientName.toLowerCase() === formData.clientName.trim().toLowerCase()
        );

        const completedRegularTasks = REGULAR_TASKS.filter(taskType => {
          const taskEntries = clientEntries.filter(entry => entry.taskType === taskType);
          if (taskEntries.length === 0) return false;
          
          const latestEntry = taskEntries.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];
          
          return latestEntry.queriesSolved === 'Yes';
        });

        const allRegularTasksCompleted = completedRegularTasks.length === REGULAR_TASKS.length;
        const pendingTasks = REGULAR_TASKS.filter(taskType => !completedRegularTasks.includes(taskType));

        if (!allRegularTasksCompleted) {
          newErrors.taskType = `Level 1 approval requires all regular tasks to be completed first. Pending tasks: ${pendingTasks.join(', ')}`;
        }
      }

      // Check if this task already exists for this client
      const existingTask = existingEntries.find(entry => 
        entry.clientName.toLowerCase() === formData.clientName.trim().toLowerCase() &&
        entry.taskType === formData.taskType
      );
      
      if (existingTask) {
        newErrors.taskType = `This task has already been submitted for ${formData.clientName}. Task was completed on ${new Date(existingTask.date).toLocaleDateString()} by ${existingTask.verifiedBy}.`;
      }
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    // Task-specific validations
    if (formData.taskType === 'Check and Approved by (Level 1)') {
      if (!formData.approvedBy.trim()) {
        newErrors.approvedBy = 'Approved by is required';
      }
    } else if (formData.taskType === 'Copy to Rehan Sir') {
      if (!formData.copyGivenBy.trim()) {
        newErrors.copyGivenBy = 'Copy given by is required';
      }
      if (!formData.receivedBy.trim()) {
        newErrors.receivedBy = 'Copy received by is required';
      }
    } else if (formData.taskType === '3CD Prepared by') {
      if (!formData.preparedBy.trim()) {
        newErrors.preparedBy = 'Prepared by is required';
      }
      if (!formData.preparationStatus) {
        newErrors.preparationStatus = 'Preparation status is required';
      }
      if (formData.preparationStatus === 'Partial') {
        const validPendencies = pendencies.filter(p => p.trim());
        if (validPendencies.length === 0) {
          newErrors.pendencies = 'At least one pendency is required when status is Partial';
        }
      }
    } else if (formData.taskType === 'UDIN Number') {
      if (!formData.udinNumber.trim()) {
        newErrors.udinNumber = 'UDIN Number is required';
      }
      if (!formData.udinPreparedUnder.trim()) {
        newErrors.udinPreparedUnder = 'UDIN Prepared Under is required';
      }
      if (!formData.udinGeneratedBy.trim()) {
        newErrors.udinGeneratedBy = 'UDIN Generated By is required';
      }
      if (!formData.udinSignedBy.trim()) {
        newErrors.udinSignedBy = 'Audit Report Signed By is required';
      }
      if (!formData.auditReportDate.trim()) {
        newErrors.auditReportDate = 'Date of Audit Report is required';
      }
    } else if (formData.taskType === 'Computation of Total Income Checking' || formData.taskType === 'Final Verification before Upload to IT Portal') {
      if (!formData.verifiedBy.trim()) {
        newErrors.verifiedBy = 'Checked by is required';
      }
    } else if (formData.taskType === 'Dis-allowances in 3CD') {
      if (!formData.verifiedBy.trim()) {
        newErrors.verifiedBy = 'Verified by is required';
      }
      const validDisallowances = disallowances.filter(d => d.section.trim() && d.disallowance.trim());
      if (validDisallowances.length === 0) {
        newErrors.disallowances = 'At least one complete disallowance entry is required';
      }
    } else {
      // Regular tasks
      if (!formData.verifiedBy.trim()) {
        newErrors.verifiedBy = 'Verified by is required';
      } else if (!validateUserField('verifiedBy', formData.verifiedBy)) {
        newErrors.verifiedBy = 'Please select a user from the database';
      }
      if (!formData.queriesSolved) {
        newErrors.queriesSolved = 'Queries solved status is required';
      }
      if (formData.queriesSolved === 'Yes' && !formData.queriesSolvedBy.trim()) {
        newErrors.queriesSolvedBy = 'Please specify who solved the queries';
      } else if (formData.queriesSolved === 'Yes' && !validateUserField('queriesSolvedBy', formData.queriesSolvedBy)) {
        newErrors.queriesSolvedBy = 'Please select a user from the database';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      let entryData: Partial<TaskEntry> = {
        clientName: formData.clientName.trim(),
        taskType: formData.taskType,
        date: formData.date,
      };

      // Task-specific data mapping
      if (formData.taskType === 'Check and Approved by (Level 1)') {
        entryData = {
          ...entryData,
          verifiedBy: formData.approvedBy.trim() || currentUser || 'Unknown',
          approvedBy: formData.approvedBy.trim(),
          queriesSolved: 'Yes',
          queriesSolvedBy: formData.approvedBy.trim(),
          checkedBy: formData.approvedBy.trim()
        };
      } else if (formData.taskType === 'Copy to Rehan Sir') {
        entryData = {
          ...entryData,
          verifiedBy: formData.copyGivenBy.trim() || currentUser || 'Unknown',
          copyGivenBy: formData.copyGivenBy.trim(),
          receivedBy: formData.receivedBy.trim(),
          queriesSolved: 'Yes'
        };
      } else if (formData.taskType === '3CD Prepared by') {
        const validPendencies = pendencies.filter(p => p.trim());
        entryData = {
          ...entryData,
          verifiedBy: formData.preparedBy.trim() || currentUser || 'Unknown',
          preparedBy: formData.preparedBy.trim(),
          preparationStatus: formData.preparationStatus as 'Done' | 'Partial',
          pendencies: formData.preparationStatus === 'Partial' ? validPendencies : undefined,
          queriesSolved: formData.preparationStatus === 'Done' ? 'Yes' : 'Partial'
        };
      } else if (formData.taskType === 'UDIN Number') {
        entryData = {
          ...entryData,
          verifiedBy: formData.udinGeneratedBy.trim() || currentUser || 'Unknown',
          udinNumber: formData.udinNumber.trim(),
          udinPreparedUnder: formData.udinPreparedUnder.trim(),
          udinGeneratedBy: formData.udinGeneratedBy.trim(),
          auditReportSignedBy: formData.udinSignedBy.trim(),
          auditReportDate: formData.auditReportDate.trim(),
          queriesSolved: 'Yes'
        };
      } else if (formData.taskType === 'Computation of Total Income Checking' || formData.taskType === 'Final Verification before Upload to IT Portal') {
        entryData = {
          ...entryData,
          verifiedBy: formData.verifiedBy.trim() || currentUser || 'Unknown',
          queriesSolved: 'Yes'
        };
      } else if (formData.taskType === 'Dis-allowances in 3CD') {
        const validDisallowances = disallowances.filter(d => d.section.trim() && d.disallowance.trim());
        const disallowancesWithUser = validDisallowances.map(d => ({
          ...d,
          addedBy: currentUser || 'Unknown',
          timestamp: new Date().toISOString()
        }));
        entryData = {
          ...entryData,
          verifiedBy: formData.verifiedBy.trim() || currentUser || 'Unknown',
          disallowances: disallowancesWithUser,
          queriesSolved: 'Yes'
        };
      } else {
        // Regular tasks
        entryData = {
          ...entryData,
          verifiedBy: formData.verifiedBy.trim() || currentUser || 'Unknown',
          queriesSolved: formData.queriesSolved,
          queriesSolvedBy: formData.queriesSolved === 'Yes' ? formData.queriesSolvedBy.trim() : undefined
        };
      }

      onAddEntry(entryData as TaskEntry);

      // Reset form
      setFormData({
        clientName: '',
        taskType: '' as TaskEntry['taskType'],
        verifiedBy: currentUser || '',
        date: '',
        queriesSolved: '' as TaskEntry['queriesSolved'],
        queriesSolvedBy: currentUser || '',
        approvedBy: currentUser || '',
        copyGivenBy: currentUser || '',
        receivedBy: currentUser || '',
        preparedBy: currentUser || '',
        preparationStatus: '' as 'Done' | 'Partial' | '',
        pendencies: [],
        udinNumber: '',
        udinPreparedUnder: '',
        udinGeneratedBy: currentUser || '',
        udinSignedBy: currentUser || '',
        auditReportDate: ''
      });
      
      setDisallowances([{ section: '', disallowance: '' }]);
      setPendencies(['']);
      setErrors({});

    } catch (error) {
      console.error('Error submitting entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderUserField = (
    fieldName: string,
    label: string,
    value: string,
    placeholder?: string,
    required = false
  ) => {
    const fieldKey = fieldName as keyof typeof formData;
    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="inline h-4 w-4 mr-1" />
          {label} {required && '*'}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => handleUserFieldChange(fieldName, e.target.value)}
          onFocus={() => {
            if (value.length > 0 && filteredUsers[fieldName]?.length > 0) {
              setShowUserSuggestions(prev => ({ ...prev, [fieldName]: true }));
            }
          }}
          onBlur={() => setTimeout(() => setShowUserSuggestions(prev => ({ ...prev, [fieldName]: false })), 300)}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
            errors[fieldName] ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder={placeholder || "Start typing to select user"}
          autoComplete="off"
        />
        
        {showUserSuggestions[fieldName] && filteredUsers[fieldName]?.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {filteredUsers[fieldName].map((user) => (
              <div
                key={user}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectUser(fieldName, user);
                }}
                className="px-4 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-gray-900">{user}</div>
              </div>
            ))}
          </div>
        )}
        
        {errors[fieldName] && (
          <p className="mt-1 text-sm text-red-600">{errors[fieldName]}</p>
        )}
      </div>
    );
  };

  const renderTaskSpecificFields = () => {
    if (formData.taskType === 'Check and Approved by (Level 1)') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderUserField('approvedBy', 'Approved By', formData.approvedBy, currentUser, true)}
        </div>
      );
    }

    if (formData.taskType === 'Copy to Rehan Sir') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderUserField('copyGivenBy', 'Copy Given By', formData.copyGivenBy, currentUser, true)}
          {renderUserField('receivedBy', 'Copy Received By', formData.receivedBy, currentUser, true)}
        </div>
      );
    }

    if (formData.taskType === '3CD Prepared by') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderUserField('preparedBy', 'Prepared By', formData.preparedBy, currentUser, true)}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CheckCircle className="inline h-4 w-4 mr-1" />
                Preparation Status *
              </label>
              <select
                value={formData.preparationStatus}
                onChange={(e) => setFormData(prev => ({ ...prev, preparationStatus: e.target.value as 'Done' | 'Partial' | '' }))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.preparationStatus ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Status</option>
                <option value="Done">Done</option>
                <option value="Partial">Partial</option>
              </select>
              {errors.preparationStatus && (
                <p className="mt-1 text-sm text-red-600">{errors.preparationStatus}</p>
              )}
            </div>
          </div>

          {formData.preparationStatus === 'Partial' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <AlertCircle className="inline h-4 w-4 mr-1" />
                List of Pendencies *
              </label>
              <div className="space-y-3">
                {pendencies.map((pendency, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 w-8">{index + 1}.</span>
                    <input
                      type="text"
                      value={pendency}
                      onChange={(e) => updatePendency(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={`Enter pendency ${index + 1}`}
                    />
                    {pendencies.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePendency(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                {pendencies.length < 10 && (
                  <button
                    type="button"
                    onClick={addPendency}
                    className="inline-flex items-center px-3 py-2 border border-dashed border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Pendency ({pendencies.length}/10)
                  </button>
                )}
              </div>
              {errors.pendencies && (
                <p className="mt-1 text-sm text-red-600">{errors.pendencies}</p>
              )}
            </div>
          )}
        </div>
      );
    }

    if (formData.taskType === 'UDIN Number') {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Hash className="inline h-4 w-4 mr-1" />
                UDIN Number *
              </label>
              <input
                type="text"
                value={formData.udinNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, udinNumber: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.udinNumber ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter UDIN Number"
              />
              {errors.udinNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.udinNumber}</p>
              )}
            </div>

            {renderUserField('udinGeneratedBy', 'UDIN Generated By', formData.udinGeneratedBy, currentUser, true)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="inline h-4 w-4 mr-1" />
                UDIN Prepared Under *
              </label>
              <select
                value={formData.udinPreparedUnder}
                onChange={(e) => setFormData(prev => ({ ...prev, udinPreparedUnder: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.udinPreparedUnder ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select UDIN Prepared Under</option>
                {UDIN_PREPARED_UNDER_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.udinPreparedUnder && (
                <p className="mt-1 text-sm text-red-600">{errors.udinPreparedUnder}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Audit Report Signed By *
              </label>
              <select
                value={formData.udinSignedBy}
                onChange={(e) => setFormData(prev => ({ ...prev, udinSignedBy: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                  errors.udinSignedBy ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Signing Person</option>
                <option value="CA Mitt S. Patel">CA Mitt S. Patel</option>
                <option value="CA Amin G. Shaikh">CA Amin G. Shaikh</option>
                <option value="CA G M Shaikh">CA G M Shaikh</option>
                <option value="CA Chahana P Vora">CA Chahana P Vora</option>
              </select>
              {errors.udinSignedBy && (
                <p className="mt-1 text-sm text-red-600">{errors.udinSignedBy}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Date of Audit Report *
            </label>
            <input
              type="date"
              value={formData.auditReportDate}
              onChange={(e) => setFormData(prev => ({ ...prev, auditReportDate: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                errors.auditReportDate ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.auditReportDate && (
              <p className="mt-1 text-sm text-red-600">{errors.auditReportDate}</p>
            )}
          </div>
        </div>
      );
    }

    if (formData.taskType === 'Computation of Total Income Checking' || formData.taskType === 'Final Verification before Upload to IT Portal') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderUserField('verifiedBy', 'Checked By', formData.verifiedBy, 'Select checker', true)}
        </div>
      );
    }

    if (formData.taskType === 'Dis-allowances in 3CD') {
      return (
        <div className="space-y-6">
          {renderUserField('verifiedBy', 'Verified By', formData.verifiedBy, 'Select verifier', true)}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Disallowances *
            </label>
            <div className="space-y-4">
              {disallowances.map((disallowance, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <input
                      type="text"
                      value={disallowance.section}
                      onChange={(e) => updateDisallowance(index, 'section', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Section (e.g., 40(a)(ia))"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={disallowance.disallowance}
                      onChange={(e) => updateDisallowance(index, 'disallowance', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Amount (e.g., ₹50,000)"
                    />
                    {disallowances.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDisallowance(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {disallowances.length < 10 && (
                <button
                  type="button"
                  onClick={addDisallowance}
                  className="inline-flex items-center px-4 py-2 border border-dashed border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Disallowance ({disallowances.length}/10)
                </button>
              )}
            </div>
            {errors.disallowances && (
              <p className="mt-1 text-sm text-red-600">{errors.disallowances}</p>
            )}
          </div>
        </div>
      );
    }

    // Regular tasks
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderUserField('verifiedBy', 'Verified By', formData.verifiedBy, 'Select verifier', true)}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CheckCircle className="inline h-4 w-4 mr-1" />
              Queries Solved *
            </label>
            <select
              value={formData.queriesSolved}
              onChange={(e) => setFormData(prev => ({ ...prev, queriesSolved: e.target.value as TaskEntry['queriesSolved'] }))}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                errors.queriesSolved ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select Status</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Partial">Partial</option>
            </select>
            {errors.queriesSolved && (
              <p className="mt-1 text-sm text-red-600">{errors.queriesSolved}</p>
            )}
          </div>
        </div>

        {formData.queriesSolved === 'Yes' && (
          renderUserField('queriesSolvedBy', 'Queries Solved By', formData.queriesSolvedBy, currentUser, true)
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center mb-8">
        <FileText className="h-6 w-6 text-indigo-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-900">Task Entry Form</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Client Name *
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => handleClientNameChange(e.target.value)}
              onFocus={() => {
                if (formData.clientName.length > 0 && filteredClients.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                errors.clientName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter or select client name"
              autoComplete="off"
            />
            
            {showSuggestions && filteredClients.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectClient(client.name);
                    }}
                    className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{client.name}</div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <span>{client.state}</span>
                      {client.gstn && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="text-xs">{client.gstn}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {errors.clientName && (
              <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Task Type *
            </label>
            <select
              value={formData.taskType}
              onChange={(e) => setFormData(prev => ({ ...prev, taskType: e.target.value as TaskEntry['taskType'] }))}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                errors.taskType ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select Task Type</option>
              {availableTaskTypes.map(type => (
                <option 
                  key={type} 
                  value={type}
                  disabled={type === 'Check and Approved by (Level 1)' && !availableTaskTypes.includes(type)}
                >
                  {type}
                  {type === 'Check and Approved by (Level 1)' && !availableTaskTypes.includes(type) ? ' (Requires all regular tasks completed)' : ''}
                </option>
              ))}
            </select>
            {errors.taskType && (
              <p className="mt-1 text-sm text-red-600">{errors.taskType}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            Date *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
              errors.date ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder={currentUser || "Enter verifier name"}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date}</p>
          )}
        </div>

        {/* Task-specific fields */}
        {formData.taskType && renderTaskSpecificFields()}

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white transition-colors ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Submit Entry
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskEntryForm;