import React from "react";
import { BaseInputProps } from "./base/BaseInputProps";
import { Adornment, BaseInputField } from "./base/BaseInputField";
import { Chip, Stack, useTheme, Zoom } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { IconButton } from "../buttons/IconButton";
import clsx from "@renderer/utils/clsx";
import { useInputDecorator } from "./decorators/InputDecoratorContext";

export interface TagsFieldProps extends Omit<BaseInputProps<string>, "onChange" | "value" | "defaultValue"> {
    value?: string[];
    defaultValue?: string[];
    onChange?: (tags: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    showTags?: boolean;
    maxTags?: number;
}

export const TagsField: React.FC<TagsFieldProps> = ({
    value: controlledValue,
    defaultValue,
    onChange,
    disabled,
    inputProps,
    size = "medium",
    color = "main",
    showTags = true,
    maxTags,
    ...other
}) => {
    const theme = useTheme();
    const decorator = useInputDecorator();
    const [uncontrolledTags, setUncontrolledTags] = React.useState<string[]>(defaultValue ?? []);
    const tags = controlledValue !== undefined ? controlledValue : uncontrolledTags;
    const [inputValue, setInputValue] = React.useState("");
    const canAddMore = !maxTags || tags.length < maxTags;

    if (decorator && maxTags) {
        Promise.resolve().then(() => {
            decorator.setRestrictions(`${(tags ?? []).length}/${maxTags}`);
        });
    }

    const handleAddTag = React.useCallback((tag?: string) => {
        const newTag = (tag ?? inputValue).trim();
        if (!newTag || tags.includes(newTag) || !canAddMore) return;
        const newTags = [...tags, newTag];
        if (onChange) onChange(newTags);
        if (controlledValue === undefined) setUncontrolledTags(newTags);
        setInputValue("");
    }, [inputValue, tags, onChange, controlledValue, canAddMore]);

    const handleRemoveTag = (tagToRemove: string) => {
        const newTags = tags.filter(tag => tag !== tagToRemove);
        if (onChange) onChange(newTags);
        if (controlledValue === undefined) setUncontrolledTags(newTags);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === "Enter" || e.key === ",") && canAddMore) {
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
                            <Zoom key={tag} in={true}>
                                <Chip
                                    key={tag}
                                    label={tag}
                                    onDelete={disabled ? undefined : () => handleRemoveTag(tag)}
                                    disabled={disabled}
                                    size="small"
                                />
                            </Zoom>
                        ))}
                    </Adornment>
                ),
                <Adornment position="end" key="add">
                    <IconButton
                        size={size}
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
            {...other}
        />
    );
};

TagsField.displayName = "TagsField";