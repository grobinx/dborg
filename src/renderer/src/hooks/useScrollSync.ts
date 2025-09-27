import { useEffect, useRef, useState } from 'react';

export function useScrollSync(
    ref: React.RefObject<HTMLElement | null>,
    paused = false
) {
    const [state, setState] = useState({ scrollTop: 0, scrollLeft: 0 });
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const onScroll = () => {
            if (paused) return;
            if (rafRef.current != null) return;
            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = null;
                setState({
                    scrollTop: el.scrollTop,
                    scrollLeft: el.scrollLeft,
                });
            });
        };

        // initial
        setState({ scrollTop: el.scrollTop, scrollLeft: el.scrollLeft });

        el.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            el.removeEventListener('scroll', onScroll);
            if (rafRef.current != null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [ref, paused]);

    return state;
}