import { useRef, useState } from "react";

const useColumnSelection = () => {
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
    const selectedColumnsRef = useRef(selectedColumns);

    /**
     * @param columnKey key column to toggle
     */
    const toggleColumnSelection = (columnKey: string) => {
        setSelectedColumns((prev) =>
            prev.includes(columnKey)
                ? prev.filter((k) => k !== columnKey)
                : [...prev, columnKey]
        );
    };

    selectedColumnsRef.current = selectedColumns;

    return { selectedColumns, toggleColumnSelection, setSelectedColumns, selectedColumnsRef };
};

export default useColumnSelection;