import React from 'react';
import { Shield } from 'lucide-react';

const Sidebar = ({ modules, activeModule, setActiveModule }) => {
  return (
    <div className="w-64 bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-10 flex items-center gap-3">
        <Shield className="w-8 h-8" />
        QMS Pro
      </h1>
      <nav className="space-y-1">
        {modules.map(module => {
          const Icon = module.icon;
          return (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition font-medium ${
                activeModule === module.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{module.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;