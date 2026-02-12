'use client';

import { useRef } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { COLOR_PRESETS, ColorPreset } from '@/utils/colors';

interface ColorPickerProps {
  colors: string[];
  setColors: (colors: string[]) => void;
  backgroundImage: string | null;
  setBackgroundImage: (image: string | null) => void;
}

const extractColorsFromImage = (dataUrl: string): Promise<string[]> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve([]);
        return;
      }
      // Small size for performance
      const size = 50;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size).data;
      const colorCounts: Record<string, number> = {};

      // Sample pixels to find dominant colors
      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];

        // Skip transparent or too dark/light pixels
        if (a < 128) continue;
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (brightness < 30 || brightness > 245) continue;

        // Quantize colors to group similar ones
        const qr = Math.round(r / 20) * 20;
        const qg = Math.round(g / 20) * 20;
        const qb = Math.round(b / 20) * 20;
        const hex = `#${qr.toString(16).padStart(2, '0')}${qg.toString(16).padStart(2, '0')}${qb.toString(16).padStart(2, '0')}`.toUpperCase();

        // Ensure hex is 7 characters
        if (hex.length === 7) {
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }
      }

      const sortedColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([color]) => color);

      // Pad with default colors if we didn't find enough
      if (sortedColors.length < 2) {
        resolve(['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181']);
      } else {
        resolve(sortedColors);
      }
    };
    img.onerror = () => resolve([]);
    img.src = dataUrl;
  });
};

export default function ColorPicker({
  colors,
  setColors,
  backgroundImage,
  setBackgroundImage,
}: ColorPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Keep track of colors extracted from the current background image
  const [imageColors, setImageColors] = useLocalStorage<string[]>('imageExtractedColors', []);

  const handlePresetSelect = (preset: ColorPreset) => {
    setColors(COLOR_PRESETS[preset]);
  };

  const handleImageThemeSelect = () => {
    if (imageColors.length > 0) {
      setColors(imageColors);
    }
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
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setBackgroundImage(dataUrl);

      // Auto-extract colors
      const extractedColors = await extractColorsFromImage(dataUrl);
      if (extractedColors.length > 0) {
        setImageColors(extractedColors);
        setColors(extractedColors);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = () => {
    setBackgroundImage(null);
    setImageColors([]);
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
          {backgroundImage && imageColors.length > 0 && (
            <button
              onClick={handleImageThemeSelect}
              className="px-3 py-1.5 rounded-lg text-sm font-medium capitalize bg-blue-600/50 hover:bg-blue-600/70 text-white border border-blue-400/30 transition-colors flex items-center gap-1.5"
            >
              <span>🖼️</span> Image Theme
            </button>
          )}
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
              <span>⚠️</span> Background images may reduce text readability. Colors auto-extracted.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
