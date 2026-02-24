import React from "react";
import {
    IDialogList,
    IDialogListColumn,
    DialogLayoutItemKind,
    resolveDialogLayoutItemsKindFactory,
    resolveDialogListColumnsFactory,
    resolveStringFactory,
    isDialogTextField,
    isDialogTextareaField,
    isDialogNumberField,
    isDialogBooleanField,
    isDialogSelectField,
    isDialogEditorField,
    isDialogRow,
    isDialogColumn,
} from "../../../../../../plugins/manager/renderer/CustomSlots";
import {
    Divider,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    useTheme,
} from "@mui/material";
import { DialogLayoutItem } from "./DialogLayoutItem";
import { getItemWrapperStyle } from "./DialogLayout";
import { DialogFieldset } from "./DialogFieldset";
import { IconButton } from "@renderer/components/buttons/IconButton";

const isSimpleField = (item: DialogLayoutItemKind) =>
    isDialogTextField(item) ||
    isDialogTextareaField(item) ||
    isDialogNumberField(item) ||
    isDialogBooleanField(item) ||
    isDialogSelectField(item) ||
    isDialogEditorField(item);

const inferColumnsFromItems = (
    items: DialogLayoutItemKind[],
    rowContext: Record<string, any>
): IDialogListColumn[] => {
    const columns: IDialogListColumn[] = [];

    for (const item of items) {
        if (isSimpleField(item)) {
            columns.push({
                key: item.key,
                label: item.label ?? item.key,
                size: item.size,
            });
        } else if (isDialogRow(item) || isDialogColumn(item)) {
            // Rekurencyjnie przeszukaj zagnieżdżone items
            const nestedItems = resolveDialogLayoutItemsKindFactory(item.items || [], rowContext) || [];
            const nestedColumns = inferColumnsFromItems(nestedItems, rowContext);
            columns.push(...nestedColumns);
        }
    }

    // fallback jeśli items nie da się zmapować na pola
    if (columns.length === 0 && rowContext && typeof rowContext === "object") {
        return Object.keys(rowContext).map((k) => ({
            key: k,
            label: k,
        }));
    }

    return columns;
};

export const DialogList: React.FC<{
    list: IDialogList;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
    invalidFields: Set<string>;
    onValidityChange: () => void;
}> = ({ list, structure, onChange, invalidFields, onValidityChange }) => {
    const theme = useTheme();

    const rows: Record<string, any>[] = Array.isArray(structure?.[list.key]) ? structure[list.key] : [];

    const [selectedIndex, setSelectedIndex] = React.useState<number>(rows.length > 0 ? 0 : -1);

    React.useEffect(() => {
        if (rows.length === 0) {
            setSelectedIndex(-1);
            return;
        }
        if (selectedIndex < 0 || selectedIndex >= rows.length) {
            setSelectedIndex(0);
        }
    }, [rows.length, selectedIndex]);

    const selectedRow = selectedIndex >= 0 ? (rows[selectedIndex] ?? {}) : undefined;

    const label = resolveStringFactory(list.label, structure);
    const resolvedItems = resolveDialogLayoutItemsKindFactory(list.items, selectedRow ?? {}) || [];
    const columns = React.useMemo(
        () => {
            const configuredColumns = resolveDialogListColumnsFactory(list.columns, structure);
            return configuredColumns && configuredColumns.length > 0
                ? configuredColumns
                : inferColumnsFromItems(resolvedItems, {});
        },
        [list.columns]
    );

    const onSelectedRowChange = (nextRow: Record<string, any>) => {
        if (selectedIndex < 0) return;

        const nextRows = [...rows];
        nextRows[selectedIndex] = nextRow;

        onChange({
            ...structure,
            [list.key]: nextRows,
        });
    };

    return (
        <DialogFieldset label={label}>
            <TableContainer style={{ height: `${5 * 2.3}rem` }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <TableCell key={column.key} sx={{ ...getItemWrapperStyle(column.size) }}>
                                    {resolveStringFactory(column.label, structure) ?? column.key}
                                </TableCell>
                            ))}
                            <TableCell key="__actions" sx={{ width: "1px" }}>
                                <IconButton size="small" onClick={() => {
                                    const nextRows = [...rows, {}];
                                    onChange({
                                        ...structure,
                                        [list.key]: nextRows,
                                    });
                                    setSelectedIndex(nextRows.length - 1);
                                }}>
                                    <theme.icons.Add color="success" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={Math.max(columns.length, 1)}>
                                    <Typography variant="body2" color="text.secondary">
                                        Brak danych
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row: Record<string, any>, rowIndex: number) => (
                                <TableRow
                                    key={rowIndex}
                                    hover
                                    selected={rowIndex === selectedIndex}
                                    onClick={() => setSelectedIndex(rowIndex)}
                                    sx={{ cursor: "pointer" }}
                                >
                                    {columns.map((column) => (
                                        <TableCell key={column.key}>
                                            {row?.[column.key] == null ? "" : typeof row?.[column.key] === "boolean" ? row[column.key] : String(row[column.key])}
                                        </TableCell>
                                    ))}
                                    <TableCell key="__actions">
                                        <IconButton size="small" onClick={(e) => {
                                            e.stopPropagation();
                                            const nextRows = rows.filter((_, i) => i !== rowIndex);
                                            onChange({
                                                ...structure,
                                                [list.key]: nextRows,
                                            });
                                            if (selectedIndex >= nextRows.length) {
                                                setSelectedIndex(nextRows.length - 1);
                                            }
                                        }}>
                                            <theme.icons.Delete color="error" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Divider />
            {selectedRow && (
                resolvedItems.map((item, index) => (
                    <DialogLayoutItem
                        key={index}
                        item={item}
                        structure={selectedRow}
                        onChange={onSelectedRowChange}
                        invalidFields={invalidFields}
                        onValidityChange={onValidityChange}
                    />
                ))
            )}
        </DialogFieldset>
    );
};