import React from "react";
import {
    SlotFactoryContext,
    IDialogRow,
    IDialogColumn,
    DialogLayoutItemKind,
    resolveStringFactory,
    resolveDialogLayoutItemsKindFactory,
} from "../../../../../../plugins/manager/renderer/CustomSlots";
import { DialogLayoutItem } from "./DialogLayoutItem";

export const DialogRow: React.FC<{
    row: IDialogRow;
    slotContext: SlotFactoryContext;
    structure: Record<string, any>;
}> = (props) => {
    const {
        row,
        slotContext,
        structure,
    } = props;

    const label = resolveStringFactory(row.label, slotContext);
    const items = resolveDialogLayoutItemsKindFactory(row.items, slotContext) || [];

    return (
        <div style={{ display: "flex", gap: "8px", width: "100%", flexWrap: "wrap" }}>
            {label && (
                <div style={{ width: "100%", fontWeight: "bold", marginBottom: "4px" }}>
                    {label}
                </div>
            )}
            {items.map((item, index) => (
                <DialogLayoutItem
                    key={index}
                    item={item}
                    slotContext={slotContext}
                    structure={structure}
                />
            ))}
        </div>
    );
};

export const DialogColumn: React.FC<{
    column: IDialogColumn;
    slotContext: SlotFactoryContext;
    structure: Record<string, any>;
}> = (props) => {
    const {
        column,
        slotContext,
        structure,
    } = props;

    const label = resolveStringFactory(column.label, slotContext);
    const items = resolveDialogLayoutItemsKindFactory(column.items, slotContext) || [];

    const columnWidth = column.width ? `${(column.width / 12) * 100}%` : "auto";

    return (
        <div style={{ flex: column.width ? "0 0 " + columnWidth : "1", display: "flex", flexDirection: "column", gap: "8px" }}>
            {label && (
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                    {label}
                </div>
            )}
            {items.map((item, index) => (
                <DialogLayoutItem
                    key={index}
                    item={item}
                    slotContext={slotContext}
                    structure={structure}
                />
            ))}
        </div>
    );
};
