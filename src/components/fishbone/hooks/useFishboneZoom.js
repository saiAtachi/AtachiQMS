/**
 * useFishboneZoom Hook
 * Handles zoom and pan functionality for fishbone diagram
 */

import { useState, useCallback, useRef } from 'react';

/**
 * Hook for managing zoom and pan state
 * @param {number} initialScale - Initial zoom scale (default 1)
 * @returns {Object} Transform state and handler functions
 */
export function useFishboneZoom(initialScale = 1) {
  const [transform, setTransform] = useState({
    scale: initialScale,
    translateX: 0,
    translateY: 0
  });

  const [isPanning, setIsPanning] = useState(false);
  const lastPanPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  /**
   * Handle zoom operation
   * @param {number} delta - Zoom delta (positive = zoom in, negative = zoom out)
   * @param {number} centerX - X coordinate of zoom center
   * @param {number} centerY - Y coordinate of zoom center
   */
  const handleZoom = useCallback((delta, centerX = 0, centerY = 0) => {
    setTransform(prev => {
      const newScale = Math.max(0.3, Math.min(3, prev.scale + delta));

      // Zoom towards cursor position (if provided)
      if (centerX && centerY) {
        const scaleFactor = newScale / prev.scale;
        const newTranslateX = centerX - (centerX - prev.translateX) * scaleFactor;
        const newTranslateY = centerY - (centerY - prev.translateY) * scaleFactor;

        return {
          scale: newScale,
          translateX: newTranslateX,
          translateY: newTranslateY
        };
      }

      return {
        ...prev,
        scale: newScale
      };
    });
  }, []);

  /**
   * Handle mouse wheel zoom
   */
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta, e.clientX, e.clientY);
  }, [handleZoom]);

  /**
   * Start panning operation
   */
  const handlePanStart = useCallback((e) => {
    // Only pan with left mouse button or touch
    if (e.button && e.button !== 0) return;

    setIsPanning(true);
    lastPanPos.current = {
      x: e.clientX || e.touches?.[0]?.clientX || 0,
      y: e.clientY || e.touches?.[0]?.clientY || 0
    };
  }, []);

  /**
   * Continue panning operation
   */
  const handlePanMove = useCallback((e) => {
    if (!isPanning) return;

    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;

    const dx = clientX - lastPanPos.current.x;
    const dy = clientY - lastPanPos.current.y;

    setTransform(prev => ({
      ...prev,
      translateX: prev.translateX + dx,
      translateY: prev.translateY + dy
    }));

    lastPanPos.current = { x: clientX, y: clientY };
  }, [isPanning]);

  /**
   * End panning operation
   */
  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  /**
   * Reset transform to initial state
   */
  const resetTransform = useCallback(() => {
    setTransform({
      scale: initialScale,
      translateX: 0,
      translateY: 0
    });
  }, [initialScale]);

  /**
   * Zoom in by fixed amount
   */
  const zoomIn = useCallback(() => {
    handleZoom(0.2);
  }, [handleZoom]);

  /**
   * Zoom out by fixed amount
   */
  const zoomOut = useCallback(() => {
    handleZoom(-0.2);
  }, [handleZoom]);

  /**
   * Fit diagram to container
   */
  const fitToContainer = useCallback((svgWidth, svgHeight) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const scaleX = containerWidth / svgWidth;
    const scaleY = containerHeight / svgHeight;
    const optimalScale = Math.min(scaleX, scaleY, 1) * 0.9; // 90% to add padding

    setTransform({
      scale: optimalScale,
      translateX: (containerWidth - svgWidth * optimalScale) / 2,
      translateY: (containerHeight - svgHeight * optimalScale) / 2
    });
  }, []);

  return {
    transform,
    setTransform,
    handleWheel,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    resetTransform,
    zoomIn,
    zoomOut,
    fitToContainer,
    isPanning,
    containerRef
  };
}

export default useFishboneZoom;
