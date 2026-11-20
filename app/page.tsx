'use client';

import { useState, useCallback, useRef } from 'react';
import BulkResultModal from '@/components/BulkResultModal';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import WheelCanvas, { WHEEL_SHAPES, type WheelShape } from '@/components/WheelCanvas';
import ListManager from '@/components/ListManager';
import ResultModal from '@/components/ResultModal';
import SpinHistory from '@/components/SpinHistory';
import ColorPicker from '@/components/ColorPicker';
import { DEFAULT_COLORS } from '@/utils/colors';
import { getWheelItems } from '@/utils/wheelUtils';
import { shuffleArray, MAX_ITEMS } from '@/utils/validation';
import { useMemo } from 'react';

interface HistoryEntry {
  winner: string;
  timestamp: number;
}

export default function Home() {
  const wheelContainerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);
  // Persistent state
  const [items, setItems] = useLocalStorage<string[]>('wheelItems', []);
  const [colors, setColors] = useLocalStorage<string[]>('wheelColors', DEFAULT_COLORS);
  const [backgroundImage, setBackgroundImage] = useLocalStorage<string | null>('wheelBackground', null);
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>('spinHistory', []);
  const [effectsEnabled, setEffectsEnabled] = useLocalStorage<boolean>('effectsEnabled', true);
  const [shape, setShape] = useLocalStorage<WheelShape>('wheelShape', 'classic');
  const [repeatCount, setRepeatCount] = useLocalStorage<number>('repeatCount', 1);
  const [disabledIndices, setDisabledIndices] = useLocalStorage<number[]>('disabledIndices', []);

  // UI state
  const [isSpinning, setIsSpinning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [winner, setWinner] = useState<{ text: string; index: number } | null>(null);
  const [spinDuration, setSpinDuration] = useState<'short' | 'normal' | 'long' | 'epic'>('normal');

  // Calculate items actually shown on the wheel
  const { wheelItems, originalIndices: wheelMapping } = useMemo(() =>
    getWheelItems(items, disabledIndices, repeatCount),
    [items, disabledIndices, repeatCount]
  );

  // ?bulk=N: one spin yields N results, each opened by click
  const [bulkEnabled, setBulkEnabled] = useLocalStorage<boolean>('bulkEnabled', false);
  const [bulkCount, setBulkCount] = useLocalStorage<number>('bulkCount', 5);
  const [urlBulk] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const n = parseInt(new URLSearchParams(window.location.search).get('bulk') ?? '', 10);
    return Number.isFinite(n) ? Math.min(Math.max(n, 1), MAX_ITEMS) : null;
  });
  // ?bulk=N seeds the controls; once the user touches them, they take over
  const [urlActive, setUrlActive] = useState(urlBulk !== null);
  const bulkOn = urlActive || bulkEnabled;
  const bulkShown = urlActive ? urlBulk! : bulkCount;
  const bulk = bulkOn ? bulkShown : 1;
  const toggleBulk = () => {
    setUrlActive(false);
    setBulkEnabled(!bulkOn);
    if (urlActive) setBulkCount(bulkShown);
  };
  const [bulkResults, setBulkResults] = useState<{ text: string; index: number }[] | null>(null);

  // Handle spin end
  const handleSpinEnd = useCallback((winnerText: string, winnerIndex: number) => {
    if (bulk > 1) {
      // every card is a different item; fewer unique items than `bulk` means fewer cards
      const winnerSrc = wheelMapping[winnerIndex];
      const others = shuffleArray([...new Set(wheelMapping)].filter(src => src !== winnerSrc)).slice(0, bulk - 1);
      const all = [winnerSrc, ...others].map(src => ({ text: items[src], index: src }));
      setBulkResults(all);
      setHistory(prev => [...all.map(r => ({ winner: r.text, timestamp: Date.now() })), ...prev]);
      return;
    }
    // Map wheel index back to source index
    const sourceIndex = wheelMapping[winnerIndex];
    setWinner({ text: winnerText, index: sourceIndex });
    setShowModal(true);
    setHistory(prev => [{ winner: winnerText, timestamp: Date.now() }, ...prev]);
  }, [setHistory, wheelMapping, bulk, items]);

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
      const removedIndex = winner.index;
      setItems(prev => prev.filter((_, i) => i !== removedIndex));

      // Update disabled indices because they shift
      setDisabledIndices(prev =>
        prev
          .filter(i => i !== removedIndex)
          .map(i => i > removedIndex ? i - 1 : i)
      );
    }
    setShowModal(false);
    // Spin again if we have enough items
    setTimeout(() => {
      if (wheelItems.length >= 2) {
        setIsSpinning(true);
      }
    }, 200);
  };

  const toggleDisable = (index: number) => {
    setDisabledIndices(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Shuffle items AND remap disabledIndices so disabled states follow their items
  const handleShuffle = useCallback(() => {
    // Build an array of indices [0, 1, 2, ...] and shuffle it
    const indices = items.map((_, i) => i);
    const shuffledIndices = shuffleArray(indices);

    // Reorder items according to shuffled indices
    const newItems = shuffledIndices.map(i => items[i]);

    // Build a reverse mapping: oldIndex -> newIndex
    const oldToNew = new Map<number, number>();
    shuffledIndices.forEach((oldIdx, newIdx) => {
      oldToNew.set(oldIdx, newIdx);
    });

    // Remap disabled indices to follow items to their new positions
    const newDisabled = disabledIndices.map(oldIdx => oldToNew.get(oldIdx)!).filter(i => i !== undefined);

    setItems(newItems);
    setDisabledIndices(newDisabled);
  }, [items, disabledIndices, setItems, setDisabledIndices]);

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => setShowTop(e.currentTarget.scrollTop > 300)}
      className={`h-dvh w-full overflow-y-auto snap-y snap-mandatory ${!backgroundImage ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : ''}`}
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
      <section className="h-dvh w-full snap-center flex flex-col items-center justify-center p-4">
        <header className="absolute top-0 left-0 right-0 py-4 px-4 text-left z-10">
          <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-transparent bg-clip-text drop-shadow-lg">
            🎡 Wheel Picker
          </h1>
        </header>

        <div ref={wheelContainerRef} className="flex-1 flex items-center justify-center w-full max-h-full relative">
          <WheelCanvas
            items={wheelItems}
            colors={colors}
            onSpinEnd={handleSpinEnd}
            isSpinning={isSpinning}
            setIsSpinning={setIsSpinning}
            spinDuration={spinDuration}
            effectsEnabled={effectsEnabled}
            shape={shape}
            containerRef={wheelContainerRef}
          />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 flex gap-1 rounded-full bg-gray-900/70 p-1">
            {WHEEL_SHAPES.map((s) => (
              <button
                key={s}
                type="button"
                disabled={isSpinning}
                aria-pressed={shape === s}
                onClick={() => setShape(s)}
                className={`px-3 py-1 rounded-full text-sm capitalize disabled:opacity-50 ${shape === s ? 'bg-pink-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
              >
                {s}
              </button>
            ))}
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-xl">
          <ListManager
            items={items}
            setItems={setItems}
            disabledIndices={disabledIndices}
            onToggleDisable={toggleDisable}
            onEnableAll={() => setDisabledIndices([])}
            onShuffle={handleShuffle}
          />
          {/* Height follows the list; history scrolls inside it instead of growing */}
          <div className="h-80 md:h-auto md:relative">
            <div className="h-full md:absolute md:inset-0">
              <SpinHistory history={history} />
            </div>
          </div>
          <div className="md:col-span-2 flex flex-col md:grid md:grid-cols-2 gap-6 items-start">
            <div className="w-full bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
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
                    {duration === 'short' ? 'Fast' :
                      duration === 'normal' ? 'Normal' :
                        duration === 'long' ? 'Slow Stop' :
                          'Very Slow 🐢'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">🎁</span> Bulk Results
                </h2>
                <button
                  onClick={toggleBulk}
                  aria-label="Toggle bulk results"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${bulkOn ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bulkOn ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <label htmlFor="bulkCount" className="text-gray-300">Cards per spin (max {MAX_ITEMS})</label>
                <input
                  id="bulkCount"
                  type="number"
                  min={2}
                  max={MAX_ITEMS}
                  value={bulkShown}
                  disabled={!bulkOn}
                  onChange={(e) => {
                    setUrlActive(false);
                    setBulkEnabled(true);
                    setBulkCount(Math.min(Math.max(parseInt(e.target.value) || 2, 2), MAX_ITEMS));
                  }}
                  className="w-20 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-white disabled:opacity-50"
                />
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

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🔄</span> Repeat List
              </h2>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Multiplier: {repeatCount}x</span>
                  <span className="text-sm text-gray-400">Total slices: {wheelItems.length}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={repeatCount}
                  onChange={(e) => setRepeatCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-1"
                />
                <div className="flex justify-between text-xs text-gray-500 px-1">
                  <span>1x</span>
                  <span>4x</span>
                  <span>7x</span>
                  <span>10x</span>
                </div>
              </div>
              <p className="text-gray-400 text-xs mt-3">
                Repeats the active list multiple times on the wheel. Useful for probability adjustments.
              </p>
            </div>

            <ColorPicker
              colors={colors}
              setColors={setColors}
              backgroundImage={backgroundImage}
              setBackgroundImage={setBackgroundImage}
            />
          </div>
        </div>
        <footer className="text-center text-gray-500 py-8">
          Scroll up to spin! ↑
        </footer>
      </section>

      {bulkResults && (
        <BulkResultModal
          results={bulkResults}
          disabledIndices={disabledIndices}
          onToggleDisable={toggleDisable}
          onDisableAll={(indices) => setDisabledIndices(prev => [...new Set([...prev, ...indices])])}
          effectsEnabled={effectsEnabled}
          onClose={() => setBulkResults(null)}
          onSpinAgain={() => {
            setBulkResults(null);
            setTimeout(() => setIsSpinning(true), 200);
          }}
        />
      )}

      {showTop && (
        <button
          onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-2xl shadow-xl transition-colors"
        >
          ↑
        </button>
      )}

      {/* Result Modal */}
      <ResultModal
        isOpen={showModal}
        winner={winner?.text || ''}
        onClose={() => setShowModal(false)}
        onSpinAgain={handleSpinAgain}
        onRemoveItem={handleRemoveItem}
        onDisableItem={() => {
          if (winner !== null) {
            toggleDisable(winner.index);
          }
          setShowModal(false);
        }}
        effectsEnabled={effectsEnabled}
      />
    </div>
  );
}
