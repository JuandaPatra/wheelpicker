import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

describe('hooks/useLocalStorage', () => {
    beforeEach(() => {
        window.localStorage.clear();
        jest.clearAllMocks();
    });

    it('should return the initial value when localStorage is empty', () => {
        const { result } = renderHook(() => useLocalStorage('testKey', 'default'));
        expect(result.current[0]).toBe('default');
    });

    it('should read an existing value from localStorage', () => {
        window.localStorage.setItem('testKey', JSON.stringify('stored-value'));
        const { result } = renderHook(() => useLocalStorage('testKey', 'default'));
        // After the effect runs, value should update
        expect(result.current[0]).toBe('stored-value');
    });

    it('should persist value to localStorage when setValue is called', () => {
        const { result } = renderHook(() => useLocalStorage('testKey', 'initial'));

        act(() => {
            result.current[1]('new-value');
        });

        expect(result.current[0]).toBe('new-value');
        expect(window.localStorage.setItem).toHaveBeenCalledWith(
            'testKey',
            JSON.stringify('new-value')
        );
    });

    it('should support functional updates', () => {
        const { result } = renderHook(() => useLocalStorage<number>('counter', 0));

        act(() => {
            result.current[1]((prev) => prev + 1);
        });

        expect(result.current[0]).toBe(1);
    });

    it('should work with complex objects', () => {
        const initialValue = { name: 'test', items: [1, 2, 3] };
        const { result } = renderHook(() =>
            useLocalStorage('complex', initialValue)
        );

        const newValue = { name: 'updated', items: [4, 5] };
        act(() => {
            result.current[1](newValue);
        });

        expect(result.current[0]).toEqual(newValue);
    });

    it('should work with arrays', () => {
        const { result } = renderHook(() =>
            useLocalStorage<string[]>('list', [])
        );

        act(() => {
            result.current[1](['a', 'b', 'c']);
        });

        expect(result.current[0]).toEqual(['a', 'b', 'c']);
    });

    it('should respond to cross-tab storage events', () => {
        const { result } = renderHook(() => useLocalStorage('tabSync', 'initial'));

        act(() => {
            const event = new StorageEvent('storage', {
                key: 'tabSync',
                newValue: JSON.stringify('from-other-tab'),
            });
            window.dispatchEvent(event);
        });

        expect(result.current[0]).toBe('from-other-tab');
    });

    it('should ignore storage events for different keys', () => {
        const { result } = renderHook(() => useLocalStorage('myKey', 'mine'));

        act(() => {
            const event = new StorageEvent('storage', {
                key: 'otherKey',
                newValue: JSON.stringify('other'),
            });
            window.dispatchEvent(event);
        });

        // Value should remain unchanged
        expect(result.current[0]).toBe('mine');
    });
});
