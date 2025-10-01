import { useState, useEffect, useRef } from "react";

/**
 * Hook to track the visibility of an element using Intersection Observer API.
 * @param options IntersectionObserverInit
 * @returns A tuple containing a ref to the element, its visibility state, and its bounding client rect.
 * Bounding client rect is null when the element is not visible
 */
export const useVisibleState = <T extends HTMLElement>(
    options?: IntersectionObserverInit
): [React.RefObject<T | null>, boolean, DOMRect | null] => {
    const [isVisible, setIsVisible] = useState(false);
    const [clientRect, setClientRect] = useState<DOMRect | null>(null);
    const elementRef = useRef<T | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
                // setClientRect(prev => {
                //     if (!entry.isIntersecting) {
                //         return null;
                //     }
                //     const rect = entry.boundingClientRect;
                //     if (rect.width !== prev?.width || rect.height !== prev?.height ||
                //         rect.top !== prev?.top || rect.left !== prev?.left ||
                //         rect.right !== prev?.right || rect.bottom !== prev?.bottom) {
                //         return rect;
                //     }
                //     return prev;
                // });
            },
            options
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => {
            if (elementRef.current) {
                observer.unobserve(elementRef.current);
            }
        };
    }, [options]);

    return [elementRef, isVisible, clientRect];
};