import React from "react";

export interface UseKeyboardNavigationProps<T, V = string> {
    items: T[];
    getId: (item: T) => V;
    onSelect?: (item: T) => void;
}

export function useKeyboardNavigation<T, V = string>({
    items,
    getId,
    onSelect,
}: UseKeyboardNavigationProps<T, V>) {
    const [selectedId, setSelectedId] = React.useState<V | undefined>(undefined);

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
            }
        },
        [items, selectedId, getId, onSelect]
    );

    // Ustaw pierwszy element jako wybrany po zmianie listy
    React.useEffect(() => {
        if (items.length > 0 && !selectedId) {
            setSelectedId(getId(items[0]));
        }
    }, [items, getId, selectedId]);

    return [
        selectedId,
        setSelectedId,
        handleKeyDown,
    ] as const;
}