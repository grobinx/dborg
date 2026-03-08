import React from "react";
import {
    DialogGridSize,
    IDialogColumn,
    IDialogRow,
    resolveValue,
} from "../../../../../../plugins/manager/renderer/CustomSlots";
import { DialogLayoutItem } from "./DialogLayoutItem";
import { Stack } from "@mui/material";
import { DialogFieldset } from "./DialogFieldset";

export const getItemWrapperStyle = (size: DialogGridSize | undefined): React.CSSProperties => {
    if (size === "auto") return { flex: "0 0 auto" };
    if (typeof size === "string") return { width: size };
    if (typeof size === "number") {
        const pct = `${(size / 12) * 100}%`;
        return { flex: `0 0 ${pct}`, maxWidth: pct };
    }
    return { flex: "1" };
};


export const DialogRow: React.FC<{
    row: IDialogRow;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
    invalidFields: Set<string>;
    onValidityChange: () => void;
    disabled?: boolean;
    ref?: React.Ref<HTMLDivElement>;
}> = (props) => {
    const { row, structure, onChange, invalidFields, onValidityChange, disabled, ref } = props;

    const label = resolveValue(row.label, structure);
    const items = resolveValue(row.items, structure) || [];

    const content = (
        <Stack direction="row" flexWrap="wrap" gap="8px" width="100%" alignItems="stretch" ref={ref} data-focus-container={true}>
            {items.map((item, index) => (
                <div
                    key={index}
                    style={{
                        boxSizing: "border-box",
                        minWidth: 0,
                        ...getItemWrapperStyle(item.size),
                    }}
                >
                    <DialogLayoutItem
                        item={item}
                        structure={structure}
                        onChange={onChange}
                        invalidFields={invalidFields}
                        onValidityChange={onValidityChange}
                        disabled={disabled}
                    />
                </div>
            ))}
        </Stack>
    );

    return (
        <DialogFieldset label={label}>{content}</DialogFieldset>
    );
};

export const DialogColumn: React.FC<{
    column: IDialogColumn;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
    invalidFields: Set<string>;
    onValidityChange: () => void;
    disabled?: boolean;
    ref?: React.Ref<HTMLDivElement>;
}> = (props) => {
    const { column, structure, onChange, invalidFields, onValidityChange, disabled, ref } = props;

    const label = resolveValue(column.label, structure);
    const items = resolveValue(column.items, structure) || [];

    const content = (
        <Stack direction="column" gap="8px" width="100%" ref={ref} data-focus-container={true}>
            {items.map((item, index) => (
                <DialogLayoutItem
                    key={index}
                    item={item}
                    structure={structure}
                    onChange={onChange}
                    invalidFields={invalidFields}
                    onValidityChange={onValidityChange}
                    disabled={disabled}
                />
            ))}
        </Stack>
    );

    return (
        <DialogFieldset label={label}>{content}</DialogFieldset>
    );
};
