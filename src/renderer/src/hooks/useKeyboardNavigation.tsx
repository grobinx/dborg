import { isKeybindingMatch, normalizeKeybinding } from "@renderer/components/CommandPalette/KeyBinding";
import React from "react";

export interface KeyBindingHandler<T> {
    /**
     * Klawisz lub kombinacja klawiszy do obsługi
     * @example "Ctrl+Enter", "Shift+A", "Escape"
     */
    key: string;
    handler: (item: T) => void;
}

export interface UseKeyboardNavigationProps<T, V = string> {
    items: T[];
    getId: (item: T) => V;
    onSelect?: (item: T) => void;
    keyBindings?: KeyBindingHandler<T>[];
}

export function useKeyboardNavigation<T, V = string>({
    items,
    getId,
    onSelect,
    keyBindings = [],
}: UseKeyboardNavigationProps<T, V>) {
    const [selectedId, setSelectedId] = React.useState<V | null>(null);

    const handleKeyDown = React.useCallback(
        (event: React.KeyboardEvent) => {
            if (!items || items.length === 0) return;

            const currentIndex = items.findIndex(item => getId(item) === selectedId);
            let nextIndex = currentIndex;

            if (event.key === "ArrowDown") {
                nextIndex = (currentIndex + 1) % items.length;
                setSelectedId(getId(items[nextIndex]));
                event.preventDefault();
            } else if (event.key === "ArrowUp") {
                nextIndex = (currentIndex - 1 + items.length) % items.length;
                setSelectedId(getId(items[nextIndex]));
                event.preventDefault();
            } else if (event.key === "Enter" && currentIndex >= 0) {
                onSelect?.(items[currentIndex]);
                event.preventDefault();
            } else if (currentIndex >= 0) {
                // Obsługa custom keybindings
                for (const binding of keyBindings) {
                    const normalized = normalizeKeybinding(binding.key);
                    if (isKeybindingMatch(normalized, event)) {
                        binding.handler(items[currentIndex]);
                        return;
                    }
                }
            }
        },
        [items, selectedId, getId, onSelect, keyBindings]
    );

    // Ustaw pierwszy element jako wybrany po zmianie listy
    React.useEffect(() => {
        if (items.length > 0 && selectedId === null) {
            setSelectedId(getId(items[0]));
        }
    }, [items, getId, selectedId]);

    return [
        selectedId,
        setSelectedId,
        handleKeyDown,
    ] as const;
}