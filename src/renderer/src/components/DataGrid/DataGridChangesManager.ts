import { DataGridChangeRow } from "@renderer/components/DataGrid/DataGrid";

export interface DataGridChangesOptions<T> {
    /**
     * Funkcja zwracająca unikalny identyfikator rekordu
     */
    getUniqueId: (record: T) => string | number;
    /**
     * Opcjonalna funkcja do generowania skryptu SQL dla danej zmiany
     */
    generateScript?: (change: DataGridChangeRow<Partial<T>>, row: T | undefined) => string;
}

export interface DataGridChangeRowOptions {
    userData?: any;
    icon?: React.ReactNode;
}

export type DataGridChangesEventType = 
    | 'change'      // Dowolna zmiana (add, update, remove)
    | 'add'         // Nowy rekord
    | 'update'      // Aktualizacja
    | 'remove'      // Usunięcie
    | 'clear'       // Wyczyszczenie wszystkich zmian
    | 'cancel';     // Anulowanie zmian dla rekordu

export interface DataGridChangesEvent<T> {
    type: DataGridChangesEventType;
    change?: DataGridChangeRow<Partial<T>>;
    uniqueId?: string | number;
    timestamp: number;
}

export type DataGridChangesEventListener<T> = (event: DataGridChangesEvent<T>) => void;

export class DataGridChangesManager<T extends Record<string, any>> {
    private changes: DataGridChangeRow<Partial<T>>[] = [];
    private options: DataGridChangesOptions<T>;
    private rows: T[] = [];
    private listeners: Map<DataGridChangesEventType | 'all', Set<DataGridChangesEventListener<T>>> = new Map();

    constructor(options: DataGridChangesOptions<T>) {
        this.options = options;
    }

    /**
     * Subskrybuj event
     * @param eventType Typ eventu ('change', 'add', 'update', 'remove', 'clear', 'cancel', 'all')
     * @param listener Funkcja callback
     * @returns Funkcja do unsubskrypcji
     */
    on(eventType: DataGridChangesEventType | 'all', listener: DataGridChangesEventListener<T>): () => void {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType)!.add(listener);

        // Zwróć funkcję unsubskrypcji
        return () => this.off(eventType, listener);
    }

    /**
     * Unsubskrybuj event
     */
    off(eventType: DataGridChangesEventType | 'all', listener: DataGridChangesEventListener<T>): void {
        this.listeners.get(eventType)?.delete(listener);
    }

    /**
     * Unsubskrybuj wszystkie listenery dla danego eventu
     */
    offAll(eventType?: DataGridChangesEventType | 'all'): void {
        if (eventType) {
            this.listeners.delete(eventType);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Emituj event
     */
    private emit<E extends DataGridChangesEventType>(
        eventType: E,
        event: Omit<DataGridChangesEvent<T>, 'type' | 'timestamp'>
    ): void {
        const fullEvent: DataGridChangesEvent<T> = {
            ...event,
            type: eventType,
            timestamp: Date.now(),
        };

        // Emituj do specyficznych listenerów
        this.listeners.get(eventType)?.forEach(listener => listener(fullEvent));

        // Emituj do 'all' listenerów
        this.listeners.get('all')?.forEach(listener => listener(fullEvent));
    }

    /**
     * Porównuje dwa rekordy i zwraca tylko zmienione pola
     */
    private getChangedFields(original: T, modified: Partial<T>): Partial<T> {
        const changed: Partial<T> = {};

        for (const key in modified) {
            if (modified[key] !== original[key]) {
                changed[key] = modified[key];
            }
        }

        return changed;
    }

    private filledFields(record: Partial<T>): Partial<T> {
        const filled: Partial<T> = {};
        for (const key in record) {
            if (record[key] !== undefined) {
                filled[key] = record[key];
            }
        }
        return filled;
    }

    /**
     * Znajduje istniejący wpis w changes dla danego rekordu
     */
    findChange(record: T | undefined | null): DataGridChangeRow<Partial<T>> | undefined {
        if (!record) return undefined;
        const uniqueId = this.options.getUniqueId(record);
        return this.changes.find(change => change.uniqueId === uniqueId);
    }

    /**
     * Aktualizuje rekord (type: "update")
     */
    updateRecord(original: T, modified: Partial<T>, options?: DataGridChangeRowOptions): boolean {
        const uniqueId = this.options.getUniqueId(original);
        const existing = this.changes.find(c => c.uniqueId === uniqueId);

        // Zbierz tylko zmienione pola względem oryginału
        const changedFields = this.getChangedFields(original, modified);

        // Jeśli nie ma zmian
        if (Object.keys(changedFields).length === 0) {
            // Usuń wpis jeśli istniał
            if (existing && existing.type === "update") {
                const index = this.changes.indexOf(existing);
                this.changes.splice(index, 1);
                this.emit('cancel', { uniqueId });
                return true;
            }
            return false;
        }

        // Jeśli istnieje wpis, aktualizuj
        if (existing) {
            existing.version = (existing.version || 1) + 1;
            existing.data = { ...existing.data, ...changedFields };
            existing.userData = options?.userData;
            existing.icon = options?.icon;
            this.emit('update', { change: existing, uniqueId });
            return true;
        }

        // Dodaj nowy wpis
        const newChange: DataGridChangeRow<Partial<T>> = {
            version: 1,
            uniqueId,
            type: "update",
            data: changedFields,
            userData: options?.userData,
            icon: options?.icon,
        };
        this.changes.push(newChange);
        this.emit('update', { change: newChange, uniqueId });

        return true;
    }

    /**
     * Dodaje nowy rekord (type: "add")
     */
    addRecord(record: Partial<T>, options?: DataGridChangeRowOptions): boolean {
        const uniqueId = this.options.getUniqueId(record as T);

        const newChange: DataGridChangeRow<Partial<T>> = {
            version: 1,
            uniqueId,
            type: "add",
            data: this.filledFields(record),
            userData: options?.userData,
            icon: options?.icon,
        };
        this.changes.push(newChange);
        this.emit('add', { change: newChange, uniqueId });

        return true;
    }

    /**
     * Usuwa rekord (type: "remove")
     */
    removeRecord(record: T, options?: DataGridChangeRowOptions): boolean {
        const uniqueId = this.options.getUniqueId(record);
        const existing = this.changes.find(c => c.uniqueId === uniqueId);

        if (existing?.type === "remove") {
            existing.userData = options?.userData;
            existing.icon = options?.icon;
            return false;
        }

        // Jeśli to był wpis typu "add", po prostu usuń go z listy
        if (existing?.type === "add") {
            const index = this.changes.indexOf(existing);
            this.changes.splice(index, 1);
            this.emit('change', { change: existing, uniqueId });
            return true;
        }

        // Jeśli to był wpis typu "update", zamień na "remove"
        if (existing?.type === "update") {
            existing.type = "remove";
            existing.data = {};
            existing.version = (existing.version || 1) + 1;
            existing.userData = options?.userData;
            existing.icon = options?.icon;
            this.emit('remove', { change: existing, uniqueId });
            return true;
        }

        // Dodaj nowy wpis typu "remove"
        const newChange: DataGridChangeRow<Partial<T>> = {
            version: 1,
            uniqueId,
            type: "remove",
            data: {},
            userData: options?.userData,
            icon: options?.icon,
        };
        this.changes.push(newChange);
        this.emit('remove', { change: newChange, uniqueId });

        return true;
    }

    /**
     * Anuluje zmiany dla danego rekordu
     */
    cancelChanges(record: T): boolean {
        const uniqueId = this.options.getUniqueId(record);
        const existing = this.changes.find(c => c.uniqueId === uniqueId);

        if (existing) {
            const index = this.changes.indexOf(existing);
            this.changes.splice(index, 1);
            this.emit('cancel', { uniqueId });
            return true;
        }

        return false;
    }

    /**
     * Czyści wszystkie zmiany
     */
    clearChanges(): void {
        this.changes = [];
        this.emit('clear', {});
    }

    /**
     * Zwraca referencję do tablicy zmian (dla grid)
     */
    getChanges(): DataGridChangeRow<Partial<T>>[] {
        return this.changes;
    }

    setRows(rows: T[]) {
        this.rows = rows;
    }

    /**
     * Generuje skrypt SQL dla wszystkich zmian
     */
    generateScript(header?: string): string | null {
        if (!this.options.generateScript) return "";
        if (!this.rows || this.rows.length === 0 || !this.changes || this.changes.length === 0) return "";
        
        const scripts: string[] = [];
        if (header) {
            scripts.push(header);
        }
        
        for (const change of this.changes) {
            const row = this.rows.find(r => this.options.getUniqueId(r) === change.uniqueId);
            const script = this.options.generateScript(change, row);
            if (script) {
                scripts.push(script);
            }
        }

        return scripts.join("\n");
    }
}