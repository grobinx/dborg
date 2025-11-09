import React from 'react';
import { useTheme, Box } from '@mui/material';
import { BaseInputProps } from './base/BaseInputProps';
import { BaseInputField } from './base/BaseInputField';
import { BaseList } from './base/BaseList';
import { TextField } from './TextField';
import { IconButton } from '../buttons/IconButton';
import { useKeyboardNavigation } from '@renderer/hooks/useKeyboardNavigation';

interface ListFieldProps extends Omit<BaseInputProps, 'value' | 'onChange'> {
    value?: string[];
    onChange?: (next: string[]) => void;
    placeholder?: string;
    emptyholder?: string;
    listHeight?: number;
    maxItems?: number;
    allowDuplicates?: boolean;
    allowDelete?: boolean;
    allowAdd?: boolean;
}

export const ListField: React.FC<ListFieldProps> = ({
    value = [],
    onChange,
    size,
    color,
    disabled,
    placeholder,
    emptyholder,
    listHeight = 260,
    maxItems,
    allowDuplicates = false,
    allowDelete = true,
    allowAdd = true,
    ...other
}) => {
    const theme = useTheme();

    const [editIndex, setEditIndex] = React.useState<number | null>(null);
    const [editValue, setEditValue] = React.useState('');
    const [newValue, setNewValue] = React.useState('');
    const listRef = React.useRef<HTMLDivElement>(null);
    const inputAddRef = React.useRef<HTMLInputElement>(null);
    const [selected, setSelected, handleListKeyDown] = useKeyboardNavigation({
        getId: (item: number) => item,
        items: React.useMemo(() => value.map((_, index) => index), [value]),
        onEnter: (item) => {
            if (editIndex !== null) return;
            startEdit(item);
        },
        actions: [
            {
                shortcut: 'Delete', handler: (item) => {
                    if (item !== -1) removeItem(item);
                }
            }
        ]
    });

    const items = value ?? [];

    const commit = (next: string[]) => {
        onChange?.(next);
    };

    const startEdit = (idx: number) => {
        if (disabled) return;
        setEditIndex(idx);
        setEditValue(items[idx] ?? '');
    };

    const saveEdit = () => {
        if (editIndex === null) return;
        const v = editValue.trim();
        if (!v) {
            // empty -> remove
            removeItem(editIndex);
            cancelEdit();
            return;
        }
        if (!allowDuplicates) {
            const dup = items.findIndex((x, i) => x === v && i !== editIndex);
            if (dup !== -1) {
                cancelEdit();
                return;
            }
        }
        const next = [...items];
        next[editIndex] = v;
        commit(next);
        cancelEdit();
    };

    const cancelEdit = () => {
        setEditIndex(null);
        setEditValue('');
        inputAddRef.current?.focus();
    };

    const removeItem = (idx: number) => {
        if (allowDelete === false) return;
        const next = items.filter((_, i) => i !== idx);
        commit(next);
        if (editIndex === idx) cancelEdit();
    };

    const canAdd = (v: string) => {
        const t = v.trim();
        if (!t) return false;
        if (maxItems !== undefined && items.length >= maxItems) return false;
        if (!allowDuplicates && items.includes(t)) return false;
        return true;
    };

    const addItem = () => {
        const t = newValue.trim();
        if (!canAdd(t)) return;
        commit([...(items ?? []), t]);
        setNewValue('');
        setSelected(items.length);
    };

    const handleNewKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        if (newValue.trim() !== '') {
            if (e.key === 'Enter') {
                e.preventDefault();
                addItem();
            } else if (e.key === 'Escape') {
                setNewValue('');
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

    return (
        <BaseInputField
            ref={listRef}
            type="list"
            size={size}
            color={color}
            disabled={disabled}
            value={items}
            onKeyDown={!allowAdd ? handleListKeyDown : undefined}
            input={
                <div style={{ width: '100%', cursor: 'default' }} tabIndex={-1}>
                    <BaseList
                        items={items}
                        size={size}
                        color={color}
                        disabled={disabled}
                        isSelected={(_, index) => newValue.trim() === '' && index === selected}
                        //isFocused={item => newValue.trim() === '' && item === selected}
                        style={{
                            maxHeight: listHeight,
                        }}
                        renderEmpty={() => (
                            emptyholder ?? 'Empty list'
                        )}
                        renderItem={(item) => {
                            const idx = items.indexOf(item);
                            const isEditing = editIndex === idx;
                            return (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        width: '100%',
                                    }}
                                    onClick={() => setSelected(idx)}
                                    onDoubleClick={() => startEdit(idx)}
                                >
                                    {isEditing ? (
                                        <>
                                            <TextField
                                                autoFocus
                                                size={size}
                                                value={editValue}
                                                disabled={disabled}
                                                onChange={setEditValue}
                                                onBlur={saveEdit}
                                                onKeyDown={handleEditKeyDown}
                                                dense
                                            />
                                            <IconButton
                                                size={size}
                                                color="success"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={saveEdit}
                                                data-ignore-toggle
                                                aria-label="save"
                                                dense
                                            >
                                                <theme.icons.Check />
                                            </IconButton>
                                            <IconButton
                                                size={size}
                                                color="warning"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={cancelEdit}
                                                data-ignore-toggle
                                                aria-label="cancel"
                                                dense
                                            >
                                                <theme.icons.Close />
                                            </IconButton>
                                        </>
                                    ) : (
                                        <>
                                            <span
                                                style={{
                                                    flex: 1,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {item}
                                            </span>
                                            <IconButton
                                                size={size}
                                                color="primary"
                                                onClick={() => startEdit(idx)}
                                                disabled={disabled}
                                                data-ignore-toggle
                                                aria-label="edit"
                                                dense
                                            >
                                                <theme.icons.EditableEditor />
                                            </IconButton>
                                            {allowDelete && ( // Conditionally render the delete button
                                                <IconButton
                                                    size={size}
                                                    color="error"
                                                    onClick={() => removeItem(idx)}
                                                    disabled={disabled}
                                                    data-ignore-toggle
                                                    aria-label="remove"
                                                    dense
                                                >
                                                    <theme.icons.Delete />
                                                </IconButton>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        }}
                    />

                    {/* Footer: dodawanie nowego elementu */}
                    {allowAdd && (
                        <Box
                            sx={{
                                mt: 4,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            <TextField
                                size={size}
                                placeholder={placeholder}
                                value={newValue}
                                onChange={setNewValue}
                                onKeyDown={handleNewKeyDown}
                                disabled={
                                    disabled ||
                                    (maxItems !== undefined && items.length >= maxItems)
                                }
                                inputRef={inputAddRef}
                            />
                            <IconButton
                                size={size}
                                color="success"
                                onClick={addItem}
                                disabled={
                                    disabled ||
                                    !canAdd(newValue) ||
                                    (maxItems !== undefined && items.length >= maxItems)
                                }
                                aria-label="add"
                            >
                                <theme.icons.Add />
                            </IconButton>
                        </Box>
                    )}
                </div>
            }
            height={"auto"}
            {...other}
        />
    );
};

ListField.displayName = 'ListField';