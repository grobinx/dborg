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
    | "code-inline"
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
    ;

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
    | IRichSwitch
    | IRichTable
    | IRichStat
    | IRichTimeline
    | IRichSkeleton
    | IRichCustomSkeleton
    | IRichMetric
    /**
     * Tablica węzłów jest traktowana jak wiersz (RichRow) z elementami ułożonymi poziomo.
     */
    | RichNode[]
    /**
     * Prosty tekst lub liczba, renderowane jako RichText z domyślnym wariantem "body".
     */
    | string | number
    | null;

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

export type RichTextDecoration = "bold" | "italic" | "underline" | "strikethrough" | "monospace";

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
     * Tooltip wyświetlany po najechaniu
     */
    tooltip?: string;
    /**
     * Rozmiar ikony
     * @default "medium"
     */
    size?: Size;
}

/**
 * Grupa elementów z opcjonalnym tytułem i możliwością zwijania.
 */
export interface IRichGroup extends IRichNode {
    type: "group";
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
    items: RichValue<RichNode[]>;
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