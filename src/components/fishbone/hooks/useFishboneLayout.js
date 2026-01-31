/**
 * useFishboneLayout Hook
 * React hook wrapper for the layout engine
 */

import { useMemo } from 'react';
import { calculateFishboneLayout } from '../utils/layoutEngine';
import { resolveAllCollisions } from '../utils/collisionDetection';

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

    // Apply collision detection and resolution
    if (layout.categories && layout.categories.length > 0) {
      layout.categories = resolveAllCollisions(layout.categories);

      // Recalculate SVG height to accommodate any shifted causes
      let minY = Infinity;
      let maxY = -Infinity;

      layout.categories.forEach(cat => {
        cat.causes.forEach(causeLayout => {
          const top = causeLayout.bounds.y;
          const bottom = causeLayout.bounds.y + causeLayout.bounds.height;
          if (top < minY) minY = top;
          if (bottom > maxY) maxY = bottom;

          // Also check subcauses
          if (causeLayout.subCauses) {
            causeLayout.subCauses.forEach(sub => {
              const subTop = sub.bounds.y;
              const subBottom = sub.bounds.y + sub.bounds.height;
              if (subTop < minY) minY = subTop;
              if (subBottom > maxY) maxY = subBottom;
            });
          }
        });
      });

      // Expand SVG height if causes extend beyond current bounds
      const padding = 60;
      if (minY < padding) {
        const shift = padding - minY;
        // Shift everything down to fit
        layout.spine.start.y += shift;
        layout.spine.end.y += shift;
        if (layout.problem) layout.problem.y += shift;
        layout.categories.forEach(cat => {
          cat.boneStart.y += shift;
          cat.boneEnd.y += shift;
          cat.labelPos.y += shift;
          cat.causes.forEach(c => {
            c.branchStart.y += shift;
            c.branchEnd.y += shift;
            c.textPos.y += shift;
            c.bounds.y += shift;
            if (c.subCauses) {
              c.subCauses.forEach(sub => {
                sub.branchStart.y += shift;
                sub.branchEnd.y += shift;
                sub.textPos.y += shift;
                sub.bounds.y += shift;
              });
            }
          });
        });
        maxY += shift;
      }

      const requiredHeight = maxY + padding;
      if (requiredHeight > layout.svgHeight) {
        layout.svgHeight = requiredHeight;
      }
    }

    return layout;
  }, [fishboneData, options]);
}

export default useFishboneLayout;
