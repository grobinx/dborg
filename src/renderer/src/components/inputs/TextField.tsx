import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';
import { validateMaxLength, validateMinLength } from './base/useValidation';
import { BaseInputField } from './base/BaseInputField';
import { List, ListItemButton, ListItemText, Paper, Popper, ClickAwayListener } from '@mui/material';

interface TextFieldProps extends BaseInputProps {
    placeholder?: FormattedContentItem;
    maxLength?: number;
    minLength?: number;
    adornments?: React.ReactNode;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    // NEW: identyfikator do historii w localStorage (włącza zapis)
    storeId?: string;
    // NEW: maksymalna liczba zapamiętanych pozycji
    historyLimit?: number;
}

export const TextField: React.FC<TextFieldProps> = (props) => {
    const {
        value,
        maxLength,
        minLength,
        inputProps,
        storeId,
        historyLimit = 20,
        ...other
    } = props;

    const decorator = useInputDecorator();
    const inputRef = React.useRef<HTMLDivElement>(null);
    const [listOpen, setListOpen] = React.useState(false);
    const [listSelectedIndex, setListSelectedIndex] = React.useState(-1);

    // Wczytaj historię (jeśli potrzebna)
    const [storedList, setStoredList] = React.useState<string[]>(() => {
        if (!storeId) return [];
        try {
            const stored = localStorage.getItem(`textFieldHistory-${storeId}`);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    if (decorator && maxLength) {
        Promise.resolve().then(() => {
            decorator.setRestrictions([`${(value ?? "").length}/${maxLength}`]);
        });
    }

    // Filtrowanie storedList wg wpisywanego tekstu
    const filteredSuggestions = React.useMemo(() => {
        const currentValue = (value ?? "").toString().trim();
        if (!currentValue || !storeId) return [];

        return storedList.filter(
            item =>
                item.toLowerCase().includes(currentValue.toLowerCase()) &&
                item !== currentValue // Nie pokazuj aktualnej wartości
        );
    }, [value, storedList, storeId]);

    // Aktualizuj stan listy przy zmianie sugestii
    React.useEffect(() => {
        setListOpen(filteredSuggestions.length > 0);
        setListSelectedIndex(filteredSuggestions.length > 0 ? 0 : -1);
    }, [filteredSuggestions.length]);

    const handleClose = () => {
        setListOpen(false);
    };

    // Zapis do historii przy opuszczeniu pola
    const handleBlur = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        // Opóźnij zamknięcie aby kliknięcie w listę mogło się wykonać
        setTimeout(() => {
            handleClose();
        }, 200);

        if (!storeId) return;

        const v = (e.currentTarget.value ?? "").trim();
        if (!v) return;

        // Unikaj duplikatów, najnowsze na końcu
        const next = storedList.includes(v)
            ? storedList
            : [...storedList, v].slice(-historyLimit);

        if (JSON.stringify(next) !== JSON.stringify(storedList)) {
            setStoredList(next);
            try {
                localStorage.setItem(`textFieldHistory-${storeId}`, JSON.stringify(next));
            } catch {
                // ignore storage errors
            }
        }
    }, [storeId, storedList, historyLimit]);

    // Obsługa klawiatury
    const handleInputKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!listOpen || filteredSuggestions.length === 0) {
            inputProps?.onKeyDown?.(e as any);
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setListSelectedIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            setListSelectedIndex(prev => Math.max(prev - 1, 0));
        }
        if (e.key === "Enter" && listSelectedIndex >= 0 && listSelectedIndex < filteredSuggestions.length) {
            e.preventDefault();
            const selectedValue = filteredSuggestions[listSelectedIndex];
            other.onChange?.(selectedValue);
            handleClose();
        }
        if (e.key === "Escape") {
            e.preventDefault();
            handleClose();
        }
    }, [listOpen, filteredSuggestions, listSelectedIndex, other.onChange, inputProps]);

    // Wybór z listy
    const handleSelectSuggestion = (suggestion: string) => {
        other.onChange?.(suggestion);
        handleClose();
    };

    return (
        <>
            <BaseInputField
                ref={inputRef}
                value={value}
                inputProps={{
                    maxLength,
                    minLength,
                    type: 'text',
                    ...inputProps,
                    onKeyDown: handleInputKeyDown,
                }}
                onBlur={(e) => handleBlur(e as React.FocusEvent<HTMLInputElement>)}
                onFocus={() => {
                    if (filteredSuggestions.length > 0) {
                        setListOpen(true);
                    }
                }}
                validations={[
                    (value: any) => validateMinLength(value, minLength),
                    (value: any) => validateMaxLength(value, maxLength),
                ]}
                {...other}
            />

            {/* Lista podpowiedzi */}
            {filteredSuggestions.length > 0 && inputRef.current && (
                <ClickAwayListener onClickAway={handleClose}>
                    <Popper
                        open={listOpen}
                        anchorEl={inputRef.current}
                        style={{
                            zIndex: 1300,
                            width: inputRef.current ? `${inputRef.current.offsetWidth}px` : "auto",
                        }}
                    >
                        <Paper sx={{ margin: 1 }}>
                            <List dense disablePadding>
                                {filteredSuggestions.map((suggestion, index) => (
                                    <ListItemButton
                                        key={suggestion}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleSelectSuggestion(suggestion);
                                        }}
                                        selected={listSelectedIndex === index}
                                    >
                                        <ListItemText primary={suggestion} />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Paper>
                    </Popper>
                </ClickAwayListener>
            )}
        </>
    );
};

TextField.displayName = "TextField";
