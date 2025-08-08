// useKeyboardState.ts
import { useState, useEffect } from 'react';

export const useKeyboardState = () => {
    const [pressedKeys, setPressedKeys] = useState(new Set<string>());
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            setPressedKeys(prev => new Set(prev).add(e.key));
        };
        
        const handleKeyUp = (e: KeyboardEvent) => {
            setPressedKeys(prev => {
                const newSet = new Set(prev);
                newSet.delete(e.key);
                return newSet;
            });
        };
        
        const handleBlur = () => {
            setPressedKeys(new Set());
        };
        
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleBlur);
        
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);
    
    return {
        isPressed: (key: string) => pressedKeys.has(key),
        shiftPressed: pressedKeys.has('Shift'),
        ctrlPressed: pressedKeys.has('Control'),
        altPressed: pressedKeys.has('Alt'),
        metaPressed: pressedKeys.has('Meta'),
    };
};