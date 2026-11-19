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

  const reveal = (i: number, e: React.MouseEvent<HTMLButtonElement>) => {
    setRevealed(prev => new Set(prev).add(i));
    if (!effectsEnabled) return;
    // burst from the clicked card
    const r = e.currentTarget.getBoundingClientRect();
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight },
      colors: ['#FFD700', '#FFA500', '#FF4500', '#FFFFFF', '#E6BE8A'],
      zIndex: 100,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90dvh] overflow-y-auto shadow-2xl border border-gray-700">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Close">
          ✕
        </button>
        <h2 className="text-2xl font-bold text-white mb-1 text-center">🎁 {results.length} Results</h2>
        <p className="text-gray-400 text-sm text-center mb-4">
          Opened {revealed.size}/{results.length} — click a card to reveal
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {results.map(({ text, index }, i) =>
            revealed.has(i) ? (
              <div
                key={i}
                className={`min-h-24 flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-gray-700 border border-yellow-500/40 text-yellow-300 font-bold text-center break-words ${effectsEnabled ? 'animate-scale-in' : ''}`}
              >
                {text}
                <button
                  onClick={() => onToggleDisable(index)}
                  className="text-xs font-medium px-2 py-1 rounded-lg bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-500 border border-yellow-500/20"
                >
                  {disabledIndices.includes(index) ? '👁️ Enable' : '👁️ Disable'}
                </button>
              </div>
            ) : (
              <button
                key={i}
                onClick={(e) => reveal(i, e)}
                className="min-h-24 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 hover:scale-105 transition-transform text-white text-3xl font-extrabold shadow-lg"
                aria-label={`Open result ${i + 1}`}
              >
                ?
              </button>
            )
          )}
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
