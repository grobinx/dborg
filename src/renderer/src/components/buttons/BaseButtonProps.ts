import { ThemeColor } from "@renderer/types/colors";
import { Size } from "@renderer/types/sizes";
import { FormattedContentItem } from "../useful/FormattedText";
import { SxProps } from "@mui/material";
import { Theme } from "@mui/system";
import { Action } from "../CommandPalette/ActionManager";

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
     * Czy pokazywać wskaźnik ładowania
     * @default true
     */
    showLoadingIndicator?: boolean;
    
    /**
     * Czy przycisk jest w stanie wybranym
     * @default false
     */
    selected?: boolean;
    
    /**
     * Rozmiar przycisku
     * @default "medium"
     */
    size?: Size | "default";

    /**
     * Czy przycisk jest w gęstym układzie
     * @default false
     */
    dense?: boolean;

    /**
     * Czy przycisk jest płaski (bez tła)
     * @default false
     */
    flat?: boolean;

    /**
     * Kolor motywu
     * @default "primary"
     */
    color?: ThemeColor | "default";
    
    /**
     * Typ przycisku HTML
     * @default "button"
     */
    type?: "button" | "submit" | "reset";

    /**
     * Stany przycisku
     */
    toggle?: string | ((string | null)[]);

    /**
     * Aktualny stan przycisku
     */
    value?: string | null;

    /**
     * Domyślny stan przycisku
     */
    defaultValue?: string | null;

    /**
     * Funkcja wywoływana po zmianie stanu przycisku
     * @param value Nowy stan przycisku
     * @returns
     */
    onChange?: (value: string | null) => void;

    id?: string;

    componentName?: string;

    onClick?: React.MouseEventHandler<HTMLButtonElement>
    onFocus?: React.FocusEventHandler<HTMLButtonElement>;
    onBlur?: React.FocusEventHandler<HTMLButtonElement>;
    onMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
    onMouseUp?: React.MouseEventHandler<HTMLButtonElement>;
    onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;
    onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
    onKeyUp?: React.KeyboardEventHandler<HTMLButtonElement>;

    /**
     * Tab index
     */
    tabIndex?: number;

    ref?: React.Ref<HTMLButtonElement>;

    'aria-label'?: string;
    'aria-describedby'?: string;

    /**
     * Style obiektu (np. MUI sx prop)
     */
    sx?: SxProps<Theme>;
    style?: React.CSSProperties;

    width?: string | number;
    height?: string | number;
}

export interface BaseButtonLoadingProps {
    componentName: string;
    className?: string;
    loading?: boolean | FormattedContentItem;
    showLoadingIndicator?: boolean;
}

export interface BaseButtonContentProps {
    componentName: string;
    className?: string;
    children?: React.ReactNode;
}
