import { useState, useEffect } from "react";

export const useFocus = (ref: React.RefObject<HTMLElement | null>) => {
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const element = ref.current;

        if (!element) return;

        const handleFocus = () => setIsFocused(true);
        const handleBlur = () => setIsFocused(false);

        element.addEventListener("focus", handleFocus);
        element.addEventListener("blur", handleBlur);

        return () => {
            element.removeEventListener("focus", handleFocus);
            element.removeEventListener("blur", handleBlur);
        };
    }, [ref]);

    return isFocused;
};