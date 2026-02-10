'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import Image from 'next/image';

interface ResultModalProps {
  isOpen: boolean;
  winner: string;
  onClose: () => void;
  onSpinAgain: () => void;
  onRemoveItem: () => void;
  effectsEnabled: boolean;
}

export default function ResultModal({
  isOpen,
  winner,
  onClose,
  onSpinAgain,
  onRemoveItem,
  effectsEnabled,
}: ResultModalProps) {
  const hasTriggeredConfetti = useRef(false);

  useEffect(() => {
    if (isOpen && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;

      if (!effectsEnabled) return;

      // Fire confetti with Jackpot colors
      const duration = 3000;
      const end = Date.now() + duration;
      const colors = ['#FFD700', '#FFA500', '#FF4500', '#FFFFFF', '#E6BE8A'];

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: colors,
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
  }, [isOpen, effectsEnabled]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700 ${effectsEnabled ? 'animate-scale-in' : ''}`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        {/* Content */}
        <div className="text-center">
          <div className={`flex flex-col items-center justify-center mb-6 ${effectsEnabled ? 'animate-bounce' : ''}`}>
            <div className="relative w-48 h-48 drop-shadow-2xl filter hover:scale-110 transition-transform duration-300">
              <Image
                src="/jackpot_777.png"
                alt="777 Jackpot"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
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
