import { useState, useEffect, useCallback } from "react";

interface ScrollState {
    scrollTop: number;
    scrollLeft: number;
}

export const useScrollSync = (ref: React.RefObject<HTMLDivElement | null>, disabled?: boolean) => {
    const [scrollState, setScrollState] = useState<ScrollState>({ scrollTop: 0, scrollLeft: 0 });

    const handleScroll = useCallback(() => {
        if (disabled || !ref.current) return;

        const { scrollTop, scrollLeft } = ref.current;
        setScrollState({ scrollTop, scrollLeft });
    }, []);

    useEffect(() => {
        const container = ref.current;
        if (!container) return;

        container.addEventListener("scroll", handleScroll);

        return () => {
            container.removeEventListener("scroll", handleScroll);
        };
    }, [ref, handleScroll]);

    return scrollState;
};