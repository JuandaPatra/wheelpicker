'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { DEFAULT_COLORS } from '@/utils/colors';

interface WheelCanvasProps {
  items: string[];
  colors: string[];
  onSpinEnd: (winner: string, index: number) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
}

export default function WheelCanvas({
  items,
  colors,
  onSpinEnd,
  isSpinning,
  setIsSpinning,
}: WheelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [canvasSize, setCanvasSize] = useState(800);
  const velocityRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const rotationRef = useRef(0);
  const hasEndedRef = useRef(false);

  // Dynamically set canvas size based on viewport height
  useEffect(() => {
    const updateSize = () => {
      const vh = window.innerHeight * 0.95;
      const vw = window.innerWidth * 0.95;
      const size = Math.min(vh, vw, 1200); // Cap at 1200px
      setCanvasSize(size);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Draw the wheel
  const drawWheel = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, currentRotation: number) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (items.length === 0) {
      // Draw empty wheel placeholder
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#374151';
      ctx.fill();
      ctx.strokeStyle = '#6B7280';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#9CA3AF';
      ctx.font = '18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add items to spin!', centerX, centerY);
      return;
    }

    const sliceAngle = (2 * Math.PI) / items.length;
    const colorPalette = colors.length > 0 ? colors : DEFAULT_COLORS;

    // Draw segments
    items.forEach((item, index) => {
      const startAngle = currentRotation + index * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = colorPalette[index % colorPalette.length];
      ctx.fill();

      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);

      // Text color - calculate contrast
      const bgColor = colorPalette[index % colorPalette.length];
      ctx.fillStyle = getContrastColor(bgColor);

      // Dynamically adjust text based on item count
      const count = items.length;
      let fontSize: number;
      let textRadiusFactor: number;
      let maxWidthFactor: number;

      if (count <= 8) {
        fontSize = 25;                // Increased from 14
        textRadiusFactor = 0.65;
        maxWidthFactor = 0.5;
      } else if (count <= 20) {
        // Smoothly transition between 8 and 20 items
        const t = (count - 8) / 12;
        fontSize = Math.round(25 - t * 5);        // 25 → 20 (was 14 → 11)
        textRadiusFactor = 0.65 + t * 0.1;        // 0.65 → 0.75
        maxWidthFactor = 0.5 - t * 0.15;          // 0.5 → 0.35
      } else {
        // 20+ items: push text further out, shrink font more
        const t = Math.min((count - 20) / 15, 1); // clamp at 35+
        fontSize = Math.round(20 - t * 6);        // 20 → 14 (was 11 → 8)
        textRadiusFactor = 0.75 + t * 0.07;       // 0.75 → 0.82
        maxWidthFactor = 0.35 - t * 0.15;         // 0.35 → 0.20
      }

      const textRadius = radius * textRadiusFactor;
      const maxTextWidth = radius * maxWidthFactor;

      ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Truncate text if too long
      let displayText = item;
      while (ctx.measureText(displayText).width > maxTextWidth && displayText.length > 3) {
        displayText = displayText.slice(0, -4) + '...';
      }

      ctx.fillText(displayText, textRadius, 0);
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#1F2937';
    ctx.fill();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw pointer at top
    const pointerSize = 25;
    ctx.beginPath();
    ctx.moveTo(centerX, 10);
    ctx.lineTo(centerX - pointerSize / 2, 0);
    ctx.lineTo(centerX + pointerSize / 2, 0);
    ctx.closePath();
    ctx.fillStyle = '#EF4444';
    ctx.fill();
    ctx.strokeStyle = '#B91C1C';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [items, colors]);

  // Calculate winner based on rotation
  const calculateWinner = useCallback((currentRotation: number) => {
    if (items.length === 0) return { winner: '', index: -1 };

    const sliceAngle = (2 * Math.PI) / items.length;
    // The pointer is at the top (270 degrees or -π/2)
    // We need to find which slice is at that position
    let normalizedRotation = currentRotation % (2 * Math.PI);
    if (normalizedRotation < 0) normalizedRotation += 2 * Math.PI;

    // Pointer is at top, so we measure from there
    const pointerAngle = Math.PI * 1.5; // 270 degrees
    let adjustedAngle = pointerAngle - normalizedRotation;
    if (adjustedAngle < 0) adjustedAngle += 2 * Math.PI;

    const winnerIndex = Math.floor(adjustedAngle / sliceAngle) % items.length;
    return { winner: items[winnerIndex], index: winnerIndex };
  }, [items]);

  // Keep rotationRef in sync
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  // Animation loop
  useEffect(() => {
    if (!isSpinning) return;

    // Set velocity if not already spinning (for "Spin Again")
    if (velocityRef.current < 0.01) {
      velocityRef.current = 0.3 + Math.random() * 0.2;
    }
    hasEndedRef.current = false;

    const animate = () => {
      velocityRef.current *= 0.985; // Deceleration factor

      setRotation(prev => {
        const newRotation = prev + velocityRef.current;
        return newRotation;
      });

      if (Math.abs(velocityRef.current) < 0.001) {
        if (!hasEndedRef.current) {
          hasEndedRef.current = true;
          // Wheel has stopped
          setIsSpinning(false);
          const { winner, index } = calculateWinner(rotationRef.current);
          onSpinEnd(winner, index);
        }
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSpinning, calculateWinner, onSpinEnd, setIsSpinning]);

  // Redraw on rotation change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawWheel(ctx, canvas, rotation);
  }, [rotation, items, colors, drawWheel, canvasSize]);

  // Initial draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawWheel(ctx, canvas, rotation);
  }, [drawWheel, rotation]);

  // Handle click to spin
  const handleClick = () => {
    if (isSpinning || items.length < 2) return;

    // Random velocity between 0.3 and 0.5 radians per frame
    velocityRef.current = 0.3 + Math.random() * 0.2;
    setIsSpinning(true);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        onClick={handleClick}
        className={`cursor-pointer transition-transform ${isSpinning ? 'cursor-wait' : 'hover:scale-[1.02]'
          } ${items.length < 2 ? 'opacity-75 cursor-not-allowed' : ''}`}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      {items.length < 2 && items.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
            Add at least 2 items to spin
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to determine text color based on background
function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#1F2937' : '#FFFFFF';
}
