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

  // UI state
  const [isSpinning, setIsSpinning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [winner, setWinner] = useState<{ text: string; index: number } | null>(null);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="py-6 px-4 text-center border-b border-gray-700/50">
        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-transparent bg-clip-text">
          🎡 Wheel Picker
        </h1>
        <p className="text-gray-400 mt-2">Click the wheel to spin!</p>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left: Wheel */}
          <div className="flex flex-col items-center gap-6">
            <WheelCanvas
              items={items}
              colors={colors}
              backgroundImage={backgroundImage}
              onSpinEnd={handleSpinEnd}
              isSpinning={isSpinning}
              setIsSpinning={setIsSpinning}
            />
            
            <SpinHistory history={history} />
          </div>

          {/* Right: Controls */}
          <div className="flex flex-col gap-6">
            <ListManager items={items} setItems={setItems} />
            <ColorPicker
              colors={colors}
              setColors={setColors}
              backgroundImage={backgroundImage}
              setBackgroundImage={setBackgroundImage}
            />
          </div>
        </div>
      </main>

      {/* Result Modal */}
      <ResultModal
        isOpen={showModal}
        winner={winner?.text || ''}
        onClose={() => setShowModal(false)}
        onSpinAgain={handleSpinAgain}
        onRemoveItem={handleRemoveItem}
      />
    </div>
  );
}
