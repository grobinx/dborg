import React from "react";
import {
    IDialogList,
    IDialogListColumn,
    DialogLayoutItemKind,
    resolveValue,
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
    Box,
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
import { DialogRow, getItemWrapperStyle } from "./DialogLayout";
import { DialogFieldset } from "./DialogFieldset";
import { IconButton } from "@renderer/components/buttons/IconButton";
import { useTranslation } from "react-i18next";
import { ActionManager, Actions, IActionManager } from "@renderer/components/CommandPalette/ActionManager";
import { useKeyboardNavigation } from "@renderer/hooks/useKeyboardNavigation";
import { useScrollIntoView } from "@renderer/hooks/useScrollIntoView";
import { focusElement } from "@renderer/components/useful/FocusContainerHandler";

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
            const nestedItems = resolveValue(item.items || [], rowContext) || [];
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
    disabled?: boolean;
}> = ({ list, structure, onChange, invalidFields, onValidityChange, disabled }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const rows: Record<string, any>[] = Array.isArray(structure?.[list.key]) ? structure[list.key] : [];

    const actions: Actions<{}> = {
        cmAdd: {
            id: "cmAdd",
            label: t("add-item", "Add item"),
            keySequence: ["F2"],
            icon: <theme.icons.Add color="success" />,
            run: () => {
                const newItem = list.prepareItem ? list.prepareItem() : {};
                const nextRows = [...rows, newItem];
                onChange({
                    ...structure,
                    [list.key]: nextRows,
                });
                setSelectedIndex(nextRows.length - 1);
            }
        },
        cmDelete: {
            id: "cmDelete",
            label: t("delete-item", "Delete item"),
            keySequence: ["Delete"],
            icon: <theme.icons.Delete color="error" />,
            run: (_, index: number) => {
                const nextRows = rows.filter((_, i) => i !== index);
                onChange({
                    ...structure,
                    [list.key]: nextRows,
                });
                if (selectedIndex === null || selectedIndex >= nextRows.length) {
                    setSelectedIndex(nextRows.length - 1);
                }
            }
        }
    }

    const listRef = React.useRef<HTMLTableElement>(null);
    const itemsRef = React.useRef<HTMLDivElement>(null);

    const [selectedIndex, setSelectedIndex, handleKeyDown] = useKeyboardNavigation({
        items: React.useMemo(() => rows.map((_, index) => index), [rows]),
        getId: (index: number) => index,
        actions: actions,
        onEnter: () => {
            if (itemsRef.current) {
                focusElement(itemsRef.current);
            }
        }
    });

    React.useEffect(() => {
        if (rows.length === 0) {
            setSelectedIndex(-1);
            return;
        }
        if (selectedIndex === null || selectedIndex >= rows.length) {
            setSelectedIndex(0);
        }
    }, [rows.length, selectedIndex]);

    const selectedRow = selectedIndex != null && selectedIndex >= 0 ? (rows[selectedIndex] ?? {}) : undefined;

    const label = resolveValue(list.label, structure);
    const resolvedItems = resolveValue(list.items, selectedRow ?? {}) || [];
    const columns = React.useMemo(
        () => {
            const configuredColumns = resolveValue(list.columns, structure);
            return configuredColumns && configuredColumns.length > 0
                ? configuredColumns
                : inferColumnsFromItems(resolvedItems, {});
        },
        [list.columns]
    );

    const onSelectedRowChange = (nextRow: Record<string, any>) => {
        if (selectedIndex === null) return;

        const nextRows = [...rows];
        nextRows[selectedIndex] = nextRow;

        onChange({
            ...structure,
            [list.key]: nextRows,
        });
    };

    useScrollIntoView({ containerRef: listRef, targetId: `item-${selectedIndex}`, stickyHeader: ".sticky", });

    return (
        <DialogFieldset label={label}>
            <TableContainer style={{ height: list.height ?? `${5 * 2.3}rem` }} ref={listRef}>
                <Table size="small" stickyHeader onKeyDown={handleKeyDown} tabIndex={0}>
                    <TableHead className="sticky">
                        <TableRow>
                            {columns.map((column) => (
                                <TableCell key={column.key} sx={{ ...getItemWrapperStyle(column.size) }}>
                                    {resolveValue(column.label, structure) ?? column.key}
                                </TableCell>
                            ))}
                            <TableCell key="__actions" sx={{ width: "1%" }}>
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <IconButton size="small" action={actions.cmAdd} />
                                </Box>
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={Math.max(columns.length + 1, 1)}>
                                    <Typography variant="body2" color="text.secondary">
                                        {t("no-rows-to-display", "No rows to display")}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row: Record<string, any>, rowIndex: number) => (
                                <TableRow
                                    key={rowIndex}
                                    id={`item-${rowIndex}`}
                                    hover
                                    selected={rowIndex === selectedIndex}
                                    onClick={() => setSelectedIndex(rowIndex)}
                                    sx={{ cursor: "pointer" }}
                                >
                                    {columns.map((column) => {
                                        let cellValue = row?.[column.key];
                                        let align: "left" | "right" | "center" = "left";

                                        if (cellValue == null) cellValue = "";
                                        else if (typeof cellValue === "boolean") cellValue = cellValue ? <theme.icons.CheckBoxChecked /> : <theme.icons.CheckBoxBlank />;
                                        else cellValue = String(cellValue);

                                        if (typeof row?.[column.key] === "number") align = "right";
                                        else if (typeof row?.[column.key] === "boolean") align = "center";

                                        return (
                                            <TableCell
                                                key={column.key}
                                                align={align}
                                            >
                                                {align === "center" ? (
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                        {cellValue}
                                                    </Box>
                                                ) : (
                                                    cellValue
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                    <TableCell key="__actions">
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <IconButton size="small" action={actions.cmDelete} actionArgs={[rowIndex]} />
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Divider />
            <DialogRow
                row={{ type: "row", items: list.items, }}
                structure={selectedRow ?? {}}
                onChange={onSelectedRowChange}
                invalidFields={invalidFields}
                onValidityChange={onValidityChange}
                disabled={!selectedRow ? true : disabled}
                ref={itemsRef}
            />
        </DialogFieldset>
    );
};