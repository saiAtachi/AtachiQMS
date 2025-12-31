import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Clock, FileText, Users, TrendingUp, AlertTriangle, Shield, Upload, Mail, UserCheck, X, Download, Bell, Link } from 'lucide-react';
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
import { Line, Doughnut } from 'react-chartjs-2';
import { Bar } from 'react-chartjs-2';
import ESignatureModal from './EsignModal'; 



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




const QMSApp = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [showESignature, setShowESignature] = useState(false);
const [pendingAction, setPendingAction] = useState(null); // { type: 'approve' | 'reject', module, recordId, role, reason? }
const [showInitiateCAPA, setShowInitiateCAPA] = useState(false);
const [capaSource, setCapaSource] = useState(null); // { module, recordId, recordTitle }
  
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
    { id: 'audits', name: 'Audit Management', icon: FileText }
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
    const linkRecords = (sourceModule, sourceId, targetModule, targetId, sourceTitle,targetTitle) => {
      console.log(`Linking records: ${sourceModule}(${sourceId}) ↔ ${targetModule}(${targetId})`);
      setRecords(prev => {
        const updated = { ...prev };

        // Link source → target
        updated[sourceModule] = updated[sourceModule].map(r =>
          r.id === sourceId
            ? { ...r, linkedRecords: [...(r.linkedRecords || []), { module: targetModule, id: targetId, title: targetTitle }] }
            : r
        );

        // Link target → source (bidirectional)
        updated[targetModule] = updated[targetModule].map(r =>
          r.id === targetId
            ? { ...r, linkedRecords: [...(r.linkedRecords || []), { module: sourceModule, id: sourceId, title: sourceTitle }] }
            : r
        );

        return updated;
      });

      // Log to audit trail on both records
      addAuditEntry(sourceModule, sourceId, 'Linked Record', `Linked to ${targetModule}: ${targetTitle}`);
      addAuditEntry(targetModule, targetId, 'Linked Record', `Linked from ${sourceModule}: ${sourceTitle}`);

      addNotification(`Records linked: ${sourceModule} ↔ ${targetModule}`, 'info');
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
    setRecords(prev => ({
      ...prev,
      [module]: prev[module].map(r => r.id === id ? {...r, status: newStatus} : r)
    }));
    addNotification(`Record status updated to ${newStatus}`, 'info');
    addAuditEntry(module, id, 'Status Changed', `Status changed to  → ${newStatus}`);
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
  const monthlyLabels = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-xl shadow-lg p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Compliance Score</h3>
            <div className="text-6xl font-bold mb-2">
              {Math.round((completedRecords / (completedRecords + pendingApprovals + openComplaints || 1)) * 100)}%
            </div>
            <p className="text-white/90">Excellent performance</p>
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

  const StatCard = ({ title, value, color }) => {
    const colors = {
      red: 'bg-red-50 text-red-600',
      blue: 'bg-blue-50 text-blue-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      green: 'bg-green-50 text-green-600'
    };
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <p className={`text-3xl font-bold mt-2 ${colors[color]}`}>{value}</p>
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
const handleInitiateCAPA = (capaData) => {
  const newCapaRecord = addRecord('capa', capaData);
  
  linkRecords(
    capaSource.module,
    capaSource.recordId,
    'capa',
    newCapaRecord.id,
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

  const { type, module, recordId, role, reason } = pendingAction;
  const signer = signatureData.username;

  if (type === 'approve') {
    approveRecord(module, recordId, role,signer);
    addNotification(`Record approved by ${role} (Signed by: ${signatureData.username})`, 'success');
  } else if (type === 'reject') {
    rejectRecord(module, recordId, role, reason || 'No reason provided',signer);
    addNotification(`Record rejected by ${role} (Signed by: ${signatureData.username})`, 'warning');
  }

  // Optional: You can store signature info later in the record if needed
  console.log('E-Signature recorded:', { ...signatureData, action: type, role });

  // Close modal and reset
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
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-gray-900 text-white p-4">
        <h1 className="text-xl font-bold mb-8 flex items-center gap-2">
          <Shield className="w-6 h-6" />
          QMS System
        </h1>
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
    action={pendingAction.type === 'approve' ? 'Approve' : 'Reject'}
    onConfirm={handleESignatureConfirm}
    onCancel={() => {
      setShowESignature(false);
      setPendingAction(null);
    }}
  />
)}
    </div>
  );

};

export default QMSApp;