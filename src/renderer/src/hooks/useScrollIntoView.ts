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
    /**
     * Opcjonalny selektor CSS elementu nagłówka sticky w kontenerze
     * (np. '.header', '#header', 'header[sticky]')
     */
    stickyHeader?: string;
}

/**
 * Zwraca aktualny offset (wysokość przykrycia) nagłówka sticky względem górnej krawędzi kontenera
 */
const getStickyOffset = (container: HTMLElement, selector?: string): number => {
    if (!selector) return 0;
    try {
        const headerEl = container.querySelector<HTMLElement>(selector);
        if (!headerEl) return 0;

        const headerRect = headerEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Kompensujemy tylko gdy nagłówek faktycznie przykrywa górę widocznego obszaru kontenera
        if (headerRect.top <= containerRect.top) {
            return Math.max(0, Math.min(headerRect.bottom, containerRect.bottom) - containerRect.top);
        }
        return 0;
    } catch (e) {
        console.warn(`Invalid stickyHeader selector: ${selector}`, e);
        return 0;
    }
};

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
    stickyHeader,
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

            const headerOffset = getStickyOffset(container, stickyHeader);

            // Znajdź element docelowy TYLKO w kontenerze
            const targetElement = container.querySelector<HTMLElement>(`#${CSS.escape(targetId)}`);
            
            if (!targetElement) {
                console.warn(`Target element not found in container: ${targetId}`);
                return;
            }

            // Sprawdź czy element jest widoczny (jeśli włączone)
            if (onlyIfNotVisible) {
                const isVisible = isElementVisible(targetElement, container, headerOffset);
                if (isVisible) {
                    return;
                }
            }

            // Scrolluj do elementu z kompensacją sticky headera na osi Y
            if (headerOffset > 0) {
                const elementRect = targetElement.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const desiredTop = container.scrollTop + (elementRect.top - containerRect.top) - headerOffset;

                const clampedTop = Math.max(0, Math.min(
                    desiredTop,
                    container.scrollHeight - container.clientHeight
                ));

                container.scrollTo({
                    top: clampedTop,
                    behavior: (options.behavior as ScrollBehavior) ?? 'auto',
                });
            } else {
                targetElement.scrollIntoView(options);
            }
        }, delay);

        return () => clearTimeout(timeoutId);
    }, [targetId, containerId, containerRef, delay, onlyIfNotVisible, stickyHeader, JSON.stringify(options)]);
};

/**
 * Sprawdza czy element jest widoczny w kontenerze z uwzględnieniem sticky headera
 */
const isElementVisible = (element: HTMLElement, container: HTMLElement, headerOffset = 0): boolean => {
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const visibleTop = containerRect.top + headerOffset;
    const visibleBottom = containerRect.bottom;

    return (
        elementRect.top >= visibleTop &&
        elementRect.bottom <= visibleBottom &&
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
    stickyHeader,
}: Omit<UseScrollIntoViewOptions, 'targetId' | 'delay'>) => {
    const scrollToElement = React.useCallback((targetId: string) => {
        const container = containerRef?.current || 
            (containerId ? document.getElementById(containerId) : null);
        
        if (!container) {
            console.warn(`Container not found: ${containerId}`);
            return;
        }

        const headerOffset = getStickyOffset(container, stickyHeader);

        // Znajdź element docelowy TYLKO w kontenerze
        const targetElement = container.querySelector<HTMLElement>(`#${CSS.escape(targetId)}`);
        
        if (!targetElement) {
            console.warn(`Target element not found in container: ${targetId}`);
            return;
        }

        if (onlyIfNotVisible) {
            const isVisible = isElementVisible(targetElement, container, headerOffset);
            if (isVisible) {
                return;
            }
        }

        if (headerOffset > 0) {
            const elementRect = targetElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const desiredTop = container.scrollTop + (elementRect.top - containerRect.top) - headerOffset;

            const clampedTop = Math.max(0, Math.min(
                desiredTop,
                container.scrollHeight - container.clientHeight
            ));

            container.scrollTo({
                top: clampedTop,
                behavior: (scrollOptions.behavior as ScrollBehavior) ?? 'auto',
            });
        } else {
            targetElement.scrollIntoView(scrollOptions);
        }
    }, [containerId, containerRef, scrollOptions, onlyIfNotVisible, stickyHeader]);

    return scrollToElement;
};