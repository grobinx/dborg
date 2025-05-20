import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { ColumnDefinition, DataGridActionContext } from "../DataGridTypes";
import { valueToString } from "../DataGridUtils";

export const AdjustWidthToData_ID = "dataGrid.actions.adjustWidthToData";

export const AdjustWidthToData = (): ActionDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    return {
        id: AdjustWidthToData_ID,
        keybindings: ["Ctrl+I"],
        label: t(AdjustWidthToData_ID, "Adjust columns width to data"),
        icon: "AdjustWidth",
        contextMenuGroupId: "column-layout",
        contextMenuOrder: 1,
        run: (context) => {
            const { start } = context.getVisibleRows();
            const endRow = Math.min(context.getRowCount(), start + 100);
            const columns: ColumnDefinition[] = [];
            const columnsMaxWdith: number[] = [];

            const sortPlaceWidth = context.getTextWidth("000") ?? 24;
            // Sprawdź szerokość etykiety kolumny
            for (let column = 0; column < context.getColumnCount(); column++) {
                const columnDefinition = context.getColumn(column);
                if (columnDefinition) {
                    columns.push(columnDefinition);
                    const labelWidth = context.getTextWidth(columnDefinition.label);
                    columnsMaxWdith.push(labelWidth !== null ? (labelWidth + sortPlaceWidth) : 0); // Ustaw szerokość etykiety jako początkową wartość
                }
            }

            // Sprawdź szerokość danych w widocznych wierszach
            for (let row = start; row < endRow; row++) {
                const data = context.getData(row);
                for (let column = 0; column < columns.length; column++) {
                    const columnDefinition = columns[column];
                    const value = valueToString(data[columnDefinition.key], columnDefinition.dataType);
                    if (value !== undefined && value !== null) {
                        const width = context.getTextWidth(value.toString());
                        if (width) {
                            columnsMaxWdith[column] = Math.max(columnsMaxWdith[column], width);
                        }
                    }
                }
            }

            // Aktualizuj szerokości kolumn
            if (endRow - start + 1 > 0) {
                for (let column = 0; column < columns.length; column++) {
                    context.updateColumn(column, { width: Math.min(columnsMaxWdith[column] + 10, 800) });
                }
            }
        },
    };
};