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
     * Można podać nadrzędny element nagłówka, który ma ustawiony `position: sticky`
     * (np. '.header', '#header', 'header[sticky]')
     */
    stickyHeader?: string;
    /**
     * Dodatkowe zależności do efektu
     */
    dependencies?: any[];
}

/**
 * Zwraca aktualny offset (wysokość przykrycia) nagłówka sticky względem górnej krawędzi kontenera
 */
const getStickyOffset = (container: HTMLElement, selector?: string): number => {
    if (!selector) return 0;
    try {
        const headerEl = container.querySelector<HTMLElement>(selector);
        if (!headerEl) return 0;

        // Sprawdź czy element lub którykolwiek z jego potomków ma position: sticky
        let stickyElement: HTMLElement | null = null;
        
        // Najpierw sprawdź sam element
        if (window.getComputedStyle(headerEl).position === 'sticky') {
            stickyElement = headerEl;
        } else {
            // Znajdź pierwszy potomny element ze sticky
            const allDescendants = headerEl.querySelectorAll('*');
            for (const descendant of Array.from(allDescendants)) {
                if (window.getComputedStyle(descendant).position === 'sticky') {
                    stickyElement = descendant as HTMLElement;
                    break;
                }
            }
        }

        // Jeśli nie znaleziono sticky elementu, zwróć 0
        if (!stickyElement) return 0;

        const stickyRect = stickyElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Kompensujemy tylko gdy sticky element faktycznie przykrywa górę widocznego obszaru kontenera
        if (stickyRect.top <= containerRect.top) {
            return Math.max(0, Math.min(stickyRect.bottom, containerRect.bottom) - containerRect.top);
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
    dependencies = [],
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

            // Oblicz pozycje
            const elementRect = targetElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const visibleTop = containerRect.top + headerOffset;
            const visibleBottom = containerRect.bottom;

            // Scrolluj do elementu z kompensacją sticky headera
            if (headerOffset > 0 || elementRect.top < visibleTop || elementRect.bottom > visibleBottom) {
                let desiredTop: number;

                if (elementRect.top < visibleTop) {
                    // Element jest powyżej widocznego obszaru - scrolluj do góry
                    desiredTop = container.scrollTop + (elementRect.top - containerRect.top) - headerOffset;
                } else if (elementRect.bottom > visibleBottom) {
                    // Element jest poniżej widocznego obszaru - scrolluj do dołu
                    desiredTop = container.scrollTop + (elementRect.bottom - containerRect.bottom);
                } else {
                    // Element jest widoczny - użyj domyślnego scrollIntoView
                    targetElement.scrollIntoView(options);
                    return;
                }

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
    }, [targetId, containerId, containerRef, delay, onlyIfNotVisible, stickyHeader, JSON.stringify(options), ...dependencies]);
};

/**
 * Sprawdza czy element jest CAŁKOWICIE widoczny w kontenerze
 */
const isElementVisible = (element: HTMLElement, container: HTMLElement, headerOffset = 0): boolean => {
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const visibleTop = containerRect.top + headerOffset;
    const visibleBottom = containerRect.bottom;

    // Element jest CAŁKOWICIE widoczny gdy:
    // - jego góra jest poniżej górnej krawędzi widocznego obszaru
    // - jego dół jest powyżej dolnej krawędzi widocznego obszaru
    const isFullyVerticallyVisible = elementRect.top >= visibleTop && elementRect.bottom <= visibleBottom;
    const isFullyHorizontallyVisible = elementRect.left >= containerRect.left && elementRect.right <= containerRect.right;

    return isFullyVerticallyVisible && isFullyHorizontallyVisible;
};

/**
 * Alternatywna wersja hooka, która zwraca funkcję do ręcznego wywołania
 */
export const useScrollIntoViewCallback = ({
    containerId,
    containerRef,
    scrollOptions,
    onlyIfNotVisible = true,
    stickyHeader,
    dependencies = [],
}: Omit<UseScrollIntoViewOptions, 'targetId' | 'delay'>) => {
    const options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'nearest', inline: 'nearest', ...scrollOptions };
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

        // Sprawdź czy element jest widoczny (jeśli włączone)
        if (onlyIfNotVisible) {
            const isVisible = isElementVisible(targetElement, container, headerOffset);
            if (isVisible) {
                return;
            }
        }

        // Oblicz pozycje
        const elementRect = targetElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const visibleTop = containerRect.top + headerOffset;
        const visibleBottom = containerRect.bottom;

        // Scrolluj do elementu z kompensacją sticky headera
        if (headerOffset > 0 || elementRect.top < visibleTop || elementRect.bottom > visibleBottom) {
            let desiredTop: number;

            if (elementRect.top < visibleTop) {
                // Element jest powyżej widocznego obszaru - scrolluj do góry
                desiredTop = container.scrollTop + (elementRect.top - containerRect.top) - headerOffset;
            } else if (elementRect.bottom > visibleBottom) {
                // Element jest poniżej widocznego obszaru - scrolluj do dołu
                desiredTop = container.scrollTop + (elementRect.bottom - containerRect.bottom);
            } else {
                // Element jest widoczny - użyj domyślnego scrollIntoView
                targetElement.scrollIntoView(options);
                return;
            }

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
    }, [containerId, containerRef, JSON.stringify(options), onlyIfNotVisible, stickyHeader, ...dependencies]);

    return scrollToElement;
};