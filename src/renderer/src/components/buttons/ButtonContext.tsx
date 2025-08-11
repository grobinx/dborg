import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { BaseButtonProps } from './BaseButtonProps';

// Typy dla kontekstu
export interface ButtonState {
    focused: boolean;
    active: boolean;
    hover: boolean;
    value: string | null; // Zmiana z 'pressed' na 'value'
}

export interface ButtonActions {
    setFocused: (focused: boolean) => void;
    setActive: (active: boolean) => void;
    setHover: (hover: boolean) => void;
    setValue: (value: string | null) => void; // Zmiana nazwy
    cycleValues: () => void; // Zmiana nazwy
    setValueByIndex: (index: number) => void; // Zmiana nazwy
    resetValue: () => void; // Zmiana nazwy
    handleClick: (e: React.SyntheticEvent<HTMLButtonElement>) => void;
    handleFocus: (e: React.FocusEvent<HTMLButtonElement>) => void;
    handleBlur: (e: React.FocusEvent<HTMLButtonElement>) => void;
    handleMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => void;
    handleMouseUp: (e: React.MouseEvent<HTMLButtonElement>) => void;
    handleMouseEnter: () => void;
    handleMouseLeave: () => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
    handleKeyUp: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
}

export interface ButtonConfig extends Pick<BaseButtonProps,
    'disabled' | 'loading' | 'selected' | 'size' | 'color' | 'type'
> {
    componentName: string;
    values?: (string | null)[]; // Zmiana z 'pressedStates' na 'values'
    showLoadingIndicator?: boolean;
}

export interface ButtonContextValue {
    // Stan przycisku
    state: ButtonState;

    // Akcje
    actions: ButtonActions;

    // Konfiguracja
    config: ButtonConfig;

    // Klasy CSS
    classes: string;

    // Dodatkowe metody
    isInteractable: boolean;
    shouldShowLoading: boolean;

    // Nowe helper methods
    currentValueIndex: number; // Zmiana nazwy
    hasValue: boolean; // Zmiana z 'isPressed' na 'hasValue'
    values: (string | null)[]; // Zmiana nazwy
}

// Domyślne wartości
const defaultState: ButtonState = {
    focused: false,
    active: false,
    hover: false,
    value: null,
};

const defaultConfig: ButtonConfig = {
    componentName: 'BaseButton',
    disabled: false,
    loading: false,
    selected: false,
    size: 'medium',
    color: 'primary',
    type: 'button',
    values: [],
    showLoadingIndicator: undefined,
};

// Kontekst
const ButtonContext = createContext<ButtonContextValue | null>(null);

// Provider props
export interface ButtonProviderProps {
    children: React.ReactNode;
    config: Partial<ButtonConfig>;
    onClick?: () => void;
    onFocus?: (e: React.FocusEvent<HTMLButtonElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLButtonElement>) => void;
    onMouseDown?: () => void;
    onMouseUp?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
    onKeyUp?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
    onChange?: (value: string | null) => void;
}

// Provider komponent
export const ButtonProvider: React.FC<ButtonProviderProps> = ({
    children,
    config: configProp,
    onClick,
    onFocus,
    onBlur,
    onMouseDown,
    onMouseUp,
    onMouseEnter,
    onMouseLeave,
    onKeyDown,
    onKeyUp,
    onChange
}) => {
    const config: ButtonConfig = {
        ...defaultConfig,
        ...configProp,
    };

    // Helper values
    const values = config.values || [];

    // Inicjalna wartość value
    const initialValue = React.useMemo(() => {
        const nullState = values.find(state => state === null);
        if (nullState === null) return null;
        return values.length > 0 ? values[0] : null;
    }, [values]);

    const [state, setState] = useState<ButtonState>(() => ({
        ...defaultState,
        value: initialValue,
    }));

    // Flaga do śledzenia czy komponent jest już zamontowany
    const [isMounted, setIsMounted] = useState(false);

    // Wywołaj onChange dla wartości inicjalnej po zamontowaniu
    React.useEffect(() => {
        if (!isMounted) {
            setIsMounted(true);
            // Wywołaj onChange dla wartości inicjalnej
            if (initialValue !== null) {
                onChange?.(initialValue);
            }
        }
    }, [isMounted, initialValue, onChange]);

    // Aktualizuj value gdy values się zmienią
    React.useEffect(() => {
        // Pomiń pierwszy render (inicjalizację)
        if (!isMounted) return;

        if (values.length > 0 && !values.includes(state.value)) {
            const newValue = values[0];
            if (newValue !== state.value) {
                setState(prev => ({ ...prev, value: newValue }));
                onChange?.(newValue);
            }
        }
    }, [values, state.value, onChange, isMounted]);

    // Sprawdź czy przycisk może być interaktywny
    const isInteractable = !config.disabled && !config.loading;

    // Sprawdź czy pokazać loading
    const shouldShowLoading = !!config.loading;

    const currentValueIndex = values.indexOf(state.value);
    const hasValue = state.value !== null;

    // Akcje
    const setFocused = useCallback((focused: boolean) => {
        setState(prev => {
            if (prev.focused !== focused) {
                return { ...prev, focused };
            }
            return prev; // Nie zmieniaj stanu jeśli wartość jest taka sama
        });
    }, []);

    const setActive = useCallback((active: boolean) => {
        setState(prev => {
            if (prev.active !== active) {
                return { ...prev, active };
            }
            return prev; // Nie zmieniaj stanu jeśli wartość jest taka sama
        });
    }, []);

    const setHover = useCallback((hover: boolean) => {
        setState(prev => {
            if (prev.hover !== hover) {
                return { ...prev, hover };
            }
            return prev; // Nie zmieniaj stanu jeśli wartość jest taka sama
        });
    }, []);

    const setValue = useCallback((value: string | null) => {
        // Sprawdź czy value jest w dostępnych stanach
        if (values.includes(value)) {
            setState(prev => {
                if (prev.value !== value) {
                    onChange?.(value);
                    return { ...prev, value };
                }
                return prev;
            });
        }
    }, [values, onChange]);

    const cycleValues = useCallback(() => {
        if (values.length === 0) return;

        setState(prev => {
            const currentIndex = values.indexOf(prev.value);
            const nextIndex = (currentIndex + 1) % values.length;
            const newValue = values[nextIndex];
            console.log('Cycling values', prev.value, '->', newValue);

            if (newValue !== prev.value) {
                setTimeout(() => onChange?.(newValue), 0);
                return { ...prev, value: newValue };
            }
            return prev;
        });
    }, [values, onChange]);

    const setValueByIndex = useCallback((index: number) => {
        if (index >= 0 && index < values.length) {
            const newValue = values[index];
            setState(prev => {
                if (prev.value !== newValue) {
                    onChange?.(newValue);
                    return { ...prev, value: newValue };
                }
                return prev;
            });
        } else if (values.length > 0) {
            // Jeśli indeks poza zakresem, ustaw pierwszą wartość
            const newValue = values[0];
            setState(prev => {
                if (prev.value !== newValue) {
                    onChange?.(newValue);
                    return { ...prev, value: newValue };
                }
                return prev;
            });
        }
    }, [values, onChange]);

    const resetValue = useCallback(() => {
        // Resetuj do pierwszej wartości z listy, lub null jeśli lista jest pusta
        if (values.length > 0) {
            const newValue = values[0];
            setState(prev => {
                if (prev.value !== newValue) {
                    onChange?.(newValue);
                    return { ...prev, value: newValue };
                }
                return prev;
            });
        } else {
            setState(prev => {
                if (prev.value !== null) {
                    onChange?.(null);
                    return { ...prev, value: null };
                }
                return prev;
            });
        }
    }, [values, onChange]);

    // Event handlers
    const handleClick = useCallback((_e: React.SyntheticEvent<HTMLButtonElement>) => {
        if (isInteractable) {
            // Jeśli są dostępne stany pressed, przełącz je przy kliknięciu
            if (values.length > 0) {
                cycleValues();
            }

            onClick?.();
        }
    }, [isInteractable, values.length, cycleValues, onClick]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLButtonElement>) => {
        setFocused(true);
        onFocus?.(e);
    }, [setFocused, onFocus]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLButtonElement>) => {
        setFocused(false);
        setActive(false);
        onBlur?.(e);
    }, [setFocused, setActive, onBlur]);

    const handleMouseDown = useCallback((_e: React.MouseEvent<HTMLButtonElement>) => {
        if (isInteractable) {
            setActive(true);
        }
        onMouseDown?.();
    }, [isInteractable, setActive, onMouseDown]);

    const handleMouseUp = useCallback((_e: React.MouseEvent<HTMLButtonElement>) => {
        setActive(false);
        onMouseUp?.();
    }, [setActive, onMouseUp]);

    const handleMouseEnter = useCallback(() => {
        if (isInteractable) {
            setHover(true);
        }
        onMouseEnter?.();
    }, [isInteractable, setHover, onMouseEnter]);

    const handleMouseLeave = useCallback(() => {
        setHover(false);
        setActive(false);
        onMouseLeave?.();
    }, [setHover, setActive, onMouseLeave]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (isInteractable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setActive(true);

            if (e.key === 'Enter') {
                handleClick(e);
            }
        }
        onKeyDown?.(e);
    }, [isInteractable, setActive, handleClick, onKeyDown]);

    const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (isInteractable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setActive(false);

            // Tylko spacja wywołuje click w keyUp
            if (e.key === ' ') {
                handleClick(e);
            }
        }
        onKeyUp?.(e);
    }, [isInteractable, setActive, handleClick, onKeyUp]);

    // Generowanie klas CSS
    const classes = React.useMemo(() => {
        const classArray = [
            `size-${config.size}`,
            `color-${config.color}`,
            `type-${config.type}`,
        ];

        if (config.disabled) classArray.push('disabled');
        if (config.loading) classArray.push('loading');
        if (config.selected) classArray.push('selected');
        if (state.focused) classArray.push('focused');
        if (state.active) classArray.push('active');
        if (state.hover) classArray.push('hover');

        // Dodaj klasę dla konkretnego stanu pressed
        if (state.value !== null) {
            classArray.push(`value-${state.value}`); // Zmiana nazwy klasy
            classArray.push('has-value'); // Ogólna klasa
        }

        return classArray.join(' ');
    }, [config, state]);

    const actions: ButtonActions = {
        setFocused,
        setActive,
        setHover,
        setValue, // Zmiana nazwy
        cycleValues, // Zmiana nazwy
        setValueByIndex, // Zmiana nazwy
        resetValue, // Zmiana nazwy
        handleClick,
        handleFocus,
        handleBlur,
        handleMouseDown,
        handleMouseUp,
        handleMouseEnter,
        handleMouseLeave,
        handleKeyDown,
        handleKeyUp,
    };

    const value: ButtonContextValue = {
        state,
        actions,
        config,
        classes,
        isInteractable,
        shouldShowLoading,
        currentValueIndex, // Zmiana nazwy
        hasValue, // Zmiana nazwy
        values, // Zmiana nazwy
    };

    return (
        <ButtonContext.Provider value={value}>
            {children}
        </ButtonContext.Provider>
    );
};

// Hook do używania kontekstu
export const useButtonContext = (): ButtonContextValue => {
    const context = useContext(ButtonContext);
    if (!context) {
        throw new Error('useButtonContext must be used within a ButtonProvider');
    }
    return context;
};

// Hook do używania tylko stanu
export const useButtonState = (): ButtonState => {
    const { state } = useButtonContext();
    return state;
};

// Hook do używania tylko akcji
export const useButtonActions = (): ButtonActions => {
    const { actions } = useButtonContext();
    return actions;
};

// Hook do używania tylko konfiguracji
export const useButtonConfig = (): ButtonConfig => {
    const { config } = useButtonContext();
    return config;
};

// Hook do sprawdzania stanów
export const useButtonStatus = () => {
    const { isInteractable, shouldShowLoading } = useButtonContext();
    return {
        isInteractable,
        shouldShowLoading,
    };
};

// Helper hook do sprawdzania czy przycisk jest w określonym stanie
export const useButtonIs = () => {
    const { state, config, hasValue, currentValueIndex } = useButtonContext();

    return {
        isFocused: state.focused,
        isActive: state.active,
        isHover: state.hover,
        isPressed: hasValue,
        pressedState: state.value,
        pressedIndex: currentValueIndex,
        isDisabled: config.disabled,
        isLoading: !!config.loading,
        isSelected: config.selected,
        isInteractable: !config.disabled && !config.loading,
    };
};

// Hook do zarządzania pressed states
export const usePressedStates = () => {
    const { state, actions, values, currentValueIndex } = useButtonContext();

    return {
        currentPressed: state.value,
        currentIndex: currentValueIndex,
        availableStates: values,
        setPressed: actions.setValue,
        cyclePressedStates: actions.cycleValues,
        setPressedByIndex: actions.setValueByIndex,
        resetPressed: actions.resetValue,
        isPressed: state.value !== null,
        isPressedState: (stateName: string | null) => state.value === stateName,
    };
};

export default ButtonContext;

