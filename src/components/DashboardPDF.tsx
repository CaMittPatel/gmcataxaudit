import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
} from '@react-pdf/renderer';
import { Client, TaskEntry } from '../types';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#000000',
  },
  
  // Header
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: '2px solid #000000',
  },
  
  // Client Info Section
  clientSection: {
    marginBottom: 20,
    padding: 15,
    border: '2px solid #000000',
    borderRadius: 8,
  },
  clientTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  clientGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clientColumn: {
    flex: 1,
    paddingHorizontal: 10,
  },
  clientRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  clientLabel: {
    fontWeight: 'bold',
    width: 80,
    fontSize: 9,
  },
  clientValue: {
    flex: 1,
    fontSize: 9,
  },
  
  // Section Titles
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 15,
    textAlign: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    border: '1px solid #000000',
  },
  
  // Regular Tasks Table
  table: {
    marginBottom: 15,
    border: '1px solid #000000',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottom: '1px solid #000000',
    padding: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #000000',
    padding: 5,
    minHeight: 25,
  },
  tableCell: {
    flex: 1,
    fontSize: 8,
    paddingHorizontal: 3,
    justifyContent: 'center',
  },
  tableCellHeader: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 3,
    textAlign: 'center',
  },
  taskNameCell: {
    flex: 2,
    fontSize: 8,
    paddingHorizontal: 3,
    justifyContent: 'center',
  },
  taskNameHeader: {
    flex: 2,
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 3,
    textAlign: 'center',
  },
  
  // Status styling
  statusCompleted: {
    fontWeight: 'bold',
  },
  statusPending: {
    fontStyle: 'italic',
  },
  statusPartial: {
    textDecoration: 'underline',
  },
  
  // Special Tasks
  specialTasksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialTaskCard: {
    width: '48%',
    border: '1px solid #000000',
    padding: 8,
    marginBottom: 8,
  },
  specialTaskTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
    borderBottom: '1px solid #000000',
    paddingBottom: 3,
  },
  specialTaskRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  specialTaskLabel: {
    fontWeight: 'bold',
    width: 70,
    fontSize: 8,
  },
  specialTaskValue: {
    flex: 1,
    fontSize: 8,
  },
  
  // Disallowances
  disallowanceItem: {
    fontSize: 7,
    marginBottom: 2,
    paddingLeft: 5,
  },
  disallowanceUser: {
    fontSize: 6,
    fontStyle: 'italic',
    color: '#666666',
    marginLeft: 5,
  },
  
  // Pendencies
  pendencyItem: {
    fontSize: 7,
    marginBottom: 2,
    paddingLeft: 5,
  },
  
  // Footer info
  footerInfo: {
    fontSize: 6,
    fontStyle: 'italic',
    marginTop: 3,
    textAlign: 'right',
  },
});

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
};

const getStatusStyle = (status?: string) => {
  switch (status) {
    case 'Yes':
    case 'Done':
      return styles.statusCompleted;
    case 'Partial':
      return styles.statusPartial;
    case 'No':
    default:
      return styles.statusPending;
  }
};

const REGULAR_TASKS = [
  'Opening Balance Verification',
  'Audit Queries Status Checking',
  'Ledger Scrutiny',
  '26AS Checking',
  'AIS Checking',
  'GST Verification',
  'Data feeding in Software',
  'Dis-allowances in 3CD'
];

const SPECIAL_TASKS = [
  'Check and Approved by (Level 1)',
  'Copy to Rehan Sir',
  '3CD Prepared by',
  'Computation of Total Income Checking',
  'Final Verification before Upload to IT Portal',
  'UDIN Number'
];

const RegularTasksTable: React.FC<{ entries: TaskEntry[] }> = ({ entries }) => {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={styles.taskNameHeader}>Task Type</Text>
        <Text style={styles.tableCellHeader}>Verified By</Text>
        <Text style={styles.tableCellHeader}>Date</Text>
        <Text style={styles.tableCellHeader}>Status</Text>
        <Text style={styles.tableCellHeader}>Solved By</Text>
      </View>
      
      {REGULAR_TASKS.map((taskType) => {
        const entry = entries.find(e => e.taskType === taskType);
        return (
          <View key={taskType} style={styles.tableRow}>
            <Text style={styles.taskNameCell}>{taskType}</Text>
            <Text style={styles.tableCell}>{entry?.verifiedBy || '-'}</Text>
            <Text style={styles.tableCell}>{entry ? formatDate(entry.date) : '-'}</Text>
            <Text style={[styles.tableCell, getStatusStyle(entry?.queriesSolved)]}>
              {entry?.queriesSolved || 'Not Started'}
            </Text>
            <Text style={styles.tableCell}>{entry?.queriesSolvedBy || '-'}</Text>
          </View>
        );
      })}
    </View>
  );
};

const SpecialTaskCard: React.FC<{ entry?: TaskEntry; taskType: string }> = ({ entry, taskType }) => {
  const renderTaskContent = () => {
    if (!entry) {
      return (
        <View style={styles.specialTaskRow}>
          <Text style={styles.specialTaskLabel}>Status:</Text>
          <Text style={[styles.specialTaskValue, styles.statusPending]}>Not Started</Text>
        </View>
      );
    }

    switch (taskType) {
      case 'Check and Approved by (Level 1)':
        return (
          <>
            <View style={styles.specialTaskRow}>
              <Text style={styles.specialTaskLabel}>Approved By:</Text>
              <Text style={styles.specialTaskValue}>{entry.approvedBy || '-'}</Text>
            </View>
            <View style={styles.specialTaskRow}>
              <Text style={styles.specialTaskLabel}>Date:</Text>
              <Text style={styles.specialTaskValue}>{formatDate(entry.date)}</Text>
            </View>
            <View style={styles.specialTaskRow}>
              <Text style={styles.specialTaskLabel}>Status:</Text>
              <Text style={[styles.specialTaskValue, styles.statusCompleted]}>Approved</Text>
            </View>
          </>
        );

      case 'Copy to Rehan Sir':
        return (
          <>
            <View style={styles.specialTaskRow}>
              <Text style={styles.specialTaskLabel}>Given By:</Text>
              <Text style={styles.specialTaskValue}>{entry.copyGivenBy || '-'}</Text>
            </View>
            <View style={styles.specialTaskRow}>
              <Text style={styles.specialTaskLabel}>Received By:</Text>
              <Text style={styles.specialTaskValue}>{entry.receivedBy || '-'}</Text>
            </View>
            <View style={styles.specialTaskRow}>
              <Text style={styles.specialTaskLabel}>Date:</Text>
              <Text style={styles.specialTaskValue}>{formatDate(entry.date)}</Text>
            </View>
          </>
        );

      case '3CD Prepared by':
        return (
          <>
            <View style={styles.specialTaskRow}>
              <Text style={styles.specialTaskLabel}>Prepared By:</Text>
              <Text style={styles.specialTaskValue}>{entry.preparedBy || '-'}</Text>
            </View>
            <View style={styles.specialTaskRow}>
              <Text style={styles.specialTaskLabel}>Status:</Text>
              <Text style={[styles.specialTaskValue, getStatusStyle(entry.preparationStatus)]}>
                {entry.preparationStatus || '-'}
              </Text>
            </View>
            <View style={styles.specialTaskRow}>
              <Text style={styles.specialTaskLabel}>Date:</Text>
              <Text style={styles.specialTaskValue}>{formatDate(entry.date)}</Text>
            </View>
            {entry.pendencies && entry.pendencies.length > 0 && (
              <View>
                <Text style={[styles.specialTaskLabel, { marginTop: 3, marginBottom: 2 }]}>Pendencies:</Text>
                {entry.pendencies.slice(0, 2).map((pendency, i) => (
                  <Text key={i} style={styles.pendencyItem}>• {pendency}</Text>
                ))}
                {entry.pendencies.length > 2 && (
                  <Text style={styles.pendencyItem}>• +{entry.pendencies.length - 2} more...</Text>
                )}
              </View>
            )}
          </>
        );

      case 'UDIN Number':
        return (
          <>
            <View style={styles.specialTaskRow}>
              <Text style={styles.specialTaskLabel}>UDIN:</Text>
              <Text style={styles.specialTaskValue}>{entry.udinNumber || '-'}</Text>
            </View>
            <View style={styles.specialTaskRow}>
              <Text style={styles.specialTaskLabel}>Generated By:</Text>
              <Text style={styles.specialTaskValue}>{entry.udinGeneratedBy || '-'}</Text>
            </View>
            <View style={styles.specialTaskRow}>
              <Text style={styles.specialTaskLabel}>Signed By:</Text>
              <Text style={styles.specialTaskValue}>{entry.auditReportSignedBy || '-'}</Text>
            </View>
            <View style={styles.specialTaskRow}>
              <Text style={styles.specialTaskLabel}>Report Date:</Text>
              <Text style={styles.specialTaskValue}>{formatDate(entry.auditReportDate)}</Text>
            </View>
          </>
        );

      default:
        return (
          <>
            <View style={styles.specialTaskRow}>
              <Text style={styles.specialTaskLabel}>Verified By:</Text>
              <Text style={styles.specialTaskValue}>{entry.verifiedBy || '-'}</Text>
            </View>
            <View style={styles.specialTaskRow}>
              <Text style={styles.specialTaskLabel}>Date:</Text>
              <Text style={styles.specialTaskValue}>{formatDate(entry.date)}</Text>
            </View>
            <View style={styles.specialTaskRow}>
              <Text style={styles.specialTaskLabel}>Status:</Text>
              <Text style={[styles.specialTaskValue, styles.statusCompleted]}>Completed</Text>
            </View>
          </>
        );
    }
  };

  return (
    <View style={styles.specialTaskCard}>
      <Text style={styles.specialTaskTitle}>{taskType}</Text>
      {renderTaskContent()}
      
      {/* Show disallowances for Dis-allowances task */}
      {taskType === 'Dis-allowances in 3CD' && entry?.disallowances && entry.disallowances.length > 0 && (
        <View style={{ marginTop: 5 }}>
          <Text style={[styles.specialTaskLabel, { marginBottom: 2 }]}>Disallowances:</Text>
          {entry.disallowances.slice(0, 3).map((disallowance, i) => (
            <View key={i}>
              <Text style={styles.disallowanceItem}>
                • {disallowance.section}: {disallowance.disallowance}
              </Text>
              {disallowance.addedBy && (
                <Text style={styles.disallowanceUser}>
                  Added by: {disallowance.addedBy}
                  {disallowance.updatedBy && disallowance.updatedBy !== disallowance.addedBy && 
                    ` | Updated by: ${disallowance.updatedBy}`
                  }
                </Text>
              )}
            </View>
          ))}
          {entry.disallowances.length > 3 && (
            <Text style={styles.disallowanceItem}>• +{entry.disallowances.length - 3} more...</Text>
          )}
        </View>
      )}
      
      {entry && (
        <Text style={styles.footerInfo}>
          Last updated: {formatDate(entry.lastStatusUpdate || entry.timestamp)}
        </Text>
      )}
    </View>
  );
};

const DashboardPDF: React.FC<{ client: Client; entries: TaskEntry[] }> = ({ client, entries }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Tax Audit Task Dashboard</Text>

        {/* Client Information */}
        <View style={styles.clientSection}>
          <Text style={styles.clientTitle}>Client Information</Text>
          <View style={styles.clientGrid}>
            <View style={styles.clientColumn}>
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>Client Name:</Text>
                <Text style={styles.clientValue}>{client.name}</Text>
              </View>
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>State:</Text>
                <Text style={styles.clientValue}>{client.state}</Text>
              </View>
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>Registration:</Text>
                <Text style={styles.clientValue}>{client.registrationStatus}</Text>
              </View>
            </View>
            <View style={styles.clientColumn}>
              {client.gstn && (
                <View style={styles.clientRow}>
                  <Text style={styles.clientLabel}>GSTN:</Text>
                  <Text style={styles.clientValue}>{client.gstn}</Text>
                </View>
              )}
              {client.pan && (
                <View style={styles.clientRow}>
                  <Text style={styles.clientLabel}>PAN:</Text>
                  <Text style={styles.clientValue}>{client.pan}</Text>
                </View>
              )}
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>Last Updated:</Text>
                <Text style={styles.clientValue}>{formatDate(client.lastUpdated)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Regular Tasks Table */}
        <Text style={styles.sectionTitle}>Regular Tasks</Text>
        <RegularTasksTable entries={entries} />

        {/* Special Tasks */}
        <Text style={styles.sectionTitle}>Special Tasks</Text>
        <View style={styles.specialTasksGrid}>
          {SPECIAL_TASKS.map((taskType) => {
            const entry = entries.find(e => e.taskType === taskType);
            return (
              <SpecialTaskCard
                key={taskType}
                taskType={taskType}
                entry={entry}
              />
            );
          })}
        </View>
      </Page>
    </Document>
  );
};

export default DashboardPDF;