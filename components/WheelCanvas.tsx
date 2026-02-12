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
}

export default function WheelCanvas({
  items,
  colors,
  onSpinEnd,
  isSpinning,
  setIsSpinning,
  spinDuration = 'normal',
  effectsEnabled,
}: WheelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [rotation, setRotation] = useState(0);
  const [canvasSize, setCanvasSize] = useState(800);
  const velocityRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const rotationRef = useRef(0);
  const hasEndedRef = useRef(false);
  const lastSectionRef = useRef(-1);
  const pointerTickRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);

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
    const radius = Math.min(centerX, centerY) - 60; // More padding for effects

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
    const radius = Math.min(centerX, centerY) - 60; // Use same radius calc

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

    // Pulse scale based on velocity
    const speed = Math.abs(velocityRef.current);
    const scale = 1 + Math.min(speed * 0.2, 0.05);

    ctx.save();
    ctx.translate(centerX, centerY);
    if (effectsEnabled) {
      ctx.scale(scale, scale);
    }

    // Motion blur / Glow effect
    if (effectsEnabled && speed > 0.05) {
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = speed * 40;
    } else {
      ctx.shadowBlur = 0;
    }

    // ROTATE and Draw Static Wheel
    ctx.rotate(currentRotation);

    if (staticCanvasRef.current) {
      // Draw cached image centered
      // Since we translated to centerX, centerY, we draw at -width/2, -height/2
      ctx.drawImage(staticCanvasRef.current, -centerX, -centerY, canvas.width, canvas.height);
    }

    ctx.restore(); // Restore transform (scale + rotation)

    // Draw particles (Global coordinates)
    if (effectsEnabled) {
      particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 + Math.random() * 2, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
    ctx.globalAlpha = 1.0;

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

  // Keep rotationRef in sync
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  // Animation loop
  useEffect(() => {
    if (!isSpinning && particlesRef.current.length === 0) return;

    // Set velocity if not already spinning (for "Spin Again")
    // JUICY: Higher velocity range
    if (velocityRef.current < 0.01) {
      const boost = spinDuration === 'epic' ? 0.3 : (spinDuration === 'long' ? 0.15 : 0);
      velocityRef.current = 0.5 + Math.random() * 0.3 + boost; // Higher base and duration-based boost
    }
    hasEndedRef.current = false;

    const baseFriction = FRICTION_MAP[spinDuration] || FRICTION_MAP.normal;

    const animate = () => {
      let friction = baseFriction;

      if (spinDuration === 'epic' && velocityRef.current > 0.1) {
        friction = 0.9985; // Extra persistent for a long time
      } else if (spinDuration === 'long' && velocityRef.current > 0.15) {
        friction = 0.996; // Slightly more persistent than base long
      }

      // Update physics if spinning
      if (isSpinning) {
        velocityRef.current *= friction;

        setRotation(prev => {
          const newRotation = prev + velocityRef.current;

          // CHECK FOR TICK
          const { index } = calculateWinner(newRotation);

          if (lastSectionRef.current !== -1 && lastSectionRef.current !== index) {
            // Section changed! Kick the pointer
            pointerTickRef.current = -0.4; // Kick back 0.4 radians

            // SPAWN SPARKS
            if (effectsEnabled) {
              const canvas = canvasRef.current;
              if (canvas) {
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                const radius = Math.min(centerX, centerY) - 60;
                const pointerY = centerY - radius - 20; // Match draw logic

                // Impact sparks (Tangential)
                const colors = ['#FFD700', '#FFA500', '#FFFFFF'];
                // Tangential velocity scale
                const tangVel = velocityRef.current * 40;

                for (let i = 0; i < 8; i++) {
                  particlesRef.current.push({
                    x: centerX + (Math.random() - 0.5) * 10,
                    y: pointerY + 25, // Exact tip location
                    // Sparks fly in wheel direction (Right) + random spread
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

          return newRotation;
        });

      }

      // Spawn Rim Friction Sparks (Centrifugal/Air friction at high speed)
      if (effectsEnabled && isSpinning && velocityRef.current > 0.2) { // Lower threshold for more action
        const canvas = canvasRef.current;
        if (canvas) {
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const radius = Math.min(centerX, centerY) - 60;
          const colors = ['#FF4500', '#FFD700', '#FFFFFF']; // Added White for pop

          // Spawn random sparks on the rim (Increased count)
          for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const sx = centerX + Math.cos(angle) * (radius + 5);
            const sy = centerY + Math.sin(angle) * (radius + 5);

            // Tangential velocity vector
            const speed = velocityRef.current * 30;
            const tx = -Math.sin(angle);
            const ty = Math.cos(angle);

            particlesRef.current.push({
              x: sx,
              y: sy,
              vx: tx * speed + (Math.random() - 0.5) * 5,
              vy: ty * speed + (Math.random() - 0.5) * 5,
              life: 0.8 + Math.random() * 0.5, // Longer life
              color: colors[Math.floor(Math.random() * colors.length)]
            });
          }
        }
      }

      // Update Particles
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // Gravity
        p.vx *= 0.95; // Air resistance
        p.life *= 0.85; // Drag/fade
      });
      // Remove dead particles
      particlesRef.current = particlesRef.current.filter(p => p.life > 0.05);

      // Decay pointer tick
      pointerTickRef.current *= 0.8;

      if (isSpinning && Math.abs(velocityRef.current) < 0.001) {
        if (!hasEndedRef.current) {
          hasEndedRef.current = true;
          // Wheel has stopped
          setIsSpinning(false);
          lastSectionRef.current = -1; // Reset
          pointerTickRef.current = 0;
          const { winner, index } = calculateWinner(rotationRef.current);
          onSpinEnd(winner, index);
        }
      }

      // Continue animation if spinning OR particles exist
      if (isSpinning || particlesRef.current.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
        // If not spinning but animating particles, force redraw
        if (!isSpinning) {
          setRotation(r => r);
        }
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSpinning, calculateWinner, onSpinEnd, setIsSpinning, items.length, spinDuration, effectsEnabled]);

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
