import { ActionManager, Actions, isActions } from "@renderer/components/CommandPalette/ActionManager";
import { isKeybindingMatch, normalizeKeybinding } from "@renderer/components/CommandPalette/KeyBinding";
import React from "react";

export interface KeyBinding<T> {
    /**
     * Klawisz lub kombinacja klawiszy do obsługi
     * @example "Ctrl+Enter", "Shift+A", "Escape"
     */
    shortcut: string;
    handler: (item: T) => void;
}

export type KeyBindings<T> = KeyBinding<T>[];

export function isKeyBinding(obj: any): obj is KeyBinding<any> {
    return obj && typeof obj === "object" && typeof obj.shortcut === "string" && typeof obj.handler === "function";
}

export function isKeyBindings(obj: any): obj is KeyBindings<any> {
    return Array.isArray(obj) && obj.every(isKeyBinding);
}

export interface UseKeyboardNavigationProps<T, V = string, A = any> {
    items: T[];
    getId: (item: T) => V | null;
    onEnter?: (item: T) => void;
    actions?: KeyBindings<T> | Actions<A>;
    actionManager?: ActionManager<A>; // Opcjonalny menedżer akcji do rejestrowania skrótów klawiszowych
    actionContext?: () => A; // Funkcja zwracająca kontekst dla menedżera akcji
    rollover?: boolean; // Czy nawigacja ma się zawijać (domyślnie false)
}

export function useKeyboardNavigation<T, V = string, A = any>({
    items,
    getId,
    onEnter,
    actions = [],
    actionManager,
    actionContext: actionContext,
    rollover = false,
}: UseKeyboardNavigationProps<T, V, A>) {
    const [selectedId, setSelectedId] = React.useState<V | null>(null);
    const itemsRef = React.useRef(items);
    const lastSelectedIndexRef = React.useRef<number>(-1);

    const handleKeyDown = React.useCallback(
        (event: React.KeyboardEvent) => {
            if (!items || items.length === 0) return;

            const currentIndex = items.findIndex(item => getId(item) === selectedId);

            if (isKeybindingMatch("ArrowDown", event)) {
                for (let i = 1; i <= items.length; i++) {
                    const idx = rollover
                        ? (currentIndex + i) % items.length
                        : currentIndex + i;
                    if (idx >= items.length) break;
                    const candidate = items[idx];
                    const candidateId = getId(candidate);
                    if (candidateId !== null) {
                        setSelectedId(candidateId);
                        break;
                    }
                }
                event.preventDefault();
            } else if (isKeybindingMatch("ArrowUp", event)) {
                for (let i = 1; i <= items.length; i++) {
                    const idx = rollover
                        ? (currentIndex - i + items.length) % items.length
                        : currentIndex - i;
                    if (idx < 0) break;
                    const candidate = items[idx];
                    const candidateId = getId(candidate);
                    if (candidateId !== null) {
                        setSelectedId(candidateId);
                        break;
                    }
                }
                event.preventDefault();
            } else if (isKeybindingMatch("Ctrl+Home", event)) {
                for (let i = 0; i < items.length; i++) {
                    const candidate = items[i];
                    const candidateId = getId(candidate);
                    if (candidateId !== null) {
                        setSelectedId(candidateId);
                        break;
                    }
                }
                event.preventDefault();
            } else if (isKeybindingMatch("Ctrl+End", event)) {
                for (let i = items.length - 1; i >= 0; i--) {
                    const candidate = items[i];
                    const candidateId = getId(candidate);
                    if (candidateId !== null) {
                        setSelectedId(candidateId);
                        break;
                    }
                }
                event.preventDefault();
            } else if (onEnter && isKeybindingMatch("Enter", event) && currentIndex >= 0) {
                onEnter(items[currentIndex]);
                event.preventDefault();
                return;
            } else if (currentIndex >= 0) {
                if (isKeyBindings(actions)) {
                    for (const binding of actions) {
                        const normalized = normalizeKeybinding(binding.shortcut);
                        if (isKeybindingMatch(normalized, event)) {
                            binding.handler(items[currentIndex]);
                            event.preventDefault();
                            return;
                        }
                    }
                }
                else if (isActions(actions)) {
                    for (const action of Object.values(actions)) {
                        if (action.keybindings) {
                            const normalized = normalizeKeybinding(action.keybindings[0]);
                            if (isKeybindingMatch(normalized, event)) {
                                action.run(actionContext?.(), items[currentIndex]);
                                return;
                            }
                        }
                    }
                }
            }
            if (actionManager && actionContext) {
                actionManager.executeActionByKeybinding(event, actionContext());
            }
        },
        [items, selectedId, getId, onEnter, actions]
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