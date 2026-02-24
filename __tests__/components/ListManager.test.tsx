import { render, screen, fireEvent } from '@testing-library/react';
import ListManager from '@/components/ListManager';
import { MAX_ITEMS } from '@/utils/validation';

describe('components/ListManager', () => {
    const defaultProps = {
        items: ['Apple', 'Banana', 'Cherry'],
        setItems: jest.fn(),
        disabledIndices: [],
        onToggleDisable: jest.fn(),
        onEnableAll: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Provide browser APIs not available in jsdom
        global.URL.createObjectURL = jest.fn(() => 'blob:mock');
        global.URL.revokeObjectURL = jest.fn();
    });

    it('should render the List Items heading with count', () => {
        render(<ListManager {...defaultProps} />);
        expect(screen.getByText(`(${defaultProps.items.length}/${MAX_ITEMS})`)).toBeInTheDocument();
    });

    it('should render all items', () => {
        render(<ListManager {...defaultProps} />);
        defaultProps.items.forEach((item) => {
            expect(screen.getByText(item)).toBeInTheDocument();
        });
    });

    // ─── Add Item ────────────────────────────────────────────

    it('should add an item when the Add button is clicked', () => {
        render(<ListManager {...defaultProps} />);
        const input = screen.getByPlaceholderText('Type an item and press Enter');
        fireEvent.change(input, { target: { value: 'Durian' } });
        fireEvent.click(screen.getByText('Add'));
        expect(defaultProps.setItems).toHaveBeenCalledWith([
            'Apple',
            'Banana',
            'Cherry',
            'Durian',
        ]);
    });

    it('should add an item when Enter key is pressed', () => {
        render(<ListManager {...defaultProps} />);
        const input = screen.getByPlaceholderText('Type an item and press Enter');
        fireEvent.change(input, { target: { value: 'Elderberry' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(defaultProps.setItems).toHaveBeenCalledWith([
            'Apple',
            'Banana',
            'Cherry',
            'Elderberry',
        ]);
    });

    it('should NOT add item when input is empty', () => {
        render(<ListManager {...defaultProps} />);
        fireEvent.click(screen.getByText('Add'));
        expect(defaultProps.setItems).not.toHaveBeenCalled();
    });

    it('should NOT add item when input is only whitespace', () => {
        render(<ListManager {...defaultProps} />);
        const input = screen.getByPlaceholderText('Type an item and press Enter');
        fireEvent.change(input, { target: { value: '   ' } });
        fireEvent.click(screen.getByText('Add'));
        expect(defaultProps.setItems).not.toHaveBeenCalled();
    });

    // ─── Remove Item ─────────────────────────────────────────

    it('should remove the correct item when ✕ is clicked', () => {
        render(<ListManager {...defaultProps} />);
        const removeButtons = screen.getAllByText('✕');
        fireEvent.click(removeButtons[1]); // remove 'Banana'
        expect(defaultProps.setItems).toHaveBeenCalledWith(['Apple', 'Cherry']);
    });

    // ─── Sort / Shuffle / Clear ──────────────────────────────

    it('should sort items A→Z when the button is clicked', () => {
        render(<ListManager {...defaultProps} />);
        fireEvent.click(screen.getByText('A → Z'));
        expect(defaultProps.setItems).toHaveBeenCalled();
        const sorted = defaultProps.setItems.mock.calls[0][0];
        expect(sorted).toEqual(['Apple', 'Banana', 'Cherry']);
    });

    it('should sort items Z→A when the button is clicked', () => {
        render(<ListManager {...defaultProps} />);
        fireEvent.click(screen.getByText('Z → A'));
        expect(defaultProps.setItems).toHaveBeenCalled();
        const sorted = defaultProps.setItems.mock.calls[0][0];
        expect(sorted).toEqual(['Cherry', 'Banana', 'Apple']);
    });

    it('should shuffle items when the Shuffle button is clicked', () => {
        render(<ListManager {...defaultProps} />);
        fireEvent.click(screen.getByText('🔀 Shuffle'));
        expect(defaultProps.setItems).toHaveBeenCalled();
        const shuffled = defaultProps.setItems.mock.calls[0][0];
        expect(shuffled).toHaveLength(3);
        expect(shuffled.sort()).toEqual(['Apple', 'Banana', 'Cherry']);
    });

    it('should clear all items when Clear All is clicked', () => {
        render(<ListManager {...defaultProps} />);
        fireEvent.click(screen.getByText('🗑️ Clear All'));
        expect(defaultProps.setItems).toHaveBeenCalledWith([]);
    });

    // ─── Empty state ─────────────────────────────────────────

    it('should show empty message when there are no items', () => {
        render(<ListManager items={[]} setItems={jest.fn()} disabledIndices={[]} onToggleDisable={jest.fn()} onEnableAll={jest.fn()} />);
        expect(
            screen.getByText('No items yet. Add some above!')
        ).toBeInTheDocument();
    });

    // ─── Disabled states ─────────────────────────────────────

    it('should disable action buttons when items are empty', () => {
        render(<ListManager items={[]} setItems={jest.fn()} disabledIndices={[]} onToggleDisable={jest.fn()} onEnableAll={jest.fn()} />);
        expect(screen.getByText('A → Z')).toBeDisabled();
        expect(screen.getByText('Z → A')).toBeDisabled();
        expect(screen.getByText('🔀 Shuffle')).toBeDisabled();
        expect(screen.getByText('🗑️ Clear All')).toBeDisabled();
    });

    it('should disable Add button when items reach MAX_ITEMS', () => {
        const maxItems = Array.from({ length: MAX_ITEMS }, (_, i) => `item${i}`);
        render(<ListManager items={maxItems} setItems={jest.fn()} disabledIndices={[]} onToggleDisable={jest.fn()} onEnableAll={jest.fn()} />);
        expect(screen.getByText('Add')).toBeDisabled();
    });

    // ─── File import ─────────────────────────────────────────

    it('should render file import label', () => {
        render(<ListManager {...defaultProps} />);
        expect(screen.getByText('Import CSV/TXT')).toBeInTheDocument();
    });

    // ─── Export CSV ───────────────────────────────────────────

    it('should render Export CSV button', () => {
        render(<ListManager {...defaultProps} />);
        expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    it('should disable Export CSV button when items list is empty', () => {
        render(<ListManager items={[]} setItems={jest.fn()} disabledIndices={[]} onToggleDisable={jest.fn()} onEnableAll={jest.fn()} />);
        expect(screen.getByText('Export CSV').closest('button')).toBeDisabled();
    });

    it('should enable Export CSV button when items exist', () => {
        render(<ListManager {...defaultProps} />);
        expect(screen.getByText('Export CSV').closest('button')).not.toBeDisabled();
    });
});
