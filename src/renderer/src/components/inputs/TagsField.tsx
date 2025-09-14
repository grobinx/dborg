import React from "react";
import { BaseInputProps } from "./base/BaseInputProps";
import { Adornment, BaseInputField } from "./base/BaseInputField";
import { Chip, Stack, useTheme } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { IconButton } from "../buttons/IconButton";
import clsx from "@renderer/utils/clsx";

export interface TagsFieldProps extends Omit<BaseInputProps<string>, "onChange" | "value" | "defaultValue"> {
    value?: string[];
    defaultValue?: string[];
    onChange?: (tags: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const TagsField: React.FC<TagsFieldProps> = ({
    value: controlledValue,
    defaultValue,
    onChange,
    disabled,
    inputProps,
    size = "medium",
    color = "main",
    ...other
}) => {
    const theme = useTheme();
    // Obsługa uncontrolled value
    const [uncontrolledTags, setUncontrolledTags] = React.useState<string[]>(defaultValue ?? []);
    const tags = controlledValue !== undefined ? controlledValue : uncontrolledTags;

    const [inputValue, setInputValue] = React.useState("");

    const handleAddTag = React.useCallback((tag?: string) => {
        const newTag = (tag ?? inputValue).trim();
        if (!newTag || tags.includes(newTag)) return;
        const newTags = [...tags, newTag];
        if (onChange) onChange(newTags);
        if (controlledValue === undefined) setUncontrolledTags(newTags);
        setInputValue("");
    }, [inputValue, tags, onChange, controlledValue]);

    const handleRemoveTag = (tagToRemove: string) => {
        const newTags = tags.filter(tag => tag !== tagToRemove);
        if (onChange) onChange(newTags);
        if (controlledValue === undefined) setUncontrolledTags(newTags);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            handleAddTag();
        }
        if (e.key === "Backspace" && !inputValue && tags.length > 0) {
            handleRemoveTag(tags[tags.length - 1]);
        }
    };

    return (
        <BaseInputField
            type="tags"
            value={inputValue}
            size={size}
            color={color}
            adornments={[
                <Adornment
                    position="start"
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
                </Adornment>,
                <Adornment position="end" key="add">
                    <IconButton
                        size={size}
                        color="main"
                        dense
                        onClick={() => handleAddTag()}
                        disabled={disabled || !inputValue.trim() || tags.includes(inputValue.trim())}
                        tabIndex={-1}
                    >
                        <theme.icons.AddTab color={color} />
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
            {...other}
        />
    );
};

TagsField.displayName = "TagsField";