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
import { Ellipsis } from '../useful/Elipsis';
import { Actions } from '../CommandPalette/ActionManager';
import { useTranslation } from 'react-i18next';
import { InputDecorator } from './decorators/InputDecorator';

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
    const { t } = useTranslation();

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

    const canSaveEdit = () => {
        if (editKey === null) return false;
        const k = allowEditPropertyName ? editNewKey.trim() : editKey;
        if (!k) return true;
        if (maxItems !== undefined && keys.length >= maxItems) return false;
        if (value.hasOwnProperty(k) && editKey !== k) return false;
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

    // AKCJE jak w ListField
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
            run: (_, key) => {
                if ((selected !== null || key !== undefined) && editKey === null) {
                    startEdit(key ?? selected);
                }
            },
            disabled: () => disabled || editKey !== null,
        },
        cmRemove: {
            id: 'cmRemove',
            label: t('remove-item', 'Remove Item'),
            icon: theme.icons.Delete,
            keySequence: ['Delete'],
            run: (_, key) => {
                if (selected !== null || key !== undefined) {
                    removeItem(key ?? selected);
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
            disabled: () => disabled || editKey === null || !canSaveEdit(),
        },
        cmCancel: {
            id: 'cmCancel',
            label: t('cancel-edit', 'Cancel Edit'),
            icon: theme.icons.Close,
            keySequence: ['Escape'],
            run: () => {
                cancelEdit();
            },
            disabled: () => disabled || editKey === null,
        },
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
                                                <InputDecorator indicator={false} disableBlink>
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
                                                </InputDecorator>
                                            ) : (
                                                <Ellipsis flex style={{ fontWeight: 500 }}>
                                                    {key}
                                                </Ellipsis>
                                            )}
                                            <InputDecorator indicator={false} disableBlink>
                                                <TextField
                                                    autoFocus={!allowEditPropertyName}
                                                    size={size}
                                                    placeholder={valuePlaceholder}
                                                    value={editValue}
                                                    disabled={disabled}
                                                    onChange={setEditValue}
                                                    onKeyDown={handleEditKeyDown}
                                                    dense
                                                    style={{ flex: 1 }}
                                                />
                                            </InputDecorator>
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
                                            <Ellipsis flex style={{ fontWeight: 500 }}>
                                                {key}
                                            </Ellipsis>
                                            <Ellipsis flex>
                                                {String(value[key])}
                                            </Ellipsis>
                                            <IconButton
                                                size={size}
                                                color="primary"
                                                action={actions.cmEdit}
                                                actionArgs={[key]}
                                                dense
                                            />
                                            {allowDelete && (
                                                <IconButton
                                                    size={size}
                                                    color="error"
                                                    action={actions.cmRemove}
                                                    actionArgs={[key]}
                                                    dense
                                                />
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
                            <InputDecorator indicator={false} disableBlink>
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
                            </InputDecorator>
                            <InputDecorator indicator={false} disableBlink>
                                <TextField
                                    size={size}
                                    placeholder={valuePlaceholder}
                                    value={newValue}
                                    onChange={setNewValue}
                                    onKeyDown={handleNewKeyDown}
                                    disabled={disabled}
                                    style={{ flex: 1 }}
                                />
                            </InputDecorator>
                            <IconButton
                                size={size}
                                color="success"
                                action={actions.cmAdd}
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