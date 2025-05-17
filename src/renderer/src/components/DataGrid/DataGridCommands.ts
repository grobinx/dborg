import { CommandDescriptor } from "../CommandPalette/CommandManager";
import { DataGridActionContext } from "./DataGridTypes";

export const createDataGridCommands = <T extends object>(): CommandDescriptor<DataGridActionContext<T>>[] => [
    {
        keybinding: "ArrowUp",
        execute: (context) => {
            const position = context.getPosition();
            if (position) {
                const { row, column } = position;
                if (row > 0) {
                    context.setPosition({ row: row - 1, column });
                }
            }
        },
    },
    {
        keybinding: "ArrowDown",
        execute: (context) => {
            const position = context.getPosition();
            if (position) {
                const { row, column } = position;
                if (row < context.getRowCount() - 1) {
                    context.setPosition({ row: row + 1, column });
                }
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
            if (position) {
                const { row, column } = position;
                const { start, end } = context.getVisibleRows();
                if (row > 0) {
                    context.setPosition({ row: Math.max(row - (end - start - 1), 0), column });
                }
            }
        },
    },
    {
        keybinding: "PageDown",
        execute: (context) => {
            const position = context.getPosition();
            if (position) {
                const { row, column } = position;
                const { start, end } = context.getVisibleRows();
                if (row < context.getRowCount() - 1) {
                    context.setPosition({ row: Math.min(row + (end - start - 1), context.getRowCount() - 1), column });
                }
            }
        },
    },
    {
        keybinding: "Home",
        execute: (context) => {
            const position = context.getPosition();
            if (position) {
                const { row } = position;
                context.setPosition({ row, column: 0 }); // Przewiń do początku wiersza
            }
        },
    },
    {
        keybinding: "End",
        execute: (context) => {
            const position = context.getPosition();
            if (position) {
                const { row } = position;
                context.setPosition({ row, column: context.getColumnCount() - 1 }); // Przewiń do końca wiersza
            }
        },
    },
    {
        keybinding: "Ctrl+Home",
        execute: (context) => {
            const position = context.getPosition();
            if (position) {
                const { column } = position;
                context.setPosition({ row: 0, column }); // Przewiń do początku kolumny
            }
        },
    },
    {
        keybinding: "Ctrl+End",
        execute: (context) => {
            const position = context.getPosition();
            if (position) {
                const { column } = position;
                context.setPosition({ row: context.getRowCount() - 1, column }); // Przewiń do końca kolumny
            }
        },
    },
];

