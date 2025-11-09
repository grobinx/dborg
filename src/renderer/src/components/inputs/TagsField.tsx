import React from "react";
import { BaseInputProps } from "./base/BaseInputProps";
import { Adornment, BaseInputField } from "./base/BaseInputField";
import { Chip, Stack, useTheme, Zoom, List, ListItemButton, ListItemText, Paper, Popper, ClickAwayListener } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { IconButton } from "../buttons/IconButton";
import clsx from "@renderer/utils/clsx";
import { useInputDecorator } from "./decorators/InputDecoratorContext";
import { Popover } from "../Popover";
import { denseSizes, Size } from "@renderer/types/sizes";

export interface TagsFieldProps extends Omit<BaseInputProps<string>, "onChange" | "value" | "defaultValue"> {
    value?: string[];
    defaultValue?: string[];
    onChange?: (tags: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    showTags?: boolean;
    maxTags?: number;
    /**
     * An optional ID to uniquely identify the component for storing tag history in localStorage.
     */
    storeId?: string;
}

export const TagsField: React.FC<TagsFieldProps> = ({
    storeId,
    value: controlledValue,
    defaultValue,
    onChange,
    disabled,
    inputProps,
    size = "medium",
    color = "main",
    showTags = true,
    maxTags,
    dense,
    ...other
}) => {
    const theme = useTheme();
    const decorator = useInputDecorator();
    const [uncontrolledTags, setUncontrolledTags] = React.useState<string[]>(defaultValue ?? []);
    const tags = controlledValue !== undefined ? controlledValue : uncontrolledTags;
    const [inputValue, setInputValue] = React.useState("");
    const canAddMore = !maxTags || tags.length < maxTags;
    const [storedList, setStoredList] = React.useState<string[]>(() => {
        if (!storeId) {
            return [];
        }
        const stored = localStorage.getItem(`tagsFieldHistory-${storeId}`);
        return stored ? JSON.parse(stored) : [];
    });
    const inputRef = React.useRef<HTMLDivElement>(null);
    const [listOpen, setListOpen] = React.useState(false);
    const [listSelectedIndex, setListSelectedIndex] = React.useState(-1);

    const handleClose = () => {
        setListOpen(false);
    };

    React.useEffect(() => {
        if (decorator && maxTags) {
            Promise.resolve().then(() => {
                decorator.setRestrictions([`${(tags ?? []).length}/${maxTags}`]);
            });
        }
    }, [(tags ?? []).length, decorator, maxTags]);

    const handleAddTag = React.useCallback((tag?: string) => {
        const newTag = (tag ?? inputValue).trim();
        if (!newTag || tags.includes(newTag) || !canAddMore) {
            return;
        }
        const newTags = [...tags, newTag];
        if (onChange) {
            onChange(newTags);
        }
        if (controlledValue === undefined) {
            setUncontrolledTags(newTags);
        }
        if (!storedList.includes(newTag) && storeId) {
            const newStoredList = [...storedList, newTag];
            setStoredList(newStoredList);
            localStorage.setItem(`tagsFieldHistory-${storeId}`, JSON.stringify(newStoredList));
        }
        setInputValue("");
    }, [inputValue, tags, onChange, controlledValue, canAddMore]);

    const handleRemoveTag = (tagToRemove: string) => {
        const newTags = tags.filter(tag => tag !== tagToRemove);
        if (onChange) {
            onChange(newTags);
        }
        if (controlledValue === undefined) {
            setUncontrolledTags(newTags);
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === "Enter" || e.key === ",") && canAddMore) {
            e.preventDefault();
            if (listOpen && listSelectedIndex >= 0 && listSelectedIndex < filteredSuggestions.length) {
                handleAddTag(filteredSuggestions[listSelectedIndex]);
            } else {
                handleAddTag();
            }
        }
        if (e.key === "Backspace" && !inputValue && tags.length > 0) {
            handleRemoveTag(tags[tags.length - 1]);
        }
        if (listOpen) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setListSelectedIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setListSelectedIndex(prev => Math.max(prev - 1, 0));
            }
            if (e.key === "Escape") {
                e.preventDefault();
                handleClose();
            }
        }
    };

    // Filtrowanie storedList wg wpisywanego tekstu i nie dodanych tagów
    const filteredSuggestions = React.useMemo(() => {
        return inputValue
            ? storedList.filter(
                tag =>
                    tag.toLowerCase().includes(inputValue.toLowerCase()) &&
                    !tags.includes(tag)
            ) : [];
    }, [inputValue, storedList, tags]);

    React.useEffect(() => {
        setListOpen(filteredSuggestions.length > 0);
        setListSelectedIndex(filteredSuggestions.length > 0 ? 0 : -1);
    }, [filteredSuggestions.length]);

    return (
        <BaseInputField
            ref={inputRef}
            type="tags"
            value={inputValue}
            size={size}
            color={color}
            adornments={[
                (tags ?? []).length > 0 && showTags && (
                    <Adornment
                        key="tags"
                        position="below"
                        className={clsx(
                            "tags-container",
                            `size-${size}`,
                            disabled && "disabled",
                            `color-${color}`
                        )}
                    >
                        {tags.map(tag => (
                            <Chip
                                key={tag}
                                label={tag}
                                onDelete={disabled ? undefined : () => handleRemoveTag(tag)}
                                disabled={disabled}
                                size="small"
                            />
                        ))}
                    </Adornment>
                ),
                <Adornment position="end" key="add">
                    <IconButton
                        size={dense && size !== "default" ? denseSizes[size as Size] : size}
                        color="main"
                        dense
                        onClick={() => handleAddTag()}
                        disabled={
                            disabled ||
                            !inputValue.trim() ||
                            tags.includes(inputValue.trim()) ||
                            !canAddMore
                        }
                        tabIndex={-1}
                    >
                        <theme.icons.Add color="success" />
                    </IconButton>
                </Adornment>
            ]}
            onChange={value => setInputValue(value ?? "")}
            inputProps={{
                ...inputProps,
                onKeyDown: handleInputKeyDown,
                disabled,
            }}
            disabled={disabled}
            dense={dense}
            {...other}
        >
            {filteredSuggestions.length > 0 && inputRef.current && (
                <Popover
                    open={listOpen}
                    anchorEl={inputRef.current}
                    onClose={handleClose}
                >
                    <List dense disablePadding style={{ width: inputRef.current ? `${inputRef.current.offsetWidth}px` : "auto", }}>
                        {filteredSuggestions.map((suggestion, index) => (
                            <ListItemButton
                                key={suggestion}
                                onClick={e => {
                                    e.preventDefault();
                                    handleAddTag(suggestion);
                                }}
                                selected={listSelectedIndex === index}
                            >
                                <ListItemText primary={suggestion} />
                            </ListItemButton>
                        ))}
                    </List>
                </Popover>
            )}
        </BaseInputField>
    );
};

TagsField.displayName = "TagsField";