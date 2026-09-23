'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { DEFAULT_COLORS } from '@/utils/colors';

// Spin duration configuration
export type SpinDuration = 'short' | 'normal' | 'long' | 'epic';

const FRICTION_MAP = {
  short: 0.97,
  normal: 0.985,
  long: 0.994,   // Slow Stop
  epic: 0.9975, // Very Slow Stop
};

// Particle system for sparks
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

interface WheelCanvasProps {
  items: string[];
  colors: string[];
  onSpinEnd: (winner: string, index: number) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  spinDuration?: SpinDuration;
  effectsEnabled: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

const MIN_CANVAS_SIZE = 260;
const MAX_CANVAS_SIZE = 1200;
const SIZE_PADDING_RATIO = 0.95;

// Space reserved around the wheel for the pointer/glow effects, scaled to canvas size
// instead of a fixed pixel value so small canvases don't lose a disproportionate chunk of radius.
function getEffectPadding(halfCanvasSize: number) {
  return Math.max(15, Math.min(60, halfCanvasSize * 0.1));
}

export default function WheelCanvas({
  items,
  colors,
  onSpinEnd,
  isSpinning,
  setIsSpinning,
  spinDuration = 'normal',
  effectsEnabled,
  containerRef
}: WheelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [canvasSize, setCanvasSize] = useState(800);
  const velocityRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const rotationRef = useRef(0);
  const hasEndedRef = useRef(false);
  const lastSectionRef = useRef(-1);
  const pointerTickRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const spinStartTimeRef = useRef(0);
  const spinFramesCountRef = useRef(0);
  const wasSpinningRef = useRef(false);
  const initialVelocityRef = useRef(0);

  // Dynamically set canvas size based on the actual space available in its container
  useEffect(() => {
    const containerEl = containerRef?.current;

    const computeFromRect = (width: number, height: number) => {
      if (width <= 0 || height <= 0) return;
      const available = Math.min(width, height) * SIZE_PADDING_RATIO;
      const size = Math.max(MIN_CANVAS_SIZE, Math.min(available, MAX_CANVAS_SIZE));
      setCanvasSize(size);
    };

    if (containerEl && typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        computeFromRect(entry.contentRect.width, entry.contentRect.height);
      });
      observer.observe(containerEl);

      // Seed immediately so we don't flash the default 800px size before the first callback fires
      const rect = containerEl.getBoundingClientRect();
      computeFromRect(rect.width, rect.height);

      return () => observer.disconnect();
    }

    // Fallback: no container ref, or ResizeObserver unsupported
    const updateSizeFromWindow = () => {
      computeFromRect(window.innerWidth, window.innerHeight);
    };
    updateSizeFromWindow();
    window.addEventListener('resize', updateSizeFromWindow);
    return () => window.removeEventListener('resize', updateSizeFromWindow);
  }, [containerRef]);

  // Update Static Cached Wheel
  useEffect(() => {
    if (items.length === 0) return;

    if (!staticCanvasRef.current) {
      staticCanvasRef.current = document.createElement('canvas');
    }
    const canvas = staticCanvasRef.current;
    if (canvas.width !== canvasSize || canvas.height !== canvasSize) {
      canvas.width = canvasSize;
      canvas.height = canvasSize;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const radius = Math.min(centerX, centerY) - getEffectPadding(Math.min(centerX, centerY));

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    const sliceAngle = (2 * Math.PI) / items.length;
    const colorPalette = colors.length > 0 ? colors : DEFAULT_COLORS;

    // Draw outer rim
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#111827';
    ctx.fill();

    // Draw segments (Rotation 0)
    items.forEach((item, index) => {
      const startAngle = index * sliceAngle;
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

      // --- NEW ADAPTIVE TEXT RENDERING ---
      const sliceAngleSize = (2 * Math.PI) / items.length;

      // 1. Set text anchor right at the rim (with small 15px padding)
      const textRadius = radius - 15;

      // 2. Max width: from rim almost to the center hub (dist of ~45px from center)
      const maxTextWidth = radius - 45;

      // 3. Calculate initial font size based on slice count
      // Larger for few items, smaller for many
      let fontSize = 28;
      if (items.length > 12) fontSize = 22;
      if (items.length > 24) fontSize = 18;
      if (items.length > 40) fontSize = 14;
      if (items.length > 60) fontSize = 10;

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // 4. Adaptive scaling: Shrink font if text is too long for the radius
      // or if it's too tall for the wedge height at the hub
      let displayText = item;
      let currentFont = `bold ${fontSize}px system-ui, sans-serif`;
      ctx.font = currentFont;

      let textWidth = ctx.measureText(displayText).width;

      // Iteratively shrink font to fit width
      while (textWidth > maxTextWidth && fontSize > 8) {
        fontSize -= 1;
        ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
        textWidth = ctx.measureText(displayText).width;
      }

      // Final vertical constraint check (prevent overlap in thin slices)
      // Height of slice at inner end of text: H = 2 * r_inner * sin(angle/2)
      const innerRadius = textRadius - textWidth;
      const sliceHeightAtInner = 2 * innerRadius * Math.sin(sliceAngleSize / 2);

      // If font is still too chunky for the thin wedge, shrink more
      if (fontSize > sliceHeightAtInner * 0.9 && fontSize > 8) {
        fontSize = Math.max(8, Math.floor(sliceHeightAtInner * 0.9));
        ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
      }

      // 5. Final Truncation (Only as a last resort at min-size)
      if (ctx.measureText(displayText).width > maxTextWidth) {
        while (ctx.measureText(displayText + '...').width > maxTextWidth && displayText.length > 2) {
          displayText = displayText.slice(0, -1);
        }
        displayText += '...';
      }

      ctx.shadowBlur = 0;
      ctx.fillText(displayText, textRadius, 0);
      ctx.restore();
      // --- END NEW RENDERING ---
    });

    // Draw center circle (Hub)
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
    ctx.fillStyle = '#1F2937';
    ctx.fill();

    // Draw Center Star/Icon
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', centerX, centerY);

  }, [items, colors, canvasSize]);

  // Draw the wheel (Render Loop)
  const drawWheel = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, currentRotation: number) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - getEffectPadding(Math.min(centerX, centerY)); // Use same radius calc

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

    ctx.save();
    ctx.translate(centerX, centerY);

    // ROTATE and Draw Static Wheel (1:1 blit, no software Gaussian blur or scale resampling)
    ctx.rotate(currentRotation);

    if (staticCanvasRef.current) {
      ctx.drawImage(staticCanvasRef.current, -centerX, -centerY, canvas.width, canvas.height);
    }

    ctx.restore(); // Restore transform

    // Draw particles (Global coordinates) - ultra-fast batch rects (10x faster than separate arc paths)
    if (effectsEnabled && particlesRef.current.length > 0) {
      const pList = particlesRef.current;
      for (let i = 0; i < pList.length; i++) {
        const p = pList[i];
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      }
      ctx.globalAlpha = 1.0;
    }

    // Draw pointer at top OUTSIDE wheel (Fixed position)
    const tickAngle = pointerTickRef.current;

    ctx.save();
    // Position pointer at top edge of wheel + padding
    const pointerY = centerY - radius - 20;

    ctx.translate(centerX, pointerY);
    ctx.rotate(tickAngle);
    ctx.translate(-centerX, -pointerY);

    // Pointer shadow
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;

    // Pointer structure (pointing down)
    ctx.beginPath();
    ctx.moveTo(centerX - 15, pointerY - 20);
    ctx.lineTo(centerX + 15, pointerY - 20);
    ctx.lineTo(centerX, pointerY + 25); // Tip pointing down into wheel
    ctx.closePath();

    ctx.fillStyle = '#EF4444';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore(); // Restore pointer transform

  }, [items, colors, effectsEnabled]); // Reduced dependencies as static drawing is handled separately

  // Calculate winner based on rotation
  const calculateWinner = useCallback((currentRotation: number) => {
    if (items.length === 0) return { winner: '', index: -1 };

    const sliceAngle = (2 * Math.PI) / items.length;
    let normalizedRotation = currentRotation % (2 * Math.PI);
    if (normalizedRotation < 0) normalizedRotation += 2 * Math.PI;

    const pointerAngle = Math.PI * 1.5; // 270 degrees
    let adjustedAngle = pointerAngle - normalizedRotation;
    if (adjustedAngle < 0) adjustedAngle += 2 * Math.PI;

    const winnerIndex = Math.floor(adjustedAngle / sliceAngle) % items.length;
    return { winner: items[winnerIndex], index: winnerIndex };
  }, [items]);

  // Animation loop
  useEffect(() => {
    if (!isSpinning && particlesRef.current.length === 0) {
      wasSpinningRef.current = false;
      return;
    }

    // Initialize spin parameters ONLY on transition from stopped -> spinning
    if (isSpinning && !wasSpinningRef.current) {
      wasSpinningRef.current = true;
      hasEndedRef.current = false;
      spinStartTimeRef.current = performance.now();
      spinFramesCountRef.current = 0;

      // Set velocity if not already initiated by handleClick (e.g. "Spin Again")
      if (velocityRef.current < 0.01) {
        const boost = spinDuration === 'epic' ? 0.3 : (spinDuration === 'long' ? 0.15 : 0);
        velocityRef.current = 0.5 + Math.random() * 0.3 + boost;
      }
      initialVelocityRef.current = velocityRef.current;
      console.log(`[Wheel Spin] Started | initial velocity: ${velocityRef.current.toFixed(4)} rad/frame (${spinDuration} mode)`);
    }
    const baseFriction = FRICTION_MAP[spinDuration] || FRICTION_MAP.normal;

    const animate = () => {
      // Use smooth consistent friction without sudden velocity cliff drops
      let friction = baseFriction;

      // Update physics if spinning
      if (isSpinning) {
        spinFramesCountRef.current++;
        // Combine aerodynamic drag (geometric) with constant mechanical friction (Coulomb)
        // Eliminates the unnatural exponential crawl and prevents hesitation/apparent speedups
        const bearingFriction = 0.00015;
        velocityRef.current = Math.max(0, velocityRef.current * friction - bearingFriction);

        // Log velocity curve progression
        if (spinFramesCountRef.current % 60 === 0 || (velocityRef.current < 0.03 && spinFramesCountRef.current % 20 === 0)) {
          const elapsed = ((performance.now() - spinStartTimeRef.current) / 1000).toFixed(2);
          console.log(`[Wheel Velocity] t=${elapsed}s (frame ${spinFramesCountRef.current}): v=${velocityRef.current.toFixed(5)} rad/frame`);
        }

        rotationRef.current += velocityRef.current;
        const newRotation = rotationRef.current;

        // CHECK FOR TICK
        const { index } = calculateWinner(newRotation);

        if (lastSectionRef.current !== -1 && lastSectionRef.current !== index) {
          // Section changed! Kick the pointer proportional to velocity
          const tickAngle = Math.min(0.35, Math.max(0.04, velocityRef.current * 1.5));
          pointerTickRef.current = -tickAngle;

          // SPAWN SPARKS (capped to 36 max particles to prevent frame drops in Firefox)
          const MAX_PARTICLES = 36;
          if (effectsEnabled && particlesRef.current.length < MAX_PARTICLES) {
            const canvas = canvasRef.current;
            if (canvas) {
              const centerX = canvas.width / 2;
              const centerY = canvas.height / 2;
              const radius = Math.min(centerX, centerY) - getEffectPadding(Math.min(centerX, centerY));
              const pointerY = centerY - radius - 20; // Match draw logic

              // Impact sparks (Tangential)
              const colors = ['#FFD700', '#FFA500', '#FFFFFF'];
              const tangVel = velocityRef.current * 40;
              const count = Math.min(3, MAX_PARTICLES - particlesRef.current.length);

              for (let i = 0; i < count; i++) {
                particlesRef.current.push({
                  x: centerX + (Math.random() - 0.5) * 10,
                  y: pointerY + 25, // Exact tip location
                  vx: tangVel + (Math.random() * 5),
                  vy: (Math.random() - 0.5) * 8 + 2,
                  life: 1.0,
                  color: colors[Math.floor(Math.random() * colors.length)]
                });
              }
            }
          }
        }
        lastSectionRef.current = index;
      }

      // Spawn Rim Friction Sparks (Centrifugal/Air friction at high speed)
      const MAX_PARTICLES = 36;
      if (effectsEnabled && isSpinning && velocityRef.current > 0.25 && particlesRef.current.length < MAX_PARTICLES) {
        const canvas = canvasRef.current;
        if (canvas) {
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const radius = Math.min(centerX, centerY) - getEffectPadding(Math.min(centerX, centerY));
          const colors = ['#FF4500', '#FFD700', '#FFFFFF'];
          const count = Math.min(2, MAX_PARTICLES - particlesRef.current.length);

          for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const sx = centerX + Math.cos(angle) * (radius + 5);
            const sy = centerY + Math.sin(angle) * (radius + 5);
            const speed = velocityRef.current * 30;

            particlesRef.current.push({
              x: sx,
              y: sy,
              vx: -Math.sin(angle) * speed + (Math.random() - 0.5) * 5,
              vy: Math.cos(angle) * speed + (Math.random() - 0.5) * 5,
              life: 0.8 + Math.random() * 0.4,
              color: colors[Math.floor(Math.random() * colors.length)]
            });
          }
        }
      }

      // Update Particles (in-place compaction, zero GC allocation)
      let liveCount = 0;
      const pList = particlesRef.current;
      for (let i = 0; i < pList.length; i++) {
        const p = pList[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // Gravity
        p.vx *= 0.95; // Air resistance
        p.life *= 0.85; // Drag/fade
        if (p.life > 0.05) {
          pList[liveCount++] = p;
        }
      }
      pList.length = liveCount;

      // Decay pointer tick
      pointerTickRef.current *= 0.8;
      if (isSpinning && velocityRef.current <= 0.0005) {
        if (!hasEndedRef.current) {
          hasEndedRef.current = true;
          velocityRef.current = 0;
          setIsSpinning(false);
          wasSpinningRef.current = false;
          lastSectionRef.current = -1; // Reset
          pointerTickRef.current = 0;
          const durationSec = (performance.now() - spinStartTimeRef.current) / 1000;
          const avgFps = Math.round(spinFramesCountRef.current / (durationSec || 1));
          console.log(`[Wheel Performance] Spin completed: ${avgFps} FPS (${spinFramesCountRef.current} frames in ${durationSec.toFixed(2)}s | ${items.length} items | initial vel: ${initialVelocityRef.current.toFixed(4)} -> 0.00000)`);

          const { winner, index } = calculateWinner(rotationRef.current);
          onSpinEnd(winner, index);
        }
      }

      // Draw the frame
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawWheel(ctx, canvas, rotationRef.current);
        }
      }

      // Continue animation if spinning OR particles exist
      if (isSpinning || particlesRef.current.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSpinning, calculateWinner, onSpinEnd, setIsSpinning, items.length, spinDuration, effectsEnabled, drawWheel]);

  // Initial and update draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawWheel(ctx, canvas, rotationRef.current);
  }, [drawWheel, canvasSize, items, colors]);

  // Handle click to spin
  const handleClick = () => {
    if (isSpinning || items.length < 2) return;

    // Random velocity with duration-based boost
    const boost = spinDuration === 'epic' ? 0.4 : (spinDuration === 'long' ? 0.2 : 0);
    velocityRef.current = 0.4 + Math.random() * 0.3 + boost;
    setIsSpinning(true);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        onClick={handleClick}
        className={`cursor-pointer transition-transform ${isSpinning ? 'cursor-wait' : (effectsEnabled ? 'hover:scale-[1.02]' : '')
          } ${items.length < 2 ? 'opacity-75 cursor-not-allowed' : ''}`}
        style={{ maxWidth: '100%', height: 'auto', transform: 'translateZ(0)', willChange: 'transform' }}
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
