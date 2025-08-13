export interface TaskEntry {
  id: string;
  clientName: string;
  taskType: 'Opening Balance Verification' | 'Audit Queries Status Checking' | 'Ledger Scrutiny' | '26AS Checking' | 'AIS Checking' | 'GST Verification' | 'Data feeding in Software' | 'Dis-allowances in 3CD' | 'Check and Approved by (Level 1)' | 'Copy to Rehan Sir' | '3CD Prepared by' | 'Computation of Total Income Checking' | 'Final Verification before Upload to IT Portal' | 'UDIN Number';
  verifiedBy: string;
  date: string;
  queriesSolved: 'Yes' | 'No' | 'Partial';
  queriesSolvedBy?: string;
  checkedBy?: string;
  approvedBy?: string;
  copyGivenBy?: string;
  receivedBy?: string;
  resubmissions?: ResubmissionEntry[];
  preparedBy?: string;
  preparationStatus?: 'Done' | 'Partial';
  pendencies?: string[];
  repreparations?: RepreparationEntry[];
  timestamp: string;
  lastStatusUpdate?: string;
  disallowances?: DisallowanceEntry[];
  udinNumber?: string;
  udinPreparedUnder?: string;
  udinGeneratedBy?: string;
  udinSignedBy?: string;
  auditReportDate?: string;
  recheckHistory?: RecheckEntry[];
  status?: string;
  assignedTo?: string;
  dueDate?: string;
  completedDate?: string;
  updatedBy?: string;
}

export interface ResubmissionEntry {
  id: string;
  status: 'Resubmission Required' | 'Resubmitted' | 'Received';
  resubmittedBy?: string;
  receivedBy?: string;
  date: string;
  timestamp: string;
}

export interface RepreparationEntry {
  id: string;
  status: 'Re-preparation Required' | 'Re-prepared By' | 'Completed';
  repreparedBy?: string;
  date: string;
  timestamp: string;
}

export interface RecheckEntry {
  id: string;
  checkedBy: string;
  date: string;
  timestamp: string;
}

export interface DisallowanceEntry {
  section: string;
  disallowance: string;
  addedBy?: string;
  updatedBy?: string;
  timestamp?: string;
  lastUpdated?: string;
}

export interface Client {
  id: string;
  name: string;
  registrationStatus: 'Registered' | 'Unregistered';
  gstn?: string;
  pan?: string;
  state: string;
  lastUpdated: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  rights: 'Top Level Rights' | 'Stage 1 rights' | 'Stage 2 rights';
  createdBy?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface TaskStatus {
  [key: string]: {
    verifiedBy: string;
    date: string;
    queriesSolved: string;
    timestamp: string;
  };
}