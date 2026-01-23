import { useState, useRef, useCallback, useEffect } from "react";

interface PanState {
  x: number;
  y: number;
}

interface UsePanReturn {
  pan: PanState;
  isPanning: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleMouseLeave: () => void;
  handleWheel: (e: React.WheelEvent) => void;
  setPan: React.Dispatch<React.SetStateAction<PanState>>;
  resetPan: () => void;
}

export function useTreePan(
  zoom: number,
  contentWidth: number,
  contentHeight: number
): UsePanReturn {
  const [pan, setPan] = useState<PanState>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan with left mouse button and not on interactive elements
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]') || target.tagName === 'text') {
      return;
    }
    
    e.preventDefault();
    setIsPanning(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || !lastMousePos.current) return;

    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;

    setPan((prev) => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    lastMousePos.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    lastMousePos.current = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Pan with trackpad/scroll
    if (!e.ctrlKey) {
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, []);

  const resetPan = useCallback(() => {
    setPan({ x: 0, y: 0 });
  }, []);

  // Add global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      lastMousePos.current = null;
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  return {
    pan,
    isPanning,
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleWheel,
    setPan,
    resetPan,
  };
}
