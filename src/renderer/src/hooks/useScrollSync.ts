import { useState, useEffect, useCallback } from "react";

interface ScrollState {
    scrollTop: number;
    scrollLeft: number;
}

export const useScrollSync = (ref: React.RefObject<HTMLDivElement | null>, disabled?: boolean) => {
    const [scrollState, setScrollState] = useState<ScrollState>({ scrollTop: 0, scrollLeft: 0 });

    useEffect(() => {
        const handleScroll = () => {
            if (disabled || !ref.current) return;

            const { scrollTop, scrollLeft } = ref.current;
            setScrollState({ scrollTop, scrollLeft });
        };

        const container = ref.current;
        if (!container) return;

        container.addEventListener("scroll", handleScroll);

        return () => {
            container.removeEventListener("scroll", handleScroll);
        };
    }, [ref, disabled]);

    return scrollState;
};