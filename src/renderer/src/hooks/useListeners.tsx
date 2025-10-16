import React from "react";

type ListenerMap<T = any,> = {
    [key: string]: ((event: T) => void)[];
};

export interface UseListenersType<T = any,> {
    onEvent: (type: string, callback: (event: T) => void) => () => void;
    emitEvent: (type: string, event: T) => void;
}

const useListeners = <T,>(): UseListenersType<T> => {
    const listeners = React.useRef<ListenerMap<T>>({});

    const onEvent = React.useCallback((type: string, callback: (event: T) => void) => {
        if (!listeners.current[type]) {
            listeners.current[type] = [];
        }
        if (!listeners.current[type].includes(callback)) {
            listeners.current[type] = [...listeners.current[type], callback];
        }

        return () => { offEvent(type, callback); }
    }, []);

    const offEvent = React.useCallback((type: string, callback: (event: T) => void) => {
        if (listeners.current[type]) {
            listeners.current[type] = listeners.current[type].filter(
                (listener) => listener !== callback
            );
        }
    }, []);

    const emitEvent = (type: string, event: T) => {
        if (listeners.current[type]) {
            // opóźnienie jest spowodowane tym, że niektóre komponenty mogą być renderowane w tym samym cyklu, co wywołanie emit
            // i nie zdążą się zaktualizować, więc wywołanie emit jest opóźnione
            setTimeout(() => {
                listeners.current[type].forEach((listener) => listener(event));
            }, 0);
        }
    };

    return { onEvent, emitEvent };
};

export default useListeners;
