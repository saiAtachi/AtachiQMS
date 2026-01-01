import React, { useState, useEffect } from 'react';

import { AlertCircle, CheckCircle,BookOpen, Clock, FileText, Users, TrendingUp, AlertTriangle, Shield, Upload, Mail, UserCheck, X, Download, Bell, Link, FileBarChart } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,        // ✅ ADD THIS
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Bar } from 'react-chartjs-2';
import ESignatureModal from './EsignModal'; 
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,        // ✅ REGISTER IT
  ArcElement,
  Tooltip,
  Legend
);


Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf'
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 12,
    color: '#1f2937'
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
    borderBottomWidth: 3,
    borderBottomColor: '#2563eb',
    paddingBottom: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280'
  },
  section: {
    marginBottom: 25
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 6
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10
  },
  tableRow: {
    flexDirection: 'row'
  },
  tableCell: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 8,
    flex: 1
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold'
  },
  text: {
    marginBottom: 6
  },
  footer: {
    marginTop: 50,
    textAlign: 'center',
    fontSize: 10,
    color: '#6b7280',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 15
  }
});

const QMSApp = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [showESignature, setShowESignature] = useState(false);
const [pendingAction, setPendingAction] = useState(null); // { type: 'approve' | 'reject', module, recordId, role, reason? }
const [showInitiateCAPA, setShowInitiateCAPA] = useState(false);
const [capaSource, setCapaSource] = useState(null); // { module, recordId, recordTitle }
  const [showLinkExisting, setShowLinkExisting] = useState(false);
const [linkSource, setLinkSource] = useState(null); // { module, id, title }
  // Load data from localStorage on initial load
  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem('qms_records');
      return saved ? JSON.parse(saved) : {
        complaints: [],
        capa: [],
        oot: [],
        vendors: [],
        risks: [],
        recalls: [],
        audits: []
      };
    } catch (error) {
      console.error('Error loading from storage:', error);
      return {
        complaints: [],
        capa: [],
        oot: [],
        vendors: [],
        risks: [],
        recalls: [],
        audits: []
      };
    }
  };
  // Sample Data Seeder

  const RecordPDFDocument = ({ record, module }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{formatModuleName(module)} Record Report</Text>
        <Text style={styles.subtitle}>Quality Management System</Text>
        <Text style={{ marginTop: 15 }}>Record ID: #{record.id}</Text>
        <Text>Generated on: {new Date().toLocaleString()}</Text>
      </View>

      {/* Record Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Record Details</Text>
        {Object.entries(record)
          .filter(([key]) => 
            !['approvalChain', 'attachments', 'comments', 'emailsSent', 'auditTrail', 'linkedRecords', 'id', 'createdBy'].includes(key)
          )
          .map(([key, value]) => (
            <View key={key} style={{ flexDirection: 'row', marginBottom: 8 }}>
              <Text style={{ fontWeight: 'bold', width: 160 }}>{key.replace(/([A-Z])/g, ' $1').trim()}:</Text>
              <Text>{value || '-'}</Text>
            </View>
          ))}
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold', width: 160 }}>Created By:</Text>
          <Text>{record.createdBy || 'Current User'}</Text>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold', width: 160 }}>Status:</Text>
          <Text>{record.status}</Text>
        </View>
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold', width: 160 }}>Approval Status:</Text>
          <Text>{record.approvalStatus}</Text>
        </View>
      </View>

      {/* Approval Workflow */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Approval Workflow</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Role</Text>
            <Text style={styles.tableCell}>Status</Text>
            <Text style={styles.tableCell}>Date</Text>
            <Text style={styles.tableCell}>Reason (if rejected)</Text>
          </View>
          {record.approvalChain.map((approval, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.tableCell}>{approval.role}</Text>
              <Text style={styles.tableCell}>{approval.status}</Text>
              <Text style={styles.tableCell}>{approval.date || '-'}</Text>
              <Text style={styles.tableCell}>{approval.reason || '-'}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CAPA Effectiveness Check - Only for CAPA */}
      {module === 'capa' && record.effectivenessChecked !== undefined && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CAPA Effectiveness Check</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { fontWeight: 'bold', width: 180 }]}>Result</Text>
              <Text style={styles.tableCell}>{record.effectivenessResult || 'Pending Review'}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { fontWeight: 'bold', width: 180 }]}>Due Date</Text>
              <Text style={styles.tableCell}>{record.effectivenessDue || '-'}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { fontWeight: 'bold', width: 180 }]}>Reviewed By</Text>
              <Text style={styles.tableCell}>{record.effectivenessReviewer || '-'}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { fontWeight: 'bold', width: 180 }]}>Review Date</Text>
              <Text style={styles.tableCell}>{record.effectivenessDate || '-'}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { fontWeight: 'bold', width: 180 }]}>Note</Text>
              <Text style={styles.tableCell}>{record.effectivenessNote || '-'}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Linked Records */}
      {record.linkedRecords?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Linked Records (Traceability)</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Module</Text>
              <Text style={styles.tableCell}>ID</Text>
              <Text style={styles.tableCell}>Title</Text>
            </View>
            {record.linkedRecords.map((link, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.tableCell}>{formatModuleName(link.module)}</Text>
                <Text style={styles.tableCell}>#{link.id}</Text>
                <Text style={styles.tableCell}>{link.title || 'Untitled'}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Attachments */}
      {record.attachments?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attachments</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>File Name</Text>
              <Text style={styles.tableCell}>Size (KB)</Text>
              <Text style={styles.tableCell}>Upload Date</Text>
            </View>
            {record.attachments.map((file, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.tableCell}>{file.name}</Text>
                <Text style={styles.tableCell}>{(file.size / 1024).toFixed(1)}</Text>
                <Text style={styles.tableCell}>{file.date}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Comments */}
      {record.comments?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comments & Collaboration</Text>
          {record.comments.map((comment, idx) => (
            <View key={idx} style={{ marginBottom: 15, padding: 10, backgroundColor: '#f9fafb', borderLeftWidth: 4, borderLeftColor: '#2563eb' }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>
                {comment.author} • {comment.date}
              </Text>
              <Text>{comment.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Audit Trail */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Audit Trail</Text>
        {record.auditTrail?.length > 0 ? (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Action</Text>
              <Text style={styles.tableCell}>User</Text>
              <Text style={styles.tableCell}>Timestamp</Text>
              <Text style={styles.tableCell}>Details</Text>
            </View>
            {record.auditTrail.map((entry) => (
              <View key={entry.id} style={styles.tableRow}>
                <Text style={styles.tableCell}>{entry.action}</Text>
                <Text style={styles.tableCell}>{entry.user}</Text>
                <Text style={styles.tableCell}>{entry.timestamp}</Text>
                <Text style={styles.tableCell}>{entry.details}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text>No audit history recorded.</Text>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer} fixed>
        <Text>CONFIDENTIAL - FOR INTERNAL USE ONLY</Text>
        <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        <Text>© 2026 QMS System. All rights reserved.</Text>
      </View>
    </Page>
  </Document>
);

  const CAPAReport = () => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCAPAs = records.capa.filter(capa => {
    const matchesStatus = filterStatus === 'all' || capa.status === filterStatus;
    const matchesSearch = 
      capa.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(capa.id).includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Title',
      'Status',
      'Created Date',
      'Linked From',
      'Effectiveness Status',
      'Effectiveness Due',
      'Effectiveness Result',
      'Closed Date'
    ];

    const rows = filteredCAPAs.map(capa => [
      capa.id,
      capa.title || 'Untitled',
      capa.status,
      capa.createdDate,
      capa.linkedRecords?.map(l => `${formatModuleName(l.module)} #${l.id}`).join('; ') || 'None',
      capa.effectivenessChecked ? 'Completed' : capa.status === 'Effectiveness Pending' ? 'Pending' : 'Not Started',
      capa.effectivenessDue || '-',
      capa.effectivenessResult || '-',
      capa.effectivenessDate || '-'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CAPA_Report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    addNotification('CAPA Report exported to CSV', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          CAPA Report
        </h2>
        <button
          onClick={exportToCSV}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow flex items-center gap-2 transition"
        >
          <Download className="w-5 h-5" />
          Export to CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-3 border rounded-lg dark:bg-gray-700"
            >
              <option value="all">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Effectiveness Pending">Effectiveness Pending</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search by Title or ID
            </label>
            <input
              type="text"
              placeholder="Search CAPAs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border rounded-lg dark:bg-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
               
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Linked From
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Effectiveness
                </th>
              
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCAPAs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No CAPA records found
                  </td>
                </tr>
              ) : (
                filteredCAPAs.map(capa => (
                  <tr key={capa.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-md">
                      {capa.title || 'Untitled CAPA'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        capa.status === 'Closed' ? 'bg-green-100 text-green-800' :
                        capa.status === 'Effectiveness Pending' ? 'bg-amber-100 text-amber-800' :
                        capa.status === 'Open' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {capa.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {capa.linkedRecords?.length > 0
                        ? capa.linkedRecords.map(l => `${formatModuleName(l.module)} #${l.id}`).join(', ')
                        : 'None'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {capa.effectivenessChecked
                        ? <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            capa.effectivenessResult === 'Effective' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {capa.effectivenessResult}
                          </span>
                        : capa.status === 'Effectiveness Pending'
                        ? <span className="text-amber-600 font-medium">Due {capa.effectivenessDue}</span>
                        : <span className="text-gray-500">Pending Closure</span>
                      }
                    </td>
                  
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

  const loadNotificationsFromStorage = () => {
    try {
      const saved = localStorage.getItem('qms_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading notifications:', error);
      return [];
    }
  };

  const [records, setRecords] = useState(loadFromStorage);
  const [notifications, setNotifications] = useState(loadNotificationsFromStorage);
  const [showNotifications, setShowNotifications] = useState(false);


useEffect(() => {
  const stored = localStorage.getItem('qms_records');
  if (!stored || (JSON.parse(stored) && Object.values(JSON.parse(stored)).every(arr => arr?.length === 0))) {
    
    // Define sampleData INSIDE the effect
    const sampleData = {
      complaints: [
        {
          id: 1001,
          title: "Packaging Leakage - Batch XYZ123",
          description: "Customer reported leakage from damaged packaging during transit. Potential contamination risk.",
          severity: "Critical",
          product: "Product ABC - 500mg Tablets",
          status: "In Progress",
          approvalStatus: "In Review",
          createdDate: "2025-12-15",
          createdBy: "Current User",
          attachments: [{ name: "customer_photo.jpg", size: 245760, date: "2025-12-16" }],
          comments: [
            { author: "QA Team", date: "2025-12-16", text: "Investigation initiated. Lab testing requested." }
          ],
          linkedRecords: [{ module: "capa", id: 2001, title: "CAPA-2026-001: Improve Packaging Strength" }],
          approvalChain: [
            { role: "QA Manager", status: "Approved", date: "2025-12-20" },
            { role: "Department Head", status: "Pending", date: null },
            { role: "Quality Director", status: "Pending", date: null }
          ],
          auditTrail: [
            { action: "Record Created", user: "Current User", timestamp: "2025-12-15 10:30", details: "New complaint initiated" },
            { action: "Comment Added", user: "QA Team", timestamp: "2025-12-16 14:20", details: "Comment: Investigation initiated..." }
          ],
          emailsSent: [],
          effectivenessChecked: false
        },
        {
          id: 1002,
          title: "Labeling Error on Batch ABC456",
          description: "Incorrect expiry date printed on labels. Regulatory non-compliance risk.",
          severity: "High",
          product: "Product XYZ - 250mg Capsules",
          status: "Open",
          approvalStatus: "Pending",
          createdDate: "2025-12-28",
          createdBy: "Current User",
          attachments: [],
          comments: [],
          linkedRecords: [],
          approvalChain: [
            { role: "QA Manager", status: "Pending", date: null },
            { role: "Department Head", status: "Pending", date: null },
            { role: "Quality Director", status: "Pending", date: null }
          ],
          auditTrail: [
            { action: "Record Created", user: "Current User", timestamp: "2025-12-28 09:15", details: "New complaint initiated" }
          ],
          emailsSent: []
        }
      ],
      capa: [
        {
          id: 2001,
          title: "CAPA-2026-001: Improve Packaging Strength",
          rootCause: "Insufficient cushioning and weak seal strength identified.",
          correctiveAction: "Update packaging spec: double-layer bubble wrap + reinforced seals.",
          preventiveAction: "Quarterly packaging integrity testing + supplier audit.",
          status: "Effectiveness Pending",
          approvalStatus: "Approved",
          createdDate: "2025-12-18",
          createdBy: "Current User",
          effectivenessDueDate: "2026-01-17",
          effectivenessChecked: false,
          linkedRecords: [{ module: "complaints", id: 1001, title: "Packaging Leakage - Batch XYZ123" }],
          approvalChain: [
            { role: "QA Manager", status: "Approved", date: "2025-12-20" },
            { role: "Department Head", status: "Approved", date: "2025-12-22" },
            { role: "Quality Director", status: "Approved", date: "2025-12-23" }
          ],
          auditTrail: [
            { action: "Record Created", user: "Current User", timestamp: "2025-12-18 11:00", details: "CAPA initiated from Complaint #1001" },
            { action: "Approved", user: "Current User", timestamp: "2025-12-20 15:30", details: "QA Manager approved" }
          ],
          comments: [],
          attachments: [],
          emailsSent: []
        }
      ],
      audits: [
        {
          id: 3001,
          auditTitle: "Annual GMP Audit 2026",
          auditType: "Internal",
          auditDate: "2026-03-15",
          auditor: "Jane Smith",
          status: "Scheduled",
          approvalStatus: "Pending",
          createdDate: "2025-12-10",
          createdBy: "Current User",
          attachments: [],
          comments: [],
          linkedRecords: [],
          approvalChain: [
            { role: "QA Manager", status: "Pending", date: null },
            { role: "Department Head", status: "Pending", date: null },
            { role: "Quality Director", status: "Pending", date: null }
          ],
          auditTrail: [
            { action: "Record Created", user: "Current User", timestamp: "2025-12-10 08:45", details: "Audit scheduled" }
          ],
          emailsSent: []
        }
      ],
      // Add more modules as needed (oot, vendors, risks, recalls)
    };

    setRecords(sampleData);
    localStorage.setItem('qms_records', JSON.stringify(sampleData));
    addNotification('Sample data loaded — explore the full system!', 'success');
  }
}, []); // Empty array → runs only once
// Empty dependency → runs only once on mount
  // Save to localStorage whenever records change
  React.useEffect(() => {
    try {
      localStorage.setItem('qms_records', JSON.stringify(records));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }, [records]);

  // Save notifications to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('qms_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }, [notifications]);

  const modules = [
    { id: 'dashboard', name: 'Dashboard', icon: TrendingUp },
    { id: 'complaints', name: 'Market Complaints', icon: AlertCircle },
    { id: 'capa', name: 'CAPA', icon: CheckCircle },
    { id: 'oot', name: 'OOT', icon: AlertTriangle },
    { id: 'vendors', name: 'Vendor Qualification', icon: Users },
    { id: 'risks', name: 'Quality Risk Management', icon: Shield },
    { id: 'recalls', name: 'Product Recall', icon: AlertCircle },
    { id: 'audits', name: 'Audit Management', icon: FileText },
    { id: 'capa-report', name: 'CAPA Report', icon: FileBarChart },
    { id: 'documentation', name: 'Documentation', icon: BookOpen } // NEW

  ];

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setNotifications(prev => [notification, ...prev].slice(0, 10));
  };
 const linkRecords = (sourceModule, sourceId,  targetModule, targetId,sourceTitle, targetTitle) => {
  setRecords(prev => {
    const updated = { ...prev };

    // Find actual records for fallback titles (safety)
    const sourceRecord = updated[sourceModule]?.find(r => r.id === sourceId);
    const targetRecord = updated[targetModule]?.find(r => r.id === targetId);

    const safeSourceTitle = sourceTitle || getRecordTitle(sourceRecord || {});
    const safeTargetTitle = targetTitle || getRecordTitle(targetRecord || {});

    // Link source → target
    updated[sourceModule] = updated[sourceModule].map(r =>
      r.id === sourceId
        ? { ...r, linkedRecords: [...(r.linkedRecords || []), { module: targetModule, id: targetId, title: safeTargetTitle }] }
        : r
    );

    // Link target → source
    updated[targetModule] = updated[targetModule].map(r =>
      r.id === targetId
        ? { ...r, linkedRecords: [...(r.linkedRecords || []), { module: sourceModule, id: sourceId, title: safeSourceTitle }] }
        : r
    );

    return updated;
  });

  addAuditEntry(sourceModule, sourceId, 'Record Linked', `Linked to ${formatModuleName(targetModule)}: ${targetTitle || 'Linked Record'}`);
  addAuditEntry(targetModule, targetId, 'Record Linked', `Linked from ${formatModuleName(sourceModule)}: ${sourceTitle || 'Linked Record'}`);

  addNotification('Records successfully linked', 'success');
};
  const addRecord = (module, data) => {
    const newRecord = {
      id: Date.now(),
      ...data,
      status: 'Open',
      approvalStatus: 'Pending',
      createdDate: new Date().toLocaleDateString(),
      createdBy: 'Current User',
      attachments: [],
      comments: [],
      approvalChain: [
        { role: 'QA Manager', status: 'Pending', date: null },
        { role: 'Department Head', status: 'Pending', date: null },
        { role: 'Quality Director', status: 'Pending', date: null }
      ],
      auditTrail: [
        {
          id: Date.now(),
          action: 'Record Created',
          user: 'Current User',
          timestamp: new Date().toLocaleString(),
          details: `New ${module} record initiated`
        }
      ],
      emailsSent: [],
      linkedRecords: []  // NEW: Empty array for links
    };
    setRecords(prev => ({
      ...prev,
      [module]: [...prev[module], newRecord]
    }));
    addNotification(`New ${module} record created`, 'success');
    return newRecord
  };

 const updateRecordStatus = (module, id, newStatus) => {
  let oldStatus = '';
  setRecords(prev => ({
    ...prev,
    [module]: prev[module].map(r => {
      if (r.id === id) {
        oldStatus = r.status;

        // Special handling for CAPA closure
        if (module === 'capa' && newStatus === 'Closed' && oldStatus !== 'Closed') {
          const effectivenessDue = new Date();
          effectivenessDue.setDate(effectivenessDue.getDate() + 30); // 30 days default

          return {
            ...r,
            status: 'Effectiveness Pending',
            effectivenessDueDate: effectivenessDue.toLocaleDateString(),
            effectivenessChecked: false
          };
        }

        return { ...r, status: newStatus };
      }
      return r;
    })
  }));


  const statusMessage = module === 'capa' && newStatus === 'Closed' 
    ? 'Closed → Effectiveness Check Scheduled' 
    : `to ${newStatus}`;

  addNotification(`Record status updated ${statusMessage}`, 'info');
  addAuditEntry(module, id, 'Status Changed', `Status changed from ${oldStatus} → ${newStatus}`);
};
  const addAttachment = (module, recordId, file) => {
    setRecords(prev => ({
      ...prev,
      [module]: prev[module].map(r => 
        r.id === recordId 
          ? {...r, attachments: [...r.attachments, {name: file.name, size: file.size, date: new Date().toLocaleDateString()}]}
          : r
      )
    }));
    addNotification(`File attached: ${file.name}`, 'success');
    addAuditEntry(module, recordId, 'Attachment Added', `File: ${file.name} (${(file.size/1024).toFixed(1)} KB)`);
  };

  const sendEmail = (module, recordId, recipient, subject) => {
    const email = {
      to: recipient,
      subject: subject,
      sentDate: new Date().toLocaleString(),
      status: 'Sent'
    };
    setRecords(prev => ({
      ...prev,
      [module]: prev[module].map(r => 
        r.id === recordId 
          ? {...r, emailsSent: [...r.emailsSent, email]}
          : r
      )
    }));
    addNotification(`Email sent to ${recipient}`, 'success');
    addAuditEntry(module, recordId, 'Email Sent', `To: ${recipient}, Subject: ${subject}`);
  };
  const addAuditEntry = (module, recordId, action, details, user = 'Current User') => {
  setRecords(prev => ({
    ...prev,
    [module]: prev[module].map(r =>
      r.id === recordId
        ? {
            ...r,
            auditTrail: [
              ...(r.auditTrail || []),
              {
                id: Date.now(),
                action,
                user,
                timestamp: new Date().toLocaleString(),
                details
              }
            ]
          }
        : r
    )
  }));
};



  const performEffectivenessCheck = (capaId, isEffective, reviewerNote = '', signer = 'Current User') => {
  setRecords(prev => ({
    ...prev,
    capa: prev.capa.map(r =>
      r.id === capaId
        ? {
            ...r,
            status: isEffective ? 'Closed' : 'Open',
            effectivenessChecked: true,
            effectivenessResult: isEffective ? 'Effective' : 'Ineffective',
            effectivenessNote: reviewerNote,
            effectivenessDate: new Date().toLocaleDateString(),
            effectivenessReviewer: signer
          }
        : r
    )
  }));

  const result = isEffective ? 'Effective' : 'Ineffective (CAPA Re-opened)';
  addNotification(`CAPA Effectiveness: ${result}`, isEffective ? 'success' : 'warning');
  addAuditEntry('capa', capaId, 'Effectiveness Check', `${result} - Note: ${reviewerNote || 'None'} (Signed by ${signer})`, signer);
};
  const approveRecord = (module, recordId, approverRole,signer) => {
    setRecords(prev => ({
      ...prev,
      [module]: prev[module].map(r => {
        if (r.id === recordId) {
          const updatedChain = r.approvalChain.map(approval => 
            approval.role === approverRole 
              ? {...approval, status: 'Approved', date: new Date().toLocaleDateString()}
              : approval
          );
          const allApproved = updatedChain.every(a => a.status === 'Approved');
          return {
            ...r,
            approvalChain: updatedChain,
            approvalStatus: allApproved ? 'Approved' : 'In Review'
          };
        }
        return r;
      })
    }));
    addNotification(`Record approved by ${approverRole}`, 'success');
    addAuditEntry(module, recordId, 'Approved', `${approverRole} approved (signed by ${signer})`, signer);
  };

  const rejectRecord = (module, recordId, approverRole, reason,signer) => {
    setRecords(prev => ({
      ...prev,
      [module]: prev[module].map(r => 
        r.id === recordId 
          ? {
              ...r,
              approvalChain: r.approvalChain.map(a => 
                a.role === approverRole 
                  ? {...a, status: 'Rejected', date: new Date().toLocaleDateString(), reason}
                  : a
              ),
              approvalStatus: 'Rejected'
            }
          : r
      )
    }));
    addNotification(`Record rejected by ${approverRole}`, 'warning');
    addAuditEntry(module, recordId, 'Rejected', `${approverRole} rejected: ${reason} (signed by ${signer})`, signer);
  };

  const addComment = (module, recordId, comment) => {
    setRecords(prev => ({
      ...prev,
      [module]: prev[module].map(r => 
        r.id === recordId 
          ? {...r, comments: [...r.comments, {text: comment, author: 'Current User', date: new Date().toLocaleString()}]}
          : r
      )
    }));
    addAuditEntry(module, recordId, 'Comment Added', `Comment: "${comment}"`);
  };
const Dashboard = () => {
  // Stats
  const openComplaints = records.complaints.filter(r => r.status === 'Open').length;
  const activeCAPAs = records.capa.filter(r => r.status !== 'Closed').length;
  const pendingApprovals = Object.values(records).flat().filter(r => 
    r.approvalStatus === 'Pending' || r.approvalStatus === 'In Review'
  ).length;
  const completedRecords = Object.values(records).flat().filter(r => r.status === 'Closed').length;
  const criticalComplaints = records.complaints.filter(r => r.severity === 'Critical').length;
  const overdueAudits = records.audits.filter(r => {
    if (!r.auditDate) return false;
    return new Date(r.auditDate) < new Date() && r.status !== 'Closed';
  }).length;

  // Real data for charts
  const moduleData = [
    { name: 'Complaints', count: records.complaints.length },
    { name: 'CAPA', count: records.capa.length },
    { name: 'OOT', count: records.oot.length },
    { name: 'Vendors', count: records.vendors.length },
    { name: 'Risks', count: records.risks.length },
    { name: 'Recalls', count: records.recalls.length },
    { name: 'Audits', count: records.audits.length }
  ].filter(m => m.count > 0);

  // Simulated monthly trend (you can enhance this later with real dates)
  const monthlyLabels = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec','Jan'];
const getMonth = (dateStr) => {
  if (!dateStr) return null;

  // dateStr = "31/12/2025"
  const [day, month, year] = dateStr.split("/");

  const d = new Date(year, month - 1, day); // SAFE parsing
  return d.toLocaleString("default", { month: "short" });
};

console.log('Records:', records);

const monthlyCounts = monthlyLabels.map(month =>
  Object.values(records).flat().filter(r => getMonth(r.createdDate) === month).length
);
console.log('Monthly Counts:', monthlyCounts);

  // Recent activity
  const recentRecords = Object.values(records).flat()
    .sort((a, b) => new Date(b.createdDate || 0) - new Date(a.createdDate || 0))
    .slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">QMS Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time quality insights and analytics</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">Today</p>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <MetricCard title="Open Complaints" value={openComplaints} trend="+12%" trendUp={true} color="red" icon={AlertCircle} />
        <MetricCard title="Critical Issues" value={criticalComplaints} trend="High Priority" trendUp={true} color="red" icon={AlertTriangle} />
        <MetricCard title="Active CAPAs" value={activeCAPAs} trend="-8%" trendUp={false} color="blue" icon={CheckCircle} />
        <MetricCard title="Pending Approvals" value={pendingApprovals} trend="Action Needed" trendUp={true} color="yellow" icon={UserCheck} />
        <MetricCard title="Completed" value={completedRecords} trend="+15%" trendUp={false} color="green" icon={TrendingUp} />
        <MetricCard title="Overdue Audits" value={overdueAudits} trend="Urgent" trendUp={true} color="purple" icon={Clock} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart: Monthly Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">
            Monthly Record Creation Trend
          </h3><Line
            data={{
              labels: monthlyLabels,
              datasets: [{
                label: 'Records Created',
                data: monthlyCounts,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37,99,235,0.1)',
                tension: 0.4,
                fill: true
              }]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false }
              }
            }}
          />

        </div>

                  {/* Doughnut Chart: Records by Module */}
                {/* Bar Chart: Records by Module */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">
              Records by Module
            </h3>

          <Bar
  key={JSON.stringify(moduleData)}   // ✅ forces clean remount
  data={{
    labels: moduleData.map(m => m.name),
    datasets: [
      {
        label: 'Total Records',
        data: moduleData.map(m => m.count),
        backgroundColor: [
          '#ef4444',
          '#3b82f6',
          '#f59e0b',
          '#10b981',
          '#8b5cf6',
          '#ec4899',
          '#6366f1'
        ],
        borderRadius: 8,
        barThickness: 40
      }
    ]
  }}
  options={{
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  }}
/>

          </div>

      </div>

      {/* Rest of your existing sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity + Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Recent Activity
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentRecords.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent activity</p>
              ) : (
                recentRecords.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <div className={`p-2 rounded-full ${item.status === 'Closed' ? 'bg-green-100 dark:bg-green-900' : 'bg-yellow-100 dark:bg-yellow-900'}`}>
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {item.title || item.testName || item.vendorName || item.productName || item.auditTitle || 'New Record'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatModuleName(Object.keys(records).find(key => records[key].includes(item)) || '')} • {item.createdDate}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-600 dark:to-blue-800 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => setActiveModule('complaints')} className="bg-white/20 hover:bg-white/30 p-4 rounded-lg text-left transition">
                <p className="font-medium">Log New Complaint</p>
                <p className="text-sm opacity-90">Report market feedback</p>
              </button>
              <button onClick={() => setActiveModule('capa')} className="bg-white/20 hover:bg-white/30 p-4 rounded-lg text-left transition">
                <p className="font-medium">Initiate CAPA</p>
                <p className="text-sm opacity-90">Corrective & Preventive Action</p>
              </button>
              <button onClick={() => setActiveModule('audits')} className="bg-white/20 hover:bg-white/30 p-4 rounded-lg text-left transition">
                <p className="font-medium">Schedule Audit</p>
                <p className="text-sm opacity-90">Plan internal/external audit</p>
              </button>
            </div>
          </div>
        </div>

        {/* Approval Queue */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-5 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                My Approval Queue
              </span>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{pendingApprovals} pending</span>
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(records).flatMap(([module, items]) =>
                items.filter(r => r.approvalStatus === 'Pending' || r.approvalStatus === 'In Review')
              ).slice(0, 8).map((item, idx) => {
                const moduleName = Object.keys(records).find(key => records[key].includes(item));
                return (
                  <div key={idx} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          {item.title || item.testName || item.vendorName || item.productName || item.auditTitle}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {formatModuleName(moduleName)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.approvalStatus === 'In Review' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {item.approvalStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
              {pendingApprovals === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-12">No pending approvals 🎉</p>
              )}
            </div>
          </div>
        </div>

        {/* Status Overview + Compliance */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-5">Status Distribution</h3>
            <div className="space-y-6">
              {['complaints', 'capa', 'audits'].map(module => {
                const data = records[module];
                const open = data.filter(r => r.status === 'Open').length;
                const inProgress = data.filter(r => r.status === 'In Progress').length;
                const closed = data.filter(r => r.status === 'Closed').length;
                const total = data.length || 1;
                return (
                  <div key={module}>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {formatModuleName(module)}s
                    </p>
                    <div className="flex h-10 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600">
                      <div style={{width: `${(open/total)*100}%`}} className="bg-yellow-400" />
                      <div style={{width: `${(inProgress/total)*100}%`}} className="bg-blue-400" />
                      <div style={{width: `${(closed/total)*100}%`}} className="bg-green-400" />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span>Open: {open}</span>
                      <span>In Progress: {inProgress}</span>
                      <span>Closed: {closed}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

              <div 
        className={`rounded-xl shadow-lg p-8 text-white text-center transition-all duration-500 ${
          (() => {
            const rate = Math.round((completedRecords / (completedRecords + openComplaints + activeCAPAs + pendingApprovals + overdueAudits || 1)) * 100);
            if (rate >= 90) return 'bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700';
            if (rate >= 70) return 'bg-gradient-to-br from-yellow-500 to-amber-600 dark:from-yellow-600 dark:to-amber-700';
            return 'bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700';
          })()
        }`}
      >
        <h3 className="text-2xl font-bold mb-4">Compliance Score</h3>
        <div className="text-6xl font-bold mb-2">
          {(() => {
            const rate = Math.round((completedRecords / (completedRecords + openComplaints + activeCAPAs + pendingApprovals + overdueAudits || 1)) * 100);
            return rate;
          })()}%
        </div>
        <p className="text-white/90 text-lg">
          {(() => {
            const rate = Math.round((completedRecords / (completedRecords + openComplaints + activeCAPAs + pendingApprovals + overdueAudits || 1)) * 100);
            if (rate >= 90) return 'Excellent performance – Keep it up!';
            if (rate >= 70) return 'Good performance – Room for improvement';
            return 'Needs attention – Review open items urgently';
          })()}
        </p>
</div>
        </div>
      </div>
    </div>
  );
};
const formatModuleName = (moduleKey) => {
  if (typeof moduleKey !== 'string') return 'Record';
  const clean = moduleKey.replace(/s$/, ''); // remove trailing 's'
  const names = {
    complaint: 'Complaint',
    capa: 'CAPA',
    oot: 'OOT',
    vendor: 'Vendor',
    risk: 'Risk',
    recall: 'Recall',
    audit: 'Audit'
  };
  return names[clean] || clean.charAt(0).toUpperCase() + clean.slice(1);
};

// Enhanced Metric Card Component
const MetricCard = ({ title, value, trend, trendUp, color, icon: Icon, bgGradient }) => {
  const colorMap = {
    red: 'text-red-600',
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    purple: 'text-purple-600'
  };

  return (
    <div className={`bg-gradient-to-br ${bgGradient} p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-xl transition-shadow`}>
      <div className="flex items-center justify-between mb-4">
        <Icon className={`w-10 h-10 ${colorMap[color]}`} />
        <span className={`text-sm font-medium ${trendUp ? 'text-red-600' : 'text-green-600'}`}>
          {trend}
        </span>
      </div>
      <p className="text-4xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-600 mt-2">{title}</p>
    </div>
  );
};


  const renderRecordDetails = (record) => {
  const excludeKeys = [
    'approvalChain',
    'attachments',
    'comments',
    'emailsSent',
    'auditTrail',
    'id',
    'createdBy',
    'linkedRecords'
  ];

  return Object.entries(record)
    .filter(([key]) => !excludeKeys.includes(key))
    .map(([key, value]) => {
      if (value === null || value === undefined) return null;

      return (
        <div key={key} className="grid grid-cols-3 gap-4 py-2 border-b last:border-b-0">
          <span className="text-sm font-medium text-gray-600 capitalize">
            {key.replace(/([A-Z])/g, ' $1')}
          </span>

          <span className="col-span-2 text-sm text-gray-800 break-words">
            {typeof value === 'object'
              ? JSON.stringify(value)
              : value.toString()}
          </span>
        </div>
      );
    });
};
const getRecordTitle = (record) => {
  return record.title || 
         record.testName || 
         record.vendorName || 
         record.riskTitle || 
         record.productName || 
         record.auditTitle || 
         `Record #${record.id}`;
};

const RecordDetailModal = ({ record, module, onClose, setShowESignature, setPendingAction }) => {
  console.log('ReRendering RecordDetailModal for record:', record);
  console.log('Module:', module);
  const [comment, setComment] = useState('');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700" 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b px-8 py-5 flex justify-between items-center rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {record.title || record.testName || record.vendorName || record.riskTitle || record.productName || record.auditTitle || 'Record Details'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {record.createdDate} • Created by {record.createdBy}
            </p>
          </div>
         <PDFDownloadLink
  document={<RecordPDFDocument record={record} module={module} />}
  fileName={`${module.toUpperCase()}_Record_${record.id}_${new Date().toISOString().slice(0,10)}.pdf`}
>
  {({ loading }) => (
    <button
      disabled={loading}
      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg shadow flex items-center gap-2 transition"
    >
      <Download className="w-5 h-5" />
      {loading ? 'Generating...' : 'Export PDF'}
    </button>
  )}
</PDFDownloadLink>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-10">


          {/* Record Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">
              Record Details
            </h3>

            <div className="divide-y">
              {renderRecordDetails(record)}
            </div>
          </div>

          
          {/* Quick Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-xl border border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Current Status</p>
              <p className={`text-2xl font-bold ${
                record.status === 'Open' ? 'text-yellow-600' :
                record.status === 'In Progress' ? 'text-blue-600' :
                'text-green-600'
              }`}>{record.status}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-xl border border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Approval Status</p>
              <p className={`text-2xl font-bold ${
                record.approvalStatus === 'Approved' ? 'text-green-600' :
                record.approvalStatus === 'Rejected' ? 'text-red-600' :
                'text-yellow-600'
              }`}>{record.approvalStatus}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-xl border border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Attachments</p>
              <p className="text-2xl font-bold text-blue-600">{record.attachments.length}</p>
            </div>
          </div>
          {/* CAPA Effectiveness Check - Only for CAPA module */}
          {module === 'capa' && (
            <div className={`rounded-xl p-6 border ${record.status === 'Effectiveness Pending' ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className={`w-6 h-6 ${record.status === 'Effectiveness Pending' ? 'text-amber-600' : 'text-green-600'}`} />
                CAPA Effectiveness Check
              </h3>

              {record.effectivenessChecked ? (
                <div className="space-y-3">
                  <p className="font-medium">
                    Result: <span className={`px-3 py-1 rounded-full text-sm ${record.effectivenessResult === 'Effective' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {record.effectivenessResult}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Reviewed on: {record.effectivenessDate} by {record.effectivenessReviewer}
                  </p>
                  {record.effectivenessNote && (
                    <p className="text-sm italic text-gray-700 dark:text-gray-300">
                      Note: {record.effectivenessNote}
                    </p>
                  )}
                </div>
              ) : record.status === 'Effectiveness Pending' ? (
                <div className="space-y-4">
                  <p className="text-amber-800 dark:text-amber-300 font-medium">
                    Effectiveness review due by: <strong>{record.effectivenessDueDate}</strong>
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setPendingAction({
                          type: 'effectiveness',
                          capaId: record.id,
                          isEffective: true
                        });
                        setShowESignature(true);
                      }}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition"
                    >
                      Mark as Effective
                    </button>
                    <button
                      onClick={() => {
                        const note = prompt('Why is this CAPA ineffective? (Required for re-opening)');
                        if (note && note.trim()) {
                          setPendingAction({
                            type: 'effectiveness',
                            capaId: record.id,
                            isEffective: false,
                            note: note.trim()
                          });
                          setShowESignature(true);
                        }
                      }}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow transition"
                    >
                      Mark as Ineffective
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  Effectiveness check will be scheduled upon closure.
                </p>
              )}
            </div>
          )}

          {/* Approval Workflow - Now with E-Signature Required */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 overflow-x-auto">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-10 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Approval Workflow
            </h3>

            <div 
              onClick={(e) => e.stopPropagation()} 
              className="relative min-w-[600px] md:min-w-0 pb-20"
            >
              {/* Background Line */}
              <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 dark:bg-gray-600 rounded-full transform -translate-y-1/2 z-0" />

              {/* Dynamic Progress Fill */}
              <div 
                className="absolute top-1/2 left-0 h-2 bg-green-500 rounded-full transform -translate-y-1/2 z-10 transition-all duration-1000 ease-in-out"
                style={{
                  width: `${(() => {
                    const approvedCount = record.approvalChain.filter(a => a.status === 'Approved').length;
                    const totalSteps = record.approvalChain.length;
                    return totalSteps <= 1 ? 100 : (approvedCount / totalSteps) * 100;
                  })()}%`
                }}
              />

              {/* Steps */}
              <div className="relative flex justify-between z-20">
                {record.approvalChain.map((approval, idx) => {
                  const isApproved = approval.status === 'Approved';
                  const isRejected = approval.status === 'Rejected';
                  const isPending = approval.status === 'Pending';

                  return (
                    <div
                      key={idx}
                      onClick={(e) => e.stopPropagation()}
                      className="flex flex-col items-center text-center"
                    >
                      {/* Circle Node */}
                      <div className={`relative w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-lg transition-all duration-500 ${
                        isApproved ? 'bg-green-100 dark:bg-green-900 border-green-600' :
                        isRejected ? 'bg-red-100 dark:bg-red-900 border-red-600' :
                        'bg-yellow-100 dark:bg-yellow-900 border-yellow-500 animate-pulse'
                      }`}>
                        <UserCheck className={`w-10 h-10 ${
                          isApproved ? 'text-green-600' :
                          isRejected ? 'text-red-600' :
                          'text-yellow-600'
                        }`} />

                        {isApproved && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 bg-green-500 rounded-full opacity-20 animate-ping" />
                          </div>
                        )}
                      </div>

                      {/* Role & Status Label */}
                      <div className="mt-4 min-w-[140px]">
                        <p className="font-bold text-gray-800 dark:text-gray-100">{approval.role}</p>
                        <p className={`text-sm font-semibold mt-1 ${
                          isApproved ? 'text-green-600' :
                          isRejected ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>
                          {approval.status}
                          {approval.date && <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">{approval.date}</span>}
                        </p>
                        {approval.reason && (
                          <p className="text-xs text-red-600 mt-2 px-2 italic">{approval.reason}</p>
                        )}
                      </div>

                      {/* E-Signature Required Action Buttons */}
                      {isPending && (
                        <div className="mt-6 flex gap-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingAction({
                                type: 'approve',
                                module,
                                recordId: record.id,
                                role: approval.role
                              });
                              setShowESignature(true);
                            }}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-md transform hover:-translate-y-0.5 transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const reason = prompt('Enter rejection reason:');
                              if (reason !== null && reason.trim()) {
                                setPendingAction({
                                  type: 'reject',
                                  module,
                                  recordId: record.id,
                                  role: approval.role,
                                  reason: reason.trim()
                                });
                                setShowESignature(true);
                              }
                            }}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-md transform hover:-translate-y-0.5 transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {/* Spacer for alignment */}
                      {!isPending && <div className="mt-6 h-12" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
         {/* Initiate CAPA Button - Only if no CAPA linked yet */}
          {(module === 'complaints' || module === 'oot') && (
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-4">
                Initiate Corrective/Preventive Action
              </h3>

              {/* Check if any linked record is a CAPA */}
              {record.linkedRecords?.some(link => link.module === 'capa') ? (
                <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300">
                  <CheckCircle className="w-6 h-6" />
                  <p className="font-medium">
                    CAPA already initiated and linked
                  </p>
                  {/* Optional: Show linked CAPA titles */}
                  <div className="mt-2 space-y-1">
                    {record.linkedRecords
                      .filter(link => link.module === 'capa')
                      .map((link, idx) => (
                        <p key={idx} className="text-sm">
                          → {link.title || 'CAPA Record'} (ID: {link.id})
                        </p>
                      ))}
                  </div>
                </div>
              ) : (
              <button
                onClick={() => {
                  const sourceTitle = record.title || record.testName || `Record #${record.id}`;
                  setCapaSource({
                    module,
                    recordId: record.id,
                    recordTitle: sourceTitle
                  });
                  setShowInitiateCAPA(true);
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition"
              >
                  Initiate CAPA
                </button>
              )}
            </div>
          )}
          {/* Link to Existing Record Button */}
            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
              <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-300 mb-4">
                Link to Existing Record
              </h3>
              <button
                onClick={() => {
                  const sourceTitle = record.title || record.testName || record.vendorName || `Record #${record.id}`;
                  setLinkSource({
                    module,
                    id: record.id,
                    title: sourceTitle
                  });
                  setShowLinkExisting(true);
                }}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow transition"
              >
                Link to Existing Record
              </button>
            </div>

          {/* Attachments Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Upload className="w-6 h-6 text-blue-600" />
              Attachments ({record.attachments.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {record.attachments.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB • {file.date}</p>
                    </div>
                  </div>
                  <Download className="w-5 h-5 text-gray-600 cursor-pointer hover:text-blue-600" />
                </div>
              ))}
              {/* Upload Area */}
              <label className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                <Upload className="w-6 h-6 text-gray-500" />
                <span className="text-gray-600 font-medium">Upload new file</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files[0]) addAttachment(module, record.id, e.target.files[0]);
                  }}
                />
              </label>
            </div>
          </div>

          {/* Email Notifications */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-600" />
              Email Notifications
            </h3>
            <div className="space-y-4 mb-6">
              {record.emailsSent.map((email, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">To: {email.to}</p>
                  <p className="text-sm text-gray-600">Subject: {email.subject}</p>
                  <p className="text-xs text-gray-500 mt-1">{email.sentDate} • Sent</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Recipient email"
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
              />
              <input
                type="text"
                placeholder="Email subject"
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
              <button
                onClick={() => {
                  if (emailRecipient && emailSubject) {
                    sendEmail(module, record.id, emailRecipient, emailSubject);
                    setEmailRecipient('');
                    setEmailSubject('');
                  }
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Send
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Comments & Collaboration</h3>
            <div className="space-y-4 mb-6">
              {record.comments.map((c, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-gray-800">{c.author}</span>
                    <span className="text-xs text-gray-500">{c.date}</span>
                  </div>
                  <p className="text-gray-700 mt-1">{c.text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && comment.trim()) {
                    addComment(module, record.id, comment);
                    setComment('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (comment.trim()) {
                    addComment(module, record.id, comment);
                    setComment('');
                  }
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Post
              </button>
            </div>
          </div>
          {/* Audit Trail Tab */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              Audit Trail
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {record.auditTrail?.length > 0 ? (
                record.auditTrail.slice().reverse().map(entry => (
                  <div key={entry.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{entry.action}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{entry.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{entry.details}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">By: {entry.user}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No audit history yet</p>
              )}
            </div>
          </div>
          {/* Traceability Matrix - Linked Records */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
              <Link className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Traceability Matrix
            </h3>
            <div className="space-y-3">
              {record.linkedRecords?.length > 0 ? (
                record.linkedRecords.map((link, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {link.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        Linked {link.module} (ID: {link.id})
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        // Optional: Switch to linked module and select record
                        setActiveModule(link.module);
                        // Find and set selectedRecord from linked id
                        const linkedRecord = records[link.module].find(r => r.id === link.id);
                        if (linkedRecord) {
                          console.log('Navigating to linked record:', linkedRecord);
                          //setSelectedRecord(linkedRecord);
                        } else {
                          addNotification('Linked record not found', 'warning');
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition"
                    >
                      View Linked Record
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No linked records yet. Use "Initiate CAPA" to create links.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
     

    </div>
  );
};

const handleLinkExisting = (targetModule, targetId, targetTitle) => {
  linkRecords(linkSource.module, linkSource.id, targetModule, targetId,linkSource.title, targetTitle);
  setShowLinkExisting(false);
  setLinkSource(null);
};
const handleInitiateCAPA = (capaData) => {
  const newCapaRecord = addRecord('capa', capaData);
  
  linkRecords(
    capaSource.module,
    capaSource.recordId,
    'capa',
    newCapaRecord.id,
    capaSource.title || capaSource.testName,
    newCapaRecord.title
  );

  setShowInitiateCAPA(false);
  setCapaSource(null);
};
 const ComplaintsModule = () => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'Low',
    product: ''
  });

  const [selectedRecord, setSelectedRecord] = useState(null);

  const isFormValid = form.title.trim() && form.description.trim();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        Market Complaints
      </h2>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          New Complaint
        </h3>

        <div className="grid grid-cols-2 gap-4">

          {/* Complaint Title */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Complaint Title
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Complaint Description
            </label>
            <textarea
              className="w-full p-2 border rounded h-24"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {/* Product */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={form.product}
              onChange={(e) =>
                setForm({ ...form, product: e.target.value })
              }
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Complaint Severity
            </label>
            <select
              className="w-full p-2 border rounded"
              value={form.severity}
              onChange={(e) =>
                setForm({ ...form, severity: e.target.value })
              }
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Submit */}
          <button
            onClick={() => {
              if (!isFormValid) return;

              addRecord('complaints', {
                ...form,
                status: 'Open',
                approvalStatus: 'Pending'
              });

              setForm({
                title: '',
                description: '',
                severity: 'Low',
                product: ''
              });
            }}
            disabled={!isFormValid}
            className={`col-span-2 p-2 rounded text-white ${
              isFormValid
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Submit Complaint
          </button>

        </div>
      </div>

      <RecordList
        records={records.complaints}
        module="complaints"
        updateStatus={updateRecordStatus}
        onViewDetails={setSelectedRecord}
      />

      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          module="complaints"
          setShowESignature={setShowESignature}
          setPendingAction={setPendingAction}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};


 const CAPAModule = () => {
  const [form, setForm] = useState({
    title: '',
    rootCause: '',
    correctiveAction: '',
    preventiveAction: ''
  });

  const [selectedRecord, setSelectedRecord] = useState(null);

  const isFormValid = form.title.trim();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        CAPA Management
      </h2>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          New CAPA
        </h3>

        <div className="space-y-4">

          {/* CAPA Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CAPA Title
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />
          </div>

          {/* Root Cause */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Root Cause Analysis
            </label>
            <textarea
              className="w-full p-2 border rounded h-20"
              value={form.rootCause}
              onChange={(e) =>
                setForm({ ...form, rootCause: e.target.value })
              }
            />
          </div>

          {/* Corrective Action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Corrective Action
            </label>
            <textarea
              className="w-full p-2 border rounded h-20"
              value={form.correctiveAction}
              onChange={(e) =>
                setForm({ ...form, correctiveAction: e.target.value })
              }
            />
          </div>

          {/* Preventive Action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preventive Action
            </label>
            <textarea
              className="w-full p-2 border rounded h-20"
              value={form.preventiveAction}
              onChange={(e) =>
                setForm({ ...form, preventiveAction: e.target.value })
              }
            />
          </div>

          {/* Create CAPA */}
          <button
            onClick={() => {
              if (!isFormValid) return;

              addRecord('capa', {
                ...form,
                status: 'Open',
                approvalStatus: 'Pending'
              });

              setForm({
                title: '',
                rootCause: '',
                correctiveAction: '',
                preventiveAction: ''
              });
            }}
            disabled={!isFormValid}
            className={`w-full p-2 rounded text-white ${
              isFormValid
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Create CAPA
          </button>

        </div>
      </div>

      <RecordList
        records={records.capa}
        module="capa"
        updateStatus={updateRecordStatus}
        onViewDetails={setSelectedRecord}
      />

      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          module="capa"
          setShowESignature={setShowESignature}
          setPendingAction={setPendingAction}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};

  const OOTModule = () => {
  const [form, setForm] = useState({
    testName: '',
    result: '',
    specification: '',
    investigation: ''
  });

  const [selectedRecord, setSelectedRecord] = useState(null);

  const isFormValid = form.testName.trim();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        Out of Trend (OOT)
      </h2>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          New OOT Investigation
        </h3>

        <div className="grid grid-cols-2 gap-4">

          {/* Test Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Name
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={form.testName}
              onChange={(e) =>
                setForm({ ...form, testName: e.target.value })
              }
            />
          </div>

          {/* Observed Result */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observed Result
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={form.result}
              onChange={(e) =>
                setForm({ ...form, result: e.target.value })
              }
            />
          </div>

          {/* Specification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specification
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={form.specification}
              onChange={(e) =>
                setForm({ ...form, specification: e.target.value })
              }
            />
          </div>

          {/* Investigation */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Investigation Details
            </label>
            <textarea
              className="w-full p-2 border rounded h-24"
              value={form.investigation}
              onChange={(e) =>
                setForm({ ...form, investigation: e.target.value })
              }
            />
          </div>

          {/* Submit OOT */}
          <button
            onClick={() => {
              if (!isFormValid) return;

              addRecord('oot', {
                ...form,
                status: 'Open',
                approvalStatus: 'Pending'
              });

              setForm({
                testName: '',
                result: '',
                specification: '',
                investigation: ''
              });
            }}
            disabled={!isFormValid}
            className={`col-span-2 p-2 rounded text-white ${
              isFormValid
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Submit OOT
          </button>

        </div>
      </div>

      <RecordList
        records={records.oot}
        module="oot"
        updateStatus={updateRecordStatus}
        onViewDetails={setSelectedRecord}
      />

      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          module="oot"
          setShowESignature={setShowESignature}
          setPendingAction={setPendingAction}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};


const VendorModule = () => {
  const [form, setForm] = useState({
    vendorName: '',
    category: '',
    qualificationStatus: 'Pending',
    auditDate: ''
  });

  const [selectedRecord, setSelectedRecord] = useState(null);

  const isFormValid = form.vendorName.trim();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        Vendor Qualification
      </h2>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          New Vendor
        </h3>

        <div className="grid grid-cols-2 gap-4">

          {/* Vendor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Name
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={form.vendorName}
              onChange={(e) =>
                setForm({ ...form, vendorName: e.target.value })
              }
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Category
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
            />
          </div>

          {/* Qualification Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Qualification Status
            </label>
            <select
              className="w-full p-2 border rounded"
              value={form.qualificationStatus}
              onChange={(e) =>
                setForm({ ...form, qualificationStatus: e.target.value })
              }
            >
              <option value="Pending">Pending</option>
              <option value="Qualified">Qualified</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Audit Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Audit Date
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={form.auditDate}
              onChange={(e) =>
                setForm({ ...form, auditDate: e.target.value })
              }
            />
          </div>

          <button
            onClick={() => {
              if (!isFormValid) return;

              addRecord('vendors', {
                ...form,
                status: 'Active',
                approvalStatus: 'Pending'
              });

              setForm({
                vendorName: '',
                category: '',
                qualificationStatus: 'Pending',
                auditDate: ''
              });
            }}
            disabled={!isFormValid}
            className={`col-span-2 p-2 rounded text-white ${
              isFormValid
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Add Vendor
          </button>

        </div>
      </div>

      <RecordList
        records={records.vendors}
        module="vendors"
        updateStatus={updateRecordStatus}
        onViewDetails={setSelectedRecord}
      />

      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          module="vendors"
          setShowESignature={setShowESignature}
          setPendingAction={setPendingAction}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};

 const RiskModule = () => {
  const [form, setForm] = useState({
    riskTitle: '',
    probability: 'Low',
    severity: 'Low',
    mitigation: ''
  });

  const [selectedRecord, setSelectedRecord] = useState(null);

  const riskScoreMap = {
    Low: 1,
    Medium: 2,
    High: 3
  };

  const riskScore =
    riskScoreMap[form.probability] *
    riskScoreMap[form.severity];

  const getRiskLevel = (score) => {
    if (score <= 2) return 'Low';
    if (score <= 4) return 'Medium';
    return 'High';
  };

  const isFormValid =
    form.riskTitle.trim() &&
    form.mitigation.trim();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        Quality Risk Management
      </h2>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          New Risk Assessment
        </h3>

        <div className="space-y-4">

          {/* Risk Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risk Title
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={form.riskTitle}
              onChange={(e) =>
                setForm({ ...form, riskTitle: e.target.value })
              }
            />
          </div>

          {/* Probability & Severity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Probability of Occurrence
              </label>
              <select
                className="w-full p-2 border rounded"
                value={form.probability}
                onChange={(e) =>
                  setForm({ ...form, probability: e.target.value })
                }
              >
                <option value="Low">Low (Rare)</option>
                <option value="Medium">Medium (Occasional)</option>
                <option value="High">High (Frequent)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Impact Severity
              </label>
              <select
                className="w-full p-2 border rounded"
                value={form.severity}
                onChange={(e) =>
                  setForm({ ...form, severity: e.target.value })
                }
              >
                <option value="Low">Low (Minor)</option>
                <option value="Medium">Medium (Major)</option>
                <option value="High">High (Critical)</option>
              </select>
            </div>
          </div>

          {/* Mitigation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mitigation Strategy
            </label>
            <textarea
              className="w-full p-2 border rounded h-24"
              value={form.mitigation}
              onChange={(e) =>
                setForm({ ...form, mitigation: e.target.value })
              }
            />
          </div>

          {/* Risk Score */}
          <div className="text-sm text-gray-600">
            Risk Score (RPN): <strong>{riskScore}</strong>
            <span className="ml-3">
              Risk Level: <strong>{getRiskLevel(riskScore)}</strong>
            </span>
          </div>

          {/* Submit */}
          <button
            onClick={() => {
              if (!isFormValid) return;

              addRecord('risks', {
                ...form,
                riskScore,
                riskLevel: getRiskLevel(riskScore),
                status: 'Open',
                approvalStatus: 'Pending'
              });

              setForm({
                riskTitle: '',
                probability: 'Low',
                severity: 'Low',
                mitigation: ''
              });
            }}
            disabled={!isFormValid}
            className={`w-full p-2 rounded text-white ${
              isFormValid
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Add Risk Assessment
          </button>

        </div>
      </div>

      <RecordList
        records={records.risks}
        module="risks"
        updateStatus={updateRecordStatus}
        onViewDetails={setSelectedRecord}
      />

      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          module="risks"
          setShowESignature={setShowESignature}
          setPendingAction={setPendingAction}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};

 const RecallModule = () => {
  const [form, setForm] = useState({
    productName: '',
    batchNumber: '',
    reason: '',
    recallClass: 'Class III'
  });

  const [selectedRecord, setSelectedRecord] = useState(null);

  const isFormValid = form.productName.trim();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        Product Recall
      </h2>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Initiate Recall
        </h3>

        <div className="grid grid-cols-2 gap-4">

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={form.productName}
              onChange={(e) =>
                setForm({ ...form, productName: e.target.value })
              }
            />
          </div>

          {/* Batch Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Batch / Lot Number
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={form.batchNumber}
              onChange={(e) =>
                setForm({ ...form, batchNumber: e.target.value })
              }
            />
          </div>

          {/* Recall Class */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recall Classification
            </label>
            <select
              className="w-full p-2 border rounded"
              value={form.recallClass}
              onChange={(e) =>
                setForm({ ...form, recallClass: e.target.value })
              }
            >
              <option value="Class I">Class I</option>
              <option value="Class II">Class II</option>
              <option value="Class III">Class III</option>
            </select>
          </div>

          {/* Reason */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recall Reason
            </label>
            <textarea
              className="w-full p-2 border rounded h-24"
              value={form.reason}
              onChange={(e) =>
                setForm({ ...form, reason: e.target.value })
              }
            />
          </div>

          <button
            onClick={() => {
              if (!isFormValid) return;

              addRecord('recalls', {
                ...form,
                status: 'Initiated',
                approvalStatus: 'Pending'
              });

              setForm({
                productName: '',
                batchNumber: '',
                reason: '',
                recallClass: 'Class III'
              });
            }}
            disabled={!isFormValid}
            className={`col-span-2 p-2 rounded text-white ${
              isFormValid
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Initiate Recall
          </button>

        </div>
      </div>

      <RecordList
        records={records.recalls}
        module="recalls"
        updateStatus={updateRecordStatus}
        onViewDetails={setSelectedRecord}
      />

      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          module="recalls"
          setShowESignature={setShowESignature}
          setPendingAction={setPendingAction}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};


 const AuditModule = () => {
  const [form, setForm] = useState({
    auditTitle: '',
    auditType: 'Internal',
    auditDate: '',
    auditor: ''
  });

  const [selectedRecord, setSelectedRecord] = useState(null);

  const isFormValid = form.auditTitle.trim();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        Audit Management
      </h2>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Schedule Audit
        </h3>

        <div className="grid grid-cols-2 gap-4">

          {/* Audit Title */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audit Title
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={form.auditTitle}
              onChange={(e) =>
                setForm({ ...form, auditTitle: e.target.value })
              }
            />
          </div>

          {/* Audit Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audit Type
            </label>
            <select
              className="w-full p-2 border rounded"
              value={form.auditType}
              onChange={(e) =>
                setForm({ ...form, auditType: e.target.value })
              }
            >
              <option value="Internal">Internal</option>
              <option value="External">External</option>
              <option value="Supplier">Supplier</option>
              <option value="Regulatory">Regulatory</option>
            </select>
          </div>

          {/* Audit Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audit Date
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={form.auditDate}
              onChange={(e) =>
                setForm({ ...form, auditDate: e.target.value })
              }
            />
          </div>

          {/* Auditor */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Auditor Name
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={form.auditor}
              onChange={(e) =>
                setForm({ ...form, auditor: e.target.value })
              }
            />
          </div>

          <button
            onClick={() => {
              if (!isFormValid) return;

              addRecord('audits', {
                ...form,
                status: 'Scheduled',
                approvalStatus: 'Pending'
              });

              setForm({
                auditTitle: '',
                auditType: 'Internal',
                auditDate: '',
                auditor: ''
              });
            }}
            disabled={!isFormValid}
            className={`col-span-2 p-2 rounded text-white ${
              isFormValid
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Schedule Audit
          </button>

        </div>
      </div>

      <RecordList
        records={records.audits}
        module="audits"
        updateStatus={updateRecordStatus}
        onViewDetails={setSelectedRecord}
      />

      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          module="audits"
          setShowESignature={setShowESignature}
          setPendingAction={setPendingAction}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};

  const RecordList = ({ records, module, updateStatus, onViewDetails }) => (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Records ({records.length})</h3>
      <div className="space-y-3">
        {records.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No records yet</p>
        ) : (
          records.map(record => (
            <div key={record.id} className="border p-4 rounded hover:bg-gray-50 cursor-pointer" onClick={() => onViewDetails(record)}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-800">
                  {record.title || record.testName || record.vendorName || record.riskTitle || record.productName || record.auditTitle}
                </h4>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded text-xs font-medium ${
                    record.approvalStatus === 'Approved' ? 'bg-green-100 text-green-800' :
                    record.approvalStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>{record.approvalStatus}</span>
                  <select
                    value={record.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateStatus(module, record.id, e.target.value);
                    }}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      record.status === 'Open' ? 'bg-yellow-100 text-yellow-800' :
                      record.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Closed</option>
                  </select>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {record.description || record.investigation || record.reason || record.mitigation||record.rootCause||record.category||record.auditor||'No description'}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Created: {record.createdDate}</span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {record.attachments.length} files
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {record.emailsSent.length} emails
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
const handleESignatureConfirm = (signatureData) => {
  if (!pendingAction) return;

  const signer = signatureData.username;

  if (pendingAction.type === 'approve') {
    approveRecord(pendingAction.module, pendingAction.recordId, pendingAction.role, signer);
  } else if (pendingAction.type === 'reject') {
    rejectRecord(pendingAction.module, pendingAction.recordId, pendingAction.role, pendingAction.reason || '', signer);
  } else if (pendingAction.type === 'effectiveness') {
    performEffectivenessCheck(
      pendingAction.capaId,
      pendingAction.isEffective,
      pendingAction.note || '',
      signer
    );
  }

  addNotification(`${pendingAction.type === 'effectiveness' ? 'Effectiveness check' : 'Action'} completed with e-signature`, 'success');

  setShowESignature(false);
  setPendingAction(null);
};
const InitiateCAPAModal = ({ source, onConfirm, onCancel }) => {
  const [form, setForm] = useState({
    title: source ? `CAPA for ${source.module.toUpperCase()}: ${source.recordTitle}` : '',
    rootCause: '',
    correctiveAction: '',
    preventiveAction: ''
  });

  const handleSubmit = () => {
    if (!form.title.trim()) {
      alert('CAPA Title is required');
      return;
    }
    onConfirm(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Initiate CAPA
          </h3>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CAPA Title
            </label>
            <input
              type="text"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Root Cause Analysis
            </label>
            <textarea
              className="w-full p-3 border rounded-lg h-32 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              value={form.rootCause}
              onChange={(e) => setForm({ ...form, rootCause: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Corrective Action
            </label>
            <textarea
              className="w-full p-3 border rounded-lg h-32 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              value={form.correctiveAction}
              onChange={(e) => setForm({ ...form, correctiveAction: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preventive Action
            </label>
            <textarea
              className="w-full p-3 border rounded-lg h-32 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              value={form.preventiveAction}
              onChange={(e) => setForm({ ...form, preventiveAction: e.target.value })}
            />
          </div>
        </div>

        <div className="border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Create & Link CAPA
          </button>
        </div>
      </div>
    </div>
  );
};
const LinkExistingModal = ({ sourceModule, sourceId, sourceTitle, onConfirm, onCancel }) => {
  const [selectedModule, setSelectedModule] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null); // For confirmation step

  const targetModules = modules
    .map(m => m.id)
    .filter(m => m !== sourceModule && m !== 'dashboard');

  const filteredRecords = selectedModule 
    ? records[selectedModule]?.filter(r => 
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.testName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(r.id).includes(searchTerm)
      ) || []
    : [];

  const handleSelect = (record) => {
    setSelectedRecord({
      module: selectedModule,
      id: record.id,
      title: getRecordTitle(record)
    });
  };

  const handleConfirmLink = () => {
    if (!selectedRecord) return;
      onConfirm(selectedRecord.module, selectedRecord.id, selectedRecord.title);
    
  };

  const handleBack = () => {
    setSelectedRecord(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {selectedRecord ? 'Confirm Link' : 'Link to Existing Record'}
          </h3>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-gray-600 dark:text-gray-400">
            Linking <strong>{sourceTitle || 'this record'}</strong> ({sourceModule})
          </p>

          {!selectedRecord ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Module
                </label>
                <select
                  className="w-full p-3 border rounded-lg dark:bg-gray-700"
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                >
                  <option value="">Choose module...</option>
                  {targetModules.map(mod => (
                    <option key={mod} value={mod}>
                      {formatModuleName(mod)}s
                    </option>
                  ))}
                </select>
              </div>

              {selectedModule && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search Records
                    </label>
                    <input
                      type="text"
                      placeholder="Search by title or ID..."
                      className="w-full p-3 border rounded-lg dark:bg-gray-700"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    {filteredRecords.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No records found</p>
                    ) : (
                      <div className="divide-y">
                        {filteredRecords.map(record => (
                          <button
                            key={record.id}
                            onClick={() => handleSelect(record)}
                            className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                          >
                            <p className="font-medium text-gray-800 dark:text-gray-100">
                              {record.title || record.testName || record.vendorName || record.riskTitle || record.productName || record.auditTitle || 'Unititled Record'}

                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {record.id} • Status: {record.status} • Created: {record.createdDate}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            /* Confirmation Step */
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">
                  You are linking:
                </h4>
                <div className="space-y-2">
                  <p><strong>From:</strong> {sourceTitle} ({sourceModule.toUpperCase()})</p>
                  <p><strong>To:</strong> {selectedRecord.title} ({selectedRecord.module.toUpperCase()} ID: {selectedRecord.id})</p>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-4">
                  This creates a permanent bidirectional link visible in both records and audit trail.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleBack}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmLink}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  Confirm & Link
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
const Documentation = () => {
  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Atachi QMS  Documentation
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Quick guide to features, processes, and compliance
        </p>
       
      </div>

      {/* Introduction Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl shadow-2xl p-10 text-white">
        <h2 className="text-3xl font-bold mb-6">Welcome to ATACHI QMS</h2>
        <p className="text-lg leading-relaxed">
          A modern, fully digital Quality Management System designed for regulated industries 
          (pharmaceuticals, medical devices, biotech). Supports end-to-end quality processes 
          with full traceability, electronic signatures, and audit-ready reporting.
        </p>
      </div>

      {/* Core Features */}
      <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-10">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8 flex items-center gap-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
          Core Features
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-3">
                Closed-Loop CAPA Management
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Initiate from Complaints/OOT</li>
                <li>• Root cause & corrective/preventive actions</li>
                <li>• Multi-level e-signature approval</li>
                <li>• Automatic 30-day effectiveness check</li>
                <li>• Re-open if ineffective</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
                Bidirectional Traceability
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Auto-link on CAPA initiation</li>
                <li>• Manual linking to existing records</li>
                <li>• Traceability Matrix with navigation</li>
                <li>• Full deviation-to-resolution visibility</li>
              </ul>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-purple-600 dark:text-purple-400 mb-3">
                Compliance & Security
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• 21 CFR Part 11 electronic signatures</li>
                <li>• Complete audit trail</li>
                <li>• PDF exports with confidentiality footer</li>
                <li>• Dark mode support</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-3">
                Reporting & Export
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Individual record PDF export</li>
                <li>• CAPA Report with filters & CSV</li>
                <li>• Professional audit-ready formatting</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Module Overview Table */}
      <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-10 overflow-x-auto">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
          Module Overview
        </h2>
        <table className="w-full min-w-max">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">Module</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">Purpose</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">Key Fields</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">Status Flow</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            <tr>
              <td className="px-6 py-4 font-medium">Market Complaints</td>
              <td className="px-6 py-4">Customer/product feedback</td>
              <td className="px-6 py-4">Title, Description, Severity, Product</td>
              <td className="px-6 py-4">Open → In Progress → Closed</td>
            </tr>
            <tr>
              <td className="px-6 py-4 font-medium">CAPA</td>
              <td className="px-6 py-4">Corrective & Preventive Actions</td>
              <td className="px-6 py-4">Title, Root Cause, Actions</td>
              <td className="px-6 py-4">Open → Closed → Effectiveness → Closed</td>
            </tr>
            <tr>
              <td className="px-6 py-4 font-medium">OOT</td>
              <td className="px-6 py-4">Lab/test deviations</td>
              <td className="px-6 py-4">Test Name, Result, Specification</td>
              <td className="px-6 py-4">Open → In Progress → Closed</td>
            </tr>
            <tr>
              <td className="px-6 py-4 font-medium">Audit Management</td>
              <td className="px-6 py-4">Internal/external audits</td>
              <td className="px-6 py-4">Title, Type, Date, Auditor</td>
              <td className="px-6 py-4">Scheduled → In Progress → Closed</td>
            </tr>
            {/* Add other modules as needed */}
          </tbody>
        </table>
      </section>

      {/* Process Flow */}
      <section className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl shadow-2xl p-10 text-white">
        <h2 className="text-3xl font-bold mb-8">Typical Process Flow</h2>
        <ol className="space-y-6 text-lg">
          <li>1. Log a Market Complaint or OOT</li>
          <li>2. Initiate CAPA → auto-linked</li>
          <li>3. Complete root cause & actions</li>
          <li>4. Multi-level approval (e-signatures)</li>
          <li>5. Close CAPA → 30-day effectiveness check scheduled</li>
          <li>6. Reviewer confirms effectiveness</li>
          <li>7. Export full report for audit</li>
        </ol>
      </section>

      {/* Footer */}
      <div className="text-center py-12 border-t-2 border-gray-300 dark:border-gray-700">
        <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
          CONFIDENTIAL - FOR INTERNAL USE ONLY
        </p>
        <p className="text-gray-600 dark:text-gray-400 mt-4">
          © 2026 QMS Pro. All rights reserved.
        </p>
      </div>
    </div>
  );
};
  const renderModule = () => {
    switch(activeModule) {
      case 'dashboard': return <Dashboard />;
      case 'complaints': return <ComplaintsModule />;
      case 'capa': return <CAPAModule />;
      case 'oot': return <OOTModule />;
      case 'vendors': return <VendorModule />;
      case 'risks': return <RiskModule />;
      case 'recalls': return <RecallModule />;
      case 'audits': return <AuditModule />;
      case 'capa-report': return <CAPAReport />;
      case 'documentation': return <Documentation />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-gray-900 text-white p-4">
     
        <div className="flex items-center gap-0 mb-10">
    <img 
      src="https://atachisystems.com/atachi_logo.png" 
      alt="Company Logo" 
      className="w-21 h-20 rounded-xl shadow-lg"
    />
          <b><h1 className="text-2xl font-bold"> QMS</h1></b>
  </div>
        <nav className="space-y-2">
          {modules.map(module => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`w-full flex items-center gap-3 p-3 rounded transition ${
                  activeModule === module.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{module.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-xl font-semibold text-gray-800">Quality Management System</h1>
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 rounded"
            >
              <Bell className="w-6 h-6 text-gray-600" />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <div className="p-2">
                  {notifications.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No notifications</p>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className={`p-3 mb-2 rounded ${
                        notif.type === 'success' ? 'bg-green-50' :
                        notif.type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
                      }`}>
                        <p className="text-sm">{notif.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notif.timestamp}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="p-8">
          {renderModule()}
        </div>
      </div>
      {/* Initiate CAPA Modal */}
{showInitiateCAPA && capaSource && (
  <InitiateCAPAModal
    source={capaSource}
    onConfirm={handleInitiateCAPA}
    onCancel={() => {
      setShowInitiateCAPA(false);
      setCapaSource(null);
    }}
  />
)}
{showESignature && pendingAction && (
  <ESignatureModal
    action={
      pendingAction.type === 'approve' ? 'Approve' :
      pendingAction.type === 'reject' ? 'Reject' :
      pendingAction.type === 'effectiveness' 
        ? (pendingAction.isEffective ? 'Mark as Effective' : 'Mark as Ineffective')
        : 'Confirm Action'
    }
    onConfirm={handleESignatureConfirm}
    onCancel={() => {
      setShowESignature(false);
      setPendingAction(null);
    }}
  />
)}
{/* Link to Existing Record Modal */}
{showLinkExisting && linkSource && (
  <LinkExistingModal
    sourceModule={linkSource.module}
    sourceId={linkSource.id}
    sourceTitle={linkSource.title}
    onConfirm={handleLinkExisting}
    onCancel={() => {
      setShowLinkExisting(false);
      setLinkSource(null);
    }}
  />
)}
    </div>
  );

};

export default QMSApp;