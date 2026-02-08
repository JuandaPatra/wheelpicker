'use client';

import { useState, useRef, useCallback } from 'react';
import {
  parseItems,
  validateItems,
  parseFileContent,
  shuffleArray,
  sortArrayAZ,
  sortArrayZA,
  MAX_ITEMS,
} from '@/utils/validation';

interface ListManagerProps {
  items: string[];
  setItems: (items: string[]) => void;
}

export default function ListManager({ items, setItems }: ListManagerProps) {
  const [inputValue, setInputValue] = useState('');
  const [showAlert, setShowAlert] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showAlertMessage = useCallback((message: string) => {
    setShowAlert(message);
    setTimeout(() => setShowAlert(null), 4000);
  }, []);

  // Add single item
  const handleAddItem = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (items.length >= MAX_ITEMS) {
      showAlertMessage(`You can only add a maximum of ${MAX_ITEMS} items.`);
      return;
    }

    setItems([...items, trimmed]);
    setInputValue('');
  };

  // Handle paste multiline
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const parsed = parseItems(pastedText);
    const result = validateItems(parsed, items.length);

    if (result.wasTruncated) {
      showAlertMessage(
        `Your input contains more than ${MAX_ITEMS} items. We have kept only the first ${MAX_ITEMS}.`
      );
    }

    if (result.items.length > 0) {
      setItems([...items, ...result.items]);
    }
  };

  // Handle file import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseFileContent(content, file.name);
      const result = validateItems(parsed, items.length);

      if (result.wasTruncated) {
        showAlertMessage(
          `Your file contains more than ${MAX_ITEMS} items. We have kept only the first ${MAX_ITEMS}.`
        );
      }

      if (result.items.length > 0) {
        setItems([...items, ...result.items]);
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Sort and shuffle
  const handleSortAZ = () => setItems(sortArrayAZ(items));
  const handleSortZA = () => setItems(sortArrayZA(items));
  const handleShuffle = () => setItems(shuffleArray(items));
  const handleClearAll = () => setItems([]);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">📝</span> List Items
        <span className="text-sm font-normal text-gray-400">
          ({items.length}/{MAX_ITEMS})
        </span>
      </h2>

      {/* Alert popup */}
      {showAlert && (
        <div className="fixed top-4 right-4 z-50 bg-yellow-500 text-black px-6 py-3 rounded-lg shadow-lg animate-slide-in">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span>{showAlert}</span>
          </div>
        </div>
      )}

      {/* Add single item */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          placeholder="Type an item and press Enter"
          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAddItem}
          disabled={items.length >= MAX_ITEMS}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Add
        </button>
      </div>

      {/* Paste area */}
      <div className="mb-4">
        <textarea
          onPaste={handlePaste}
          placeholder="Paste multiple items here (one per line or comma-separated)"
          className="w-full h-20 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          readOnly
        />
      </div>

      {/* File import */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileImport}
          className="hidden"
          id="file-import"
        />
        <label
          htmlFor="file-import"
          className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors"
        >
          <span>📁</span> Import CSV/TXT
        </label>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleSortAZ}
          disabled={items.length === 0}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
        >
          A → Z
        </button>
        <button
          onClick={handleSortZA}
          disabled={items.length === 0}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
        >
          Z → A
        </button>
        <button
          onClick={handleShuffle}
          disabled={items.length === 0}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
        >
          🔀 Shuffle
        </button>
        <button
          onClick={handleClearAll}
          disabled={items.length === 0}
          className="bg-red-600/50 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-sm transition-colors ml-auto"
        >
          🗑️ Clear All
        </button>
      </div>

      {/* Items list */}
      <div className="max-h-64 overflow-y-auto space-y-1">
        {items.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No items yet. Add some above!</p>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-700/50 rounded-lg px-3 py-2 group hover:bg-gray-700"
            >
              <span className="text-white truncate mr-2">{item}</span>
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
