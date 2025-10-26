import React from 'react';

interface UseScrollIntoViewOptions {
    /**
     * ID kontenera, w którym ma być scrollowanie
     */
    containerId?: string;
    /**
     * Ref do kontenera (alternatywa dla containerId)
     */
    containerRef?: React.RefObject<HTMLElement | null>;
    /**
     * ID elementu, który ma być widoczny
     */
    targetId?: string | null;
    /**
     * Opcje dla scrollIntoView
     * @default { behavior: 'smooth', block: 'nearest', inline: 'nearest' }
     */
    scrollOptions?: ScrollIntoViewOptions;
    /**
     * Opóźnienie przed scrollowaniem (ms)
     * @default 0
     */
    delay?: number;
    /**
     * Czy scrollować tylko gdy element nie jest widoczny
     * @default true
     */
    onlyIfNotVisible?: boolean;
}

/**
 * Hook zapewniający, że element o podanym ID jest widoczny w kontenerze
 */
export const useScrollIntoView = ({
    containerId,
    containerRef,
    targetId,
    scrollOptions,
    delay = 0,
    onlyIfNotVisible = true,
}: UseScrollIntoViewOptions) => {
    const options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'nearest', inline: 'nearest', ...scrollOptions };
    React.useEffect(() => {
        if (!targetId) return;

        const timeoutId = setTimeout(() => {
            // Znajdź kontener
            const container = containerRef?.current || 
                (containerId ? document.getElementById(containerId) : null);
            
            if (!container) {
                console.warn(`Container not found: ${containerId}`);
                return;
            }

            // Znajdź element docelowy TYLKO w kontenerze
            const targetElement = container.querySelector<HTMLElement>(`#${CSS.escape(targetId)}`);
            
            if (!targetElement) {
                console.warn(`Target element not found in container: ${targetId}`);
                return;
            }

            // Sprawdź czy element jest widoczny (jeśli włączone)
            if (onlyIfNotVisible) {
                const isVisible = isElementVisible(targetElement, container);
                if (isVisible) {
                    return;
                }
            }

            // Scrolluj do elementu
            targetElement.scrollIntoView(options);
        }, delay);

        return () => clearTimeout(timeoutId);
    }, [targetId, containerId, containerRef, delay, onlyIfNotVisible, JSON.stringify(options)]);
};

/**
 * Sprawdza czy element jest widoczny w kontenerze
 */
const isElementVisible = (element: HTMLElement, container: HTMLElement): boolean => {
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    return (
        elementRect.top >= containerRect.top &&
        elementRect.bottom <= containerRect.bottom &&
        elementRect.left >= containerRect.left &&
        elementRect.right <= containerRect.right
    );
};

/**
 * Alternatywna wersja hooka, która zwraca funkcję do ręcznego wywołania
 */
export const useScrollIntoViewCallback = ({
    containerId,
    containerRef,
    scrollOptions = { behavior: 'smooth', block: 'nearest', inline: 'nearest' },
    onlyIfNotVisible = true,
}: Omit<UseScrollIntoViewOptions, 'targetId' | 'delay'>) => {
    const scrollToElement = React.useCallback((targetId: string) => {
        const container = containerRef?.current || 
            (containerId ? document.getElementById(containerId) : null);
        
        if (!container) {
            console.warn(`Container not found: ${containerId}`);
            return;
        }

        // Znajdź element docelowy TYLKO w kontenerze
        const targetElement = container.querySelector<HTMLElement>(`#${CSS.escape(targetId)}`);
        
        if (!targetElement) {
            console.warn(`Target element not found in container: ${targetId}`);
            return;
        }

        if (onlyIfNotVisible) {
            const isVisible = isElementVisible(targetElement, container);
            if (isVisible) {
                return;
            }
        }

        targetElement.scrollIntoView(scrollOptions);
    }, [containerId, containerRef, scrollOptions, onlyIfNotVisible]);

    return scrollToElement;
};