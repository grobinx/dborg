import { ThemeColor } from "@renderer/types/colors";
import { Size } from "@renderer/types/sizes";
import { FormattedContentItem } from "../useful/FormattedText";
import { SxProps } from "@mui/material";
import { Theme } from "@mui/system";
import { BaseButtonContent, BaseButtonLoading } from './BaseButton';

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
    toggle?: string | ((string | null)[]);

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

    ref?: React.Ref<HTMLButtonElement>;

    'aria-label'?: string;
    'aria-describedby'?: string;

    /**
     * Style obiektu (np. MUI sx prop)
     */
    sx?: SxProps<Theme>;
    style?: React.CSSProperties;
}
