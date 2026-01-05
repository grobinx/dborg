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
import { listItemSizeProperties } from '@renderer/themes/layouts/default/consts';
import { Actions } from '../CommandPalette/ActionManager';
import { useTranslation } from 'react-i18next';
import { Ellipsis } from '../useful/Elipsis';
import { InputDecorator } from './decorators/InputDecorator';

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
    const { t } = useTranslation();

    const actions: Actions<{}> = {
        cmAdd: {
            id: 'cmAdd',
            label: t('add-item', 'Add Item'),
            icon: theme.icons.Add,
            keySequence: ['Enter'],
            run: () => {
                if (canAdd(newValue)) {
                    addItem();
                }
            },
            disabled: () => disabled || !canAdd(newValue),
        },
        cmEdit: {
            id: 'cmEdit',
            label: t('edit-item', 'Edit Item'),
            icon: theme.icons.EditableEditor,
            keySequence: ['Enter'],
            run: (_, index) => {
                if ((selected !== null || index !== undefined) && editIndex === null) {
                    startEdit(index ?? selected);
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
                    removeItem(index ?? selected);
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
            disabled: () => disabled || editIndex === null || !canSaveEdit(editValue),
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
    }

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

    const canSaveEdit = (v: string) => {
        const t = v.trim();
        if (!t) return false;
        if (!allowDuplicates) {
            const dup = items.findIndex((x, i) => x === t && i !== editIndex);
            if (dup !== -1) return false;
        }
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

    useScrollIntoView({ containerRef: listRef, targetId: selected !== null ? `item-${selected}` : undefined });

    return (
        <BaseInputField
            type="list"
            size={size}
            color={color}
            disabled={disabled}
            value={items}
            onKeyDown={!allowAdd ? handleListKeyDown : undefined}
            onConvertToInput={value => JSON.stringify(value)}
            onConvertToValue={value => JSON.parse(value)}
            input={
                <Box
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
                        items={items}
                        size={size}
                        color={color}
                        disabled={disabled}
                        isSelected={(_, index) => newValue.trim() === '' && index === selected}
                        getItemId={(_, index) => `item-${index}`}
                        //isFocused={item => newValue.trim() === '' && item === selected}
                        renderEmpty={() => (
                            emptyholder ?? t('empty-list', 'Empty list')
                        )}
                        renderItem={(item) => {
                            const idx = items.indexOf(item);
                            const isEditing = editIndex === idx;
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
                                    onClick={() => setSelected(idx)}
                                    onDoubleClick={() => startEdit(idx)}
                                >
                                    {isEditing ? (
                                        <>
                                            <InputDecorator indicator={false} disableBlink>
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
                                            <Ellipsis flex>
                                                {item}
                                            </Ellipsis>
                                            <IconButton
                                                size={size}
                                                color="primary"
                                                action={actions.cmEdit}
                                                actionArgs={[idx]}
                                                dense
                                            />
                                            {allowDelete && ( // Conditionally render the delete button
                                                <IconButton
                                                    size={size}
                                                    color="error"
                                                    action={actions.cmRemove}
                                                    actionArgs={[idx]}
                                                    dense
                                                />
                                            )}
                                        </>
                                    )}
                                </Box>
                            );
                        }}
                    />

                    {/* Footer: dodawanie nowego elementu */}
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
                                    placeholder={placeholder ?? t('add-new-item', 'Add new item...')}
                                    value={newValue}
                                    onChange={setNewValue}
                                    onKeyDown={handleNewKeyDown}
                                    disabled={
                                        disabled
                                        //|| (maxItems !== undefined && items.length >= maxItems)
                                    }
                                    inputRef={inputAddRef}
                                />
                            </InputDecorator>
                            <IconButton
                                size={size}
                                color="success"
                                action={actions.cmAdd}
                            />
                        </Box>
                    )}
                </Box>
            }
            height={"auto"}
            {...other}
        />
    );
};

ListField.displayName = 'ListField';