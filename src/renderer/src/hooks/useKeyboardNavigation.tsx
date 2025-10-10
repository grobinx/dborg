import { ActionManager } from "@renderer/components/CommandPalette/ActionManager";
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

export interface UseKeyboardNavigationProps<T, V = string, A = any> {
    items: T[];
    getId: (item: T) => V;
    onSelect?: (item: T) => void;
    keyBindings?: KeyBindingHandler<T>[];
    actionManager?: ActionManager<A>; // Opcjonalny menedżer akcji do rejestrowania skrótów klawiszowych
    getContext?: () => A; // Funkcja zwracająca kontekst dla menedżera akcji
}

export function useKeyboardNavigation<T, V = string, A = any>({
    items,
    getId,
    onSelect,
    keyBindings = [],
    actionManager,
    getContext,
}: UseKeyboardNavigationProps<T, V, A>) {
    const [selectedId, setSelectedId] = React.useState<V | null>(null);

    const handleKeyDown = React.useCallback(
        (event: React.KeyboardEvent) => {
            if (!items || items.length === 0) return;

            const currentIndex = items.findIndex(item => getId(item) === selectedId);
            let nextIndex = currentIndex;

            if (isKeybindingMatch("ArrowDown", event)) {
                nextIndex = (currentIndex + 1) % items.length;
                setSelectedId(getId(items[nextIndex]));
                event.preventDefault();
                return;
            } else if (isKeybindingMatch("ArrowUp", event)) {
                nextIndex = (currentIndex - 1 + items.length) % items.length;
                setSelectedId(getId(items[nextIndex]));
                event.preventDefault();
                return;
            } else if (onSelect && isKeybindingMatch("Enter", event) && currentIndex >= 0) {
                onSelect(items[currentIndex]);
                event.preventDefault();
                return;
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
            if (actionManager && getContext) {
                actionManager.executeActionByKeybinding(event, getContext());
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