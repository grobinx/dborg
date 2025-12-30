import { CommandDescriptor } from "../CommandPalette/CommandManager";
import { DataGridActionContext } from "./DataGridTypes";

export const createDataGridCommands = <T extends object>(): CommandDescriptor<DataGridActionContext<T>>[] => [
    {
        keybinding: "ArrowUp",
        execute: (context) => {
            const position = context.getPosition();
            if (!position) return;

            const { row, column } = position;
            // search backwards for the previous row that has data (hasKeys)
            let target = row - 1;
            while (target >= 0) {
                const data = context.getData(target);
                const hasKeys = data && Object.keys(data).length > 0;
                if (hasKeys) {
                    context.setPosition({ row: target, column });
                    return;
                }
                target--;
            }

            // if none found, move to first row (or stay if already at top)
            if (row > 0) {
                context.setPosition({ row: 0, column });
            }
        },
    },
    {
        keybinding: "ArrowDown",
        execute: (context) => {
            const position = context.getPosition();
            if (!position) return;

            const { row, column } = position;
            const last = context.getRowCount() - 1;
            // search forwards for the next row that has data (hasKeys)
            let target = row + 1;
            while (target <= last) {
                const data = context.getData(target);
                const hasKeys = data && Object.keys(data).length > 0;
                if (hasKeys) {
                    context.setPosition({ row: target, column });
                    return;
                }
                target++;
            }

            // if none found, move to last row (or stay if already at bottom)
            if (row < last) {
                context.setPosition({ row: last, column });
            }
        },
    },
    {
        keybinding: "ArrowLeft",
        execute: (context) => {
            const position = context.getPosition();
            if (position) {
                const { row, column } = position;
                if (column > 0) {
                    context.setPosition({ row, column: column - 1 });
                }
            }
        },
    },
    {
        keybinding: "ArrowRight",
        execute: (context) => {
            const position = context.getPosition();
            if (position) {
                const { row, column } = position;
                if (column < context.getColumnCount() - 1) {
                    context.setPosition({ row, column: column + 1 });
                }
            }
        },
    },
    {
        keybinding: "PageUp",
        execute: (context) => {
            const position = context.getPosition();
            if (!position) return;

            const { row, column } = position;
            const { start, end } = context.getVisibleRows();
            const step = Math.max(end - start - 1, 1);
            let target = Math.max(row - step, 0);

            // find nearest row at or before target that has data
            while (target >= 0) {
                const data = context.getData(target);
                const hasKeys = data && Object.keys(data).length > 0;
                if (hasKeys) {
                    context.setPosition({ row: target, column });
                    return;
                }
                target--;
            }

            // fallback to first row
            context.setPosition({ row: 0, column });
        },
    },
    {
        keybinding: "PageDown",
        execute: (context) => {
            const position = context.getPosition();
            if (!position) return;

            const { row, column } = position;
            const { start, end } = context.getVisibleRows();
            const step = Math.max(end - start - 1, 1);
            const last = context.getRowCount() - 1;
            let target = Math.min(row + step, last);

            // find nearest row at or after target that has data
            while (target <= last) {
                const data = context.getData(target);
                const hasKeys = data && Object.keys(data).length > 0;
                if (hasKeys) {
                    context.setPosition({ row: target, column });
                    return;
                }
                target++;
            }

            // fallback to last row
            context.setPosition({ row: last, column });
        },
    },
    {
        keybinding: "Home",
        execute: (context) => {
            const position = context.getPosition();
            if (position) {
                const { row } = position;
                context.setPosition({ row, column: 0 }); // move to first column
            }
        },
    },
    {
        keybinding: "End",
        execute: (context) => {
            const position = context.getPosition();
            if (position) {
                const { row } = position;
                context.setPosition({ row, column: context.getColumnCount() - 1 }); // move to last column
            }
        },
    },
    {
        keybinding: "Ctrl+Home",
        execute: (context) => {
            const position = context.getPosition();
            if (position) {
                const { column } = position;
                context.setPosition({ row: 0, column }); // move to first row, keep column
            }
        },
    },
    {
        keybinding: "Ctrl+End",
        execute: (context) => {
            const position = context.getPosition();
            if (position) {
                const { column } = position;
                context.setPosition({ row: context.getRowCount() - 1, column }); // move to last row, keep column
            }
        },
    },
];

