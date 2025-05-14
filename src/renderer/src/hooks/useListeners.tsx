import { useMemo, useRef } from "react";

type ListenerMap = {
    [key: string]: ((...args: any[]) => void)[];
};

export interface UseListenersType {
    addListener: (type: string, callback: (...args: any[]) => void) => void;
    removeListener: (type: string, callback: (...args: any[]) => void) => void;
    callListeners: (type: string, ...args: any[]) => void;
    emit: (type: string, ...args: any[]) => void;
}

const useListeners = (): UseListenersType => {
    const listenersRef = useRef<ListenerMap>({});

    const addListener = (type: string, callback: (...args: any[]) => void) => {
        if (!listenersRef.current[type]) {
            listenersRef.current[type] = [];
        }
        if (!listenersRef.current[type].includes(callback)) {
            listenersRef.current[type] = [...listenersRef.current[type], callback];
        }
    };

    const removeListener = (type: string, callback: (...args: any[]) => void) => {
        if (listenersRef.current[type]) {
            listenersRef.current[type] = listenersRef.current[type].filter(
                (listener) => listener !== callback
            );
        }
    };

    const callListeners = (type: string, ...args: any[]) => {
        if (listenersRef.current[type]) {
            // opóźnienie jest spowodowane tym, że niektóre komponenty mogą być renderowane w tym samym cyklu, co wywołanie emit
            // i nie zdążą się zaktualizować, więc wywołanie emit jest opóźnione
            setTimeout(() => {
                listenersRef.current[type].forEach((listener) => listener(...args));
            }, 0);
        }
    };

    return useMemo(
        () => ({ addListener, removeListener, callListeners, emit: callListeners }),
        []
    );
};

export default useListeners;
