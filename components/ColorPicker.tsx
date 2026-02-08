'use client';

import { useRef } from 'react';
import { COLOR_PRESETS, ColorPreset } from '@/utils/colors';

interface ColorPickerProps {
  colors: string[];
  setColors: (colors: string[]) => void;
  backgroundImage: string | null;
  setBackgroundImage: (image: string | null) => void;
}

export default function ColorPicker({
  colors,
  setColors,
  backgroundImage,
  setBackgroundImage,
}: ColorPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePresetSelect = (preset: ColorPreset) => {
    setColors(COLOR_PRESETS[preset]);
  };

  const handleCustomColor = (index: number, color: string) => {
    const newColors = [...colors];
    newColors[index] = color;
    setColors(newColors);
  };

  const handleAddColor = () => {
    if (colors.length < 12) {
      setColors([...colors, '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')]);
    }
  };

  const handleRemoveColor = (index: number) => {
    if (colors.length > 2) {
      setColors(colors.filter((_, i) => i !== index));
    }
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBackgroundImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = () => {
    setBackgroundImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">🎨</span> Customize
      </h2>

      {/* Color presets */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">Color Presets</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(COLOR_PRESETS) as ColorPreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetSelect(preset)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium capitalize bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Custom colors */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Custom Colors ({colors.length}/12)
        </label>
        <div className="flex flex-wrap gap-2">
          {colors.map((color, index) => (
            <div key={index} className="relative group">
              <input
                type="color"
                value={color}
                onChange={(e) => handleCustomColor(index, e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-600 hover:border-gray-500"
              />
              {colors.length > 2 && (
                <button
                  onClick={() => handleRemoveColor(index)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {colors.length < 12 && (
            <button
              onClick={handleAddColor}
              className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300 transition-colors flex items-center justify-center text-xl"
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* Background image */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Background Image
        </label>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleBackgroundUpload}
            className="hidden"
            id="bg-upload"
          />
          <label
            htmlFor="bg-upload"
            className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors text-sm"
          >
            <span>🖼️</span> Upload
          </label>
          {backgroundImage && (
            <button
              onClick={handleRemoveBackground}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Remove
            </button>
          )}
        </div>
        {backgroundImage && (
          <div className="mt-2 p-1 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
            <p className="text-yellow-400 text-xs flex items-center gap-1">
              <span>⚠️</span> Background images may reduce text readability
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
