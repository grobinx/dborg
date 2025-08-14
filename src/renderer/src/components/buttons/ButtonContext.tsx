import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { BaseButtonProps } from './BaseButtonProps';
import { f } from 'react-router/dist/development/route-data-H2S3hwhf';

type FocusSource = "keyboard" | "mouse" | "program" | null;

// Typy dla kontekstu
export interface ButtonState {
    focused: boolean;
    focusedSource: FocusSource;
    active: boolean;
    hover: boolean;
    value: string | null;
}

export interface ButtonActions {
    setFocused: (focused: boolean) => void;
    setFocusedSource: (source: FocusSource) => void;
    setActive: (active: boolean) => void;
    setHover: (hover: boolean) => void;
    setValue: (value: string | null) => void;
    cycleValues: () => void;
    resetValue: () => void;
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
    toggle?: string | (string | null)[];
    value?: string | null;
    showLoadingIndicator?: boolean;
}

export interface ButtonContextValue {
    state: ButtonState;
    actions: ButtonActions;
    config: ButtonConfig;
    classes: string;
    isInteractable: boolean;
    shouldShowLoading: boolean;
    currentValueIndex: number;
    hasValue: boolean;
    toggleValues: (string | null)[]; // Znormalizowana tablica wartości
}

// Domyślne wartości
const defaultState: ButtonState = {
    focused: false,
    focusedSource: null,
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
    toggle: undefined,
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

// Helper function do normalizacji toggle
const normalizeToggle = (toggle: string | (string | null)[] | undefined): (string | null)[] => {
    if (!toggle) return [];

    if (typeof toggle === 'string') {
        // Jeśli toggle to string, stwórz przełącznik [null, string]
        return [null, toggle];
    }

    if (Array.isArray(toggle)) {
        return toggle;
    }

    return [];
};

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
    // Normalizacja konfiguracji
    const config: ButtonConfig = React.useMemo(() => ({
        ...defaultConfig,
        ...configProp,
    }), [configProp]);

    // Normalizacja toggle do tablicy
    const toggleValues = React.useMemo(() =>
        normalizeToggle(config.toggle),
        [config.toggle]
    );

    // Inicjalna wartość value - uwzględnij przekazane value
    const initialValue = React.useMemo(() => {
        // Jeśli value zostało przekazane i jest w toggleValues, użyj go
        if (config.value !== undefined && toggleValues.includes(config.value)) {
            return config.value;
        }

        // W przeciwnym przypadku użyj pierwszej wartości lub null
        return toggleValues.length > 0 ? toggleValues[0] : null;
    }, [toggleValues, config.value]);

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
            // Wywołaj onChange dla wartości inicjalnej tylko jeśli nie jest null
            if (initialValue !== null) {
                onChange?.(initialValue);
            }
        }
    }, [isMounted, initialValue, onChange]);

    // Aktualizuj value gdy toggleValues się zmienią
    React.useEffect(() => {
        // Pomiń pierwszy render (inicjalizację)
        if (!isMounted) return;

        if (toggleValues.length > 0 && !toggleValues.includes(state.value)) {
            const newValue = toggleValues[0];
            if (newValue !== state.value) {
                setState(prev => ({ ...prev, value: newValue }));
                onChange?.(newValue);
            }
        }
    }, [toggleValues, state.value, onChange, isMounted]);

    // Aktualizuj value gdy config.value się zmieni
    React.useEffect(() => {
        if (config.value !== undefined && config.value !== state.value && toggleValues.includes(config.value)) {
            setState(prev => ({ ...prev, value: config.value! }));
            if (isMounted) {
                onChange?.(config.value!);
            }
        }
    }, [config.value, state.value, toggleValues, onChange, isMounted]);

    // Sprawdź czy przycisk może być interaktywny
    const isInteractable = !config.disabled && !config.loading;

    // Sprawdź czy pokazać loading
    const shouldShowLoading = !!config.loading;

    const currentValueIndex = toggleValues.indexOf(state.value);
    const hasValue = state.value !== null;

    // Akcje
    const setFocused = useCallback((focused: boolean) => {
        setState(prev => {
            if (prev.focused !== focused) {
                return { ...prev, focused };
            }
            return prev;
        });
    }, []);

    const setFocusedSource = useCallback((source: FocusSource) => {
        setState(prev => {
            if (prev.focusedSource !== source) {
                return { ...prev, focusedSource: source };
            }
            return prev;
        });
    }, []);

    const setActive = useCallback((active: boolean) => {
        setState(prev => {
            if (prev.active !== active) {
                return { ...prev, active };
            }
            return prev;
        });
    }, []);

    const setHover = useCallback((hover: boolean) => {
        setState(prev => {
            if (prev.hover !== hover) {
                return { ...prev, hover };
            }
            return prev;
        });
    }, []);

    const setValue = useCallback((value: string | null) => {
        // Sprawdź czy value jest w dostępnych stanach
        if (toggleValues.includes(value)) {
            setState(prev => {
                if (prev.value !== value) {
                    setTimeout(() => onChange?.(value), 0);
                    return { ...prev, value };
                }
                return prev;
            });
        }
    }, [toggleValues, onChange]);

    const cycleValues = useCallback(() => {
        if (toggleValues.length === 0) return;

        setState(prev => {
            const currentIndex = toggleValues.indexOf(prev.value);
            const nextIndex = (currentIndex + 1) % toggleValues.length;
            const newValue = toggleValues[nextIndex];

            if (newValue !== prev.value) {
                setTimeout(() => onChange?.(newValue), 0);
                return { ...prev, value: newValue };
            }
            return prev;
        });
    }, [toggleValues, onChange]);

    const resetValue = useCallback(() => {
        // Resetuj do pierwszej wartości z listy, lub null jeśli lista jest pusta
        if (toggleValues.length > 0) {
            const newValue = toggleValues[0];
            setState(prev => {
                if (prev.value !== newValue) {
                    setTimeout(() => onChange?.(newValue), 0);
                    return { ...prev, value: newValue };
                }
                return prev;
            });
        } else {
            setState(prev => {
                if (prev.value !== null) {
                    setTimeout(() => onChange?.(null), 0);
                    return { ...prev, value: null };
                }
                return prev;
            });
        }
    }, [toggleValues, onChange]);

    // Event handlers
    const handleClick = useCallback((_e: React.SyntheticEvent<HTMLButtonElement>) => {
        if (isInteractable) {
            // Jeśli są dostępne stany toggle, przełącz je przy kliknięciu
            if (toggleValues.length > 0) {
                cycleValues();
            }

            onClick?.();
        }
    }, [isInteractable, toggleValues.length, cycleValues, onClick]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLButtonElement>) => {
        setFocused(true);
        onFocus?.(e);
        setFocusedSource(state.focusedSource ?? 'keyboard');
    }, [setFocused, onFocus, setFocusedSource, state.focusedSource]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLButtonElement>) => {
        setFocused(false);
        setActive(false);
        setFocusedSource(null);
        onBlur?.(e);
    }, [setFocused, setActive, setFocusedSource, onBlur]);

    const handleMouseDown = useCallback((_e: React.MouseEvent<HTMLButtonElement>) => {
        if (isInteractable) {
            setActive(true);
            setFocusedSource(state.focusedSource ?? 'mouse');
        }
        onMouseDown?.();
    }, [isInteractable, setActive, setFocusedSource, state.focusedSource, onMouseDown]);

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
        if (isInteractable) {
            if ((e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                setActive(true);

                if (e.key === 'Enter') {
                    handleClick(e);
                }
            }
        }
        onKeyDown?.(e);
    }, [isInteractable, setActive, handleClick, onKeyDown, setFocusedSource, state.focusedSource]);

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
        if (state.focusedSource) classArray.push(`focused-${state.focusedSource}`);
        if (state.active) classArray.push('active');
        if (state.hover) classArray.push('hover');

        // Dodaj klasę dla konkretnego stanu value
        if (state.value !== null) {
            classArray.push(`value-${state.value}`);
            classArray.push('has-value');
        }

        return classArray.join(' ');
    }, [config, state]);

    const actions: ButtonActions = {
        setFocused,
        setFocusedSource,
        setActive,
        setHover,
        setValue,
        cycleValues,
        resetValue,
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
        currentValueIndex,
        hasValue,
        toggleValues, // Zwróć znormalizowaną tablicę
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

// Hook do zarządzania toggle states
export const useToggleStates = () => {
    const { state, actions, toggleValues, currentValueIndex } = useButtonContext();

    return {
        currentValue: state.value,
        currentIndex: currentValueIndex,
        availableValues: toggleValues,
        setValue: actions.setValue,
        cycleValues: actions.cycleValues,
        resetValue: actions.resetValue,
        hasValue: state.value !== null,
        isValue: (valueName: string | null) => state.value === valueName,
    };
};

export default ButtonContext;

