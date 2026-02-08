'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { DEFAULT_COLORS } from '@/utils/colors';

interface WheelCanvasProps {
  items: string[];
  colors: string[];
  backgroundImage: string | null;
  onSpinEnd: (winner: string, index: number) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
}

export default function WheelCanvas({
  items,
  colors,
  backgroundImage,
  onSpinEnd,
  isSpinning,
  setIsSpinning,
}: WheelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const velocityRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  // Load background image
  useEffect(() => {
    if (backgroundImage) {
      const img = new Image();
      img.onload = () => {
        bgImageRef.current = img;
      };
      img.src = backgroundImage;
    } else {
      bgImageRef.current = null;
    }
  }, [backgroundImage]);

  // Draw the wheel
  const drawWheel = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, currentRotation: number) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image if exists
    if (bgImageRef.current) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.clip();
      ctx.drawImage(bgImageRef.current, centerX - radius, centerY - radius, radius * 2, radius * 2);
      ctx.restore();
    }

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
      
      if (!bgImageRef.current) {
        ctx.fillStyle = colorPalette[index % colorPalette.length];
        ctx.fill();
      }
      
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
      
      const textRadius = radius * 0.65;
      const maxTextWidth = radius * 0.5;
      
      ctx.font = 'bold 14px system-ui, sans-serif';
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

  // Animation loop
  useEffect(() => {
    if (!isSpinning) return;

    const animate = () => {
      velocityRef.current *= 0.985; // Deceleration factor
      
      setRotation(prev => {
        const newRotation = prev + velocityRef.current;
        return newRotation;
      });

      if (Math.abs(velocityRef.current) < 0.001) {
        // Wheel has stopped
        setIsSpinning(false);
        const { winner, index } = calculateWinner(rotation + velocityRef.current);
        onSpinEnd(winner, index);
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
  }, [isSpinning, calculateWinner, onSpinEnd, rotation, setIsSpinning]);

  // Redraw on rotation change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawWheel(ctx, canvas, rotation);
  }, [rotation, items, colors, drawWheel]);

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
        width={500}
        height={500}
        onClick={handleClick}
        className={`cursor-pointer transition-transform ${
          isSpinning ? 'cursor-wait' : 'hover:scale-[1.02]'
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
