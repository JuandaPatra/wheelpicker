import { DEFAULT_COLORS, COLOR_PRESETS } from '@/utils/colors';

describe('utils/colors', () => {
    describe('DEFAULT_COLORS', () => {
        it('should contain exactly 12 colors', () => {
            expect(DEFAULT_COLORS).toHaveLength(12);
        });

        it('should contain valid hex color strings', () => {
            const hexRegex = /^#[0-9A-Fa-f]{6}$/;
            DEFAULT_COLORS.forEach((color) => {
                expect(color).toMatch(hexRegex);
            });
        });
    });

    describe('COLOR_PRESETS', () => {
        const presetNames: (keyof typeof COLOR_PRESETS)[] = [
            'vibrant',
            'pastel',
            'neon',
            'autumn',
            'ocean',
        ];

        it('should have all 5 preset themes', () => {
            expect(Object.keys(COLOR_PRESETS)).toHaveLength(5);
            presetNames.forEach((name) => {
                expect(COLOR_PRESETS).toHaveProperty(name);
            });
        });

        it.each(presetNames)('preset "%s" should be a non-empty array of valid hex colors', (preset) => {
            const colors = COLOR_PRESETS[preset];
            expect(colors.length).toBeGreaterThan(0);
            colors.forEach((color) => {
                expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
            });
        });

        it('vibrant preset should match DEFAULT_COLORS', () => {
            expect(COLOR_PRESETS.vibrant).toEqual(DEFAULT_COLORS);
        });
    });
});
