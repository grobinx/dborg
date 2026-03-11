import { ThemeIconName } from "@renderer/themes/icons";
import { Action } from "../CommandPalette/ActionManager";
import { Size } from "@renderer/types/sizes";

/**
 * Poziom ważności elementu Rich Content, wpływający na jego kolor i ikonę.
 */
export type RichSeverity = "default" | "info" | "warning" | "error" | "success";

/**
 * Wariant typograficzny tekstu w Rich Content.
 */
export type RichTextVariant = "body" | "caption" | "label" | "title" | "description" | "markdown";

/**
 * Wariant chipów w Rich Content (np. dla alertów lub tagów).
 */
export type RichChipVariant = "outlined" | "filled";

/**
 * Typ odstępów
 */
export type RichGap = number | string;

/**
 * Typ rozmiaru kolumny w układzie siatki (Grid System)
 */
export type RichColSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | "auto";

/**
 * Typ węzła w strukturze Rich Content.
 */
export type RichNodeType =
    | "text" | "link" | "chip" | "code" | "progress" | "group"
    | "row" | "column" | "icon" | "divider"
    | "spacer" | "alert" | "kbd" | "action" | "image"
    | "list" | "listitem";

/**
 * Union type wszystkich możliwych węzłów Rich Content.
 */
export type RichNode =
    | IRichText
    | IRichLink
    | IRichChip
    | IRichCode
    | IRichProgress
    | IRichIcon
    | IRichGroup
    | IRichRow
    | IRichColumn
    | IRichDivider
    | IRichSpacer
    | IRichAlert
    | IRichKbd
    | IRichAction
    | IRichImage
    | IRichList
    | IRichListItem
    | RichNode[]
    | string | number;

/**
 * Domyślne wartości dla kontenerów Rich Content (grupy, wiersze, kolumny).
 * Umożliwia ustawienie globalnych stylów i odstępów dla wszystkich elementów wewnątrz kontenera.
 */
export interface IRichContainerDefaults {
    /**
     * Domyślny font dla zwykłego tekstu.
     * @default ui/fontFamily
     */
    fontFamily?: string;
    /**
     * Domyślny font dla kodu/kbd/monospace.
     * @default ui/fontFamilyMonospace
     */
    fontFamilyMonospace?: string;
    /**
     * Domyślny rozmiar fontu.
     * @default ui/fontSize
     */
    fontSize?: number | string;
    /**
     * Domyślna grubość fontu.
     * @default "normal"
     */
    fontWeight?: number | string;
    /**
     * Domyślny padding dla kontenera/grup.
     * @default 8
     */
    padding?: number | string;
    /**
     * Domyślny gap między elementami.
     * @default 8
     */
    gap?: RichGap;
    /**
     * Domyślna wartość radius dla elementów z obramowaniem (np. alert, chip).
     * @default 4
     */
    radius?: number | string;
}

/**
 * Kontener dla elementów Rich Content, który może zawierać inne węzły.
 */
export interface IRichContainer extends IRichContainerDefaults {
    /**
     * Elementy wewnątrz kontenera
     */
    items: RichNode[];
    /**
     * Szerokość kontenera (np. "100%", "auto", 300)
     * @default "100%" 
     */
    width?: number | string;
    /**
     * Wysokość kontenera (np. "100%", "auto", 300)
     * @default "auto"
     */
    height?: number | string;
    /**
     * Zachowanie zawartości przy przekroczeniu rozmiaru kontenera
     * @default "auto"
     */
    overflow?: "visible" | "hidden" | "scroll" | "auto";
}

/**
 * Bazowy interfejs dla wszystkich węzłów Rich Content.
 */
export interface IRichNode {
    /**
     * Typ węzła
     */
    type: RichNodeType;
}

/**
 * Separator wizualny (linia pozioma).
 */
export interface IRichDivider extends IRichNode {
    type: "divider";
}

/**
 * Singleton instance separatora do wielokrotnego użycia.
 */
export const RichDivider: IRichDivider = { type: "divider" };

/**
 * Chip (mały element z tekstem, podobny do tagu).
 */
export interface IRichChip extends IRichNode {
    type: "chip";
    /**
     * Tekst wyświetlany w chipie
     */
    text: string;
    /**
     * Poziom ważności wpływający na kolor
     */
    severity?: RichSeverity;
    /**
     * Wariant chipu (np. dla alertów lub tagów)
     * @default "filled"
     */
    variant?: RichChipVariant;
    /**
     * Badge wyświetlany na chipie (opcjonalnie)
     */
    badge?: RichBadgeConfig;
}

/**
 * Prosty tekst z opcjonalnym formatowaniem.
 */
export interface IRichText extends IRichNode {
    type: "text";
    /**
     * Tekst do wyświetlenia
     */
    text: string;
    /**
     * Poziom ważności wpływający na kolor
     */
    severity?: RichSeverity;
    /**
     * Wariant typograficzny (rozmiar, grubość czcionki)
     */
    variant?: RichTextVariant;
}

/**
 * Klikalny link (hiperłącze).
 */
export interface IRichLink extends IRichNode {
    type: "link";
    /**
     * Tekst linku (jeśli nie podano, zostanie użyty href)
     */
    text?: string;
    /**
     * Adres URL
     */
    href: string;
    /**
     * Poziom ważności wpływający na kolor
     */
    severity?: RichSeverity;
    /**
     * Wariant typograficzny (rozmiar, grubość czcionki)
     */
    variant?: RichTextVariant;
}

/**
 * Blok kodu z opcjonalnym podświetlaniem składni.
 */
export interface IRichCode extends IRichNode {
    type: "code";
    /**
     * Kod do wyświetlenia
     */
    code: string;
    /**
     * Język składni (np. "sql", "json", "typescript")
     */
    language?: string;
    /**
     * Czy pokazać numery linii
     * @default false
     */
    lineNumbers?: boolean;
}

/**
 * Pasek postępu z opcjonalną etykietą.
 */
export interface IRichProgress extends IRichNode {
    type: "progress";
    /**
     * Wartość postępu (0-100)
     */
    value: number;
    /**
     * Wartość bufora (0-100) (opcjonalnie)
     */
    bufferValue?: number;
    /**
     * Etykieta postępu
     */
    label?: string;
    /**
     * Poziom ważności wpływający na kolor paska
     */
    severity?: RichSeverity;
    /**
     * Czy pokazać procent
     * @default false
     */
    showPercent?: boolean;
}

/**
 * Ikona z opcjonalnym tooltipem.
 */
export interface IRichIcon extends IRichNode {
    type: "icon";
    /**
     * Nazwa ikony z theme lub ReactNode
     */
    icon: React.ReactNode | ThemeIconName;
    /**
     * Poziom ważności wpływający na kolor
     */
    severity?: RichSeverity;
    /**
     * Tooltip wyświetlany po najechaniu
     */
    tooltip?: string;
}

/**
 * Grupa elementów z opcjonalnym tytułem i możliwością zwijania.
 */
export interface IRichGroup extends IRichNode {
    type: "group";
    /**
     * Tytuł grupy (opcjonalnie)
     */
    title?: string;
    /**
     * Ikona grupy (opcjonalnie)
     */
    icon?: React.ReactNode | ThemeIconName;
    /**
     * Odstęp między elementami
     */
    gap?: RichGap;
    /**
     * Elementy wewnątrz grupy
     */
    items: RichNode[];
    /**
     * Poziom ważności grupy
     */
    severity?: RichSeverity;
    /**
     * Czy grupa jest zwijalna
     * @default false
     */
    collapsible?: boolean;
    /**
     * Czy grupa jest domyślnie rozwinięta (jeśli collapsible)
     * @default true
     */
    defaultExpanded?: boolean;
}

export interface IRichRowBase extends IRichNode {
    type: "row";
    /**
     * Wyrównanie elementów w wierszu
     */
    align?: "start" | "center" | "end" | "stretch";
    /**
     * Justyfikacja elementów w wierszu
     */
    justify?: "start" | "center" | "end" | "space-between" | "space-around";
}

/**
 * Kontener układający elementy poziomo (w wierszu).
 */
export interface IRichRowInline extends IRichRowBase {
    /**
     * Układ w trybie inline (elementy będą układane w jednej linii, a nie zawijane do nowej linii)
     */
    layout?: "inline";
    /**
     * Elementy w wierszu (ułożone poziomo)
     */
    items: RichNode[];
    /**
     * Odstęp między elementami
     */
    gap?: RichGap;
}

/**
 * Kontener układający elementy poziomo (w wierszu).
 */
export interface IRichRowGrid extends IRichRowBase {
    /**
     * Układ w trybie grid (elementy będą układane w siatce, a nie zawijane do nowej linii)
     */
    layout: "grid";
    /**
     * Elementy w wierszu (ułożone poziomo)
     */
    items: IRichColumn[];
}

export type IRichRow = IRichRowInline | IRichRowGrid;

/**
 * Kontener układający elementy pionowo (w kolumnie).
 */
export interface IRichColumn extends IRichNode {
    type: "column";
    /**
     * Elementy w kolumnie (ułożone pionowo)
     */
    items: RichNode[];
    /**
     * Odstęp między elementami
     */
    gap?: RichGap;
    /**
     * Szerokość kolumny (jak w Grid System: 1-12 lub "auto")
     */
    size?: RichColSize;
    /**
     * Poziom ważności wpływający na kolor punktora
     */
    severity?: RichSeverity;
    /**
     * Czy wyróżnić element listy (np. poprzez szerszy pasek z lewej strony w kolorze severity)
     * @default false
     */
    indicator?: boolean;
}

/**
 * Spacer - elastyczna przestrzeń między elementami.
 */
export interface IRichSpacer extends IRichNode {
    type: "spacer";
    /**
     * Rozmiar odstępu (np. "8px", "1rem", 16)
     * @default "auto" - zajmuje całą dostępną przestrzeń
     */
    size?: number | string | "auto";
}

/**
 * Alert/Box - kolorowa ramka z tłem dla wyróżnienia treści.
 */
export interface IRichAlert extends IRichNode {
    type: "alert";
    /**
     * Tytuł alertu (opcjonalnie)
     */
    title?: string;
    /**
     * Odstęp między elementami
     */
    gap?: RichGap;
    /**
     * Elementy wewnątrz alertu
     */
    items: RichNode[];
    /**
     * Poziom ważności wpływający na kolor tła i obramowania
     */
    severity?: RichSeverity;
    /**
     * Ikona alertu (opcjonalnie, domyślnie ikona z severity)
     */
    icon?: React.ReactNode | ThemeIconName;
    /**
     * Czy pokazać ikonę
     * @default true
     */
    showIcon?: boolean;
}

/**
 * Kbd - reprezentacja klawisza klawiatury (np. Ctrl, Alt, Enter).
 */
export interface IRichKbd extends IRichNode {
    type: "kbd";
    /**
     * Nazwa klawisza/kombinacji (np. "Ctrl+C", "Enter")
     */
    keys: string | string[];
}

/**
 * Button - prosty przycisk akcji.
 */
export interface IRichAction extends IRichNode, Omit<Action<void>, "groupId" | "contextMenuGroupId" | "contextMenuOrder"> {
    type: "action";
    /**
     * Badge wyświetlany na przycisku (opcjonalnie)
     */
    badge?: RichBadgeConfig;
    /**
     * Poziom ważności wpływający na kolor przycisku
     */
    severity?: RichSeverity;
}

/**
 * Image - obrazek z opcjonalnym alt text i rozmiarem.
 */
export interface IRichImage extends IRichNode {
    type: "image";
    /**
     * URL obrazka lub data URI
     */
    src: string;
    /**
     * Tekst alternatywny (dostępność)
     */
    alt?: string;
    /**
     * Szerokość obrazka
     */
    width?: number | string;
    /**
     * Wysokość obrazka
     */
    height?: number | string;
    /**
     * Jak dopasować obrazek do kontenera
     * @default "contain"
     */
    fit?: "contain" | "cover" | "fill" | "none" | "scale-down";
    /**
     * Powtórzanie (np. "no-repeat", "repeat", "repeat-x", "repeat-y", "space", "round")
     * @default "no-repeat"
     */
    repeat?: "no-repeat" | "repeat" | "repeat-x" | "repeat-y" | "space" | "round";
    /**
     * Rozmiar tile (np. "8px", "1rem", 16)
     * @default "auto"
     */
    tileSize?: number | string;
}

/**
 * Lista z bullet points.
 */
export interface IRichList extends IRichNode {
    type: "list";
    /**
     * Elementy listy
     */
    items: IRichListItem[];
    /**
     * Typ listy
     * @default "bullet"
     */
    listType?: "bullet" | "numbered" | "none";
}

/**
 * Element listy.
 */
export interface IRichListItem extends IRichNode {
    type: "listitem";
    /**
     * Poziom ważności wpływający na kolor punktora
     */
    severity?: RichSeverity;
    /**
     * Czy wyróżnić element listy (np. poprzez szerszy pasek z lewej strony w kolorze severity)
     * @default false
     */
    indicator?: boolean;
    /**
     * Zawartość elementu listy
     */
    items: RichNode[];
}

/**
 * Konfiguracja badge (znaczka) dla elementu.
 */
export interface RichBadgeConfig {
    /**
     * Wartość wyświetlana w badge (liczba lub krótki tekst)
     */
    value: string | number;
    /**
     * Poziom ważności wpływający na kolor
     */
    severity?: RichSeverity;
    /**
     * Maksymalna wartość do wyświetlenia (np. "99+")
     * @default undefined
     */
    max?: number;
    /**
     * Pozycja badge względem elementu
     * @default "top-right"
     */
    position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}
