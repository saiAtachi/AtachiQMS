/**
 * Collision Detection Utilities
 * Prevents overlapping of causes in the fishbone diagram
 */

// Padding added around each bounding box for comfortable spacing
const COLLISION_PADDING = 8;

/**
 * Expand a bounding box by padding on all sides
 * @param {Object} box - Bounding box { x, y, width, height }
 * @param {number} pad - Padding in pixels
 * @returns {Object} Expanded bounding box
 */
function padBox(box, pad = COLLISION_PADDING) {
  return {
    x: box.x - pad,
    y: box.y - pad,
    width: box.width + pad * 2,
    height: box.height + pad * 2
  };
}

/**
 * Check if two bounding boxes overlap (with padding)
 * @param {Object} box1 - First bounding box { x, y, width, height }
 * @param {Object} box2 - Second bounding box { x, y, width, height }
 * @returns {boolean} True if boxes overlap
 */
export function checkCollision(box1, box2) {
  if (!box1 || !box2) return false;

  const a = padBox(box1);
  const b = padBox(box2);

  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
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
 * Shift a cause layout (and its subcauses) by a vertical amount
 * @param {Object} causeLayout - Cause layout object
 * @param {number} shiftY - Vertical shift in pixels
 */
function shiftCause(causeLayout, shiftY) {
  causeLayout.textPos.y += shiftY;
  causeLayout.branchEnd.y += shiftY;
  causeLayout.branchStart.y += shiftY;
  causeLayout.bounds.y += shiftY;

  // Also shift subcauses
  if (causeLayout.subCauses && causeLayout.subCauses.length > 0) {
    causeLayout.subCauses.forEach(sub => {
      sub.textPos.y += shiftY;
      sub.branchEnd.y += shiftY;
      sub.branchStart.y += shiftY;
      sub.bounds.y += shiftY;
    });
  }
}

/**
 * Adjust layout to prevent overlaps within a category
 * Uses multiple passes to ensure all collisions are resolved
 * @param {Array} causeLayouts - Array of cause layout objects
 * @param {boolean} isTop - Whether category is on top
 * @param {number} minSpacing - Minimum spacing to maintain
 * @returns {Array} Adjusted layout objects
 */
export function resolveCollisions(causeLayouts, isTop, minSpacing = 15) {
  if (!causeLayouts || causeLayouts.length < 2) return causeLayouts;

  const adjusted = causeLayouts.map(c => ({ ...c }));
  const direction = isTop ? -1 : 1;
  const maxPasses = 5;

  for (let pass = 0; pass < maxPasses; pass++) {
    let hadCollision = false;

    for (let i = 0; i < adjusted.length - 1; i++) {
      const current = adjusted[i];
      const next = adjusted[i + 1];

      if (!current.bounds || !next.bounds) continue;

      if (checkCollision(current.bounds, next.bounds)) {
        hadCollision = true;

        // Calculate required shift based on direction
        let overlapAmount;
        if (isTop) {
          // Top causes: next should be further up (lower y)
          overlapAmount = (next.bounds.y + next.bounds.height) - current.bounds.y;
        } else {
          // Bottom causes: next should be further down (higher y)
          overlapAmount = (current.bounds.y + current.bounds.height) - next.bounds.y;
        }

        const shiftAmount = (Math.abs(overlapAmount) + minSpacing) * direction;

        // Shift this cause and all subsequent causes
        for (let j = i + 1; j < adjusted.length; j++) {
          shiftCause(adjusted[j], shiftAmount);
        }
      }
    }

    // Stop early if no collisions were found
    if (!hadCollision) break;
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
 * Resolve cross-category collisions (causes from different categories that overlap)
 * @param {Array} categoryLayouts - Array of category layout objects
 * @returns {Array} Adjusted category layouts
 */
function resolveCrossCategoryCollisions(categoryLayouts) {
  // Collect all cause bounds grouped by side (top / bottom)
  const topCategories = categoryLayouts.filter(c => c.isTop);
  const bottomCategories = categoryLayouts.filter(c => !c.isTop);

  [topCategories, bottomCategories].forEach(sideCategories => {
    for (let ci = 0; ci < sideCategories.length; ci++) {
      for (let cj = ci + 1; cj < sideCategories.length; cj++) {
        const catA = sideCategories[ci];
        const catB = sideCategories[cj];
        const isTop = catA.isTop;
        const direction = isTop ? -1 : 1;

        catA.causes.forEach(causeA => {
          catB.causes.forEach(causeB => {
            if (!causeA.bounds || !causeB.bounds) return;

            if (checkCollision(causeA.bounds, causeB.bounds)) {
              // Shift the cause that is closer to the spine further away
              let overlapAmount;
              if (isTop) {
                overlapAmount = (causeB.bounds.y + causeB.bounds.height) - causeA.bounds.y;
              } else {
                overlapAmount = (causeA.bounds.y + causeA.bounds.height) - causeB.bounds.y;
              }

              const shiftAmount = (Math.abs(overlapAmount) + 12) * direction;
              shiftCause(causeB, shiftAmount);
            }
          });
        });
      }
    }
  });

  return categoryLayouts;
}

/**
 * Apply collision resolution to all categories in a layout
 * Resolves within-category collisions first, then cross-category
 * @param {Array} categoryLayouts - Array of category layout objects
 * @returns {Array} Adjusted category layouts
 */
export function resolveAllCollisions(categoryLayouts) {
  // Phase 1: Resolve within each category
  let resolved = categoryLayouts.map(catLayout => ({
    ...catLayout,
    causes: resolveCollisions(catLayout.causes, catLayout.isTop)
  }));

  // Phase 2: Resolve cross-category collisions
  resolved = resolveCrossCategoryCollisions(resolved);

  return resolved;
}

const collisionDetection = {
  checkCollision,
  calculateDistance,
  resolveCollisions,
  hasOverlaps,
  resolveAllCollisions
};

export default collisionDetection;
