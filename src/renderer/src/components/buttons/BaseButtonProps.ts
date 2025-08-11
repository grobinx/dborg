import { ThemeColor } from "@renderer/types/colors";
import { Size } from "@renderer/types/sizes";
import { FormattedContentItem } from "../useful/FormattedText";
import { SxProps } from "@mui/material";
import { Theme } from "@mui/system";

export interface BaseButtonProps {
    /**
     * Komponent, który będzie renderowany
     * Może to być np. 'span', 'div', 'button' lub inny komponent React.
     */
    component?: React.ElementType;
    
    /**
     * Tekst lub zawartość przycisku
     */
    children?: React.ReactNode;
    
    /**
     * Dodatkowe klasy CSS
     */
    className?: string;

    /**
     * Czy przycisk jest nieaktywny
     * @default false
     */
    disabled?: boolean;
    
    /**
     * Czy przycisk jest w stanie ładowania
     * @default false
     */
    loading?: boolean | FormattedContentItem;
    
    /**
     * Czy przycisk jest w stanie wybranym
     * @default false
     */
    selected?: boolean;
    
    /**
     * Rozmiar przycisku
     * @default "medium"
     */
    size?: Size;
    
    /**
     * Kolor motywu
     * @default "primary"
     */
    color?: ThemeColor;
    
    /**
     * Typ przycisku HTML
     * @default "button"
     */
    type?: "button" | "submit" | "reset";

    /**
     * Stany przycisku
     */
    values?: (string | null)[];

    /**
     * Aktualny stan przycisku
     */
    value?: string | null;

    /**
     * Funkcja wywoływana po zmianie stanu przycisku
     * @param value Nowy stan przycisku
     * @returns
     */
    onChange?: (value: string | null) => void;

    id?: string;

    componentName?: string;

    showLoadingIndicator?: boolean;

    onClick?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onMouseDown?: () => void;
    onMouseUp?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onKeyDown?: () => void;
    onKeyUp?: () => void;
    
    /**
     * Tab index
     */
    tabIndex?: number;

    slots?: {
        // content?: React.ComponentType<BaseButtonContentProps>;
        // loading?: React.ComponentType<BaseButtonLoadingProps>;
    }
    
    ref?: React.Ref<ButtonRefHandle>;

    'aria-label'?: string;
    'aria-describedby'?: string;

    /**
     * Style obiektu (np. MUI sx prop)
     */
    sx?: SxProps<Theme>;
    style?: React.CSSProperties;
}

export interface ButtonRefHandle {
    // Focus management
    focus: () => void;
    blur: () => void;
    
    // State management
    setValue: (value: string | null) => void;
    getValue: () => string | null;
    cycleValues: () => void;
    setValueByIndex: (index: number) => void;
    resetValue: () => void;
    
    // State getters
    isFocused: () => boolean;
    isActive: () => boolean;
    isHover: () => boolean;
    hasValue: () => boolean;
    isInteractable: () => boolean;
    
    // DOM element access
    getElement: () => HTMLButtonElement | null;
    
    // Manual state setters
    setFocused: (focused: boolean) => void;
    setActive: (active: boolean) => void;
    setHover: (hover: boolean) => void;
    
    // Click simulation
    click: () => void;
}
