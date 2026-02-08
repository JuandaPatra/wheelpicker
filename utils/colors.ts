// High-contrast default color palette for the wheel
export const DEFAULT_COLORS = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Teal
  '#FFE66D', // Yellow
  '#95E1D3', // Mint
  '#F38181', // Salmon
  '#AA96DA', // Lavender
  '#FCBAD3', // Pink
  '#A8D8EA', // Light Blue
  '#FF9F43', // Orange
  '#6BCB77', // Green
  '#4D96FF', // Blue
  '#C9B1FF', // Purple
];

// Preset color themes
export const COLOR_PRESETS = {
  vibrant: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA', '#FF9F43', '#6BCB77', '#4D96FF', '#C9B1FF'],
  pastel: ['#FFB5B5', '#B5EAD7', '#FFDAC1', '#E2F0CB', '#C7CEEA', '#FF9AA2', '#B5B9FF', '#FFDFBA', '#FFFFBA', '#BAFFC9'],
  neon: ['#FF0080', '#00FF00', '#00FFFF', '#FF00FF', '#FFFF00', '#FF6600', '#0066FF', '#9933FF', '#00FF99', '#FF3366'],
  autumn: ['#D4A373', '#BC6C25', '#DDA15E', '#606C38', '#283618', '#FEFAE0', '#E9EDC9', '#CCD5AE', '#B7C4AA', '#A98467'],
  ocean: ['#03045E', '#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#48CAE4', '#00A8E8', '#007EA7', '#003459', '#00171F'],
};

export type ColorPreset = keyof typeof COLOR_PRESETS;
