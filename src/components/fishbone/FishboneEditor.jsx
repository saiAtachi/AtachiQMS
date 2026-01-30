/**
 * FishboneEditor Component
 * Interactive editor for fishbone causes
 */

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

const FishboneEditor = ({ fishbone, onChange }) => {
  const [newCause, setNewCause] = useState({});

  if (!fishbone || !fishbone.categories) {
    return <div className="text-gray-500 p-4">No fishbone data available</div>;
  }

  // Check if fishbone is locked
  if (fishbone.locked) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="font-bold text-blue-800">Fishbone Analysis Locked</span>
        </div>
        <p className="text-sm text-blue-700">
          This fishbone diagram has been finalized and locked. Editing is disabled to maintain data integrity.
          Contact Quality Assurance to unlock if changes are required.
        </p>
      </div>
    );
  }

  const handleAddCause = (categoryId, categoryName) => {
    const causeText = newCause[categoryId];
    if (!causeText || !causeText.trim()) return;

    // Create new cause object
    const newCauseObj = {
      id: `cause-${Date.now()}`,
      text: causeText.trim(),
      description: "",
      severity: "medium",
      order: fishbone.categories.find(c => c.id === categoryId)?.causes?.length || 0,
      subCauses: []
    };

    // Update fishbone data
    const updated = {
      ...fishbone,
      categories: fishbone.categories.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            causes: [...(cat.causes || []), newCauseObj]
          };
        }
        return cat;
      })
    };

    onChange(updated);

    // Clear input
    setNewCause(prev => ({ ...prev, [categoryId]: '' }));
  };

  const handleRemoveCause = (categoryId, causeId) => {
    const updated = {
      ...fishbone,
      categories: fishbone.categories.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            causes: cat.causes.filter(cause => cause.id !== causeId)
          };
        }
        return cat;
      })
    };

    onChange(updated);
  };

  const handleKeyPress = (e, categoryId) => {
    if (e.key === 'Enter') {
      handleAddCause(categoryId);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" onClick={(e) => e.stopPropagation()}>
      {fishbone.categories.map(category => (
        <div
          key={category.id}
          className="border rounded-lg p-4 bg-white shadow-sm"
        >
          <h4
            className="font-bold text-lg mb-3 pb-2 border-b"
            style={{ color: category.color }}
          >
            {category.name}
          </h4>

          {/* Add cause input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder={`Add cause for ${category.name}`}
              className="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newCause[category.id] || ''}
              onChange={(e) => setNewCause(prev => ({ ...prev, [category.id]: e.target.value }))}
              onKeyPress={(e) => handleKeyPress(e, category.id)}
            />
            <button
              onClick={() => handleAddCause(category.id, category.name)}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
              title="Add cause"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* List of causes */}
          {(!category.causes || category.causes.length === 0) ? (
            <p className="text-sm text-gray-500 italic">No causes added</p>
          ) : (
            <ul className="space-y-2">
              {category.causes.map((cause) => (
                <li
                  key={cause.id}
                  className="flex items-start justify-between gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors group"
                >
                  <span className="flex-1 text-sm text-gray-800">{cause.text}</span>
                  <button
                    onClick={() => handleRemoveCause(category.id, cause.id)}
                    className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove cause"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Cause count */}
          {category.causes && category.causes.length > 0 && (
            <div className="mt-3 pt-3 border-t text-xs text-gray-500">
              {category.causes.length} cause{category.causes.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FishboneEditor;
