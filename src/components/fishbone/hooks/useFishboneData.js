/**
 * useFishboneData Hook
 * Manages fishbone data structure with CRUD operations
 */

import { useState, useCallback, useEffect } from 'react';
import { migrateFishboneData, createEmptyFishbone, validateFishbone } from '../utils/migration';

/**
 * Hook for managing fishbone data with automatic migration
 * @param {Object} initialFishbone - Initial fishbone data (may be old format)
 * @param {Function} onChange - Callback when data changes
 * @returns {Object} - Fishbone data and helper functions
 */
export function useFishboneData(initialFishbone, onChange) {
  // Migrate initial data on mount
  const [fishbone, setFishbone] = useState(() => {
    return migrateFishboneData(initialFishbone);
  });

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange(fishbone);
    }
  }, [fishbone, onChange]);

  /**
   * Add a new cause to a category
   */
  const addCause = useCallback((categoryId, causeText, severity = 'medium') => {
    if (!causeText || !causeText.trim()) return;

    setFishbone(prev => ({
      ...prev,
      categories: prev.categories.map(cat => {
        if (cat.id === categoryId) {
          const newCause = {
            id: `cause-${Date.now()}`,
            text: causeText.trim(),
            description: "",
            severity,
            order: cat.causes.length,
            subCauses: []
          };
          return {
            ...cat,
            causes: [...cat.causes, newCause]
          };
        }
        return cat;
      })
    }));
  }, []);

  /**
   * Update an existing cause
   */
  const updateCause = useCallback((categoryId, causeId, updates) => {
    setFishbone(prev => ({
      ...prev,
      categories: prev.categories.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            causes: cat.causes.map(cause => {
              if (cause.id === causeId) {
                return { ...cause, ...updates };
              }
              return cause;
            })
          };
        }
        return cat;
      })
    }));
  }, []);

  /**
   * Remove a cause from a category
   */
  const removeCause = useCallback((categoryId, causeId) => {
    setFishbone(prev => ({
      ...prev,
      categories: prev.categories.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            causes: cat.causes.filter(cause => cause.id !== causeId)
          };
        }
        return cat;
      })
    }));
  }, []);

  /**
   * Add a subcause to an existing cause
   */
  const addSubCause = useCallback((categoryId, parentCauseId, subcauseText, severity = 'medium') => {
    if (!subcauseText || !subcauseText.trim()) return;

    const addSubCauseRecursive = (causes) => {
      return causes.map(cause => {
        if (cause.id === parentCauseId) {
          const newSubCause = {
            id: `subcause-${Date.now()}`,
            text: subcauseText.trim(),
            description: "",
            severity,
            order: cause.subCauses.length,
            subCauses: []
          };
          return {
            ...cause,
            subCauses: [...cause.subCauses, newSubCause]
          };
        }
        // Check in nested subcauses
        if (cause.subCauses && cause.subCauses.length > 0) {
          return {
            ...cause,
            subCauses: addSubCauseRecursive(cause.subCauses)
          };
        }
        return cause;
      });
    };

    setFishbone(prev => ({
      ...prev,
      categories: prev.categories.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            causes: addSubCauseRecursive(cat.causes)
          };
        }
        return cat;
      })
    }));
  }, []);

  /**
   * Update a subcause
   */
  const updateSubCause = useCallback((categoryId, subcauseId, updates) => {
    const updateSubCauseRecursive = (causes) => {
      return causes.map(cause => {
        // Check direct subcauses
        if (cause.subCauses && cause.subCauses.length > 0) {
          const updatedSubCauses = cause.subCauses.map(sub => {
            if (sub.id === subcauseId) {
              return { ...sub, ...updates };
            }
            // Recursively check nested subcauses
            if (sub.subCauses && sub.subCauses.length > 0) {
              return {
                ...sub,
                subCauses: updateSubCauseRecursive([sub]).flatMap(c => c.subCauses)
              };
            }
            return sub;
          });
          return { ...cause, subCauses: updatedSubCauses };
        }
        return cause;
      });
    };

    setFishbone(prev => ({
      ...prev,
      categories: prev.categories.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            causes: updateSubCauseRecursive(cat.causes)
          };
        }
        return cat;
      })
    }));
  }, []);

  /**
   * Remove a subcause
   */
  const removeSubCause = useCallback((categoryId, subcauseId) => {
    const removeSubCauseRecursive = (causes) => {
      return causes.map(cause => {
        if (cause.subCauses && cause.subCauses.length > 0) {
          return {
            ...cause,
            subCauses: cause.subCauses
              .filter(sub => sub.id !== subcauseId)
              .map(sub => removeSubCauseRecursive([sub])[0])
          };
        }
        return cause;
      });
    };

    setFishbone(prev => ({
      ...prev,
      categories: prev.categories.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            causes: removeSubCauseRecursive(cat.causes)
          };
        }
        return cat;
      })
    }));
  }, []);

  /**
   * Reorder causes within a category
   */
  const reorderCauses = useCallback((categoryId, sourceIndex, destinationIndex) => {
    setFishbone(prev => ({
      ...prev,
      categories: prev.categories.map(cat => {
        if (cat.id === categoryId) {
          const newCauses = Array.from(cat.causes);
          const [removed] = newCauses.splice(sourceIndex, 1);
          newCauses.splice(destinationIndex, 0, removed);

          // Update order property
          return {
            ...cat,
            causes: newCauses.map((cause, index) => ({
              ...cause,
              order: index
            }))
          };
        }
        return cat;
      })
    }));
  }, []);

  /**
   * Move cause to different category
   */
  const moveCause = useCallback((sourceCategoryId, causeId, targetCategoryId) => {
    setFishbone(prev => {
      let movedCause = null;

      // First pass: remove from source
      const updated = {
        ...prev,
        categories: prev.categories.map(cat => {
          if (cat.id === sourceCategoryId) {
            const cause = cat.causes.find(c => c.id === causeId);
            if (cause) movedCause = cause;

            return {
              ...cat,
              causes: cat.causes.filter(c => c.id !== causeId)
            };
          }
          return cat;
        })
      };

      // Second pass: add to target
      if (movedCause) {
        updated.categories = updated.categories.map(cat => {
          if (cat.id === targetCategoryId) {
            return {
              ...cat,
              causes: [...cat.causes, { ...movedCause, order: cat.causes.length }]
            };
          }
          return cat;
        });
      }

      return updated;
    });
  }, []);

  /**
   * Update problem statement
   */
  const updateProblemStatement = useCallback((newStatement) => {
    setFishbone(prev => ({
      ...prev,
      problemStatement: newStatement
    }));
  }, []);

  /**
   * Get category by ID
   */
  const getCategory = useCallback((categoryId) => {
    return fishbone.categories.find(cat => cat.id === categoryId);
  }, [fishbone]);

  /**
   * Get total cause count (including subcauses)
   */
  const getTotalCauseCount = useCallback(() => {
    const countCausesRecursive = (causes) => {
      return causes.reduce((count, cause) => {
        return count + 1 + (cause.subCauses ? countCausesRecursive(cause.subCauses) : 0);
      }, 0);
    };

    return fishbone.categories.reduce((total, cat) => {
      return total + countCausesRecursive(cat.causes);
    }, 0);
  }, [fishbone]);

  /**
   * Reset fishbone to empty state
   */
  const reset = useCallback((problemStatement = "") => {
    setFishbone(createEmptyFishbone(problemStatement));
  }, []);

  /**
   * Validate current fishbone data
   */
  const validate = useCallback(() => {
    return validateFishbone(fishbone);
  }, [fishbone]);

  return {
    fishbone,
    setFishbone,
    addCause,
    updateCause,
    removeCause,
    addSubCause,
    updateSubCause,
    removeSubCause,
    reorderCauses,
    moveCause,
    updateProblemStatement,
    getCategory,
    getTotalCauseCount,
    reset,
    validate
  };
}

export default useFishboneData;
