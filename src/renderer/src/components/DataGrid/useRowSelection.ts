import { useState } from "react";

const useRowSelection = () => {
    const [selectedRows, setSelectedRows] = useState<number[]>([]);

    /**
     * 
     * @param rowIndex 
     * @param oneRow select one row or toggle it (ctrl + click)
     * @param range select a range of rows (shift + click)
     */
    const toggleRowSelection = (rowIndex: number, oneRow: boolean, range: boolean) => {
        setSelectedRows((prev) => {
            if (oneRow) {
                return prev.includes(rowIndex)
                    ? prev.filter((row) => row !== rowIndex)
                    : [...prev, rowIndex];
            } else if (range && prev.length > 0) {
                const lastSelectedRow = prev[prev.length - 1];
                const range = [lastSelectedRow, rowIndex].sort((a, b) => a - b);
                const newSelectedRows = Array.from(
                    { length: range[1] - range[0] + 1 },
                    (_, i) => range[0] + i
                );
                return Array.from(new Set([...prev, ...newSelectedRows]));
            } else {
                return prev.includes(rowIndex) ? [] : [rowIndex];
            }
        });
    };

    return { selectedRows, toggleRowSelection, setSelectedRows };
};

export default useRowSelection;