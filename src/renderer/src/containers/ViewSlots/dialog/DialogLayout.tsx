import React from "react";
import {
    SlotRuntimeContext,
    IDialogRow,
    IDialogColumn,
    resolveStringFactory,
    resolveDialogLayoutItemsKindFactory,
} from "../../../../../../plugins/manager/renderer/CustomSlots";
import { DialogLayoutItem } from "./DialogLayoutItem";

export const DialogRow: React.FC<{
    row: IDialogRow;
    runtimeContext: SlotRuntimeContext;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
    invalidFields: Set<string>;
    onValidityChange: () => void;
}> = (props) => {
    const {
        row,
        runtimeContext,
        structure,
        onChange,
        invalidFields,
        onValidityChange,
    } = props;

    const label = resolveStringFactory(row.label, runtimeContext);
    const items = resolveDialogLayoutItemsKindFactory(row.items, runtimeContext) || [];

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
                    runtimeContext={runtimeContext}
                    structure={structure}
                    onChange={onChange}
                    invalidFields={invalidFields}
                    onValidityChange={onValidityChange}
                />
            ))}
        </div>
    );
};

export const DialogColumn: React.FC<{
    column: IDialogColumn;
    runtimeContext: SlotRuntimeContext;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
    invalidFields: Set<string>;
    onValidityChange: () => void;
}> = (props) => {
    const {
        column,
        runtimeContext,
        structure,
        onChange,
        invalidFields,
        onValidityChange,
    } = props;

    const label = resolveStringFactory(column.label, runtimeContext);
    const items = resolveDialogLayoutItemsKindFactory(column.items, runtimeContext) || [];

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
                    runtimeContext={runtimeContext}
                    structure={structure}
                    onChange={onChange}
                    invalidFields={invalidFields}
                    onValidityChange={onValidityChange}
                />
            ))}
        </div>
    );
};
