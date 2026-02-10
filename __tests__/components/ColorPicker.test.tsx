import { render, screen, fireEvent } from '@testing-library/react';
import ColorPicker from '@/components/ColorPicker';
import { COLOR_PRESETS } from '@/utils/colors';

describe('components/ColorPicker', () => {
    const defaultProps = {
        colors: ['#FF6B6B', '#4ECDC4', '#FFE66D'],
        setColors: jest.fn(),
        backgroundImage: null,
        setBackgroundImage: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render the Customize heading', () => {
        render(<ColorPicker {...defaultProps} />);
        expect(screen.getByText('Customize')).toBeInTheDocument();
    });

    // ─── Preset Buttons ──────────────────────────────────────

    it('should render preset buttons for all 5 themes', () => {
        render(<ColorPicker {...defaultProps} />);
        const presetNames = Object.keys(COLOR_PRESETS);
        presetNames.forEach((name) => {
            expect(screen.getByText(name)).toBeInTheDocument();
        });
    });

    it('should call setColors with the correct palette when a preset is clicked', () => {
        render(<ColorPicker {...defaultProps} />);
        fireEvent.click(screen.getByText('pastel'));
        expect(defaultProps.setColors).toHaveBeenCalledWith(COLOR_PRESETS.pastel);
    });

    // ─── Custom Colors ───────────────────────────────────────

    it('should render color inputs matching the colors array length', () => {
        render(<ColorPicker {...defaultProps} />);
        const colorInputs = screen.getAllByDisplayValue(/#[0-9A-Fa-f]{6}/);
        expect(colorInputs.length).toBe(defaultProps.colors.length);
    });

    it('should call setColors when a custom color is changed', () => {
        render(<ColorPicker {...defaultProps} />);
        const colorInputs = screen.getAllByDisplayValue(/#[0-9A-Fa-f]{6}/);
        fireEvent.change(colorInputs[0], { target: { value: '#000000' } });
        expect(defaultProps.setColors).toHaveBeenCalledWith([
            '#000000',
            '#4ECDC4',
            '#FFE66D',
        ]);
    });

    // ─── Add Color ───────────────────────────────────────────

    it('should show add button when colors < 12', () => {
        render(<ColorPicker {...defaultProps} />);
        expect(screen.getByText('+')).toBeInTheDocument();
    });

    it('should hide add button when colors = 12', () => {
        const twelve = Array(12).fill('#FF6B6B');
        render(<ColorPicker {...defaultProps} colors={twelve} />);
        expect(screen.queryByText('+')).not.toBeInTheDocument();
    });

    it('should call setColors with a new random color when add is clicked', () => {
        render(<ColorPicker {...defaultProps} />);
        fireEvent.click(screen.getByText('+'));
        expect(defaultProps.setColors).toHaveBeenCalled();
        const newColors = defaultProps.setColors.mock.calls[0][0];
        expect(newColors).toHaveLength(4); // 3 + 1
    });

    // ─── Remove Color ────────────────────────────────────────

    it('should show remove buttons when colors > 2', () => {
        render(<ColorPicker {...defaultProps} />);
        const removeButtons = screen.getAllByText('✕');
        expect(removeButtons.length).toBe(defaultProps.colors.length);
    });

    it('should NOT show remove buttons when colors = 2', () => {
        const twoColors = ['#FF6B6B', '#4ECDC4'];
        render(<ColorPicker {...defaultProps} colors={twoColors} />);
        expect(screen.queryByText('✕')).not.toBeInTheDocument();
    });

    it('should remove the correct color when remove is clicked', () => {
        render(<ColorPicker {...defaultProps} />);
        const removeButtons = screen.getAllByText('✕');
        fireEvent.click(removeButtons[1]); // remove second color
        expect(defaultProps.setColors).toHaveBeenCalledWith(['#FF6B6B', '#FFE66D']);
    });

    // ─── Background Image ────────────────────────────────────

    it('should show Upload button', () => {
        render(<ColorPicker {...defaultProps} />);
        expect(screen.getByText('Upload')).toBeInTheDocument();
    });

    it('should show Remove button and warning when backgroundImage is set', () => {
        render(<ColorPicker {...defaultProps} backgroundImage="data:image/png;base64,abc" />);
        expect(screen.getByText('Remove')).toBeInTheDocument();
        expect(
            screen.getByText('Background images may reduce text readability')
        ).toBeInTheDocument();
    });

    it('should NOT show Remove button when backgroundImage is null', () => {
        render(<ColorPicker {...defaultProps} />);
        expect(screen.queryByText('Remove')).not.toBeInTheDocument();
    });

    it('should call setBackgroundImage(null) when Remove is clicked', () => {
        render(<ColorPicker {...defaultProps} backgroundImage="data:image/png;base64,abc" />);
        fireEvent.click(screen.getByText('Remove'));
        expect(defaultProps.setBackgroundImage).toHaveBeenCalledWith(null);
    });

    // ─── Color count display ─────────────────────────────────

    it('should display the current color count', () => {
        render(<ColorPicker {...defaultProps} />);
        expect(screen.getByText('Custom Colors (3/12)')).toBeInTheDocument();
    });
});
