import { render, screen } from '@testing-library/react';
import SpinHistory from '@/components/SpinHistory';

describe('components/SpinHistory', () => {
    // ─── Empty State ─────────────────────────────────────────

    it('should show "No spins yet" when history is empty', () => {
        render(<SpinHistory history={[]} />);
        expect(
            screen.getByText('No spins yet. Give it a try!')
        ).toBeInTheDocument();
    });

    it('should show Spin History heading when history is empty', () => {
        render(<SpinHistory history={[]} />);
        expect(screen.getByText('Spin History')).toBeInTheDocument();
    });

    // ─── With History ────────────────────────────────────────

    it('should render all history entries', () => {
        const history = [
            { winner: 'Alpha', timestamp: Date.now() },
            { winner: 'Beta', timestamp: Date.now() - 1000 },
            { winner: 'Gamma', timestamp: Date.now() - 2000 },
        ];
        render(<SpinHistory history={history} />);
        expect(screen.getByText('Alpha')).toBeInTheDocument();
        expect(screen.getByText('Beta')).toBeInTheDocument();
        expect(screen.getByText('Gamma')).toBeInTheDocument();
    });

    it('should display entry count', () => {
        const history = [
            { winner: 'A', timestamp: Date.now() },
            { winner: 'B', timestamp: Date.now() },
        ];
        render(<SpinHistory history={history} />);
        expect(screen.getByText('(2)')).toBeInTheDocument();
    });

    it('should display descending rank numbers (most recent first)', () => {
        const history = [
            { winner: 'First', timestamp: Date.now() },
            { winner: 'Second', timestamp: Date.now() - 1000 },
        ];
        render(<SpinHistory history={history} />);
        // First entry should be #2 (total count), second should be #1
        expect(screen.getByText('#2')).toBeInTheDocument();
        expect(screen.getByText('#1')).toBeInTheDocument();
    });

    it('should display formatted time for each entry', () => {
        const now = new Date(2026, 1, 10, 14, 30, 0).getTime(); // 2:30 PM
        const history = [{ winner: 'Test', timestamp: now }];
        const { container } = render(<SpinHistory history={history} />);

        // Should show a time string (format varies by locale)
        // Match both colon and period separators (e.g., "2:30" or "14.30")
        expect(container.textContent).toMatch(/\d{1,2}[:.]\d{2}/);
    });

    it('should render the 📜 emoji', () => {
        render(<SpinHistory history={[]} />);
        expect(screen.getByText('📜')).toBeInTheDocument();
    });
});
