/**
 * Kolejność klawiszy modyfikujących.
 */
const MODIFIERS_ORDER = ['Ctrl', 'Shift', 'Alt', 'Meta'];

export interface KeyboardEvent {
    key: string;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
}

/**
 * Sortuje klawisze modyfikujące w standardowej kolejności.
 * 
 * @param keys Tablica klawiszy do posortowania.
 * @returns Posortowana tablica klawiszy.
 */
function sortModifiers(keys: string[]): string[] {
    return keys.sort((a, b) => MODIFIERS_ORDER.indexOf(a) - MODIFIERS_ORDER.indexOf(b));
}

/**
 * Normalizuje keybinding do standardowego formatu.
 * 
 * @param keybinding [Ctrl|Control+][Shift|Sh+][Alt|Option+][Meta|Command|Cmd|Win|Windows|Os+]Key
 * @returns [Ctrl+][Shift+][Alt+][Meta+]Key
 */
export function normalizeKeybinding(keybinding: string): string {
    const parts = keybinding
        .split('+')
        .map(part => part.trim());

    const keyMap: Record<string, string> = {
        control: 'Ctrl',
        ctrl: 'Ctrl',
        shift: 'Shift',
        sh: 'Shift',
        alt: 'Alt',
        option: 'Alt',
        meta: 'Meta',
        command: 'Meta',
        cmd: 'Meta',
        win: 'Meta',
        windows: 'Meta',
        os: 'Meta',
        '⌘': 'Meta',
        space: ' ',
        ' ': ' ',
    };

    const normalizedParts = parts.map((part) => keyMap[part.toLowerCase()] || part);

    const modifiers = sortModifiers(normalizedParts.filter((key) => MODIFIERS_ORDER.includes(key)));
    const mainKey = normalizedParts.find((key) => !MODIFIERS_ORDER.includes(key));

    return [...modifiers, mainKey].filter(Boolean).join('+');
}

/**
 * Rozbija keybinding na tablicę w odpowiedniej kolejności.
 * 
 * Zakładam, ze keybinding jest znormalizowany do standardowego formatu.
 * 
 * @param keybinding znormalizowana postać skrótu klawiszowego w formacie [Ctrl+][Shift+][Alt+][Meta+]Key
 * @returns Tablica klawiszy w kolejności [Ctrl, Shift, Alt, Meta, Key]
 */
export function splitKeybinding(keybinding: string): string[] {
    // Rozdziel keybinding na części
    return keybinding.split('+');
}

/**
 * Sprawdza, czy podany keybinding pasuje do zdarzenia klawiatury.
 * 
 * Zakładam, ze keybinding jest znormalizowany do standardowego formatu.
 * 
 * @param keybinding Znormalizowana postać skrótu klawiszowy w formacie [Ctrl+][Shift+][Alt+][Meta+]Key
 * @param event Obiekt zdarzenia klawiatury
 * @returns True, jeśli keybinding pasuje do zdarzenia
 */
function keysEqual(a: string, b: string) {
    return (
        a.toLowerCase() === b.toLowerCase() ||
        (a === ' ' && b.toLowerCase() === 'space') ||
        (a.toLowerCase() === 'space' && b === ' ')
    );
}

export function isKeybindingMatch(
    keybinding: string,
    event: KeyboardEvent
): boolean {
    const parts = splitKeybinding(keybinding);

    const modifiers = {
        Ctrl: event.ctrlKey,
        Shift: event.shiftKey,
        Alt: event.altKey,
        Meta: event.metaKey,
    };

    for (const modifier of MODIFIERS_ORDER) {
        const hasModifier = parts.includes(modifier);
        if (hasModifier !== modifiers[modifier]) {
            return false;
        }
    }

    const mainKey = parts.find((key) => !MODIFIERS_ORDER.includes(key));
    if (!mainKey) {
        return false;
    }

    return keysEqual(mainKey, event.key);
}

export function keyboardEventToKeybinding(event: KeyboardEvent): string {
    const modifiers: string[] = [];

    if (event.ctrlKey) modifiers.push('Ctrl');
    if (event.shiftKey) modifiers.push('Shift');
    if (event.altKey) modifiers.push('Alt');
    if (event.metaKey) modifiers.push('Meta');

    // Zamień spację na 'Space' dla czytelności
    const mainKey = event.key === ' ' ? 'Space' : event.key;

    return [...modifiers, mainKey].join('+');
}
