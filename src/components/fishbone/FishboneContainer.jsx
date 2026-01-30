/**
 * FishboneContainer Component
 * Main container that orchestrates SVG rendering with zoom/pan controls
 */

import React, { useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react';
import FishboneSVG from './FishboneSVG';
import useFishboneLayout from './hooks/useFishboneLayout';
import useFishboneZoom from './hooks/useFishboneZoom';

/**
 * FishboneContainer Component
 * @param {Object} props
 * @param {Object} props.fishbone - Fishbone data structure
 * @param {Function} props.onChange - Optional callback when fishbone changes
 * @param {boolean} props.readOnly - Whether diagram is read-only (default true)
 * @param {Function} props.onCauseClick - Optional callback when cause is clicked
 * @param {Object} props.layoutOptions - Optional layout configuration
 */
const FishboneContainer = ({
  fishbone,
  onChange,
  readOnly = true,
  onCauseClick,
  layoutOptions = {}
}) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  // Calculate layout
  const layout = useFishboneLayout(fishbone, {
    includeSubcauses: true,
    ...layoutOptions
  });

  // Zoom and pan state
  const {
    transform,
    handleWheel,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    resetTransform,
    zoomIn,
    zoomOut,
    fitToContainer,
    isPanning
  } = useFishboneZoom(1);

  // Fit diagram to container on initial load
  useEffect(() => {
    if (layout && containerRef.current) {
      // Small delay to ensure container has rendered
      setTimeout(() => {
        fitToContainer(layout.svgWidth, layout.svgHeight);
      }, 100);
    }
  }, [layout, fitToContainer]);

  // Handle cause click
  const handleCauseClick = (cause, isSubCause) => {
    if (onCauseClick) {
      onCauseClick(cause, isSubCause);
    }
  };

  if (!fishbone || !layout) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <p className="text-gray-500 text-sm">No fishbone diagram available</p>
          <p className="text-gray-400 text-xs mt-2">Add causes to categories to create the diagram</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Zoom controls toolbar */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white rounded-lg shadow-md border border-gray-200 p-2">
        <button
          onClick={zoomIn}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={zoomOut}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={resetTransform}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Reset view"
          aria-label="Reset view"
        >
          <Maximize2 className="w-5 h-5 text-gray-700" />
        </button>
        <div className="border-t border-gray-200 my-1"></div>
        <div className="p-2 text-center">
          <Move className="w-5 h-5 text-gray-400 mx-auto" />
          <span className="text-xs text-gray-400 mt-1 block">Drag to pan</span>
        </div>
      </div>

      {/* Zoom level indicator */}
      <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-md border border-gray-200 px-3 py-2">
        <span className="text-sm text-gray-600 font-medium">
          {Math.round(transform.scale * 100)}%
        </span>
      </div>

      {/* Diagram info */}
      {layout.metadata && layout.metadata.totalCauses > 0 && (
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md border border-gray-200 px-3 py-2">
          <span className="text-sm text-gray-600">
            <span className="font-medium">{layout.metadata.totalCauses}</span> causes
          </span>
        </div>
      )}

      {/* SVG container with pan and zoom */}
      <div
        ref={containerRef}
        className="overflow-hidden p-4"
        style={{
          cursor: isPanning ? 'grabbing' : 'grab',
          minHeight: '500px'
        }}
        onWheel={handleWheel}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
        onTouchStart={handlePanStart}
        onTouchMove={handlePanMove}
        onTouchEnd={handlePanEnd}
      >
        <div
          style={{
            transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            width: 'fit-content'
          }}
        >
          <FishboneSVG
            ref={svgRef}
            layout={layout}
            transform={transform}
            onCauseClick={handleCauseClick}
          />
        </div>
      </div>

      {/* Severity legend */}
      {layout.metadata && layout.metadata.totalCauses > 0 && (
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Severity Levels:</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-600">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-xs text-gray-600">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-xs text-gray-600">High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-600">Critical</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FishboneContainer;
