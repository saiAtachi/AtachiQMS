import React, { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';

const ESignatureModal = ({ 
  action,           // 'Approve' or 'Reject'
  onConfirm,
  onCancel
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [meaning, setMeaning] = useState('');

  const handleConfirm = () => {
    if (!username || !password || !meaning) {
      alert('All fields are required for e-signature');
      return;
    }

    // 🔐 Fake authentication (for now)
    if (password !== 'admin123') {
      alert('Invalid credentials');
      return;
    }

    onConfirm({
      username,
      meaning,
      timestamp: new Date().toLocaleString()
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Electronic Signature
          </h3>
          <button onClick={onCancel}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Please authenticate to <strong>{action}</strong> this record.
          </p>

          <input
            type="text"
            placeholder="Username"
            className="w-full p-2 border rounded"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 border rounded"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <textarea
            placeholder="Meaning of Signature (required)"
            className="w-full p-2 border rounded h-20"
            value={meaning}
            onChange={e => setMeaning(e.target.value)}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-white rounded ${
              action === 'Approve' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            Confirm {action}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ESignatureModal;
