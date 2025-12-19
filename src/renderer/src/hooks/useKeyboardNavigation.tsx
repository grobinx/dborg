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

export interface UseKeyboardNavigationActionsProps<T, A> {
    actions: KeyBindings<T> | Actions<A>;
    actionManager?: ActionManager<A>;
    actionContext?: never;
}

// Wariant 2: akcje przez manager i context
export interface UseKeyboardNavigationManagerProps<T, A> {
    actions?: KeyBindings<T> | Actions<A>;
    actionManager: ActionManager<A>;
    actionContext: () => A;
}

export interface UseKeyboardNavigationActionsNoneProps<T, A> {
    actions?: KeyBindings<T> | Actions<A>;
    actionManager?: ActionManager<A>;
    actionContext?: never;
}


/**
 * Hook do nawigacji klawiaturowej wśród listy elementów.
 * Umożliwia poruszanie się za pomocą strzałek, Home, End oraz definiowanie własnych skrótów klawiszowych.
 * 
 * W tym hooku nie działają sekwencje skrótów klawiszowych jeśli przekazano akcje wprost.
 * Zawsze jest brany pierwszy skrót z keybindings.
 * 
 * @param items Lista elementów do nawigacji.
 * @param getId Funkcja zwracająca unikalny identyfikator elementu.
 * @param onEnter Funkcja wywoływana po naciśnięciu Enter na zaznaczonym elemencie.
 * @param actions Dodatkowe skróty klawiszowe i ich obsługa. 
 *      Jeśli podano wprost akcje, manager i kontekst nie jest potrzebny.
 *      Jeśli nie podano, należy podać actionManager i actionContext.
 * @param actionManager Opcjonalny menedżer akcji z zarejestrowanymi skrótami klawiszowymi.
 * @param actionContext Funkcja zwracająca kontekst dla menedżera akcji.
 */
export type UseKeyboardNavigationProps<T, V = string, A = any> = {
    items: T[];
    getId: (item: T) => V | null;
    onEnter?: (item: T) => void;
    rollover?: boolean; // Czy nawigacja ma się zawijać (domyślnie false)
} & (
        UseKeyboardNavigationActionsProps<T, A>
        | UseKeyboardNavigationManagerProps<T, A>
        | UseKeyboardNavigationActionsNoneProps<T, A>
    );

export function handleListNavigation<T, V>(
    event: React.KeyboardEvent,
    items: T[],
    getId: (item: T) => V | null,
    selectedId: V | null,
    setSelectedId: (id: V | null) => void,
    rollover: boolean = false
) {
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
        return true;
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
        return true;
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
        return true;
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
        return true;
    }
    return false;
}

export function useKeyboardNavigation<T, V = string, A = any>({
    items,
    getId,
    onEnter,
    rollover = false,
    actions,
    actionManager,
    actionContext,
}: UseKeyboardNavigationProps<T, V, A>) {
    const [selectedId, setSelectedId] = React.useState<V | null>(null);
    const itemsRef = React.useRef(items);
    const lastSelectedIndexRef = React.useRef<number>(-1);

    const handleKeyDown = React.useCallback(
        (event: React.KeyboardEvent) => {
            if (!items || items.length === 0) return;

            // Użycie wyodrębnionej funkcji
            if (handleListNavigation(event, items, getId, selectedId, setSelectedId, rollover)) {
                return;
            }

            const currentIndex = items.findIndex(item => getId(item) === selectedId);

            if (onEnter && isKeybindingMatch("Enter", event) && currentIndex >= 0) {
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
                else if (isActions<A>(actions)) {
                    for (const action of Object.values(actions)) {
                        if (action.keybindings) {
                            const normalized = normalizeKeybinding(action.keybindings[0]);
                            if (isKeybindingMatch(normalized, event)) {
                                action.run(actionContext?.() ?? {} as A, items[currentIndex]);
                                return;
                            }
                        }
                    }
                }
                else if (actionManager && actionContext) {
                    actionManager.executeActionByKeybinding(event, actionContext());
                }
            }
            if (actionManager && actionContext) {
                actionManager.executeActionByKeybinding(event, actionContext());
            }
        },
        [items, selectedId, getId, onEnter, actions, actionManager, actionContext, rollover]
    );

    // Zapamiętaj ostatnio wybrany i istniejący indeks
    const selectedIndex = React.useMemo(() => {
        const selectedIndex = items.findIndex(item => getId(item) === selectedId);
        if (selectedIndex !== -1) {
            lastSelectedIndexRef.current = selectedIndex;
        }
        return selectedIndex;
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
        selectedIndex,
    ] as const;
}