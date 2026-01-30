/**
 * Fishbone Layout Engine
 * Calculates positions for all elements in the fishbone diagram
 */

/**
 * Calculate arrow head points for the spine
 * @param {number} endX - X coordinate of arrow tip
 * @param {number} endY - Y coordinate of arrow tip
 * @param {number} size - Size of arrow head
 * @returns {string} Points string for polygon
 */
function calculateArrowHead(endX, endY, size) {
  return `${endX},${endY} ${endX - size},${endY - size/2} ${endX - size},${endY + size/2}`;
}

/**
 * Wrap text into multiple lines based on max width
 * @param {string} text - Text to wrap
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} fontSize - Font size in pixels
 * @returns {string[]} Array of text lines
 */
export function wrapText(text, maxWidth, fontSize) {
  if (!text) return [''];

  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  // Approximate character width (better than nothing)
  const charWidth = fontSize * 0.6;
  const maxChars = Math.floor(maxWidth / charWidth);

  words.forEach(word => {
    if ((currentLine + word).length <= maxChars) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
}

/**
 * Count all causes including nested subcauses recursively
 * @param {Array} causes - Array of cause objects
 * @returns {number} Total count
 */
export function countAllCauses(causes) {
  if (!causes || causes.length === 0) return 0;

  return causes.reduce((count, cause) => {
    return count + 1 + (cause.subCauses ? countAllCauses(cause.subCauses) : 0);
  }, 0);
}

/**
 * Layout subcauses recursively with proper hierarchy
 * @param {Array} subCauses - Array of subcause objects
 * @param {number} parentX - Parent cause X position
 * @param {number} parentY - Parent cause Y position
 * @param {boolean} isTop - Whether category is on top of spine
 * @param {number} spacing - Vertical spacing between subcauses
 * @param {number} maxWidth - Maximum text width
 * @param {number} level - Nesting level (for indentation)
 * @returns {Array} Layout objects for subcauses
 */
function layoutSubCauses(subCauses, parentX, parentY, isTop, spacing, maxWidth, level = 1) {
  const indent = 60; // Horizontal indent per level
  const layouts = [];
  let currentY = parentY;
  const direction = isTop ? -1 : 1;

  subCauses.forEach((subCause, index) => {
    const subY = currentY + (spacing * direction * (index === 0 ? 1 : 1.2));
    const subEndX = parentX + indent;

    // Wrap text for subcause
    const fontSize = Math.max(10, 12 - level); // Smaller font for deeper nesting
    const wrappedLines = wrapText(subCause.text, maxWidth * 0.8, fontSize);
    const textHeight = wrappedLines.length * (fontSize + 4);

    const subLayout = {
      subCause,
      level,
      branchStart: { x: parentX + 10, y: subY },
      branchEnd: { x: subEndX, y: subY },
      textLines: wrappedLines,
      textPos: { x: subEndX + 5, y: subY - textHeight / 2 },
      fontSize,
      bounds: {
        x: subEndX + 5,
        y: subY - textHeight / 2,
        width: maxWidth * 0.8,
        height: textHeight
      }
    };

    // Recursively layout nested subcauses
    if (subCause.subCauses && subCause.subCauses.length > 0) {
      subLayout.subCauses = layoutSubCauses(
        subCause.subCauses,
        subEndX,
        subY,
        isTop,
        spacing * 0.8,
        maxWidth,
        level + 1
      );

      // Adjust next Y position to account for nested subcauses
      const nestedHeight = subLayout.subCauses.length * spacing * 0.8;
      currentY = subY + (nestedHeight * direction);
    } else {
      currentY = subY;
    }

    layouts.push(subLayout);
  });

  return layouts;
}

/**
 * Layout causes along a category bone with collision detection
 * @param {Array} causes - Array of cause objects
 * @param {number} startX - Starting X position on category bone
 * @param {number} startY - Starting Y position on category bone
 * @param {boolean} isTop - Whether category is on top of spine
 * @param {number} spacing - Minimum vertical spacing
 * @param {number} maxWidth - Maximum text width before wrapping
 * @param {boolean} includeSubcauses - Whether to layout subcauses
 * @returns {Array} Layout objects for causes
 */
function layoutCauses(causes, startX, startY, isTop, spacing, maxWidth, includeSubcauses) {
  const layouts = [];
  let currentY = startY;
  const direction = isTop ? -1 : 1;
  const branchLength = 150; // Length of cause branch (increased from 100)
  const minGap = 30; // Minimum gap between cause texts (increased from 25)

  causes.forEach((cause, index) => {
    // For first cause, add initial offset
    if (index === 0) {
      currentY = currentY + (spacing * 2 * direction); // Increased from 1.5
    }

    const causeY = currentY;
    const causeEndX = startX + branchLength;

    // Wrap text if needed
    const wrappedLines = wrapText(cause.text, maxWidth, 14);
    const textHeight = wrappedLines.length * 18;

    const causeLayout = {
      cause,
      branchStart: { x: startX + 10, y: causeY },
      branchEnd: { x: causeEndX, y: causeY },
      textLines: wrappedLines,
      textPos: { x: causeEndX + 10, y: causeY - textHeight / 2 },
      bounds: {
        x: causeEndX + 10,
        y: causeY - textHeight / 2,
        width: maxWidth,
        height: textHeight
      },
      subCauses: []
    };

    // Layout subcauses if present and enabled
    if (includeSubcauses && cause.subCauses && cause.subCauses.length > 0) {
      causeLayout.subCauses = layoutSubCauses(
        cause.subCauses,
        causeEndX,
        causeY,
        isTop,
        spacing * 0.7, // Smaller spacing for subcauses
        maxWidth * 0.9,
        1
      );

      // Adjust spacing for next cause to account for subcauses
      const subCauseCount = countAllCauses(cause.subCauses);
      const subCauseHeight = subCauseCount * spacing * 0.7;
      currentY = causeY + ((textHeight / 2 + minGap + subCauseHeight) * direction);
    } else {
      // Move to next position based on text height + minimum gap
      currentY = causeY + ((textHeight / 2 + minGap + spacing) * direction);
    }

    layouts.push(causeLayout);
  });

  return layouts;
}

/**
 * Calculate complete fishbone diagram layout
 * @param {Object} fishboneData - Fishbone data structure
 * @param {Object} options - Layout configuration options
 * @returns {Object} Complete layout with all coordinates
 */
export function calculateFishboneLayout(fishboneData, options = {}) {
  const {
    minWidth = 900,
    minHeight = 400,
    padding = 60,
    spineRatio = 0.65,       // Spine takes 65% of width
    branchAngle = 40,        // Degrees for category bones
    minCauseSpacing = 50,    // Min px between causes (increased from 35)
    maxCauseWidth = 200,     // Max text width before wrapping
    includeSubcauses = true
  } = options;

  // Handle empty or invalid data
  if (!fishboneData || !fishboneData.categories || fishboneData.categories.length === 0) {
    return {
      svgWidth: minWidth,
      svgHeight: minHeight,
      spine: {
        start: { x: padding, y: minHeight / 2 },
        end: { x: minWidth * spineRatio, y: minHeight / 2 },
        arrowHead: calculateArrowHead(minWidth * spineRatio, minHeight / 2, 20)
      },
      categories: [],
      metadata: {
        totalCauses: 0,
        maxCausesPerCategory: 0
      }
    };
  }

  // Step 1: Calculate cause counts for each category (including subcauses)
  const categoryCounts = fishboneData.categories.map(cat =>
    includeSubcauses
      ? countAllCauses(cat.causes)
      : cat.causes.length
  );

  // Step 2: Determine required height based on max causes
  const maxCauses = Math.max(...categoryCounts, 4);
  const requiredHeight = Math.max(
    minHeight,
    maxCauses * minCauseSpacing * 3.5 + padding * 2  // Increased multiplier for better spacing
  );

  // Step 3: Calculate SVG dimensions
  const svgWidth = Math.max(minWidth, maxCauseWidth * 5);
  const svgHeight = requiredHeight;

  // Step 4: Spine coordinates (horizontal arrow through center)
  const spineY = svgHeight / 2;
  const spineStartX = padding;
  const spineEndX = svgWidth * spineRatio;
  const arrowHeadPoints = calculateArrowHead(spineEndX, spineY, 20);

  // Step 5: Problem statement position (at arrow head)
  const problemPos = {
    x: spineEndX + 30,
    y: spineY
  };

  // Step 6: Category bone positions (alternate top/bottom)
  const numCategories = fishboneData.categories.length;
  const categoriesPerSide = Math.ceil(numCategories / 2);
  const categorySpacing = (spineEndX - spineStartX - padding * 2) / categoriesPerSide;

  const categoryLayouts = fishboneData.categories.map((category, index) => {
    const isTop = index % 2 === 0;
    const columnIndex = Math.floor(index / 2);

    // Category bone anchor point on spine
    const anchorX = spineStartX + padding + columnIndex * categorySpacing + categorySpacing / 2;

    // Calculate category bone endpoint
    const boneLength = 120;
    const angleRad = (branchAngle * Math.PI) / 180;
    const endX = anchorX - boneLength * Math.cos(angleRad);
    const endY = isTop
      ? spineY - boneLength * Math.sin(angleRad)
      : spineY + boneLength * Math.sin(angleRad);

    // Calculate cause positions along this category bone
    const causeLayouts = layoutCauses(
      category.causes || [],
      endX,
      endY,
      isTop,
      minCauseSpacing,
      maxCauseWidth,
      includeSubcauses
    );

    return {
      category,
      boneStart: { x: anchorX, y: spineY },
      boneEnd: { x: endX, y: endY },
      labelPos: {
        x: endX - (isTop ? 10 : 10),
        y: isTop ? endY - 15 : endY + 25
      },
      causes: causeLayouts,
      isTop
    };
  });

  return {
    svgWidth,
    svgHeight,
    spine: {
      start: { x: spineStartX, y: spineY },
      end: { x: spineEndX, y: spineY },
      arrowHead: arrowHeadPoints
    },
    problem: problemPos,
    categories: categoryLayouts,
    metadata: {
      totalCauses: categoryCounts.reduce((a, b) => a + b, 0),
      maxCausesPerCategory: Math.max(...categoryCounts, 0),
      problemStatement: fishboneData.problemStatement || ''
    }
  };
}

export default calculateFishboneLayout;
