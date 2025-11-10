import React from 'react';
import { useTheme, Box } from '@mui/material';
import { BaseInputProps } from './base/BaseInputProps';
import { BaseInputField } from './base/BaseInputField';
import { BaseList } from './base/BaseList';
import { TextField } from './TextField';
import { IconButton } from '../buttons/IconButton';
import { useKeyboardNavigation } from '@renderer/hooks/useKeyboardNavigation';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { useScrollIntoView } from '@renderer/hooks/useScrollIntoView';

interface ListFieldProps extends Omit<BaseInputProps, 'value' | 'onChange'> {
    value?: string[];
    onChange?: (next: string[]) => void;
    placeholder?: string;
    emptyholder?: string;
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
    const listRef = React.useRef<HTMLUListElement>(null);
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
    const decorator = useInputDecorator();

    const items = value ?? [];

    React.useEffect(() => {
        if (decorator && maxItems) {
            Promise.resolve().then(() => {
                decorator.setRestrictions([`${(value ?? []).length}/${maxItems}`]);
            });
        }
    }, [items.length, decorator, maxItems]);

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
            if (e.key === 'Enter' && canAdd(newValue)) {
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

    useScrollIntoView({ containerRef: listRef, targetId: `item-${selected}` });

    return (
        <BaseInputField
            type="list"
            size={size}
            color={color}
            disabled={disabled}
            value={items}
            onKeyDown={!allowAdd ? handleListKeyDown : undefined}
            input={
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        height: '100%',
                        cursor: 'default',
                        gap: 4,
                        minHeight: 0,
                    }}
                    tabIndex={-1}
                >
                    <BaseList
                        ref={listRef}
                        items={items}
                        size={size}
                        color={color}
                        disabled={disabled}
                        isSelected={(_, index) => newValue.trim() === '' && index === selected}
                        getItemId={(_, index) => `item-${index}`}
                        //isFocused={item => newValue.trim() === '' && item === selected}
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
                                        minHeight: 0,
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
                                                //onBlur={cancelEdit}
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
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                flexShrink: 0,
                            }}
                        >
                            <TextField
                                size={size}
                                placeholder={placeholder}
                                value={newValue}
                                onChange={setNewValue}
                                onKeyDown={handleNewKeyDown}
                                disabled={
                                    disabled
                                    //|| (maxItems !== undefined && items.length >= maxItems)
                                }
                                inputRef={inputAddRef}
                            />
                            <IconButton
                                size={size}
                                color="success"
                                onClick={addItem}
                                disabled={
                                    disabled ||
                                    !canAdd(newValue)
                                    //|| (maxItems !== undefined && items.length >= maxItems)
                                }
                                aria-label="add"
                            >
                                <theme.icons.Add />
                            </IconButton>
                        </div>
                    )}
                </div>
            }
            height={"auto"}
            {...other}
        />
    );
};

ListField.displayName = 'ListField';