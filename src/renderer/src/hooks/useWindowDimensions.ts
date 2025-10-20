import { Size } from "electron";
import React from "react";

function getWindowDimensions(): Size {
    const { innerWidth: width, innerHeight: height } = window;
    return {
        width,
        height
    };
}

function useWindowDimensions(): Size {
    const [windowDimensions, setWindowDimensions] = React.useState(getWindowDimensions());

    React.useEffect((): ReturnType<React.EffectCallback> => {
        function handleResize(): void {
            setWindowDimensions(getWindowDimensions());
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowDimensions;
}

export default useWindowDimensions;