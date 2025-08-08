import { ThemeColor } from "@renderer/types/colors";
import { Size } from "@renderer/types/sizes";
import { FormattedContentItem } from "../useful/FormattedText";

interface BaseProps {
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
}

export interface BaseButtonProps extends BaseProps {
    id?: string;

    /**
     * Callback wywoływany przy kliknięciu
     */
    onClick?: () => void;

    /**
     * Callback wywoływany przy fokusie
     */
    onFocus?: () => void;

    /**
     * Callback wywoływany przy utracie fokusu
     */
    onBlur?: () => void;
    
    /**
     * Tab index
     */
    tabIndex?: number;
    
    /**
     * Ref do elementu button
     */
    ref?: React.Ref<HTMLButtonElement>;
}

export interface BaseButtonContentProps extends BaseProps {
    /**
     * Ref do elementu zawartości
     */
    ref?: React.Ref<HTMLElement>;

}