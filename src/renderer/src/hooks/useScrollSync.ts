import { useState, useEffect } from "react";

interface ScrollState {
    scrollTop: number;
    scrollLeft: number;
}

export const useScrollSync = (ref: React.RefObject<HTMLDivElement | null>, disabled?: boolean) => {
    const [scrollState, setScrollState] = useState<ScrollState>({ scrollTop: 0, scrollLeft: 0 });
    const [el, setEl] = useState<HTMLDivElement | null>(null);

    // śledź zmiany ref.current
    useEffect(() => {
        setEl(ref.current);
    }, [ref.current]);

    useEffect(() => {
        if (!el) return;

        const handle = () => {
            if (disabled) return;
            setScrollState({ scrollTop: el.scrollTop, scrollLeft: el.scrollLeft });
        };

        // inicjalizacja od razu (ważne na pierwszym montażu)
        handle();

        el.addEventListener("scroll", handle, { passive: true } as AddEventListenerOptions);
        return () => {
            el.removeEventListener("scroll", handle as EventListener);
        };
    }, [el, disabled]);

    return scrollState;
};