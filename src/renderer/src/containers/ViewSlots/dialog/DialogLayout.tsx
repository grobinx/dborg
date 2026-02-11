import React from "react";
import {
    IDialogColumn,
    IDialogRow,
    resolveDialogLayoutItemsKindFactory,
    resolveStringFactory,
} from "../../../../../../plugins/manager/renderer/CustomSlots";
import { DialogLayoutItem } from "./DialogLayoutItem";
import { Stack } from "@mui/material";
import { DialogFieldset } from "./DialogFieldset";

export const DialogRow: React.FC<{
    row: IDialogRow;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
    invalidFields: Set<string>;
    onValidityChange: () => void;
}> = (props) => {
    const { row, structure, onChange, invalidFields, onValidityChange } = props;

    const label = resolveStringFactory(row.label, structure);
    const items = resolveDialogLayoutItemsKindFactory(row.items, structure) || [];

    const getItemWrapperStyle = (item: any): React.CSSProperties => {
        const size = item?.size;

        if (typeof size === "string") return { width: size };
        if (size === "auto") return { flex: "0 0 auto" };
        if (typeof size === "number") {
            const pct = `${(size / 12) * 100}%`;
            return { flex: `0 0 ${pct}`, maxWidth: pct };
        }
        return { flex: "1" };
    };

    const content = (
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
                        structure={structure}
                        onChange={onChange}
                        invalidFields={invalidFields}
                        onValidityChange={onValidityChange}
                    />
                </div>
            ))}
        </div>
    );

    return (
        <Stack direction="column" gap="8px">
            <DialogFieldset label={label}>{content}</DialogFieldset>
        </Stack>
    );
};

export const DialogColumn: React.FC<{
    column: IDialogColumn;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
    invalidFields: Set<string>;
    onValidityChange: () => void;
}> = (props) => {
    const { column, structure, onChange, invalidFields, onValidityChange } = props;

    const label = resolveStringFactory(column.label, structure);
    const items = resolveDialogLayoutItemsKindFactory(column.items, structure) || [];

    const content = (
        <Stack direction="column" gap="8px" width="100%">
            {items.map((item, index) => (
                <DialogLayoutItem
                    key={index}
                    item={item}
                    structure={structure}
                    onChange={onChange}
                    invalidFields={invalidFields}
                    onValidityChange={onValidityChange}
                />
            ))}
        </Stack>
    );

    return (
        <Stack direction="column" gap="8px" width="100%">
            <DialogFieldset label={label}>{content}</DialogFieldset>
        </Stack>
    );
};
