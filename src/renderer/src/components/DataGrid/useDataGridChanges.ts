import { useRef, useCallback, useMemo } from "react";
import { DataGridChangeRow } from "@renderer/components/DataGrid/DataGrid";
import { DataGridChangeRowOptions, DataGridChangesManager, DataGridChangesOptions } from "@renderer/components/DataGrid/DataGridChangesManager";

export function useDataGridChanges<T extends Record<string, any>>(
    options: DataGridChangesOptions<T>
) {
    // Tworzymy manager tylko raz (przy mount)
    const managerRef = useRef<DataGridChangesManager<T>>(new DataGridChangesManager<T>(options));
    const manager = managerRef.current;

    /**
     * Aktualizuje rekord (type: "update")
     */
    const updateRecord = useCallback((original: T, modified: Partial<T>, options?: DataGridChangeRowOptions): boolean => {
        return manager.updateRecord(original, modified, options);
    }, [manager]);

    /**
     * Dodaje nowy rekord (type: "add")
     */
    const addRecord = useCallback((record: Partial<T>, options?: DataGridChangeRowOptions): boolean => {
        return manager.addRecord(record, options);
    }, [manager]);

    /**
     * Usuwa rekord (type: "remove")
     */
    const removeRecord = useCallback((record: T, options?: DataGridChangeRowOptions): boolean => {
        return manager.removeRecord(record, options);
    }, [manager]);

    /**
     * Anuluje zmiany dla danego rekordu
     */
    const cancelChanges = useCallback((record: T): boolean => {
        return manager.cancelChanges(record);
    }, [manager]);

    /**
     * Czyści wszystkie zmiany
     */
    const clearChanges = useCallback(() => {
        manager.clearChanges();
    }, [manager]);

    /**
     * Zwraca kopię aktualnych zmian
     */
    const getChanges = useCallback(() => {
        return manager.getChanges();
    }, [manager]);

    /**
     * Pobiera zmienione dane dla konkretnego rekordu (merge original + changes)
     */
    const getMergedRecord = useCallback((original: T): T => {
        return manager.getMergedRecord(original);
    }, [manager]);

    /**
     * Znajduje istniejący wpis w changes dla danego rekordu
     */
    const findChange = useCallback((record: T): DataGridChangeRow<Partial<T>> | undefined => {
        return manager.findChange(record);
    }, [manager]);

    return {
        changes: manager.getChanges(),
        updateRecord,
        addRecord,
        removeRecord,
        cancelChanges,
        clearChanges,
        getChanges,
        getMergedRecord,
        findChange,
    };
}