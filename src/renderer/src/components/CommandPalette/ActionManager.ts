import { KeyboardEvent, keyboardEventToKeybinding, normalizeKeybinding } from "./KeyBinding"; // Import funkcji normalizującej

export type ActionGroupMode =
    'actions' |
    'filter';

export interface ActionGroupOption<T> {
    /**
     * Unikalny identyfikator akcji.
     */
    id: string;
    /**
     * Ikona akcji, która będzie prezentowana użytkownikowi.
     */
    icon: React.ReactNode;
    /**
     * Etykieta akcji, która będzie prezentowana użytkownikowi.
     * DLa przycisku jest to tylko tooltip.
     */
    label?: string;
    /**
     * Skrót klawiszowy przypisany do akcji opcji.
     */
    keybinding?: string;
    /**
     * Kod do wykonania akcji.
     * @param context Obiekt, na którym akcja ma być wykon
     * @param args 
     * @returns 
     */
    run: (context: T, ...args: any[]) => void | Promise<void>;
    /**
     * Funkcja powinna zwrócić true/false, czy akcja jest aktualnie wybrana.
     * Używane do oznaczania akcji jako wybranej w interfejsie użytkownika.
     * @param context Obiekt, na którym akcja ma być wykon
     * @returns 
     */
    selected?: (context: T) => boolean;
    /**
     * Funkcja powinna zwrócić true/false, czy akcja jest aktualnie wyłączona.
     * @param context Obiekt, na którym akcja ma być wykonana.
     * @returns 
     */
    disabled?: (context: T) => boolean;
}

export interface ActionGroup<T = any> {
    /**
     * Unikalny identyfikator grupy akcji.
     */
    id: string;

    /**
     * Etykieta grupy akcji, która będzie prezentowana użytkownikowi.
     * np. @ - obiekty
     * # - schematy
     */
    label: string;

    /**
     * Prefix grupy akcji
     * Używane do grupowania akcji i wybierania ich poprzez wpisanie prefixu w polu tekstowym
     */
    prefix: string;

    getSearchText?: (context: T) => string;

    onOpen?: (context: T) => void;

    /**
     * Dostawca akcji, który zwraca tablicę akcji związanych z tą grupą.
     * Używane do dynamicznego ładowania akcji w zależności od kontekstu.
     * Te akcje nie są rejestrowane w menedżerze akcji. W związku z tym nie będzie możliwa ich konfiguacja.
     * To mogą być akcje np. do wyboru schematów bazy danych, parsowane obiekty, itp.
     * @param context Obiekt, na którym akcja ma być wykonana.
     * @param searchText Opcjonalny parametr zapytania, który może być użyty do filtrowania akcji.
     * @returns Tablica akcji, które są częścią tej grupy.
     */
    actions: (context: T, searchText?: string) => Action<T>[] | Promise<Action<T>[]>;

    /**
     * Funkcja, która zostanie wywołana, gdy użytkownik anuluje grupę akcji.
     * @param context Obiekt, na którym akcja ma być wykonana.
     * @returns 
     */
    onCancel?: (context: T) => void;

    /**
     * Tryb grupy akcji.
     * Określa, czy akcje w tej grupie mają być wyświetlane jako akcje (actions) czy jako filtry (filter).
     * w trybie 'actions' akcje są wyświetlane jako przyciski akcji i fitrowane wg labeli.
     * w trybie 'filter' do funkcji actions przekazywany jest query, który można wykorzystać do filtrowania danych.
     * W tym trybie actions wywołane będzie z opóźnieniem.
     * i wyświetlania ich jako listy rozwijanej.
     * Domyślnie jest to 'actions'.
     * @default 'actions'
     */
    mode?: ActionGroupMode;

    /**
     * Dodatkowe przyciski widoczne w polu poleceń.
     * Używane do dodawania dodatkowych akcji związanych z tą grupą akcji.
     */
    options?: ActionGroupOption<T>[];

    /**
     * Pozycja okna poleceń względem rodzica (np. na dole można umieścić gdy grupa służy do wyszukiwania)
     * @default 'top'
     */
    position?: 'top' | 'bottom';
}

export interface Action<T> {
    /**
     * Unikalny identyfikator akcji.
     */
    id: string;

    /**
     * Grupa akcji, do której należy ta akcja.
     * Używane do grupowania akcji i wybierania ich poprzez wpisanie prefixu w polu tekstowym
     * Akcje bez przypisania grupy będą się pokazywać zawsze.
     */
    groupId?: string;

    /**
     * Etykieta akcji, która będzie prezentowana użytkownikowi.
     * @param context Obiekt, na którym akcja ma być wykonana.
     * @param args to dodatkowe argumenty przekazywane do funkcji, które mogą być użyte do dynamicznego generowania etykiety. Przygotuj się na to, że mogą być puste.
     */
    label: string | ((context: T, ...args: any[]) => string);

    /**
     * Opis akcji, który może być prezentowany użytkownikowi.
     * @param context Obiekt, na którym akcja ma być wykonana.
     * @param args to dodatkowe argumenty przekazywane do funkcji, które mogą być użyte do dynamicznego generowania etykiety. Przygotuj się na to, że mogą być puste.
     */
    description?: string | ((context: T, ...args: any[]) => string);

    /**
     * Podpowiedź (tooltip) akcji, która będzie prezentowana użytkownikowi.
     * @param context Obiekt, na którym akcja ma być wykonana.
     * @param args to dodatkowe argumenty przekazywane do funkcji, które mogą być użyte do dynamicznego generowania etykiety. Przygotuj się na to, że mogą być puste.
     */
    tooltip?: string | ((context: T, ...args: any[]) => string);

    /**
     * Ikona akcji, która będzie prezentowana użytkownikowi.
     * Może być to komponent React lub inny element reprezentujący ikonę.
     */
    icon?: React.ReactNode | ((context: T, ...args: any[]) => React.ReactNode);

    /**
     * Tablica skrótów klawiszowych przypisanych do akcji.
     * Jest to sekwencja klawiszowych.
     */
    keybindings?: string[];

    /**
     * Grupa menu kontekstowego, w której akcja powinna się pojawić.
     */
    contextMenuGroupId?: "commandPalette" | "layout" | string;

    /**
     * Kolejność w grupie menu kontekstowego.
     */
    contextMenuOrder?: number;

    /**
     * Funkcja, która zostanie wykonana, gdy akcja zostanie wywołana.
     * @param context Obiekt, na którym akcja ma być wykonana.
     * @param args Dodatkowe argumenty przekazywane do funkcji. Przygotuj się na to, że mogą być puste.
     */
    run: (context: T, ...args: any[]) => void | Promise<void>;

    /**
     * Czy akcja jest aktualnie wybrana.
     * Używane do oznaczania akcji jako wybranej w interfejsie użytkownika.
     */
    selected?: boolean | ((context: T, ...args: any[]) => boolean);

    /**
     * Czy akcja jest aktualnie wyłączona.
     */
    disabled?: boolean | ((context: T, ...args: any[]) => boolean);

    /**
     * Czy akcja jest widoczna w interfejsie użytkownika.
     * Jeśli nie jest widoczna, nie będzie się pojawiać w palecie poleceń ani w menu kontekstowym. Będzie ją można wywołać za pomocą skrótów klawiszowych.
     */
    visible?: boolean | ((context: T, ...args: any[]) => boolean);

    /**
     * Czy akcja jest aktywna (dostępna do użycia z poziomu skrótów klawiszowych).
     * Wtedy w UI będzie widoczna, ale nie będzie można jej wywołać skrótem klawiszowym. Skrót będzie niewidoczny lub przyciemniony.
     */
    active?: boolean | ((context: T, ...args: any[]) => boolean);

    /**
     * Czy akcja jest oznaczona jako ładowanie czegoś.
     */
    loading?: boolean | ((context: T, ...args: any[]) => boolean);

    /**
     * Wewnętrzna wartość do przechowywania czasu ostatniego wybrania akcji.
     * Używane do zarządzania porządkiem listy akcji.
     */
    _LastSelected?: number;
}

export interface Actions<T,> {
    [id: string]: Action<T>;
}

export function isAction<A>(obj: any): obj is Action<A> {
    return (
        typeof obj === "object" &&
        obj !== null &&
        typeof obj.id === "string" &&
        typeof obj.label === "string" &&
        typeof obj.run === "function"
    );
}

export function isActions<A>(obj: any): obj is Actions<A> {
    if (typeof obj !== "object" || obj === null) {
        return false;
    }
    return Object.values(obj).every(isAction<A>);
}

export class ActionManager<T> {
    private actions: Map<string, Action<T>> = new Map();
    private actionGroups: Map<string, ActionGroup<T>> = new Map();
    private currentSequence: string[] = [];
    private sequenceTimeout: NodeJS.Timeout | null = null;
    private sequenceResetTime = 2000;

    constructor() {
        this.registerActionGroup({
            id: 'default',
            label: '> Search and run actions',
            prefix: '>',
            actions: () => Array.from(this.actions.values()),
        });
    }

    /**
     * Rejestruje nową grupę akcji.
     * @param group Opis grupy akcji.
     */
    registerActionGroup(...groups: ActionGroup<T>[]): void {
        for (const group of groups) {
            if (this.actionGroups.has(group.id)) {
                continue;
            }
            this.actionGroups.set(group.id, group);
        }
    }

    /**
     * Pobiera zarejestrowaną grupę akcji na podstawie jej identyfikatora.
     * @param groupId Identyfikator grupy akcji.
     * @returns Zarejestrowana grupa akcji lub undefined, jeśli nie istnieje.
     */
    getActionGroup(groupId: string): ActionGroup<T> | undefined {
        return this.actionGroups.get(groupId);
    }

    /**
     * Pobiera wszystkie zarejestrowane grupy akcji.
     * @returns Tablica zarejestrowanych grup akcji.
     */
    getRegisteredActionGroups(): ActionGroup<T>[] {
        return Array.from(this.actionGroups.values());
    }

    /**
     * Rejestruje nową akcję.
     * @param action Opis akcji
     */
    registerAction(...actions: Action<T>[]): void {
        for (const action of actions) {
            const normalizedKeybindings = action.keybindings?.map(normalizeKeybinding); // Normalizacja keybindings
            const normalizedAction = { ...action, keybindings: normalizedKeybindings };

            if (this.actions.has(action.id)) {
                continue;
            }
            this.actions.set(action.id, normalizedAction);
        }
    }

    /**
     * Wykonuje akcję na podstawie jej identyfikatora lub obiektu akcji.
     * @param actionId Identyfikator akcji do wykonania.
     * @param context Obiekt, na którym akcja ma być wykonana.
     * @param args Dodatkowe argumenty przekazywane do funkcji.
     */
    executeAction(actionId: string, context: T, ...args: any[]): void | Promise<void>;

    /**
     * Wykonuje akcję przekazaną jako parametr.
     * @param action Obiekt akcji.
     * @param context Obiekt, na którym akcja ma być wykonana.
     * @param args Dodatkowe argumenty przekazywane do funkcji.
     */
    executeAction(action: Action<T>, context: T, ...args: any[]): void | Promise<void>;

    executeAction(actionOrId: string | Action<T>, context: T, ...args: any[]): void | Promise<void> {
        let action: Action<T> | undefined;

        // Jeśli przekazano identyfikator, znajdź akcję w zarejestrowanych akcjach
        if (typeof actionOrId === 'string') {
            action = this.actions.get(actionOrId);
            if (!action) {
                console.error(`Action with id "${actionOrId}" is not registered.`);
                return;
            }
        } else {
            // Jeśli przekazano obiekt akcji, użyj go bezpośrednio
            action = actionOrId;
        }

        const visible = typeof action.visible === 'function' ? action.visible(context) : (action.visible ?? true);
        const disabled = typeof action.disabled === 'function' ? action.disabled(context) : (action.disabled ?? false);

        // Sprawdź warunek wstępny (precondition), jeśli istnieje
        if (disabled || !visible) {
            return;
        }

        if (action.contextMenuGroupId !== "commandPalette") {
            action._LastSelected = Date.now();
        }
        // Wykonaj akcję
        return action.run(context, ...args);
    }

    /**
     * Obsługuje wciśnięcie klawisza i sprawdza sekwencję skrótów.
     * @param event Obiekt KeyboardEvent lub string reprezentujący klawisz.
     * @param context Obiekt, na którym akcja ma być wykonana.
     * @param args Argumenty przekazywane do funkcji `run`.
     */
    executeActionByKeybinding(event: KeyboardEvent | string, context: T, ...args: any[]): boolean {
        const keybinding = (typeof event === 'string' ? event : keyboardEventToKeybinding(event)).toLocaleLowerCase();

        // Dodaj klawisz do bieżącej sekwencji
        this.currentSequence.push(keybinding);

        // Zresetuj timeout sekwencji
        if (this.sequenceTimeout) {
            clearTimeout(this.sequenceTimeout);
        }
        this.sequenceTimeout = setTimeout(() => this.resetSequence(), this.sequenceResetTime);

        // Sprawdź, czy istnieje akcja pasująca do bieżącej sekwencji
        const action = Array.from(this.actions.values()).find(a =>
            a.keybindings && this.isSequenceMatch(a.keybindings, this.currentSequence)
        );

        if (action) {
            //const visible = typeof action.visible === 'function' ? action.visible(context) : (action.visible ?? true);
            const disabled = typeof action.disabled === 'function' ? action.disabled(context) : (action.disabled ?? false);

            if (disabled) {
                this.resetSequence();
                return true; // Sekwencja jest poprawna, ale akcja nie została wykonana
            }

            if (action.contextMenuGroupId !== "commandPalette") {
                action._LastSelected = Date.now();
            }
            action.run(context, ...args);
            this.resetSequence(); // Zresetuj sekwencję po wykonaniu akcji
            return true; // Akcja została wykonana
        }

        // Jeśli nie znaleziono pasującej akcji, sprawdź, czy sekwencja poprawnie się zaczyna
        const isValidSequence = Array.from(this.actions.values()).some(a =>
            a.keybindings &&
            this.currentSequence.every((key, index) =>
                a.keybindings![index] !== undefined && key.toLowerCase() === a.keybindings![index].toLowerCase()
            )
        );

        if (isValidSequence) {
            return true; // Fragment sekwencji jest poprawny
        }

        this.resetSequence(); // Zresetuj sekwencję, jeśli jest niepoprawna
        return false; // Nie znaleziono akcji ani poprawnego fragmentu sekwencji
    }

    /**
     * Sprawdza, czy bieżąca sekwencja pasuje do pełnej sekwencji skrótu.
     * @param fullSequence Tablica reprezentująca pełną sekwencję skrótu.
     * @param currentSequence Bieżąca sekwencja klawiszy.
     * @returns True, jeśli bieżąca sekwencja pasuje do pełnej sekwencji.
     */
    private isSequenceMatch(fullSequence: string[], currentSequence: string[]): boolean {
        if (currentSequence.length !== fullSequence.length) {
            return false;
        }
        return currentSequence.every((key, index) => key.toLowerCase() === fullSequence[index].toLowerCase());
    }

    /**
     * Resetuje bieżącą sekwencję klawiszy.
     */
    private resetSequence(): void {
        this.currentSequence = [];
        if (this.sequenceTimeout) {
            clearTimeout(this.sequenceTimeout);
            this.sequenceTimeout = null;
        }
    }

    /**
     * Pobuera akcję na podstawie jej identyfikatora.
     * Jeśli akcja nie istnieje, zwraca undefined.
     * Funkcja działa wyłąznie na akacjach zarejestrowanych w menedżerze akcji. Nie działa na akcjach z grupy.
     * @param actionId Identyfikator akcji do pobrania.
     * @returns 
     */
    getAction(actionId: string): Action<T> | undefined {
        return this.actions.get(actionId);
    }

    /**
     * Pobiera listę zarejestrowanych akcji.
     * Jeśli podano prefix, zwraca akcje z grupy o podanym prefixie.
     * Jeśli prefix jest null, zwraca wszystkie zarejestrowane akcji.
     * @param prefix Prefix grupy akcji lub null.
     * @param context Obiekt, na którym akcje mają być wykonane (wymagany dla dynamicznych akcji).
     * @returns Tablica akcji.
     */
    async getRegisteredActions(prefix: string | null = '>', context?: T, query?: string): Promise<Action<T>[]> {
        if (prefix === null) {
            return [];
        }

        console.debug("ActionManager.getRegisteredActions");
        const actionGroup = Array.from(this.actionGroups.values()).find(group => group.prefix === prefix);

        if (!actionGroup) {
            return [];
        }

        let actions: Action<T>[] = await actionGroup.actions(context!, query);

        if ((actionGroup.mode ?? 'actions') === 'actions' && actionGroup.id === 'default') {
            actions = actions.sort((a, b) => {
                // Najpierw sortuj według internalLastSelected (najnowsze na górze), potem alfabetycznie
                const lastSelectedA = a._LastSelected || 0;
                const lastSelectedB = b._LastSelected || 0;
                if (lastSelectedA !== lastSelectedB) {
                    return lastSelectedB - lastSelectedA; // Najnowsze wybory na górze
                }
                const labelA = typeof a.label === "function" ? a.label(context!) : a.label;
                const labelB = typeof b.label === "function" ? b.label(context!) : b.label;
                return labelA.localeCompare(labelB); // Sortowanie alfabetyczne
            });
        }

        return actions;
    }

    /**
     * Usuwa akcję na podstawie jej identyfikatora.
     * @param actionId Identyfikator akcji do usunięcia.
     */
    unregisterAction(actionId: string): void {
        if (!this.actions.delete(actionId)) {
            throw new Error(`Action with id "${actionId}" is not registered.`);
        }
    }
}