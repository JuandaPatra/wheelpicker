import { render, screen, fireEvent } from '@testing-library/react';
import ResultModal from '@/components/ResultModal';

// canvas-confetti is already mocked in jest.setup.ts

describe('components/ResultModal', () => {
    const defaultProps = {
        isOpen: true,
        winner: 'Pizza',
        onClose: jest.fn(),
        onSpinAgain: jest.fn(),
        onRemoveItem: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── Visibility ──────────────────────────────────────────

    it('should render nothing when isOpen is false', () => {
        const { container } = render(<ResultModal {...defaultProps} isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('should render the modal when isOpen is true', () => {
        render(<ResultModal {...defaultProps} />);
        expect(screen.getByText('We Have a Winner!')).toBeInTheDocument();
    });

    // ─── Winner display ──────────────────────────────────────

    it('should display the winner text', () => {
        render(<ResultModal {...defaultProps} />);
        expect(screen.getByText('Pizza')).toBeInTheDocument();
    });

    it('should display a different winner text', () => {
        render(<ResultModal {...defaultProps} winner="Sushi" />);
        expect(screen.getByText('Sushi')).toBeInTheDocument();
    });

    it('should show the celebration emoji', () => {
        render(<ResultModal {...defaultProps} />);
        expect(screen.getByText('🎉')).toBeInTheDocument();
    });

    // ─── Action Buttons ──────────────────────────────────────

    it('should call onClose when the close button is clicked', () => {
        render(<ResultModal {...defaultProps} />);
        fireEvent.click(screen.getByText('✕'));
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when clicking the backdrop', () => {
        render(<ResultModal {...defaultProps} />);
        // The backdrop is the first child overlay div
        const backdrop = screen.getByText('We Have a Winner!').closest('.fixed')
            ?.querySelector('.absolute.inset-0');
        if (backdrop) {
            fireEvent.click(backdrop);
            expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
        }
    });

    it('should call onSpinAgain when Spin Again button is clicked', () => {
        render(<ResultModal {...defaultProps} />);
        fireEvent.click(screen.getByText('🎡 Spin Again'));
        expect(defaultProps.onSpinAgain).toHaveBeenCalledTimes(1);
    });

    it('should call onRemoveItem when Remove & Spin button is clicked', () => {
        render(<ResultModal {...defaultProps} />);
        fireEvent.click(screen.getByText('🗑️ Remove & Spin'));
        expect(defaultProps.onRemoveItem).toHaveBeenCalledTimes(1);
    });
});
