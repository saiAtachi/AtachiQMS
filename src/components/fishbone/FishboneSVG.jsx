/**
 * FishboneSVG Component
 * Renders the fishbone diagram as SVG based on layout calculations
 */

import React from 'react';
import { wrapText } from './utils/layoutEngine';

// Severity colors
const SEVERITY_COLORS = {
  low: '#10b981',      // Green
  medium: '#f59e0b',   // Amber
  high: '#f97316',     // Orange
  critical: '#ef4444', // Red
  default: '#6b7280'   // Gray
};

/**
 * Get color based on severity level
 */
const getSeverityColor = (severity) => {
  return SEVERITY_COLORS[severity] || SEVERITY_COLORS.default;
};

/**
 * Render a single subcause with its branches
 */
const SubCause = ({ subLayout, onCauseClick }) => {
  return (
    <g className="subcause">
      {/* Subcause branch line */}
      <line
        x1={subLayout.branchStart.x}
        y1={subLayout.branchStart.y}
        x2={subLayout.branchEnd.x}
        y2={subLayout.branchEnd.y}
        stroke={getSeverityColor(subLayout.subCause.severity)}
        strokeWidth="1"
        opacity="0.8"
      />

      {/* Subcause text (wrapped) */}
      <g
        onClick={() => onCauseClick?.(subLayout.subCause, true)}
        style={{ cursor: onCauseClick ? 'pointer' : 'default' }}
      >
        {subLayout.textLines.map((line, i) => (
          <text
            key={i}
            x={subLayout.textPos.x}
            y={subLayout.textPos.y + i * (subLayout.fontSize + 4) + subLayout.fontSize}
            fontSize={subLayout.fontSize}
            fill="#4b5563"
            fontStyle="italic"
          >
            {line}
          </text>
        ))}
      </g>

      {/* Severity indicator dot */}
      <circle
        cx={subLayout.branchEnd.x + 5}
        cy={subLayout.branchEnd.y}
        r="3"
        fill={getSeverityColor(subLayout.subCause.severity)}
      />

      {/* Render nested subcauses recursively */}
      {subLayout.subCauses && subLayout.subCauses.map((nested, idx) => (
        <SubCause
          key={nested.subCause.id || idx}
          subLayout={nested}
          onCauseClick={onCauseClick}
        />
      ))}
    </g>
  );
};

/**
 * Render a single cause with its subcauses
 */
const Cause = ({ causeLayout, onCauseClick }) => {
  return (
    <g className="cause">
      {/* Main cause branch line */}
      <line
        x1={causeLayout.branchStart.x}
        y1={causeLayout.branchStart.y}
        x2={causeLayout.branchEnd.x}
        y2={causeLayout.branchEnd.y}
        stroke={getSeverityColor(causeLayout.cause.severity)}
        strokeWidth="1.5"
      />

      {/* Cause text (wrapped) */}
      <g
        onClick={() => onCauseClick?.(causeLayout.cause, false)}
        style={{ cursor: onCauseClick ? 'pointer' : 'default' }}
      >
        {causeLayout.textLines.map((line, i) => (
          <text
            key={i}
            x={causeLayout.textPos.x}
            y={causeLayout.textPos.y + i * 18 + 14}
            fontSize="14"
            fill="#1f2937"
            fontWeight="500"
          >
            {line}
          </text>
        ))}
      </g>

      {/* Severity indicator dot */}
      <circle
        cx={causeLayout.branchEnd.x + 5}
        cy={causeLayout.branchEnd.y}
        r="4"
        fill={getSeverityColor(causeLayout.cause.severity)}
      />

      {/* Render subcauses */}
      {causeLayout.subCauses && causeLayout.subCauses.map((subLayout, idx) => (
        <SubCause
          key={subLayout.subCause.id || idx}
          subLayout={subLayout}
          onCauseClick={onCauseClick}
        />
      ))}
    </g>
  );
};

/**
 * Render a category with all its causes
 */
const Category = ({ catLayout, onCauseClick }) => {
  return (
    <g className="category">
      {/* Category bone line */}
      <line
        x1={catLayout.boneStart.x}
        y1={catLayout.boneStart.y}
        x2={catLayout.boneEnd.x}
        y2={catLayout.boneEnd.y}
        stroke={catLayout.category.color || '#374151'}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Category label */}
      <text
        x={catLayout.labelPos.x}
        y={catLayout.labelPos.y}
        fontSize="16"
        fontWeight="bold"
        fill={catLayout.category.color || '#1f2937'}
        textAnchor="middle"
      >
        {catLayout.category.name}
      </text>

      {/* Render all causes in this category */}
      {catLayout.causes && catLayout.causes.map((causeLayout, idx) => (
        <Cause
          key={causeLayout.cause.id || idx}
          causeLayout={causeLayout}
          onCauseClick={onCauseClick}
        />
      ))}
    </g>
  );
};

/**
 * Main FishboneSVG Component
 * @param {Object} props
 * @param {Object} props.layout - Complete layout object from useFishboneLayout
 * @param {Object} props.transform - Transform state from useFishboneZoom
 * @param {Function} props.onCauseClick - Optional callback when cause is clicked
 * @param {React.Ref} props.svgRef - Optional ref to the SVG element
 */
const FishboneSVG = React.forwardRef(({ layout, transform = { scale: 1, translateX: 0, translateY: 0 }, onCauseClick }, ref) => {
  if (!layout) {
    return (
      <svg width="800" height="400" className="border border-gray-200 rounded">
        <text x="400" y="200" textAnchor="middle" fill="#9ca3af" fontSize="14">
          No fishbone data to display
        </text>
      </svg>
    );
  }

  const { svgWidth, svgHeight, spine, problem, categories } = layout;

  return (
    <svg
      ref={ref}
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="fishbone-diagram"
      style={{
        backgroundColor: '#ffffff',
        maxWidth: '100%',
        height: 'auto'
      }}
    >
      {/* Main spine (horizontal arrow) */}
      <g className="spine">
        <line
          x1={spine.start.x}
          y1={spine.start.y}
          x2={spine.end.x}
          y2={spine.end.y}
          stroke="#111827"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Arrow head */}
        <polygon
          points={spine.arrowHead}
          fill="#111827"
        />
      </g>

      {/* Problem statement */}
      {layout.metadata?.totalCauses > 0 && (
        <g className="problem">
          {(() => {
            const problemText = layout.metadata?.problemStatement || 'Problem';
            const wrappedLines = wrapText(problemText, 250, 16);
            return wrappedLines.map((line, i) => (
              <text
                key={i}
                x={problem.x}
                y={problem.y + i * 20}
                fontSize="16"
                fontWeight="bold"
                fill="#1f2937"
                textAnchor="start"
              >
                {line}
              </text>
            ));
          })()}
        </g>
      )}

      {/* Render all categories */}
      {categories.map((catLayout, idx) => (
        <Category
          key={catLayout.category.id || idx}
          catLayout={catLayout}
          onCauseClick={onCauseClick}
        />
      ))}

      {/* Empty state message */}
      {layout.metadata.totalCauses === 0 && (
        <text
          x={svgWidth / 2}
          y={svgHeight / 2 + 40}
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="14"
        >
          Add causes to the categories to build your fishbone diagram
        </text>
      )}
    </svg>
  );
});

FishboneSVG.displayName = 'FishboneSVG';

export default FishboneSVG;
