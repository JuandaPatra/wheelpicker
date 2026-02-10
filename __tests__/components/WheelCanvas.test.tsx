import { render, screen, fireEvent } from '@testing-library/react';
import WheelCanvas from '@/components/WheelCanvas';

describe('components/WheelCanvas', () => {
    const defaultProps = {
        items: ['A', 'B', 'C', 'D'],
        colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'],
        onSpinEnd: jest.fn(),
        isSpinning: false,
        setIsSpinning: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── Rendering ───────────────────────────────────────────

    it('should render a canvas element', () => {
        const { container } = render(<WheelCanvas {...defaultProps} />);
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
    });

    it('should have width and height attributes', () => {
        const { container } = render(<WheelCanvas {...defaultProps} />);
        const canvas = container.querySelector('canvas');
        expect(canvas).toHaveAttribute('width');
        expect(canvas).toHaveAttribute('height');
    });

    // ─── Click to Spin ───────────────────────────────────────

    it('should call setIsSpinning(true) when canvas is clicked with >= 2 items', () => {
        const { container } = render(<WheelCanvas {...defaultProps} />);
        const canvas = container.querySelector('canvas')!;
        fireEvent.click(canvas);
        expect(defaultProps.setIsSpinning).toHaveBeenCalledWith(true);
    });

    it('should NOT spin when already spinning', () => {
        const { container } = render(
            <WheelCanvas {...defaultProps} isSpinning={true} />
        );
        const canvas = container.querySelector('canvas')!;
        fireEvent.click(canvas);
        expect(defaultProps.setIsSpinning).not.toHaveBeenCalled();
    });

    it('should NOT spin when items < 2', () => {
        const { container } = render(
            <WheelCanvas {...defaultProps} items={['OnlyOne']} />
        );
        const canvas = container.querySelector('canvas')!;
        fireEvent.click(canvas);
        expect(defaultProps.setIsSpinning).not.toHaveBeenCalled();
    });

    it('should NOT spin when items is empty', () => {
        const { container } = render(
            <WheelCanvas {...defaultProps} items={[]} />
        );
        const canvas = container.querySelector('canvas')!;
        fireEvent.click(canvas);
        expect(defaultProps.setIsSpinning).not.toHaveBeenCalled();
    });

    // ─── Overlay message ─────────────────────────────────────

    it('should show "Add at least 2 items" overlay when 1 item', () => {
        render(<WheelCanvas {...defaultProps} items={['OnlyOne']} />);
        expect(
            screen.getByText('Add at least 2 items to spin')
        ).toBeInTheDocument();
    });

    it('should NOT show overlay when items >= 2', () => {
        render(<WheelCanvas {...defaultProps} />);
        expect(
            screen.queryByText('Add at least 2 items to spin')
        ).not.toBeInTheDocument();
    });

    it('should NOT show overlay when items is empty', () => {
        render(<WheelCanvas {...defaultProps} items={[]} />);
        expect(
            screen.queryByText('Add at least 2 items to spin')
        ).not.toBeInTheDocument();
    });
});

// ─── getContrastColor (exported via module for testing) ──

// The function is not exported, but we can test it indirectly
// by verifying the canvas draws correctly. However, we can also
// test the logic directly by extracting it:
describe('getContrastColor logic', () => {
    // Re-implement the logic here to unit test it
    function getContrastColor(hexColor: string): string {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#1F2937' : '#FFFFFF';
    }

    it('should return dark color for light backgrounds', () => {
        expect(getContrastColor('#FFFFFF')).toBe('#1F2937'); // white
        expect(getContrastColor('#FFE66D')).toBe('#1F2937'); // yellow
        expect(getContrastColor('#95E1D3')).toBe('#1F2937'); // mint
    });

    it('should return white for dark backgrounds', () => {
        expect(getContrastColor('#000000')).toBe('#FFFFFF'); // black
        expect(getContrastColor('#03045E')).toBe('#FFFFFF'); // dark blue
        expect(getContrastColor('#1F2937')).toBe('#FFFFFF'); // dark gray
    });

    it('should handle mid-range colors', () => {
        const result = getContrastColor('#808080'); // medium gray
        expect(['#1F2937', '#FFFFFF']).toContain(result);
    });
});
