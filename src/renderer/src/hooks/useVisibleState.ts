import { useState, useEffect, useRef } from "react";

export const useVisibleState = <T extends HTMLElement>(
    options?: IntersectionObserverInit
): [React.RefObject<T | null>, boolean] => {
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef<T | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
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

    return [elementRef, isVisible];
};