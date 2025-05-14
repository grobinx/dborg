import { KeyboardEvent, keyboardEventToKeybinding, normalizeKeybinding } from "./KeyBinding"; // Import funkcji normalizującej

type CommandFunction<T> = (context: T, ...args: any[]) => void;

export interface CommandDescriptor<T> {
    keybinding: string; // Skrót klawiszowy przypisany do polecenia
    execute: CommandFunction<T>; // Funkcja, która zostanie wykonana
}

/**
 * Menedżer poleceń, który obsługuje rejestrację i wykonanie poleceń na podstawie skrótów klawiszowych.
 * Umożliwia dodawanie, usuwanie i wykonywanie poleceń związanych z konkretnym komponentem.
 * 
 * @class CommandManager
 * @template T Typ kontekstu, w którym polecenia będą wykonywane.
 */
export class CommandManager<T> {
    private commands: Map<string, CommandDescriptor<T>> = new Map();

    /**
     * Rejestruje nowe polecenie za pomocą skrótu klawiszowego i funkcji wykonawczej.
     * @param keybinding Skrót klawiszowy przypisany do polecenia (np. "Ctrl+S").
     * @param execute Funkcja, która zostanie wykonana po aktywacji polecenia.
     */
    registerCommand(keybinding: string, execute: CommandFunction<T>): void;

    /**
     * Rejestruje jedno lub więcej poleceń za pomocą obiektu CommandDescriptor lub tablicy CommandDescriptor.
     * @param descriptors Obiekt lub tablica zawierająca definicje poleceń.
     */
    registerCommand(descriptors: CommandDescriptor<T> | CommandDescriptor<T>[]): void;

    /**
     * Implementacja metody registerCommand.
     */
    registerCommand(
        keybindingOrDescriptors: string | CommandDescriptor<T> | CommandDescriptor<T>[],
        execute?: CommandFunction<T>
    ): void {
        if (typeof keybindingOrDescriptors === "string") {
            // Obsługa wersji z keybinding i execute
            const normalizedKeybinding = normalizeKeybinding(keybindingOrDescriptors);
            if (this.commands.has(normalizedKeybinding)) {
                return;
            }
            this.commands.set(normalizedKeybinding, {
                keybinding: normalizedKeybinding,
                execute: execute!,
            });
        } else if (Array.isArray(keybindingOrDescriptors)) {
            // Obsługa wersji z tablicą CommandDescriptor
            keybindingOrDescriptors.forEach((descriptor) => {
                const normalizedKeybinding = normalizeKeybinding(descriptor.keybinding);
                if (!this.commands.has(normalizedKeybinding)) {
                    this.commands.set(normalizedKeybinding, {
                        keybinding: normalizedKeybinding,
                        execute: descriptor.execute,
                    });
                }
            });
        } else {
            // Obsługa wersji z pojedynczym CommandDescriptor
            const normalizedKeybinding = normalizeKeybinding(keybindingOrDescriptors.keybinding);
            if (!this.commands.has(normalizedKeybinding)) {
                this.commands.set(normalizedKeybinding, {
                    keybinding: normalizedKeybinding,
                    execute: keybindingOrDescriptors.execute,
                });
            }
        }
    }

    /**
     * Wykonuje polecenie na podstawie skrótu klawiszowego.
     * @param event Zdarzenie klawiatury lub skrót klawiszowy w formie string.
     * @param context Kontekst przekazywany do funkcji polecenia.
     * @param args Argumenty przekazywane do funkcji polecenia.
     * @returns True, jeśli polecenie zostało znalezione i wykonane; w przeciwnym razie false.
     */
    executeCommand(event: KeyboardEvent | string, context: T, ...args: any[]): boolean {
        const keybinding = typeof event === 'string' ? event : keyboardEventToKeybinding(event);
        const command = this.commands.get(keybinding); // Pobranie polecenia na podstawie zdarzenia klawiatury
        if (!command) {
            return false; // Polecenie nie zostało znalezione
        }
        command.execute(context, ...args);
        return true; // Polecenie zostało wykonane
    }

    /**
     * Pobiera listę wszystkich zarejestrowanych poleceń.
     * @returns Tablica zarejestrowanych poleceń.
     */
    getRegisteredCommands(): CommandDescriptor<T>[] {
        return Array.from(this.commands.values());
    }

    /**
     * Usuwa polecenie na podstawie skrótu klawiszowego.
     * @param keybinding Skrót klawiszowy przypisany do polecenia.
     */
    unregisterCommand(keybinding: string): void {
        const normalizedKeybinding = normalizeKeybinding(keybinding); // Normalizacja skrótu
        if (!this.commands.delete(normalizedKeybinding)) {
            throw new Error(`Command with keybinding "${normalizedKeybinding}" is not registered.`);
        }
    }
}