import React from 'react';
import { Box, useTheme } from '@mui/material';
import { BaseInputProps } from './base/BaseInputProps';
import { BaseInputField } from './base/BaseInputField';
import { BaseList } from './base/BaseList';
import { TextField } from './TextField';
import { IconButton } from '../buttons/IconButton';
import { useKeyboardNavigation } from '@renderer/hooks/useKeyboardNavigation';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { useScrollIntoView } from '@renderer/hooks/useScrollIntoView';
import { listItemSizeProperties } from '@renderer/themes/layouts/default/consts';

interface PropertyFieldProps extends Omit<BaseInputProps, 'value' | 'onChange'> {
    value?: Record<string, any>;
    onChange?: (next: Record<string, any>) => void;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    emptyholder?: string;
    maxItems?: number;
    allowDelete?: boolean;
    allowAdd?: boolean;
    allowEditPropertyName?: boolean;
}

export const PropertyField: React.FC<PropertyFieldProps> = ({
    value = {},
    onChange,
    size,
    color,
    disabled,
    keyPlaceholder = 'Add property...',
    valuePlaceholder = 'Set value...',
    emptyholder,
    maxItems,
    allowDelete = true,
    allowAdd = true,
    allowEditPropertyName = true,
    ...other
}) => {
    const theme = useTheme();

    const [editKey, setEditKey] = React.useState<string | null>(null);
    const [editNewKey, setEditNewKey] = React.useState('');
    const [editValue, setEditValue] = React.useState('');
    const [newKey, setNewKey] = React.useState('');
    const [newValue, setNewValue] = React.useState('');
    const listRef = React.useRef<HTMLUListElement>(null);
    const inputAddKeyRef = React.useRef<HTMLInputElement>(null);
    const inputRef = React.useRef<HTMLDivElement>(null);
    
    const keys = React.useMemo(() => Object.keys(value ?? {}), [value]).sort();
    
    const [selected, setSelected, handleListKeyDown] = useKeyboardNavigation({
        getId: (key: string) => key,
        items: keys,
        onEnter: (key) => {
            if (editKey !== null) return;
            startEdit(key);
        },
        actions: [
            {
                shortcut: 'Delete',
                handler: (key) => {
                    if (key) removeItem(key);
                }
            }
        ]
    });
    const decorator = useInputDecorator();

    React.useEffect(() => {
        if (decorator && maxItems) {
            Promise.resolve().then(() => {
                decorator.setRestrictions([`${keys.length}/${maxItems}`]);
            });
        }
    }, [keys.length, decorator, maxItems]);

    const commit = (next: Record<string, any>) => {
        onChange?.(next);
    };

    const startEdit = (key: string) => {
        if (disabled) return;
        setEditKey(key);
        setEditNewKey(key);
        setEditValue(String(value[key] ?? ''));
    };

    const saveEdit = () => {
        if (editKey === null) return;
        const k = allowEditPropertyName ? editNewKey.trim() : editKey;
        const v = editValue.trim();
        
        if (!k) {
            // empty key -> remove
            removeItem(editKey);
            cancelEdit();
            return;
        }

        // Check if key changed and new key already exists
        if (allowEditPropertyName && editKey !== k && value.hasOwnProperty(k)) {
            cancelEdit();
            return;
        }

        const next = { ...value };
        
        // If key changed and editing is allowed, remove old key
        if (allowEditPropertyName && editKey !== k) {
            delete next[editKey];
        }
        
        next[k] = v;
        commit(next);
        cancelEdit();
        setSelected(k);
    };

    const cancelEdit = () => {
        setEditKey(null);
        setEditNewKey('');
        setEditValue('');
        inputAddKeyRef.current?.focus();
    };

    const removeItem = (key: string) => {
        if (allowDelete === false) return;
        const next = { ...value };
        delete next[key];
        commit(next);
        if (editKey === key) cancelEdit();
    };

    const canAdd = () => {
        const k = newKey.trim();
        if (!k) return false;
        if (maxItems !== undefined && keys.length >= maxItems) return false;
        if (value.hasOwnProperty(k)) return false;
        return true;
    };

    const addItem = () => {
        if (!canAdd()) return;
        const k = newKey.trim();
        const v = newValue.trim();
        commit({ ...value, [k]: v });
        setNewKey('');
        setNewValue('');
        setSelected(k);
        inputAddKeyRef.current?.focus();
    };

    const handleNewKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        if (newKey.trim() !== '' || newValue.trim() !== '') {
            if (e.key === 'Enter' && canAdd()) {
                e.preventDefault();
                addItem();
            } else if (e.key === 'Escape') {
                setNewKey('');
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

    useScrollIntoView({ containerRef: listRef, targetId: selected ? `item-${selected}` : undefined });

    return (
        <BaseInputField
            type="property"
            size={size}
            color={color}
            disabled={disabled}
            value={value}
            onKeyDown={!allowAdd ? handleListKeyDown : undefined}
            input={
                <Box
                    ref={inputRef}
                    sx={{
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
                        items={keys}
                        size={size}
                        color={color}
                        disabled={disabled}
                        isSelected={(key) => newKey.trim() === '' && newValue.trim() === '' && key === selected}
                        getItemId={(key) => `item-${key}`}
                        renderEmpty={() => emptyholder ?? 'Empty properties'}
                        renderItem={(key) => {
                            const isEditing = editKey === key;
                            return (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        width: '100%',
                                        height: '100%',
                                        padding: listItemSizeProperties[size || 'medium'].padding,
                                        minHeight: 0,
                                        '& .IconButton-root': {
                                            visibility: 'hidden',
                                            '.selected &': {
                                                visibility: 'visible',
                                            }
                                        },
                                        '&:hover': {
                                            '& .IconButton-root': {
                                                visibility: 'visible',
                                            }
                                        }
                                    }}
                                    onClick={() => setSelected(key)}
                                    onDoubleClick={() => startEdit(key)}
                                >
                                    {isEditing ? (
                                        <>
                                            {allowEditPropertyName ? (
                                                <TextField
                                                    autoFocus
                                                    size={size}
                                                    placeholder={keyPlaceholder}
                                                    value={editNewKey}
                                                    disabled={disabled}
                                                    onChange={setEditNewKey}
                                                    onKeyDown={handleEditKeyDown}
                                                    dense
                                                    style={{ flex: 1 }}
                                                />
                                            ) : (
                                                <span
                                                    style={{
                                                        flex: 1,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    {key}
                                                </span>
                                            )}
                                            <TextField
                                                autoFocus={!allowEditPropertyName}
                                                size={size}
                                                placeholder={valuePlaceholder}
                                                value={editValue}
                                                disabled={disabled}
                                                onChange={setEditValue}
                                                //onBlur={cancelEdit}
                                                onKeyDown={handleEditKeyDown}
                                                dense
                                                style={{ flex: 1 }}
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
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {key}
                                            </span>
                                            <span
                                                style={{
                                                    flex: 1,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {String(value[key])}
                                            </span>
                                            <IconButton
                                                size={size}
                                                color="primary"
                                                onClick={() => startEdit(key)}
                                                disabled={disabled}
                                                data-ignore-toggle
                                                aria-label="edit"
                                                dense
                                            >
                                                <theme.icons.EditableEditor />
                                            </IconButton>
                                            {allowDelete && (
                                                <IconButton
                                                    size={size}
                                                    color="error"
                                                    onClick={() => removeItem(key)}
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
                                </Box>
                            );
                        }}
                    />

                    {allowAdd && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                flexShrink: 0,
                            }}
                        >
                            <TextField
                                size={size}
                                placeholder={keyPlaceholder}
                                value={newKey}
                                onChange={setNewKey}
                                onKeyDown={handleNewKeyDown}
                                disabled={disabled}
                                inputRef={inputAddKeyRef}
                                style={{ flex: 1 }}
                            />
                            <TextField
                                size={size}
                                placeholder={valuePlaceholder}
                                value={newValue}
                                onChange={setNewValue}
                                onKeyDown={handleNewKeyDown}
                                disabled={disabled}
                                style={{ flex: 1 }}
                            />
                            <IconButton
                                size={size}
                                color="success"
                                onClick={addItem}
                                disabled={disabled || !canAdd()}
                                aria-label="add"
                            >
                                <theme.icons.Add />
                            </IconButton>
                        </Box>
                    )}
                </Box>
            }
            height={"auto"}
            {...other}
        />
    );
};

PropertyField.displayName = 'PropertyField';