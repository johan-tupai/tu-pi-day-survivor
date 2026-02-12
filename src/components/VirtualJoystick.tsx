import React, { useRef, useCallback, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
}

const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const center = useRef({ x: 0, y: 0 });

  const handleStart = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    center.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    dragging.current = true;
    handleMove(clientX, clientY);
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!dragging.current) return;
    const dx = clientX - center.current.x;
    const dy = clientY - center.current.y;
    const maxDist = 50;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);
    const nx = (Math.cos(angle) * clampedDist) / maxDist;
    const ny = (Math.sin(angle) * clampedDist) / maxDist;
    onMove(nx, ny);
  }, [onMove]);

  const handleEnd = useCallback(() => {
    dragging.current = false;
    onMove(0, 0);
  }, [onMove]);

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handleEnd();
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleMove, handleEnd]);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-8 left-8 z-10 w-32 h-32 rounded-full border-2 border-foreground/20 flex items-center justify-center"
      style={{ background: 'hsla(0,0%,100%,0.1)', touchAction: 'none' }}
      onTouchStart={(e) => {
        e.preventDefault();
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }}
    >
      <div className="w-14 h-14 rounded-full" style={{ background: 'hsla(0,0%,100%,0.3)' }} />
    </div>
  );
};

export default VirtualJoystick;
