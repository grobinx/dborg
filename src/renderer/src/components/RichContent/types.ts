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
export type RichTextVariant =
    /**
     * Najmniejszy tekst pomocniczy.
     * Użycie: metadane o niskim priorytecie (np. krótkie dopiski techniczne, małe statusy).
     * Styl bazowy: 0.79em, lineHeight 1.30, fontWeight 400, component span.
     */
    | "micro"
    /**
     * Mały podpis / adnotacja.
     * Użycie: podpisy pod elementami, krótkie opisy wtórne.
     * Styl bazowy: 0.89em, lineHeight 1.35, fontWeight 400, component span.
     */
    | "caption"
    /**
     * Krótki opis treści, bardziej czytelny niż caption.
     * Użycie: opis sekcji, opis elementu UI, tekst pomocniczy pod nagłówkiem.
     * Styl bazowy: 0.95em, lineHeight 1.45, fontWeight 400, component p.
     */
    | "description"
    /**
     * Podstawowy wariant tekstu.
     * Użycie: główna treść akapitów i domyślny tekst w Rich Content.
     * Styl bazowy: 1em, lineHeight 1.50, fontWeight 400, component p.
     */
    | "body"
    /**
     * Tekst podstawowy z mocniejszym akcentem.
     * Użycie: ważniejsze zdanie w akapicie bez zmiany poziomu nagłówka.
     * Styl bazowy: 1em, lineHeight 1.50, fontWeight 600, component p.
     */
    | "body-strong"
    /**
     * Akapit wprowadzający.
     * Użycie: lead na początku sekcji lub krótkie podsumowanie przed treścią.
     * Styl bazowy: 1.12em, lineHeight 1.45, fontWeight 400, component p.
     */
    | "lead"
    /**
     * Etykieta o podwyższonej czytelności.
     * Użycie: labelki pól, nazwy parametrów, krótkie nagłówki wierszy.
     * Styl bazowy: 0.89em, lineHeight 1.30, fontWeight 600, letterSpacing 0.01em, component span.
     */
    | "label"
    /**
     * Etykieta sekcyjna pisana wielkimi literami.
     * Użycie: mały nadtytuł nad właściwym tytułem (kategoria, sekcja).
     * Styl bazowy: 0.79em, lineHeight 1.25, fontWeight 600, letterSpacing 0.08em, uppercase, component span.
     */
    | "overline"
    /**
     * Mały nagłówek sekcji.
     * Użycie: tytuł podsekcji niższego poziomu.
     * Styl bazowy: 1.26em, lineHeight 1.30, fontWeight 600, component h4.
     */
    | "title-sm"
    /**
     * Standardowy tytuł sekcji.
     * Użycie: główny nagłówek bloku treści.
     * Styl bazowy: 1.42em, lineHeight 1.25, fontWeight 600, component h3.
     */
    | "title"
    /**
     * Duży tytuł sekcji.
     * Użycie: mocno eksponowane nagłówki większych paneli.
     * Styl bazowy: 1.60em, lineHeight 1.20, fontWeight 700, component h2.
     */
    | "title-lg"
    /**
     * Największy nagłówek widoku.
     * Użycie: tytuł strony/ekranu.
     * Styl bazowy: 1.80em, lineHeight 1.15, fontWeight 700, component h1.
     */
    | "hero"
    /**
     * Kod inline w treści.
     * Użycie: krótkie fragmenty kodu osadzone w zdaniu (np. nazwa parametru, komenda).
     * Styl bazowy: 0.92em, lineHeight 1.40, fontWeight 400, component code.
     */
    | "code"
    /**
     * Tryb renderowania Markdown.
     * Użycie: gdy tekst ma być parsowany jako Markdown; nie ma bezpośredniego wpisu w RichTextVariantStyles.
     * Mapowanie nagłówków i paragrafów odbywa się w komponencie RichText.
     */
    | "markdown";

/**
 * Style dla wariantów tekstu w Rich Content, definiujący rozmiar, grubość i inne właściwości typograficzne.
 */
export interface RichTextVariantStyle {
    fontSize: string;
    lineHeight: number;
    fontWeight: number;
    letterSpacing?: string;
    textTransform?: "uppercase";
    component: React.ElementType;
}

/**
 * Mapowanie wariantów tekstu na ich style typograficzne w Rich Content.
 */
export type RichTextVariantStyles = Record<Exclude<RichTextVariant, "markdown">, RichTextVariantStyle>;

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
export type RichColSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | "auto" | "stretch";

export type RichValue<V = any> = V | (() => Promise<V>);

/**
 * Typ węzła w strukturze Rich Content.
 */
export type RichNodeType =
    | "text"
    | "link"
    | "chip"
    | "code"
    | "progress"
    | "section"
    | "group"
    | "row"
    | "column"
    | "icon"
    | "divider"
    | "spacer"
    | "alert"
    | "kbd"
    | "action"
    | "image"
    | "list"
    | "switch"
    | "table"
    | "stat"
    | "timeline"
    | "entity"
    | "skeleton"
    | "metric"
    | "time"
    | "bullet"
    | "refresh"
    | "sparkline"
    | "callout";

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
    | IRichSection
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
    | IRichSwitch
    | IRichTable
    | IRichStat
    | IRichTimeline
    | IRichTime
    | IRichSkeleton
    | IRichCustomSkeleton
    | IRichMetric
    | IRichBullet
    | IRichRefresh
    | IRichSparkline
    | IRichCallout
    /**
     * Tablica węzłów jest traktowana jak wiersz (RichRow) z elementami ułożonymi poziomo.
     */
    | RichNode[]
    /**
     * Prosty tekst lub liczba, renderowane jako RichText z domyślnym wariantem "body".
     */
    | string | number
    | null | undefined;

/**
 * Metadane dla węzłów Rich Content, umożliwiające dodatkową kontrolę nad renderowaniem i interakcją.
 */
export interface IRichMetadata {
    /**
     * Stabilny identyfikator domenowy elementu
     */
    id?: string;
    /**
     * Klucz renderowania listy (jeśli potrzebny inny niż id)
     */
    key?: React.Key;
    /**
     * Atrybut pod testy e2e/integration
     */
    testId?: string;

    /**
     * Dodatkowe style/klasy na poziomie węzła
     */
    className?: string;
    style?: React.CSSProperties;

    /**
     * Kontrola widoczności bez usuwania z danych
     * @default false
     */
    hidden?: boolean;
    
    /**
     * Jeśli true, element oraz wszystkie jego dzieci zostaną całkowicie 
     * pominięte podczas procesu generowania i renderowania.
     * Nie będzie po nim śladu w DOM ani w pamięci renderera.
     * Z wyjątkiem przypadku w którym element ma lazy content, wtedy dane zostaną pobrane mimo, że nie zostaną wyrenderowane.
     * @default false
     */
    excluded?: boolean;

    /**
     * Generyczny tooltip dla dowolnego węzła
     */
    tooltip?: RichNode;
}

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
     * @default "4px 8px"
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
    /**
     * Zmienione style dla wariantów tekstu (np. body, caption) wewnątrz tego kontenera.
     */
    textVariantStyles?: Partial<RichTextVariantStyles>;
}

/**
 * Węzeł reprezentujący element czasu, który może wyświetlać czas względny lub absolutny w zależności od formatu.
 */
export interface IRichTime extends IRichNode {
    type: "time";
    /** 
     * Timestamp w formacie ISO lub Unix 
     */
    value: string | number;
    /** 
     * Format wyświetlania: "relative", "absolute", "full"
     * @default "absolute"
     */
    format?: "relative" | "absolute" | "full";
}

/**
 * Kontener dla elementów Rich Content, który może zawierać inne węzły.
 */
export interface IRichContainer extends IRichContainerDefaults, IRichMetadata {
    /**
     * Elementy wewnątrz kontenera
     */
    items: RichValue<RichNode[]>;
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
    /**
     * Portale pozwalające na renderowanie treści zdefiniowanej przez programistę
     */
    portals?: IRichPortalRenderer[];
}

/**
 * Bazowy interfejs dla wszystkich węzłów Rich Content.
 */
export interface IRichNode extends IRichMetadata {
    /**
     * Typ węzła
     */
    type: RichNodeType;
}

export interface IRichSkeletonBase extends IRichNode {
    type: "skeleton";
    /**
     * Funkcja zwracająca dane do renderowania po zakończeniu ładowania.
     */
    value: () => Promise<RichNode>;
}

export type RichSkeletonVariant = "rectangular" | "circular" | "text";

/**
 * Szkielet (placeholder) wyświetlany podczas ładowania danych, z opcją niestandardowego komponentu szkieletu.
 */
export interface IRichSkeleton extends IRichSkeletonBase {
    /**
     * Wariant szkieletu (np. "rectangular", "circular", "text")
     * @default "text"
     */
    variant?: RichSkeletonVariant;
    /**
     * Szerokość szkieletu (np. "100%", "auto", 300)
     */
    width?: number | string;
    /**
     * Wysokość szkieletu (np. "100%", "auto", 300)
     */
    height?: number | string;
    /**
     * Liczba powtórzeń szkieletu (np. dla list) - jeśli podano, renderuje wiele szkieletów obok siebie.
     */
    times?: number;
}

/**
 * Niestandardowy komponent szkieletu, jeśli variant jest ustawiony na "custom".
 */
export interface IRichCustomSkeleton extends IRichSkeletonBase {
    /**
     * Wariant "custom" pozwala na pełną kontrolę nad wyglądem szkieletu poprzez podanie własnego węzła RichNode do renderowania podczas ładowania.
     */
    variant: "custom";
    /**
     * Wypełniacz do renderowania niestandardowego szkieletu. Może być użyty do pokazania prostego placeholdera lub animacji podczas ładowania.
     */
    custom: RichNode;
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
    text: RichValue<RichNode>;
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
    badge?: IRichBadge;
}

export type RichTextDecoration = "bold" | "italic" | "underline" | "strikethrough" | "monospace" | "uppercase";

/**
 * Prosty tekst z opcjonalnym formatowaniem.
 */
export interface IRichText extends IRichNode {
    type: "text";
    /**
     * Tekst do wyświetlenia
     */
    text: string | number;
    /**
     * Poziom ważności wpływający na kolor
     */
    severity?: RichSeverity;
    /**
     * Wariant typograficzny (rozmiar, grubość czcionki)
     */
    variant?: RichTextVariant;
    /**
     * Dekoracje tekstu (np. pogrubienie, kursywa, podkreślenie)
     */
    decoration?: RichTextDecoration[];
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
    code: RichValue<string>;
    /**
     * Język składni (np. "sql", "json", "typescript")
     */
    language?: string;
    /**
     * Czy pokazać numery linii
     * @default false
     */
    lineNumbers?: boolean;
    /**
     * Numer linii, od której zaczyna się kod (domyślnie 1)
     */
    startLineNumber?: number;
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
    label?: RichNode;
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
     * Rozmiar ikony
     * @default "medium"
     */
    size?: Size;
}

/**
 * Grupa elementów z opcjonalnym tytułem i możliwością zwijania.
 */
export interface IRichSection extends IRichNode {
    type: "section";
    /**
     * Tytuł grupy (opcjonalnie)
     */
    title?: RichNode;
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
    items: RichValue<RichNode[]>;
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
    expanded?: boolean;
    /**
     * Kierunek układania elementów w grupie
     * @default "horizontal"
     */
    direction?: "vertical" | "horizontal";
}

export interface IRichGroup extends IRichNode {
    type: "group";
    /**
     * Lista elementów wewnątrz grupy
     */
    items: RichValue<RichNode[]>;
    /**
     * Kierunek układania elementów w grupie
     * @default "vertical"
     */
    direction?: "vertical" | "horizontal";
    /**
     * Odstęp między elementami w grupie
     * @default undefined (nie dodaje dodatkowego gapu, można ustawić w defaults)
     */
    gap?: RichGap;
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
    items: RichValue<RichNode[]>;
    /**
     * Odstęp między elementami
     */
    gap?: RichGap;
    /**
     * Padding wewnątrz wiersza
     */
    padding?: RichGap;
}

/**
 * Kontener układający w postacie grid-u.
 */
export interface IRichRowGrid extends IRichRowBase {
    /**
     * Układ w trybie grid (elementy będą układane w siatce, a nie zawijane do nowej linii)
     */
    layout: "grid";
    /**
     * Elementy w wierszu (ułożone poziomo)
     */
    items: RichValue<RichNode[]>;
    /**
     * Szablon kolumn w gridzie (np. "1fr 1fr" dla dwóch równych kolumn, "auto auto" dla kolumn dopasowanych do zawartości, "100px 200px" dla kolumn o stałej szerokości)
     */
    gridTemplateColumns?: string;
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
    items: RichValue<RichNode[]>;
    /**
     * Odstęp między elementami
     */
    gap?: RichGap;
    /**
     * Padding wewnątrz kolumny
     */
    padding?: RichGap;
    /**
     * Szerokość kolumny (jak w Grid System: 1-12 lub "auto")
     */
    size?: RichColSize;
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
    title?: RichNode;
    /**
     * Odstęp między elementami
     */
    gap?: RichGap;
    /**
     * Elementy wewnątrz alertu
     */
    message: RichValue<RichNode>;
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
export interface IRichAction extends Omit<IRichNode, "tooltip" | "id">, Omit<Action<void>, "groupId" | "contextMenuGroupId" | "contextMenuOrder"> {
    type: "action";
    /**
     * Badge wyświetlany na przycisku (opcjonalnie)
     */
    badge?: IRichBadge;
    /**
     * Poziom ważności wpływający na kolor przycisku
     */
    severity?: RichSeverity;
    /**
     * Wariant przycisku (pełny lub ikona - ikona bez labela)
     */
    variant?: "button" | "icon";
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
    items: RichValue<IRichListItem[]>;
    /**
     * Typ listy
     * @default "bullet"
     */
    listType?: "bullet" | "numbered" | "none";
}

/**
 * Element listy.
 */
export interface IRichListItem extends IRichMetadata {
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
    content: RichValue<RichNode>;
    /**
     * Odstęp pozycji listy
     * @default "2px 4px"
     */
    padding?: RichGap;
}

/**
 * Konfiguracja badge (znaczka) dla elementu.
 */
export interface IRichBadge extends IRichMetadata {
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

/**
 * Switch - przełącznik toggle.
 */
export interface IRichSwitch extends IRichNode {
    type: "switch";
    /**
     * Etykieta wyświetlana obok przełącznika
     */
    label?: RichNode;
    /**
     * Aktualny stan przełącznika
     */
    checked?: boolean;
    /**
     * Callback wywoływany przy zmianie stanu
     */
    onChange?: (checked: boolean) => void;
    /**
     * Poziom ważności wpływający na kolor
     */
    severity?: RichSeverity;
    /**
     * Czy przełącznik jest wyłączony
     */
    disabled?: boolean;
}

/**
 * Definicja kolumny tabeli.
 */
export interface IRichTableColumn extends Omit<IRichMetadata, "key"> {
    /**
     * Klucz kolumny (identyfikator)
     */
    key: string;
    /**
     * Nagłówek kolumny
     */
    header?: RichNode;
    /**
     * Szerokość kolumny (np. "auto", "20%", 120)
     */
    width?: number | string;
    /**
     * Wyrównanie zawartości kolumny
     * @default "start"
     */
    align?: "start" | "center" | "end";
}

/**
 * Wiersz tabeli — mapa klucz→węzeł.
 */
export type IRichTableRow = Record<string, RichNode>;

/**
 * Tabela danych.
 */
export interface IRichTable extends IRichNode {
    type: "table";
    /**
     * Tytuł tabeli (opcjonalnie)
     */
    title?: RichNode;
    /**
     * Definicje kolumn (kolejność i metadane)
     */
    columns: IRichTableColumn[];
    /**
     * Wiersze danych
     */
    rows: RichValue<IRichTableRow[]>;
    /**
     * Czy pokazać nagłówek tabeli
     * @default true
     */
    showHeader?: boolean;
    /**
     * Wysokość tabeli (np. "100%", "auto", 300) - jeśli zawartość przekroczy wysokość, pojawi się scroll
     */
    height?: number | string;
}

/**
 * Stat - pojedyncza metryka z etykietą i opcjonalnym trendem.
 */
export interface IRichStat extends IRichNode {
    type: "stat";
    /**
     * Wyświetlana wartość (np. "1 234", "42 MB", "99.9%")
     */
    value: RichNode;
    /**
     * Etykieta opisująca metrykę
     */
    label: RichNode;
    /**
     * Kierunek trendu (opcjonalnie)
     */
    trend?: "up" | "down" | "flat";
    /**
     * Poziom ważności wpływający na kolor wartości
     */
    severity?: RichSeverity;
    /**
     * Ikona obok wartości
     */
    icon?: React.ReactNode | ThemeIconName;
    /**
     * Rozmiar statu (podobnie jak dla kolumn)
     */
    size?: RichColSize;
}

/**
 * Pojedyncze zdarzenie na osi czasu.
 */
export interface IRichTimelineItem extends IRichMetadata {
    /**
     * Treść zdarzenia
     */
    label: RichNode;
    /**
     * Dodatkowy opis
     */
    description?: RichNode;
    /**
     * Poziom ważności wpływający na kolor kropki/ikony
     */
    severity?: RichSeverity;
    /**
     * Sygnatura czasowa (wyświetlana jako tekst)
     */
    timestamp?: RichNode;
    /**
     * Ikona zastępująca domyślną kropkę
     */
    icon?: React.ReactNode | ThemeIconName;
}

/**
 * Timeline - oś czasu z listą zdarzeń.
 */
export interface IRichTimeline extends IRichNode {
    type: "timeline";
    /**
     * Zdarzenia na osi czasu
     */
    items: IRichTimelineItem[];
}

/**
 * Typ kształtu avatara.
 */
export type RichAvatarShape = "circle" | "square" | "rounded";

/**
 * Entity/Avatar - komponent prezentujący obiekt, osobę lub system.
 */
export interface IRichEntity extends IRichNode {
    type: "entity";
    /**
     * Główna nazwa/tytuł encji (np. "Jan Kowalski", "Produkcyjna Baza Danych")
     */
    name: RichNode;
    /**
     * Opcjonalny krótki opis pod nazwą
     */
    description?: RichNode;
    /**
     * URL do obrazka avatara
     */
    src?: string;
    /**
     * Inicjały wyświetlane, gdy brak obrazka (np. "JK")
     */
    initials?: string;
    /**
     * Ikona zastępcza lub dekoracyjna
     */
    icon?: React.ReactNode | ThemeIconName;
    /**
     * Rozmiar całego bloku
     * @default "medium"
     */
    size?: Size;
    /**
     * Kształt avatara
     * @default "circle"
     */
    shape?: RichAvatarShape;
    /**
     * Poziom ważności (może wpływać na kolor obramowania lub tła inicjałów)
     */
    severity?: RichSeverity;
    /**
     * Czy encja jest w stanie "online/aktywnym" (mała kropka statusu)
     */
    status?: "online" | "offline" | "away" | "busy";
}

/**
 * Quote - cytat z opcjonalnym autorem i akcentem kolorystycznym.
 */
export interface IRichQuote extends IRichNode {
    type: "quote";
    /**
     * Treść cytatu
     */
    content: RichNode;
    /**
     * Opcjonalny autor lub źródło
     */
    caption?: RichNode;
    /**
     * Akcent kolorystyczny z lewej strony
     */
    severity?: RichSeverity;
}

/**
 * Opis definicji pary label-value, często używany w listach właściwości lub FAQ.
 */
export interface IRichDescriptionItem {
    /**
     * Etykieta/klucz właściwości
     */
    label: RichNode;
    /**
     * Wartość właściwości
     */
    value: RichNode;
    /** 
     * Opcjonalna ikona pomocnicza przy etykiecie 
     */
    icon?: ThemeIconName;
}

export interface IRichCallout extends IRichNode {
    type: "callout";
    /** 
     * Poziom ważności wpływający na kolor tła i obramowania
     */
    severity: RichSeverity;
    /** 
     * Elementy wewnątrz boxa
     */
    value: RichNode;
}

/**
 * Description - lista par label-value z opcjonalnym układem i szerokością kolumny labela.
 */
export interface IRichDescription extends IRichNode {
    type: "description";
    /**
     * Elementy listy opisowej - pary label-value, które będą renderowane w formacie "label: value".
     */
    items: IRichDescriptionItem[];
    /** 
     * Szerokość kolumny labela w trybie horizontal 
     */
    labelWidth?: string | number;
}

/**
 * Element drzewa - węzeł z etykietą i opcjonalnymi dziećmi, renderowany jako rozbudowany komponent drzewa.
 */
export interface IRichTreeItem extends IRichListItem {
    /**
     * Dzieci elementu drzewa - jeśli podano, element będzie renderowany jako rozbudowany węzeł drzewa z możliwością rozwijania/zwijania.
     */
    children?: IRichTreeItem[];
    /**
     * Czy element drzewa jest domyślnie rozwinięty (jeśli ma dzieci)
     */
    expanded?: boolean;
}

/**
 * Drzewo - struktura hierarchiczna elementów, renderowana jako rozbudowany komponent drzewa z możliwością rozwijania/zwijania gałęzi.
 */
export interface IRichTree extends IRichNode {
    type: "tree";
    /**
     * Elementy drzewa - lista węzłów, które będą renderowane jako gałęzie i liście drzewa. Każdy element może mieć swoje dzieci, tworząc zagnieżdżoną strukturę.
     */
    items: IRichTreeItem[];
}

/**
 * Wskaźnik kroku - komponent prezentujący postęp w wieloetapowym procesie, z etykietami i ikonami dla każdego kroku.
 */
export interface IRichStep {
    /**
     * Etykieta kroku, która może być prostym tekstem lub złożonym węzłem RichNode (np. z ikoną, badge'em itp.).
     */
    label: RichNode;
    /**
     * Dodatkowy opis kroku, wyświetlany pod etykietą lub jako tooltip (opcjonalnie)
     */
    description?: RichNode;
    /**
     * Ikona reprezentująca krok (opcjonalnie, może być użyta do oznaczenia typu kroku lub jego stanu)
     */
    icon?: React.ReactNode | ThemeIconName;
    /**
     * Status kroku, który wpływa na jego wygląd (np. kolor, ikona) i informuje użytkownika o postępie w procesie.
     * - "pending": krok jeszcze nie rozpoczęty, zwykle szary lub z ikoną zegara.
     * - "current": aktualnie aktywny krok, zwykle wyróżniony kolorem lub ikoną wskazującą na aktywność.
     * - "completed": krok zakończony, zwykle zielony lub z ikoną checkmarka.
     * - "error": krok zakończony z błędem, zwykle czerwony lub z ikoną błędu.
     */
    status: "pending" | "current" | "completed" | "error";
}

/**
 * Wskaźnik kroku - komponent prezentujący postęp w wieloetapowym procesie, z etykietami i ikonami dla każdego kroku.
 * Może być renderowany w orientacji poziomej lub pionowej, z opcją automatycznego numerowania kroków.
 */
export interface IRichStepper extends IRichNode {
    type: "stepper";
    /**
     * Kroki procesu, które będą renderowane jako kolejne etapy w wskaźniku. Każdy krok ma swoją etykietę, status i opcjonalną ikonę, co pozwala na jasne przedstawienie postępu użytkownikowi.
     */
    items: IRichStep[];
    /** 
     * Orientacja wskaźnika kroku 
     */
    orientation?: "horizontal" | "vertical";
    /** 
     * Czy kroki mają być numerowane automatycznie 
     */
    numbered?: boolean;
}

/**
 * RichMetric - specjalny typ statu, który oprócz wartości i etykiety może zawierać mini-wykres (sparkline) oraz opis trendu, idealny do prezentacji kluczowych wskaźników wydajności (KPI).
 */
export interface IRichMetric extends IRichNode {
    type: "metric";
    /** 
     * Uproszczona tablica wartości do wygenerowania mini-wykresu liniowego 
     */
    sparkline: RichValue<number[]>;
    /**
     * Wyświetlana wartość metryki (np. "1 234", "42 MB", "99.9%")
     */
    unit?: string;
    /**
     * Etykieta opisująca metrykę
     */
    label: RichNode;
    /**
     * Poziom ważności wpływający na kolor wartości
     */
    severity?: RichSeverity;
    /**
     * Ikona obok wartości
     */
    icon?: React.ReactNode | ThemeIconName;
    /**
     * Rozmiar metryki (podobnie jak dla kolumn)
     */
    size?: RichColSize;
}

/**
 * Pozycja logu - struktura reprezentująca pojedynczy wpis w logu, z informacjami o czasie, poziomie ważności, źródle i treści wiadomości.
 */
export interface IRichLogEntry {
    /**
     * Sygnatura czasowa wpisu logu (np. "2024-01-01 12:00:00" lub "5 minut temu")
     */
    timestamp?: string;
    /**
     * Poziom ważności wpisu logu, który może wpływać na kolor i ikonę (np. "debug", "info", "warn", "error", "trace")
     */
    level?: "debug" | "info" | "warn" | "error" | "trace";
    /**
     * Źródło lub kategoria wpisu logu (np. nazwa modułu, komponentu lub systemu, który wygenerował log)
     */
    source?: string;
    /**
     * Treść wiadomości logu, która może być prostym tekstem lub złożonym węzłem RichNode (np. z podświetleniem składni, linkami, chipami itp.)
     */
    message: RichNode;
}

/**
 * Log - komponent do wyświetlania strumienia logów, z opcją wirtualnego scrollowania dla dużych ilości danych, podświetleniem składni i kontrolą nad formatowaniem wpisów logu.
 */
export interface IRichLog extends IRichNode {
    type: "log";
    /** 
     * Tablica wpisów logów 
     */
    entries: RichValue<IRichLogEntry[]>;
    /** 
     * Wysokość okna logów (jeśli duża ilość danych, włączy się virtual scroll) 
     */
    height?: number | string;
}

export interface IRichBullet extends IRichNode {
    type: "bullet";
    /**
     * Poziom ważności wpływający na kolor kropki
     */
    severity: RichSeverity;
    /** 
     * Czy kropka ma pulsować 
     */
    pulse?: boolean;
}

export interface IRichRefresh extends IRichNode {
    type: "refresh";
    /**
     * Interwał odświeżania danych w milisekundach - jeśli podano, komponent będzie automatycznie odświeżał dane co określony czas, wywołując ponownie funkcję value i aktualizując zawartość.
     */
    interval: number;
    /**
     * Zawartość do renderowania, która będzie aktualizowana po każdym odświeżeniu. Może być dowolnym węzłem RichNode, co pozwala na dynamiczne aktualizowanie różnych typów treści (np. tekst, wykresy, tabele) w regularnych odstępach czasu.
     */
    refresh: RichNode;
}

// types.ts

export type RichSparklineCurve = "linear" | "smooth";
export type RichSparklineFill = "none" | "gradient";

export interface IRichSparkline extends IRichNode {
    type: "sparkline";
    /**
     * Tablica wartości numerycznych do wygenerowania wykresu liniowego. Każda wartość reprezentuje punkt na wykresie, a ich kolejność determinuje kształt linii. Wartości mogą być dynamiczne (funkcja zwracająca Promise), co pozwala na asynchroniczne ładowanie danych do wykresu.
     */
    values: RichValue<number[]>;
    /**
     * Szerokość wykresu (np. "100%", "auto", 300) - domyślnie "100%", co oznacza, że wykres zajmie całą dostępną szerokość kontenera. Można ustawić konkretną wartość w pikselach lub procentach, aby dostosować rozmiar wykresu do potrzeb projektu.
     */
    width?: number | string;      // default: "100%"
    /**
     * Wysokość wykresu (np. "100%", "auto", 300) - domyślnie 28 pikseli, co jest standardową wysokością dla mini-wykresów typu sparkline. Można dostosować tę wartość, aby zwiększyć lub zmniejszyć wysokość wykresu w zależności od ilości danych i dostępnej przestrzeni w interfejsie użytkownika.
     */
    height?: number | string;     // default: 28
    /**
     * Grubość linii wykresu w pikselach - domyślnie 2, co zapewnia dobrą widoczność linii bez nadmiernego obciążenia wizualnego. Można zwiększyć tę wartość, aby uzyskać bardziej wyrazisty wykres, lub zmniejszyć ją dla delikatniejszego efektu, w zależności od stylu projektu i ilości danych prezentowanych na wykresie.
     */
    strokeWidth?: number;         // default: 2
    /**
     * Typ krzywej łączącej punkty na wykresie - domyślnie "linear", co oznacza, że punkty będą łączone prostymi liniami. Opcja "smooth" pozwala na wygładzenie linii, tworząc bardziej zaokrąglony i estetyczny wygląd wykresu, co może być szczególnie przydatne przy prezentacji danych z dużymi wahaniami lub gdy chcemy uzyskać bardziej organiczny efekt wizualny.
     */
    curve?: RichSparklineCurve;   // default: "linear"
    /**
     * Typ wypełnienia pod linią wykresu - domyślnie "none", co oznacza brak wypełnienia. Opcja "gradient" pozwala na dodanie gradientowego wypełnienia pod linią, co może zwiększyć atrakcyjność wizualną wykresu i pomóc w lepszym zrozumieniu zakresu wartości, zwłaszcza gdy wykres prezentuje duże różnice między punktami danych.
     */
    fill?: RichSparklineFill;     // default: "none"
    /**
     * Poziom ważności wpływający na kolor linii i wypełnienia wykresu - domyślnie "default", co oznacza standardowy kolor. Można ustawić różne poziomy ważności (np. "success", "warning", "error"), aby wizualnie wyróżnić wykres w zależności od kontekstu danych, co może pomóc użytkownikom szybko zidentyfikować kluczowe informacje lub potencjalne problemy przedstawione na wykresie.
     */
    severity?: RichSeverity;
    /**
     * Zakres wartości do wyświetlenia na wykresie - domyślnie automatycznie dopasowywany do zakresu danych. Można ręcznie ustawić minimalną i maksymalną wartość, aby zachować spójność skali między różnymi wykresami lub skupić się na określonym zakresie danych, co może być szczególnie przydatne przy porównywaniu różnych zestawów danych lub gdy chcemy podkreślić określone trendy w danych.
     */
    min?: number;                 // opcjonalny clamp zakresu
    /**
     * Zakres wartości do wyświetlenia na wykresie - domyślnie automatycznie dopasowywany do zakresu danych. Można ręcznie ustawić minimalną i maksymalną wartość, aby zachować spójność skali między różnymi wykresami lub skupić się na określonym zakresie danych, co może być szczególnie przydatne przy porównywaniu różnych zestawów danych lub gdy chcemy podkreślić określone trendy w danych.
     */
    max?: number;                 // opcjonalny clamp zakresu
    /**
     * Czy pokazać kropki na punktach danych - domyślnie false, co oznacza, że punkty danych będą reprezentowane tylko przez linię. Ustawienie tej opcji na true spowoduje wyświetlenie kropek na każdym punkcie danych, co może pomóc w lepszym zidentyfikowaniu poszczególnych wartości na wykresie, zwłaszcza gdy dane są gęste lub gdy chcemy podkreślić konkretne punkty na wykresie.
     */
    showDots?: boolean;           // default: false
    /**
     * Czy animować wykres podczas aktualizacji danych - domyślnie false, co oznacza, że wykres będzie aktualizowany natychmiast bez animacji. Ustawienie tej opcji na true spowoduje płynne przejście między starymi a nowymi wartościami, co może poprawić doświadczenie użytkownika i uczynić zmiany danych bardziej zauważalnymi, zwłaszcza gdy wykres jest często aktualizowany lub gdy chcemy podkreślić dynamiczny charakter prezentowanych danych.
     */
    animated?: boolean;           // default: false
}

/**
 * Label-Value - para etykieta-wartość, często używana w listach właściwości, FAQ lub wszędzie tam, gdzie chcemy przedstawić dane w formacie "klucz: wartość". Ten komponent pozwala na elastyczne formatowanie zarówno etykiety, jak i wartości, a także opcjonalne dodanie separatora i kontrolę nad układem (poziomy lub pionowy).
 */
export interface IRichLabelValue extends IRichNode {
    type: "label-value";
    /**
     * Etykieta/klucz właściwości, która może być prostym tekstem lub złożonym węzłem RichNode (np. z ikoną, badge'em itp.)
     */
    label: RichNode;
    /**
     * Wartość właściwości, która może być prostym tekstem lub złożonym węzłem RichNode (np. z ikoną, badge'em itp.)
     */
    value: RichNode;
    /** 
     * Separator między etykietą a wartością, np. ":" lub "—" 
     */
    separator?: string;
    /** 
     * Czy etykieta ma być nad wartością (vertical) czy obok (horizontal) 
     */
    layout?: "horizontal" | "vertical";
}

/**
 * Price - komponent do wyświetlania wartości pieniężnych z odpowiednim formatowaniem, symbolem waluty i opcjonalnym kolorowaniem na podstawie znaku kwoty (dodatnia, ujemna, neutralna). Ten komponent jest idealny do prezentacji cen, kosztów, przychodów lub innych danych finansowych w sposób czytelny i estetyczny.
 */
export interface IRichPrice extends IRichNode {
    type: "price";
    /**
     * Wartość pieniężna do wyświetlenia, która może być liczbą lub tekstem sformatowanym (np. "1 234,56" lub "1.234,56"). Komponent może automatycznie formatować liczby na podstawie ustawień regionalnych i dodawać odpowiednie separatory tysięcy i dziesiętne, co ułatwia czytelność wartości finansowych.
     */
    value: number;
    /**
     * Kod waluty, który będzie wyświetlany obok wartości (np. "PLN", "USD"). Komponent może również obsługiwać symbole walutowe (np. "$", "€") i umieszczać je w odpowiedniej pozycji względem wartości, zgodnie z konwencjami danej waluty, co pozwala na jasne zidentyfikowanie rodzaju prezentowanej wartości finansowej.
     */
    currency: string | "auto"; // np. "PLN", "USD"
    /** 
     * Czy kolorować automatycznie na podstawie znaku kwoty 
     */
    colored?: boolean | {
        positive?: RichSeverity; // default: "success"
        negative?: RichSeverity; // default: "error"
        zero?: RichSeverity;     // default: "default"
    };
    /** 
     * Liczba miejsc po przecinku (default: 2) 
     */
    decimals?: number;
}

/**
 * Counter - animowany licznik, który płynnie przechodzi od poprzedniej do nowej wartości, idealny do prezentacji dynamicznych danych liczbowych, takich jak liczba użytkowników online, ilość sprzedanych produktów czy inne metryki, które często się zmieniają. Ten komponent pozwala na atrakcyjne wizualnie przedstawienie zmian wartości liczbowych, co może przyciągnąć uwagę użytkowników i uczynić dane bardziej angażującymi.
 */
export interface IRichCounter extends IRichNode {
    type: "counter";
    /**
     * Aktualna wartość licznika, która będzie animowana przy zmianie. Komponent będzie płynnie przechodził od poprzedniej do nowej wartości, co pozwala na atrakcyjne wizualnie przedstawienie zmian liczbowych. Wartość może być dynamiczna (funkcja zwracająca Promise), co umożliwia asynchroniczne aktualizowanie licznika w oparciu o dane z serwera lub inne źródła danych.
     */
    value: number;
    /** 
     * Czas trwania animacji w ms 
     * @default 1000 (1 sekunda)
     */
    duration?: number;
    /** 
     * Prefiks/Sufiks, np. "%", ">" 
     */
    prefix?: string;
    /**
     * Prefiks/Sufiks, np. "%", "<"
     */
    suffix?: string;
}

/**
 * Color - próbka koloru z opcjonalnym kodem i możliwością kopiowania, idealna do prezentacji kolorów w paletach, wynikach analizy kolorów lub wszędzie tam, gdzie chcemy pokazać wizualną reprezentację koloru wraz z jego kodem (np. hex, rgb, css var). Ten komponent pozwala na szybkie zidentyfikowanie koloru oraz łatwe skopiowanie jego kodu do schowka, co może być szczególnie przydatne dla projektantów, deweloperów i wszystkich pracujących z kolorami w interfejsie użytkownika.
 */
export interface IRichColor extends IRichNode {
    type: "color";
    /**
     * Kod koloru do wyświetlenia, który może być w formacie hex (np. "#ff0000"), rgb (np. "rgb(255, 0, 0)") lub jako zmienna CSS (np. "var(--primary-color)"). Komponent będzie renderował próbkę tego koloru, a jeśli opcja showCode jest ustawiona na true, również wyświetli kod koloru obok próbki, co pozwala na szybkie zidentyfikowanie i wykorzystanie koloru w innych częściach projektu.
     */
    color: string; // hex, rgb, css var
    /** 
     * Czy wyświetlić kod koloru obok próbki 
     */
    showCode?: boolean;
    /** 
     * Czy umożliwić skopiowanie kodu kliknięciem 
     */
    copyable?: boolean;
}

/**
 * Rating - komponent do wyświetlania oceny w formie ikon (np. gwiazdek), z możliwością dostosowania ikony, maksymalnej wartości i kolorowania na podstawie wartości, idealny do prezentacji ocen produktów, usług, treści lub innych elementów, które można ocenić w skali. Ten komponent pozwala na szybkie zrozumienie poziomu oceny dzięki wizualnej reprezentacji, a także umożliwia dostosowanie wyglądu ikon i kolorów w zależności od kontekstu i wartości oceny.
 */
export interface IRichRating extends IRichNode {
    type: "rating";
    /** 
     * Aktualna wartość 
     */
    value: number;
    /** 
     * Maksymalna wartość (domyślnie 5) 
     * @default 5
     */
    max?: number;
    /** 
     * Ikona (domyślnie gwiazdka, ale może być np. "circle" lub "bolt")
     * @default "Star"
     */
    icon?: React.ReactNode | ThemeIconName;
    /** 
     * Czy kolor ma zależeć od wartości (np. 1/5 = red, 5/5 = green) 
     */
    severity?: RichSeverity;
}

/**
 * Mime - komponent do wyświetlania plików multimedialnych (np. PDF, wideo, audio) z opcją podania nazwy pliku, ścieżki do pliku (lokalnej lub sieciowej), typu MIME i strategii interakcji (np. otwieranie w domyślnej aplikacji, pokazywanie w folderze, pobieranie lub wykonywanie akcji). Ten komponent jest idealny do prezentacji różnorodnych treści multimedialnych w interfejsie użytkownika, umożliwiając użytkownikom łatwy dostęp do plików i interakcję z nimi zgodnie z określonymi preferencjami.
 */
export interface IRichMime extends IRichNode {
    type: "mime";
    /** 
     * Nazwa pliku do wyświetlenia (np. "raport_otr.pdf") 
     */
    fileName: RichNode;
    /** 
     * Lokalizacja pliku:
     * - Ścieżka systemowa (np. "C:/Users/Admin/Documents/config.json")
     * - URL sieciowy (np. "https://cdn.com/file.pdf")
     * - URI danych (data:application/pdf;base64,...)
     */
    path?: string;
    /** 
     * Typ MIME (np. "video/mp4"). 
     * Jeśli brak, renderer może spróbować go odgadnąć po rozszerzeniu z fileName.
     */
    mimeType?: string;
    /** 
     * Opcjonalna informacja o rozmiarze pliku do wyświetlenia 
     */
    sizeLabel?: string;
    /** 
     * Strategia interakcji:
     * - "open": otwiera plik w domyślnej aplikacji systemowej (shell.openPath)
     * - "show": pokazuje plik w folderze (shell.showItemInFolder)
     * - "download": pobiera plik z sieci (jeśli path to URL)
     * - "action": wykonuje przypisaną akcję IRichAction
     */
    interaction?: "open" | "show" | "download" | "action";
    /** 
     * Akcja wykonywana jeśli interaction === "action" 
     */
    action?: IRichAction;
}

/**
 * Portal - specjalny węzeł, który pozwala wyrenderować treść zdefiniowaną przez portalId, zarejestrowany w mechaniźmie Rich Content.
 * Render Portalu musi być zarejestrowany globalnie lub przekazany do RichContainer.
 */
export interface IRichPortal extends IRichNode {
    type: "portal";
    /** 
     * Unikalny identyfikator portalu, który renderer będzie rozpoznawał i renderował w odpowiednim miejscu interfejsu użytkownika. Ten identyfikator pozwala na dynamiczne wstawianie treści do różnych części aplikacji, umożliwiając elastyczne i kontekstowe renderowanie w zależności od potrzeb projektu.
     */
    portalId: string;
    /**
     * Parametry konfiguracyjne dla portalu, które mogą być używane przez renderer do dostosowania sposobu renderowania treści w portalu. Mogą zawierać informacje o pozycjonowaniu, animacjach, warstwie z-index, czy innych właściwościach specyficznych dla danego portalu, co pozwala na elastyczne i kontekstowe renderowanie treści w różnych częściach interfejsu użytkownika.
     */
    props?: Record<string, any>;
    /** 
     * Co pokazać, jeśli portalId nie zostanie rozpoznany przez aplikację.
     */
    fallback?: RichNode;
}

export interface IRichPortalRenderer {
    /**
     * Unikalny identyfikator portalu, który renderer będzie rozpoznawał i renderował w odpowiednim miejscu interfejsu użytkownika. Ten identyfikator pozwala na dynamiczne wstawianie treści do różnych części aplikacji, umożliwiając elastyczne i kontekstowe renderowanie w zależności od potrzeb projektu.
     */
    portalId: string;
    /**
     * Funkcja renderująca zawartość portalu na podstawie przekazanych właściwości.
     * @param props Właściwości konfiguracyjne dla portalu, które mogą być używane do dostosowania sposobu renderowania treści.
     * @returns Węzeł React do wyrenderowania w portalu.
     */
    render: (props: Record<string, any>, metadata: IRichMetadata) => React.ReactNode;
}