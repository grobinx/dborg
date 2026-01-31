import React from "react";
import {
    IDialogColumn,
    IDialogRow,
    resolveDialogLayoutItemsKindFactory,
    resolveStringFactory,
    SlotRuntimeContext,
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

    const label = resolveStringFactory(row.label, structure);
    const items = resolveDialogLayoutItemsKindFactory(row.items, structure) || [];

    const getItemWrapperStyle = (item: any): React.CSSProperties => {
        const size = item?.size;

        // jeśli size string => jawna szerokość i nie ustawiamy flex (Twoje wymaganie)
        if (typeof size === "string") {
            return { width: size };
        }

        if (size === "auto") {
            return { flex: "0 0 auto" };
        }

        if (typeof size === "number") {
            const pct = `${(size / 12) * 100}%`;
            return { flex: `0 0 ${pct}`, maxWidth: pct };
        }

        return { flex: "1" };
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {label && <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{label}</div>}

            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: "8px",
                    width: "100%",
                    alignItems: "stretch",
                }}
            >
                {items.map((item, index) => (
                    <div
                        key={index}
                        style={{
                            boxSizing: "border-box",
                            minWidth: 0,
                            ...getItemWrapperStyle(item),
                        }}
                    >
                        <DialogLayoutItem
                            item={item}
                            runtimeContext={runtimeContext}
                            structure={structure}
                            onChange={onChange}
                            invalidFields={invalidFields}
                            onValidityChange={onValidityChange}
                        />
                    </div>
                ))}
            </div>
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

    const label = resolveStringFactory(column.label, structure);
    const items = resolveDialogLayoutItemsKindFactory(column.items, structure) || [];

    // Kolumna: zawsze pionowo. `size` (jeśli jest) nie jest tutaj używane.
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
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
