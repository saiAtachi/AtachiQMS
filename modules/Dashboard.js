 const Dashboard = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">QMS Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Open Complaints" value={records.complaints.filter(r => r.status === 'Open').length} color="red" />
        <StatCard title="Active CAPAs" value={records.capa.filter(r => r.status === 'Open').length} color="blue" />
        <StatCard title="Pending Approvals" value={Object.values(records).flat().filter(r => r.approvalStatus === 'Pending' || r.approvalStatus === 'In Review').length} color="yellow" />
        <StatCard title="Critical Risks" value={records.risks.filter(r => getRiskLevel(r.probability, r.severity).level === 'High').length} color="red" />
        {/* Closed Records */}
  <StatCard 
    title="Closed Records" 
    value={Object.values(records).flat().filter(r => r.status === 'Closed').length} 
    color="green" 
  />      
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[...records.complaints, ...records.capa, ...records.recalls, ...records.oot].slice(-6).reverse().map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition">
                <div>
                  <p className="text-sm font-medium">{getRecordTitle(item)}</p>
                  <p className="text-xs text-gray-500">{activeModule ? modules.find(m => m.id === Object.keys(records).find(k => records[k].includes(item)))?.name : ''}</p>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-medium ${
                  item.status === 'Open' ? 'bg-yellow-100 text-yellow-800' :
                  item.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Approval Queue</h3>
          <div className="space-y-3">
            {Object.values(records).flat()
              .filter(r => r.approvalStatus === 'Pending' || r.approvalStatus === 'In Review')
              .slice(0, 6)
              .map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition">
                  <div>
                    <p className="text-sm font-medium">{getRecordTitle(item)}</p>
                    <p className="text-xs text-gray-500">{item.approvalStatus}</p>
                  </div>
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
