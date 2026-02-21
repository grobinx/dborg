import React from 'react';
import { Box, useTheme, Table, TableHead, TableBody, TableRow, TableCell, TableFooter } from '@mui/material';
import { BaseInputProps } from './base/BaseInputProps';
import { BaseInputField } from './base/BaseInputField';
import { TextField } from './TextField';
import { IconButton } from '../buttons/IconButton';
import { useKeyboardNavigation } from '@renderer/hooks/useKeyboardNavigation';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { Ellipsis } from '../useful/Elipsis';
import { Actions } from '../CommandPalette/ActionManager';
import { useTranslation } from 'react-i18next';
import { InputDecorator } from './decorators/InputDecorator';
import { NumberField } from './NumberField';
import { BooleanField } from './BooleanField';
import { SelectField } from './SelectField';

export interface GridFieldColumn {
    key: string;
    label: string;
    width?: number | string;
    editable?: boolean;
    required?: boolean;
    placeholder?: string;
    type?: 'text' | 'number' | 'boolean' | "select";
    options?: { label: string; value: any }[];
    render?: (value: any, row: Record<string, any>) => React.ReactNode;
}

interface GridFieldProps extends Omit<BaseInputProps, 'value' | 'onChange'> {
    value?: Record<string, any>[];
    onChange?: (next: Record<string, any>[]) => void;
    columns: GridFieldColumn[];
    emptyholder?: string;
    maxItems?: number;
    allowDelete?: boolean;
    allowAdd?: boolean;
    getRowId?: (row: Record<string, any>, index: number) => string;
}

export const GridField: React.FC<GridFieldProps> = ({
    value = [],
    onChange,
    columns,
    size = 'medium',
    color,
    disabled,
    emptyholder,
    maxItems,
    allowDelete = true,
    allowAdd = true,
    getRowId = (_, index) => String(index),
    ...other
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const [editIndex, setEditIndex] = React.useState<number | null>(null);
    const [editValues, setEditValues] = React.useState<Record<string, any>>({});
    const [newValues, setNewValues] = React.useState<Record<string, any>>({});
    const inputAddRef = React.useRef<HTMLInputElement>(null);
    const inputRef = React.useRef<HTMLDivElement>(null);
    const tableRef = React.useRef<HTMLTableElement>(null);

    const rows = React.useMemo(() => value ?? [], [value]);
    const rowIds = React.useMemo(() => rows.map((row, index) => getRowId(row, index)), [rows, getRowId]);

    const [selected, setSelected, handleListKeyDown] = useKeyboardNavigation({
        getId: (id: string) => id,
        items: rowIds,
        onEnter: (id) => {
            if (editIndex !== null) return;
            const index = rowIds.indexOf(id);
            if (index >= 0) startEdit(index);
        },
        actions: [
            {
                shortcut: 'Delete',
                handler: (id) => {
                    if (id) {
                        const index = rowIds.indexOf(id);
                        if (index >= 0) removeItem(index);
                    }
                }
            }
        ]
    });

    const decorator = useInputDecorator();

    React.useEffect(() => {
        if (decorator && maxItems) {
            Promise.resolve().then(() => {
                decorator.setRestrictions([`${rows.length}/${maxItems}`]);
            });
        }
    }, [rows.length, decorator, maxItems]);

    const commit = (next: Record<string, any>[]) => {
        onChange?.(next);
    };

    const startEdit = (index: number) => {
        if (disabled) return;
        setEditIndex(index);
        setEditValues({ ...rows[index] });
    };

    const saveEdit = () => {
        if (editIndex === null) return;

        // Validate required fields
        const requiredColumns = columns.filter(col => col.required && col.editable);
        for (const col of requiredColumns) {
            const val = editValues[col.key];
            if (val === undefined || val === null || String(val).trim() === '') {
                return;
            }
        }

        const next = [...rows];
        next[editIndex] = { ...editValues };
        commit(next);
        cancelEdit();
        setSelected(getRowId(next[editIndex], editIndex));
    };

    const cancelEdit = () => {
        setEditIndex(null);
        setEditValues({});
        inputAddRef.current?.focus();
    };

    const removeItem = (index: number) => {
        if (allowDelete === false) return;
        const next = rows.filter((_, i) => i !== index);
        commit(next);
        if (editIndex === index) cancelEdit();
    };

    const canAdd = () => {
        if (maxItems !== undefined && rows.length >= maxItems) return false;

        // Check required fields
        const requiredColumns = columns.filter(col => col.required && col.editable);
        for (const col of requiredColumns) {
            const val = newValues[col.key];
            if (val === undefined || val === null || String(val).trim() === '') {
                return false;
            }
        }
        return true;
    };

    const canSaveEdit = () => {
        if (editIndex === null) return false;

        // Check required fields
        const requiredColumns = columns.filter(col => col.required && col.editable);
        for (const col of requiredColumns) {
            const val = editValues[col.key];
            if (val === undefined || val === null || String(val).trim() === '') {
                return false;
            }
        }
        return true;
    };

    const addItem = () => {
        if (!canAdd()) return;
        const newRow = { ...newValues };
        commit([...rows, newRow]);
        setNewValues({});
        setSelected(getRowId(newRow, rows.length));
        inputAddRef.current?.focus();
    };

    const handleNewKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        const hasValues = Object.values(newValues).some(v => v !== undefined && v !== null && String(v).trim() !== '');
        if (hasValues) {
            if (e.key === 'Enter' && canAdd()) {
                e.preventDefault();
                addItem();
            } else if (e.key === 'Escape') {
                setNewValues({});
            }
        } else {
            handleListKeyDown(e);
        }
    };

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        }
    };

    const actions: Actions<{}> = {
        cmAdd: {
            id: 'cmAdd',
            label: t('add-item', 'Add Item'),
            icon: theme.icons.Add,
            keySequence: ['Enter'],
            run: () => {
                if (canAdd()) {
                    addItem();
                }
            },
            disabled: () => disabled || !canAdd(),
        },
        cmEdit: {
            id: 'cmEdit',
            label: t('edit-item', 'Edit Item'),
            icon: theme.icons.EditableEditor,
            keySequence: ['Enter'],
            run: (_, index) => {
                if ((selected !== null || index !== undefined) && editIndex === null) {
                    const idx = index ?? (selected !== null ? rowIds.indexOf(selected) : -1);
                    if (idx >= 0) startEdit(idx);
                }
            },
            disabled: () => disabled || editIndex !== null,
        },
        cmRemove: {
            id: 'cmRemove',
            label: t('remove-item', 'Remove Item'),
            icon: theme.icons.Delete,
            keySequence: ['Delete'],
            run: (_, index) => {
                if (selected !== null || index !== undefined) {
                    const idx = index ?? (selected !== null ? rowIds.indexOf(selected) : -1);
                    if (idx >= 0) removeItem(idx);
                }
            },
            disabled: () => disabled ?? false,
        },
        cmSave: {
            id: 'cmSave',
            label: t('save-edit', 'Save Edit'),
            icon: theme.icons.Check,
            keySequence: ['Enter'],
            run: () => {
                saveEdit();
            },
            disabled: () => disabled || editIndex === null || !canSaveEdit(),
        },
        cmCancel: {
            id: 'cmCancel',
            label: t('cancel-edit', 'Cancel Edit'),
            icon: theme.icons.Close,
            keySequence: ['Escape'],
            run: () => {
                cancelEdit();
            },
            disabled: () => disabled || editIndex === null,
        },
    };

    const renderCell = (column: GridFieldColumn, row: Record<string, any>, isEditing: boolean, isNewRow: boolean) => {
        const value = isEditing ? (editValues[column.key] ?? row[column.key] ?? '') : (isNewRow ? (newValues[column.key] ?? '') : (row[column.key] ?? ''));

        // Editable field in edit mode or new row
        if ((isEditing || isNewRow) && column.editable) {
            if ((column.type ?? "text") === "text") {
                return (
                    <InputDecorator indicator={false} disableBlink>
                        <TextField
                            autoFocus={isEditing && column === columns.find(c => c.editable)}
                            size={size}
                            placeholder={column.placeholder ?? column.label}
                            value={value}
                            disabled={disabled}
                            onChange={(newVal) => {
                                if (isEditing) {
                                    setEditValues({ ...editValues, [column.key]: newVal });
                                } else {
                                    setNewValues({ ...newValues, [column.key]: newVal });
                                }
                            }}
                            onKeyDown={isEditing ? handleEditKeyDown : handleNewKeyDown}
                            dense
                        />
                    </InputDecorator>
                );
            } else if (column.type === "number") {
                return (
                    <InputDecorator indicator={false} disableBlink>
                        <NumberField
                            autoFocus={isEditing && column === columns.find(c => c.editable)}
                            size={size}
                            placeholder={column.placeholder ?? column.label}
                            value={value}
                            disabled={disabled}
                            onChange={(newVal) => {
                                if (isEditing) {
                                    setEditValues({ ...editValues, [column.key]: newVal });
                                } else {
                                    setNewValues({ ...newValues, [column.key]: newVal });
                                }
                            }}
                            onKeyDown={isEditing ? handleEditKeyDown : handleNewKeyDown}
                            dense
                        />
                    </InputDecorator>
                );
            } else if (column.type === "select") {
                return (
                    <InputDecorator indicator={false} disableBlink>
                        <SelectField
                            autoFocus={isEditing && column === columns.find(c => c.editable)}
                            size={size}
                            value={value}
                            disabled={disabled}
                            onChange={(newVal) => {
                                if (isEditing) {
                                    setEditValues({ ...editValues, [column.key]: newVal });
                                } else {
                                    setNewValues({ ...newValues, [column.key]: newVal });
                                }
                            }}
                            onKeyDown={isEditing ? handleEditKeyDown : handleNewKeyDown}
                            dense
                            options={column.options ?? []}
                        />
                    </InputDecorator>
                );
            }
        }

        // Non-editable field in edit mode - show current value
        if (isEditing && !column.editable) {
            if (column.render) {
                return column.render(value, row);
            }
            return (
                <Ellipsis style={{ display: 'block' }}>
                    {String(value)}
                </Ellipsis>
            );
        }

        // Non-editable field in new row - show placeholder
        if (isNewRow && !column.editable) {
            return (
                <Box sx={{
                    opacity: 0.5,
                    fontStyle: 'italic'
                }}>
                    <Ellipsis style={{ display: 'block' }}>-</Ellipsis>
                </Box>
            );
        }

        // Normal display mode
        if (column.render) {
            return column.render(value, row);
        }

        return (
            <Ellipsis style={{ display: 'block' }}>
                {String(value)}
            </Ellipsis>
        );
    };

    const cellSizeMap = {
        small: { padding: '2px 2px', fontSize: "inherit" },
        medium: { padding: '4px 4px', fontSize: "inherit" },
        large: { padding: '8px 8px', fontSize: "inherit" }
    };

    const cellSize = cellSizeMap[size];

    return (
        <BaseInputField
            type="grid"
            size={size}
            color={color}
            disabled={disabled}
            value={value}
            onKeyDown={!allowAdd ? handleListKeyDown : undefined}
            onConvertToInput={value => JSON.stringify(value)}
            onConvertToValue={value => JSON.parse(value)}
            input={
                <Box
                    ref={inputRef}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        height: '100%',
                        cursor: 'default',
                        minHeight: 0,
                        overflow: 'auto',
                    }}
                    tabIndex={-1}
                >
                    <Table ref={tableRef} stickyHeader>
                        <TableHead>
                            <TableRow>
                                {columns.map((col) => (
                                    <TableCell
                                        key={col.key}
                                        sx={{
                                            width: col.width,
                                            fontWeight: 600,
                                            ...cellSize
                                        }}
                                    >
                                        {col.label}
                                    </TableCell>
                                ))}
                                <TableCell sx={{ /*width: size === 'small' ? 96 : 128,*/ ...cellSize }}>
                                    {t('actions', 'Actions')}
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.length === 0 && !allowAdd && (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length + 1}
                                        align="center"
                                        sx={{
                                            fontStyle: 'italic',
                                            opacity: 0.6,
                                            ...cellSize
                                        }}
                                    >
                                        {emptyholder ?? t('no-items', 'No items')}
                                    </TableCell>
                                </TableRow>
                            )}
                            {rows.map((row, index) => {
                                const id = rowIds[index];
                                const isEditing = editIndex === index;
                                const isSelected = selected === id && !Object.values(newValues).some(v => v !== undefined && v !== null && String(v).trim() !== '');

                                return (
                                    <TableRow
                                        key={id}
                                        id={`item-${id}`}
                                        selected={isSelected}
                                        hover={!isEditing}
                                        onClick={() => !isEditing && setSelected(id)}
                                        onDoubleClick={() => !isEditing && startEdit(index)}
                                        sx={{
                                            cursor: isEditing ? 'default' : 'pointer',
                                            '& .IconButton-root': {
                                                visibility: 'hidden',
                                            },
                                            '&.Mui-selected .IconButton-root, &:hover .IconButton-root': {
                                                visibility: 'visible',
                                            }
                                        }}
                                    >
                                        {columns.map((col) => (
                                            <TableCell key={col.key} sx={{ width: col.width, ...cellSize }}>
                                                {renderCell(col, row, isEditing, false)}
                                            </TableCell>
                                        ))}
                                        <TableCell sx={{ /*width: size === 'small' ? 96 : 128,*/ ...cellSize }}>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                {isEditing ? (
                                                    <>
                                                        <IconButton
                                                            size={size}
                                                            color="success"
                                                            action={actions.cmSave}
                                                            dense
                                                        />
                                                        <IconButton
                                                            size={size}
                                                            color="warning"
                                                            action={actions.cmCancel}
                                                            dense
                                                        />
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconButton
                                                            size={size}
                                                            color="primary"
                                                            action={actions.cmEdit}
                                                            actionArgs={[index]}
                                                            dense
                                                        />
                                                        {allowDelete && (
                                                            <IconButton
                                                                size={size}
                                                                color="error"
                                                                action={actions.cmRemove}
                                                                actionArgs={[index]}
                                                                dense
                                                            />
                                                        )}
                                                    </>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                        {allowAdd && (
                            <TableFooter>
                                <TableRow sx={{ position: 'sticky', bottom: 0, backgroundColor: theme.palette.background.paper }}>
                                    {columns.map((col) => (
                                        <TableCell key={col.key} sx={{ width: col.width, ...cellSize }}>
                                            {renderCell(col, {}, false, true)}
                                        </TableCell>
                                    ))}
                                    <TableCell sx={{ /*width: size === 'small' ? 96 : 128,*/ ...cellSize }}>
                                        <IconButton
                                            //ref={inputAddRef}
                                            size={size}
                                            color="success"
                                            action={actions.cmAdd}
                                            dense
                                        />
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>
                </Box>
            }
            height={"auto"}
            {...other}
        />
    );
};

GridField.displayName = 'GridField';