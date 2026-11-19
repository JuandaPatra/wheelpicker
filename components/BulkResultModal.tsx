'use client';

import { useState } from 'react';
import confetti from 'canvas-confetti';

interface BulkResultModalProps {
  results: { text: string; index: number }[];
  disabledIndices: number[];
  onToggleDisable: (index: number) => void;
  onDisableAll: (indices: number[]) => void;
  effectsEnabled: boolean;
  onClose: () => void;
  onSpinAgain: () => void;
}

const FUT_SHAPE = 'polygon(0 5%, 8% 4%, 15% 0, 85% 0, 92% 4%, 100% 5%, 100% 82%, 50% 100%, 0 82%)';

export default function BulkResultModal({
  results,
  disabledIndices,
  onToggleDisable,
  onDisableAll,
  effectsEnabled,
  onClose,
  onSpinAgain,
}: BulkResultModalProps) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  // exactly one wild card per bulk, position fixed for the lifetime of the modal
  const [wildIndex] = useState(() => Math.floor(Math.random() * results.length));

  const reveal = (i: number, e: React.MouseEvent<HTMLButtonElement>) => {
    setRevealed(prev => new Set(prev).add(i));
    if (!effectsEnabled) return;
    // burst from the clicked card
    const r = e.currentTarget.getBoundingClientRect();
    const origin = { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight };
    if (i === wildIndex) {
      confetti({
        particleCount: 80,
        spread: 140,
        origin,
        shapes: ['star'],
        scalar: 1.6,
        colors: ['#FFD700', '#FFEA00', '#FFC400', '#FFF176'],
        zIndex: 100,
      });
    }
    confetti({
      particleCount: i === wildIndex ? 180 : 60,
      spread: i === wildIndex ? 120 : 70,
      origin,
      colors: i === wildIndex
        ? ['#ff0080', '#ffd000', '#00ff9d', '#00c8ff', '#a64dff', '#ffffff']
        : ['#FFD700', '#FFA500', '#FF4500', '#FFFFFF', '#E6BE8A'],
      zIndex: 100,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 lg:p-10 max-w-5xl w-full mx-4 max-h-[92dvh] overflow-y-auto shadow-2xl border border-gray-700">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Close">
          ✕
        </button>
        <h2 className="text-2xl font-bold text-white mb-1 text-center">🎁 {results.length} Results</h2>
        <p className="text-gray-400 text-sm text-center mb-4">
          Opened {revealed.size}/{results.length} — click a card to reveal
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
          {results.map(({ text, index }, i) => {
            const open = revealed.has(i);
            const wild = i === wildIndex;
            // FUT-style card outline; the outer layer is the border colour, the inner one the fill
            const outer = 'absolute inset-0 p-[3px]';
            const inner = 'relative w-full h-full flex flex-col items-center justify-center gap-2 px-3 pt-4 pb-[22%] text-center';
            const shape = { clipPath: FUT_SHAPE };
            return (
              // perspective on the wrapper, 3D flip on the inner card
              <div key={i} className={`aspect-[5/8] ${open && wild && effectsEnabled ? 'animate-wild-shake' : ''}`} style={{ perspective: '1000px' }}>
                <div
                  className="relative w-full h-full"
                  style={{
                    transformStyle: 'preserve-3d',
                    transition: effectsEnabled ? 'transform 0.7s' : 'none',
                    transform: open ? 'rotateY(180deg)' : 'none',
                  }}
                >
                  {/* front: closed card, identical for every card (gold) */}
                  <button
                    onClick={(e) => reveal(i, e)}
                    tabIndex={open ? -1 : 0}
                    aria-label={`Open result ${i + 1}`}
                    className={`${outer} bg-amber-200 hover:scale-105 transition-transform`}
                    style={{ ...shape, backfaceVisibility: 'hidden', pointerEvents: open ? 'none' : 'auto' }}
                  >
                    <div
                      className={`${inner} text-amber-900/70 text-6xl font-extrabold`}
                      style={{
                        ...shape,
                        background:
                          'linear-gradient(120deg, transparent 38%, rgba(194,120,30,0.55) 42%, rgba(255,230,150,0.7) 48%, transparent 52%), linear-gradient(160deg, #f8e9b0, #e7c56e 55%, #c99a3e)',
                      }}
                    >
                      ?
                    </div>
                  </button>
                  {/* back: revealed result. Wild = purple + neon green */}
                  <div
                    className={`${outer} ${wild ? 'bg-amber-300' : 'bg-amber-200'}`}
                    style={{ ...shape, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', pointerEvents: open ? 'auto' : 'none' }}
                  >
                    <div
                      className={`${inner} font-extrabold break-words ${wild ? 'holo text-amber-300 ' + (effectsEnabled ? 'holo-anim' : '') : 'text-amber-950'}`}
                      style={{
                        ...shape,
                        background: wild
                          ? 'linear-gradient(135deg, transparent 55%, rgba(96,165,250,0.45) 70%, transparent 82%), linear-gradient(60deg, transparent 60%, rgba(147,197,253,0.35) 75%, transparent 88%), linear-gradient(160deg, #0a1240, #1d3a9e 50%, #0a1a5c)'
                          : 'linear-gradient(160deg, #f8e9b0, #e7c56e 55%, #c99a3e)',
                      }}
                    >
                      {wild && (
                        <>
                          <span className="text-3xl leading-none">CIHUY</span>
                          <span className="text-xs tracking-widest uppercase">★ Wild ★</span>
                        </>
                      )}
                      <span className={`text-base lg:text-lg leading-tight uppercase ${wild ? 'border-y border-amber-300/60 py-1 w-full' : ''}`}>{text}</span>
                      <button
                        onClick={() => onToggleDisable(index)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${wild ? 'bg-amber-300/10 border-amber-300/40 text-amber-300' : 'bg-amber-900/10 border-amber-900/30 text-amber-900'}`}
                      >
                        {disabledIndices.includes(index) ? '👁️ Enable' : '👁️ Disable'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => onDisableAll(results.map(r => r.index))}
          className="w-full mb-3 bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-500 px-6 py-3 rounded-xl font-bold border border-yellow-500/20"
        >
          👁️ Disable All Results
        </button>
        <button
          onClick={onSpinAgain}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold"
        >
          🎡 Spin Again
        </button>
      </div>
    </div>
  );
}
