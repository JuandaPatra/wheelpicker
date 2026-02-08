'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface ResultModalProps {
  isOpen: boolean;
  winner: string;
  onClose: () => void;
  onSpinAgain: () => void;
  onRemoveItem: () => void;
}

export default function ResultModal({
  isOpen,
  winner,
  onClose,
  onSpinAgain,
  onRemoveItem,
}: ResultModalProps) {
  const hasTriggeredConfetti = useRef(false);

  useEffect(() => {
    if (isOpen && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;
      
      // Fire confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#AA96DA'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#AA96DA'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }

    if (!isOpen) {
      hasTriggeredConfetti.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700 animate-scale-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">We Have a Winner!</h2>
          <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-transparent bg-clip-text text-4xl font-extrabold py-4 px-6 mb-6 break-words">
            {winner}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onSpinAgain}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
            >
              🎡 Spin Again
            </button>
            <button
              onClick={onRemoveItem}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
            >
              🗑️ Remove & Spin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
