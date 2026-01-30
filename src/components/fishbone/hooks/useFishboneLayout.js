/**
 * useFishboneLayout Hook
 * React hook wrapper for the layout engine
 */

import { useMemo } from 'react';
import { calculateFishboneLayout } from '../utils/layoutEngine';

/**
 * Hook to calculate fishbone layout with memoization
 * @param {Object} fishboneData - Fishbone data structure
 * @param {Object} options - Layout configuration options
 * @returns {Object|null} Complete layout with all coordinates
 */
export function useFishboneLayout(fishboneData, options = {}) {
  return useMemo(() => {
    if (!fishboneData || !fishboneData.categories) {
      return null;
    }

    // Calculate layout
    const layout = calculateFishboneLayout(fishboneData, options);

    return layout;
  }, [fishboneData, options]);
}

export default useFishboneLayout;
