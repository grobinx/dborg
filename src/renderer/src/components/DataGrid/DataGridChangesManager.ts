import { DataGridChangeRow } from "@renderer/components/DataGrid/DataGrid";

export interface DataGridChangesOptions<T> {
    /**
     * Funkcja zwracająca unikalny identyfikator rekordu
     */
    getUniqueId: (record: T) => string | number;
}

export interface DataGridChangeRowOptions {
    userData?: any;
    icon?: React.ReactNode;
}

export class DataGridChangesManager<T extends Record<string, any>> {
    private changes: DataGridChangeRow<Partial<T>>[] = [];
    private options: DataGridChangesOptions<T>;

    constructor(options: DataGridChangesOptions<T>) {
        this.options = options;
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
    findChange(record: T): DataGridChangeRow<Partial<T>> | undefined {
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
                return true; // Zmiana (usunięcie)
            }
            return false; // Brak zmian
        }

        // Jeśli istnieje wpis, aktualizuj
        if (existing) {
            existing.data = { ...existing.data, ...changedFields };
            existing.userData = options?.userData;
            existing.icon = options?.icon;
            return true;
        }

        // Dodaj nowy wpis
        this.changes.push({
            uniqueId,
            type: "update",
            data: changedFields,
            userData: options?.userData,
            icon: options?.icon,
        });

        return true;
    }

    /**
     * Dodaje nowy rekord (type: "add")
     */
    addRecord(record: Partial<T>, options?: DataGridChangeRowOptions): boolean {
        const uniqueId = this.options.getUniqueId(record as T);

        // Dodaj nowy wpis
        this.changes.push({
            uniqueId,
            type: "add",
            data: this.filledFields(record),
            userData: options?.userData,
            icon: options?.icon,
        });

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
            return false; // Rekord już jest oznaczony do usunięcia
        }

        // Jeśli to był wpis typu "add", po prostu usuń go z listy
        if (existing?.type === "add") {
            const index = this.changes.indexOf(existing);
            this.changes.splice(index, 1);
            return true;
        }

        // Jeśli to był wpis typu "update", zamień na "remove"
        if (existing?.type === "update") {
            existing.type = "remove";
            existing.data = {};
            existing.userData = options?.userData;
            existing.icon = options?.icon;
            return true;
        }

        // Dodaj nowy wpis typu "remove"
        this.changes.push({
            uniqueId,
            type: "remove",
            data: {},
            userData: options?.userData,
            icon: options?.icon,
        });

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
            return true;
        }

        return false;
    }

    /**
     * Czyści wszystkie zmiany
     */
    clearChanges(): void {
        this.changes = [];
    }

    /**
     * Zwraca referencję do tablicy zmian (dla grid)
     */
    getChanges(): DataGridChangeRow<Partial<T>>[] {
        return this.changes;
    }

    /**
     * Pobiera zmienione dane dla konkretnego rekordu (merge original + changes)
     */
    getMergedRecord(original: T): T {
        const change = this.findChange(original);
        if (!change) return original;

        return { ...original, ...change.data };
    }
}