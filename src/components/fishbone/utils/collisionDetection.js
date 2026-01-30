/**
 * Collision Detection Utilities
 * Prevents overlapping of causes in the fishbone diagram
 */

/**
 * Check if two bounding boxes overlap
 * @param {Object} box1 - First bounding box { x, y, width, height }
 * @param {Object} box2 - Second bounding box { x, y, width, height }
 * @returns {boolean} True if boxes overlap
 */
export function checkCollision(box1, box2) {
  if (!box1 || !box2) return false;

  return !(
    box1.x + box1.width < box2.x ||
    box2.x + box2.width < box1.x ||
    box1.y + box1.height < box2.y ||
    box2.y + box2.height < box1.y
  );
}

/**
 * Calculate distance between two points
 * @param {Object} p1 - First point { x, y }
 * @param {Object} p2 - Second point { x, y }
 * @returns {number} Distance in pixels
 */
export function calculateDistance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Adjust layout to prevent overlaps within a category
 * @param {Array} causeLayouts - Array of cause layout objects
 * @param {boolean} isTop - Whether category is on top
 * @param {number} minSpacing - Minimum spacing to maintain
 * @returns {Array} Adjusted layout objects
 */
export function resolveCollisions(causeLayouts, isTop, minSpacing = 10) {
  if (!causeLayouts || causeLayouts.length === 0) return causeLayouts;

  const adjusted = [...causeLayouts];
  const direction = isTop ? -1 : 1;

  // Check each pair of consecutive causes
  for (let i = 0; i < adjusted.length - 1; i++) {
    const current = adjusted[i];
    const next = adjusted[i + 1];

    if (!current.bounds || !next.bounds) continue;

    // Check for collision
    if (checkCollision(current.bounds, next.bounds)) {
      // Calculate overlap amount
      const overlapY = isTop
        ? current.bounds.y - (next.bounds.y + next.bounds.height)
        : (current.bounds.y + current.bounds.height) - next.bounds.y;

      // Shift next cause to resolve collision
      const shiftAmount = Math.abs(overlapY) + minSpacing;

      // Update next cause position
      next.textPos.y += shiftAmount * direction;
      next.branchEnd.y += shiftAmount * direction;
      next.branchStart.y += shiftAmount * direction;
      next.bounds.y += shiftAmount * direction;

      // Recursively check if this shift causes collision with subsequent causes
      for (let j = i + 1; j < adjusted.length - 1; j++) {
        const curr = adjusted[j];
        const following = adjusted[j + 1];

        if (checkCollision(curr.bounds, following.bounds)) {
          const shift = Math.abs(
            isTop
              ? curr.bounds.y - (following.bounds.y + following.bounds.height)
              : (curr.bounds.y + curr.bounds.height) - following.bounds.y
          ) + minSpacing;

          following.textPos.y += shift * direction;
          following.branchEnd.y += shift * direction;
          following.branchStart.y += shift * direction;
          following.bounds.y += shift * direction;
        }
      }
    }
  }

  return adjusted;
}

/**
 * Check if any causes in a category layout have overlaps
 * @param {Object} categoryLayout - Category layout object
 * @returns {boolean} True if overlaps detected
 */
export function hasOverlaps(categoryLayout) {
  if (!categoryLayout || !categoryLayout.causes || categoryLayout.causes.length < 2) {
    return false;
  }

  for (let i = 0; i < categoryLayout.causes.length - 1; i++) {
    for (let j = i + 1; j < categoryLayout.causes.length; j++) {
      if (checkCollision(categoryLayout.causes[i].bounds, categoryLayout.causes[j].bounds)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Apply collision resolution to all categories in a layout
 * @param {Array} categoryLayouts - Array of category layout objects
 * @returns {Array} Adjusted category layouts
 */
export function resolveAllCollisions(categoryLayouts) {
  return categoryLayouts.map(catLayout => ({
    ...catLayout,
    causes: resolveCollisions(catLayout.causes, catLayout.isTop)
  }));
}

export default {
  checkCollision,
  calculateDistance,
  resolveCollisions,
  hasOverlaps,
  resolveAllCollisions
};
