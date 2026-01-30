/**
 * Fishbone Data Migration Utilities
 * Handles backward compatibility for old fishbone data structures
 */

export const FISHBONE_VERSION = "2.0";

const DEFAULT_COLORS = [
  '#3b82f6', // Blue - Man
  '#10b981', // Green - Machine
  '#f59e0b', // Amber - Method
  '#8b5cf6', // Purple - Material
  '#ec4899', // Pink - Measurement
  '#14b8a6'  // Teal - Environment
];

const DEFAULT_CATEGORIES = [
  'Man',
  'Machine',
  'Method',
  'Material',
  'Measurement',
  'Environment'
];

/**
 * Create an empty fishbone structure with version 2.0
 * @param {string} problemStatement - Optional problem statement
 * @returns {Object} Empty fishbone structure
 */
export function createEmptyFishbone(problemStatement = "") {
  return {
    version: FISHBONE_VERSION,
    problemStatement,
    categories: DEFAULT_CATEGORIES.map((name, index) => ({
      id: `cat-${index + 1}`,
      name,
      color: DEFAULT_COLORS[index],
      order: index,
      causes: []
    }))
  };
}

/**
 * Migrate old fishbone data structure to new hierarchical format
 * @param {Object} oldData - Old fishbone data (flat or nested)
 * @returns {Object} Migrated fishbone data in version 2.0 format
 */
export function migrateFishboneData(oldData) {
  // If no data, return empty fishbone
  if (!oldData || Object.keys(oldData).length === 0) {
    return createEmptyFishbone();
  }

  // If already version 2.0, return as-is
  if (oldData.version === FISHBONE_VERSION) {
    return oldData;
  }

  // Detect old structure type
  const isOldFlat = typeof oldData.Man !== 'undefined';  // Direct properties like { Man: [], Machine: [] }
  const isOldNested = oldData.categories && typeof oldData.categories.Man !== 'undefined';  // { categories: { Man: [], Machine: [] } }

  // If neither format detected, return empty fishbone
  if (!isOldFlat && !isOldNested) {
    console.warn('Unknown fishbone data format, creating empty fishbone');
    return createEmptyFishbone(oldData.problemStatement || "");
  }

  // Get the categories object from either format
  const oldCategories = isOldFlat ? oldData : oldData.categories;

  // Migrate to new structure
  return {
    version: FISHBONE_VERSION,
    problemStatement: oldData.problemStatement || "",
    categories: DEFAULT_CATEGORIES.map((name, index) => ({
      id: `cat-${index + 1}`,
      name,
      color: DEFAULT_COLORS[index],
      order: index,
      causes: (oldCategories[name] || []).map((causeText, causeIndex) => {
        // Old format was just strings, convert to new cause object
        if (typeof causeText === 'string') {
          return {
            id: `cause-${Date.now()}-${causeIndex}`,
            text: causeText,
            description: "",
            severity: "medium",  // Default severity
            order: causeIndex,
            subCauses: []
          };
        }
        // If somehow already an object, preserve it but ensure it has all fields
        return {
          id: causeText.id || `cause-${Date.now()}-${causeIndex}`,
          text: causeText.text || causeText,
          description: causeText.description || "",
          severity: causeText.severity || "medium",
          order: causeText.order !== undefined ? causeText.order : causeIndex,
          subCauses: causeText.subCauses || []
        };
      })
    }))
  };
}

/**
 * Validate fishbone data structure
 * @param {Object} data - Fishbone data to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateFishbone(data) {
  const errors = [];

  // Check version
  if (!data || !data.version) {
    errors.push("Missing version field");
  }

  // Check categories array
  if (!data.categories || !Array.isArray(data.categories)) {
    errors.push("Missing or invalid categories array");
    return { isValid: false, errors };
  }

  // Validate each category
  data.categories.forEach((cat, i) => {
    if (!cat.id) errors.push(`Category ${i} missing id`);
    if (!cat.name) errors.push(`Category ${i} missing name`);
    if (!Array.isArray(cat.causes)) errors.push(`Category ${cat.name || i} missing or invalid causes array`);

    // Validate each cause
    if (Array.isArray(cat.causes)) {
      cat.causes.forEach((cause, j) => {
        if (!cause.id) errors.push(`Cause ${j} in ${cat.name} missing id`);
        if (!cause.text) errors.push(`Cause ${j} in ${cat.name} missing text`);
        if (!Array.isArray(cause.subCauses)) errors.push(`Cause ${j} in ${cat.name} missing subCauses array`);
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Safely get fishbone data with migration
 * Use this when reading fishbone data from records
 * @param {Object} fishboneData - Raw fishbone data from record
 * @returns {Object} Migrated and validated fishbone data
 */
export function getFishboneData(fishboneData) {
  const migrated = migrateFishboneData(fishboneData);
  const validation = validateFishbone(migrated);

  if (!validation.isValid) {
    console.error('Fishbone validation errors:', validation.errors);
    // Return empty fishbone if validation fails
    return createEmptyFishbone();
  }

  return migrated;
}
