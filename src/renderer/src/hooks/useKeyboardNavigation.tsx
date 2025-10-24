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
    const itemsRef = React.useRef(items);
    const lastSelectedIndexRef = React.useRef<number>(-1);

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

    // Zapamiętaj ostatnio wybrany i istniejący indeks
    React.useEffect(() => {
        const selectedIndex = items.findIndex(item => getId(item) === selectedId);
        if (selectedIndex !== -1) {
            lastSelectedIndexRef.current = selectedIndex;
        }
    }, [selectedId, items]);

    // Ustaw selectedId przy zmianie items
    React.useEffect(() => {
        if (itemsRef.current !== items) {
            itemsRef.current = items;
            if (items.length > 0) {
                if (selectedId === null) {
                    setSelectedId(getId(items[0]));
                }
                else if (items.find(item => getId(item) === selectedId) === undefined) {
                    if (lastSelectedIndexRef.current >= 0 && lastSelectedIndexRef.current < items.length) {
                        setSelectedId(getId(items[lastSelectedIndexRef.current]));
                    }
                    else if (lastSelectedIndexRef.current >= items.length && items.length > 0) {
                        setSelectedId(getId(items[items.length - 1]));
                    }
                    else {
                        setSelectedId(getId(items[0]));
                    }
                }
            }
            else if (items.length === 0) {
                setSelectedId(null);
            }
        }
    }, [items, selectedId]);

    return [
        selectedId,
        setSelectedId,
        handleKeyDown,
    ] as const;
}