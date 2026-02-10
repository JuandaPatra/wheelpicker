'use client';

import { useState, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import WheelCanvas from '@/components/WheelCanvas';
import ListManager from '@/components/ListManager';
import ResultModal from '@/components/ResultModal';
import SpinHistory from '@/components/SpinHistory';
import ColorPicker from '@/components/ColorPicker';
import { DEFAULT_COLORS } from '@/utils/colors';

interface HistoryEntry {
  winner: string;
  timestamp: number;
}

export default function Home() {
  // Persistent state
  const [items, setItems] = useLocalStorage<string[]>('wheelItems', []);
  const [colors, setColors] = useLocalStorage<string[]>('wheelColors', DEFAULT_COLORS);
  const [backgroundImage, setBackgroundImage] = useLocalStorage<string | null>('wheelBackground', null);
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>('spinHistory', []);
  const [effectsEnabled, setEffectsEnabled] = useLocalStorage<boolean>('effectsEnabled', true);

  // UI state
  const [isSpinning, setIsSpinning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [winner, setWinner] = useState<{ text: string; index: number } | null>(null);
  const [spinDuration, setSpinDuration] = useState<'short' | 'normal' | 'long' | 'epic'>('normal');

  // Handle spin end
  const handleSpinEnd = useCallback((winnerText: string, winnerIndex: number) => {
    setWinner({ text: winnerText, index: winnerIndex });
    setShowModal(true);
    setHistory(prev => [{ winner: winnerText, timestamp: Date.now() }, ...prev]);
  }, [setHistory]);

  // Handle spin again from modal
  const handleSpinAgain = () => {
    setShowModal(false);
    // Small delay before spinning again
    setTimeout(() => {
      setIsSpinning(true);
    }, 200);
  };

  // Handle remove item from modal
  const handleRemoveItem = () => {
    if (winner !== null) {
      setItems(prev => prev.filter((_, i) => i !== winner.index));
    }
    setShowModal(false);
    // Spin again if we have enough items
    setTimeout(() => {
      if (items.length > 2) {
        setIsSpinning(true);
      }
    }, 200);
  };

  return (
    <div
      className="h-screen w-full overflow-y-auto snap-y snap-mandatory bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      style={
        backgroundImage
          ? {
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }
          : undefined
      }
    >
      {/* Header - Fixed or part of the first snap section? Let's keep it part of flow but minimal */}

      {/* Section 1: Wheel (Full Screen Snap) */}
      <section className="h-screen w-full snap-center flex flex-col items-center justify-center p-4">
        <header className="absolute top-0 left-0 right-0 py-4 px-4 text-left z-10">
          <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-transparent bg-clip-text drop-shadow-lg">
            🎡 Wheel Picker
          </h1>
        </header>

        <div className="flex-1 flex items-center justify-center w-full max-h-full relative">
          <WheelCanvas
            items={items}
            colors={colors}
            onSpinEnd={handleSpinEnd}
            isSpinning={isSpinning}
            setIsSpinning={setIsSpinning}
            spinDuration={spinDuration}
            effectsEnabled={effectsEnabled}
          />
          {/* Vignette Overlay (Full Screen) */}
          <div
            className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 z-50
              bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)]
              ${isSpinning && effectsEnabled ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>
      </section>

      {/* Section 2: Controls (Snap Start) */}
      <section className="min-h-screen w-full snap-start container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8 bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-xl">
          <ListManager items={items} setItems={setItems} />
          <div className="flex flex-col gap-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Spin Speed
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {(['short', 'normal', 'long', 'epic'] as const).map((duration) => (
                  <button
                    key={duration}
                    onClick={() => setSpinDuration(duration)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${spinDuration === duration
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                  >
                    {duration === 'epic' ? 'Slow 🐢' : duration}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">✨</span> Visual Effects
                </h2>
                <button
                  onClick={() => setEffectsEnabled(!effectsEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${effectsEnabled ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${effectsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Disable animations, confetti, and sparkles for a simpler experience.
              </p>
            </div>

            <ColorPicker
              colors={colors}
              setColors={setColors}
              backgroundImage={backgroundImage}
              setBackgroundImage={setBackgroundImage}
            />
            <SpinHistory history={history} />
          </div>
        </div>
        <footer className="text-center text-gray-500 py-8">
          Scroll up to spin! ↑
        </footer>
      </section>

      {/* Result Modal */}
      <ResultModal
        isOpen={showModal}
        winner={winner?.text || ''}
        onClose={() => setShowModal(false)}
        onSpinAgain={handleSpinAgain}
        onRemoveItem={handleRemoveItem}
        effectsEnabled={effectsEnabled}
      />
    </div>
  );
}
