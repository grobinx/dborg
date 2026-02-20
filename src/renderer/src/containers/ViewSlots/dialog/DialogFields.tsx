import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import { NumberField } from "@renderer/components/inputs/NumberField";
import { SelectField } from "@renderer/components/inputs/SelectField";
import { TextField } from "@renderer/components/inputs/TextField";
import { BooleanField } from "@renderer/components/inputs/BooleanField";
import {
    SlotRuntimeContext,
    IDialogTextField,
    IDialogNumberField,
    IDialogSelectField,
    IDialogBooleanField,
    resolveBooleanFactory,
    resolveSelectOptionsFactory,
    resolveStringFactory,
    IDialogEditorField,
    IDialogTextareaField,
    IDialogStatic,
    resolveCSSPropertiesFactory
} from "../../../../../../plugins/manager/renderer/CustomSlots";
import React from "react";
import { EditorField } from "@renderer/components/inputs/EditorField";
import { TextareaField } from "@renderer/components/inputs/TextareaField";
import { Typography } from "@mui/material";

export const DialogTextField: React.FC<{
    field: IDialogTextField;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
    invalidFields: Set<string>;
    onValidityChange: () => void;
}> = (props) => {
    const {
        field,
        structure,
        onChange,
        invalidFields,
        onValidityChange,
    } = props;

    const label = resolveStringFactory(field.label, structure);
    const tooltip = resolveStringFactory(field.tooltip, structure);
    const helperText = resolveStringFactory(field.helperText, structure);
    const disabled = resolveBooleanFactory(field.disabled, structure);
    const required = resolveBooleanFactory(field.required, structure);

    return (
        <InputDecorator indicator={false} disableBlink label={label} description={helperText} showValidity={false}>
            <TextField
                value={structure[field.key]}
                onChange={(value) => onChange({ ...structure, [field.key]: value })}
                disabled={disabled}
                required={required}
                width={field.width}
                minLength={field.minLength}
                maxLength={field.maxLength}
                tooltip={tooltip}
                autoFocus={field.autoFocus}
                onValidityChange={(isValid) => {
                    if (!isValid) {
                        if (!invalidFields.has(field.key)) {
                            invalidFields.add(field.key);
                        }
                    } else {
                        if (invalidFields.has(field.key)) {
                            invalidFields.delete(field.key);
                        }
                    }
                    onValidityChange();
                }}
            />
        </InputDecorator>
    );
};

export const DialogTextareaField: React.FC<{
    field: IDialogTextareaField;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
    invalidFields: Set<string>;
    onValidityChange: () => void;
}> = (props) => {
    const {
        field,
        structure,
        onChange,
        invalidFields,
        onValidityChange,
    } = props;

    const label = resolveStringFactory(field.label, structure);
    const tooltip = resolveStringFactory(field.tooltip, structure);
    const helperText = resolveStringFactory(field.helperText, structure);
    const disabled = resolveBooleanFactory(field.disabled, structure);
    const required = resolveBooleanFactory(field.required, structure);

    return (
        <InputDecorator indicator={false} disableBlink label={label} description={helperText} showValidity={false}>
            <TextareaField
                value={structure[field.key]}
                onChange={(value) => onChange({ ...structure, [field.key]: value })}
                disabled={disabled}
                required={required}
                width={field.width}
                minLength={field.minLength}
                maxLength={field.maxLength}
                minRows={field.minRows}
                maxRows={field.maxRows}
                rows={field.rows}
                tooltip={tooltip}
                autoFocus={field.autoFocus}
                onValidityChange={(isValid) => {
                    if (!isValid) {
                        if (!invalidFields.has(field.key)) {
                            invalidFields.add(field.key);
                        }
                    } else {
                        if (invalidFields.has(field.key)) {
                            invalidFields.delete(field.key);
                        }
                    }
                    onValidityChange();
                }}
            />
        </InputDecorator>
    );
};

export const DialogNumberField: React.FC<{
    field: IDialogNumberField;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
    invalidFields: Set<string>;
    onValidityChange: () => void;
}> = (props) => {
    const {
        field,
        structure,
        onChange,
        invalidFields,
        onValidityChange,
    } = props;

    const label = resolveStringFactory(field.label, structure);
    const tooltip = resolveStringFactory(field.tooltip, structure);
    const helperText = resolveStringFactory(field.helperText, structure);
    const disabled = resolveBooleanFactory(field.disabled, structure);
    const required = resolveBooleanFactory(field.required, structure);

    return (
        <InputDecorator indicator={false} disableBlink label={label} description={helperText} showValidity={false}>
            <NumberField
                value={structure[field.key]}
                onChange={(value) => onChange({ ...structure, [field.key]: value })}
                disabled={disabled}
                required={required}
                width={field.width}
                min={field.min}
                max={field.max}
                step={field.step}
                tooltip={tooltip}
                autoFocus={field.autoFocus}
                onValidityChange={(isValid) => {
                    if (!isValid) {
                        if (!invalidFields.has(field.key)) {
                            invalidFields.add(field.key);
                        }
                    } else {
                        if (invalidFields.has(field.key)) {
                            invalidFields.delete(field.key);
                        }
                    }
                    onValidityChange();
                }}
            />
        </InputDecorator>
    );
};

export const DialogSelectField: React.FC<{
    field: IDialogSelectField;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
    invalidFields: Set<string>;
    onValidityChange: () => void;
}> = (props) => {
    const {
        field,
        structure,
        onChange,
        invalidFields,
        onValidityChange,
    } = props;

    const label = resolveStringFactory(field.label, structure);
    const tooltip = resolveStringFactory(field.tooltip, structure);
    const helperText = resolveStringFactory(field.helperText, structure);
    const disabled = resolveBooleanFactory(field.disabled, structure);
    const required = resolveBooleanFactory(field.required, structure);
    const options = resolveSelectOptionsFactory(field.options, structure) || [];

    return (
        <InputDecorator indicator={false} disableBlink label={label} description={helperText} showValidity={false}>
            <SelectField
                value={structure[field.key]}
                onChange={(value) => onChange({ ...structure, [field.key]: value })}
                disabled={disabled}
                required={required}
                width={field.width}
                options={options}
                tooltip={tooltip}
                searchable={true}
                autoFocus={field.autoFocus}
                onValidityChange={(isValid) => {
                    if (!isValid) {
                        if (!invalidFields.has(field.key)) {
                            invalidFields.add(field.key);
                        }
                    } else {
                        if (invalidFields.has(field.key)) {
                            invalidFields.delete(field.key);
                        }
                    }
                    onValidityChange();
                }}
            />
        </InputDecorator>
    );
};

export const DialogBooleanField: React.FC<{
    field: IDialogBooleanField;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
    invalidFields: Set<string>;
    onValidityChange: () => void;
}> = (props) => {
    const {
        field,
        structure,
        onChange,
        invalidFields,
        onValidityChange,
    } = props;

    const label = resolveStringFactory(field.label, structure);
    const tooltip = resolveStringFactory(field.tooltip, structure);
    const helperText = resolveStringFactory(field.helperText, structure);
    const disabled = resolveBooleanFactory(field.disabled, structure);
    const required = resolveBooleanFactory(field.required, structure);

    return (
        <InputDecorator indicator={false} disableBlink description={helperText} showValidity={false}>
            <BooleanField
                value={structure[field.key]}
                onChange={(value) => onChange({ ...structure, [field.key]: value })}
                disabled={disabled}
                required={required}
                width={field.width}
                label={label}
                tooltip={tooltip}
                indeterminate={field.indeterminate}
                autoFocus={field.autoFocus}
                onValidityChange={(isValid) => {
                    if (!isValid) {
                        if (!invalidFields.has(field.key)) {
                            invalidFields.add(field.key);
                        }
                    } else {
                        if (invalidFields.has(field.key)) {
                            invalidFields.delete(field.key);
                        }
                    }
                    onValidityChange();
                }}
            />
        </InputDecorator>
    );
};

export const DialogEditorField: React.FC<{
    field: IDialogEditorField;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
    invalidFields: Set<string>;
    onValidityChange: () => void;
}> = (props) => {
    const {
        field,
        structure,
        onChange,
        invalidFields,
        onValidityChange,
    } = props;

    const label = resolveStringFactory(field.label, structure);
    const tooltip = resolveStringFactory(field.tooltip, structure);
    const helperText = resolveStringFactory(field.helperText, structure);
    const disabled = resolveBooleanFactory(field.disabled, structure);
    const required = resolveBooleanFactory(field.required, structure);

    return (
        <InputDecorator
            indicator={false}
            disableBlink
            description={helperText}
            label={label}
            showValidity={false}
            sx={{ height: field.height === "100%" ? field.height : undefined }}
        >
            <EditorField
                value={structure[field.key]}
                onChange={(value) => onChange({ ...structure, [field.key]: value })}
                disabled={disabled}
                required={required}
                width={field.width}
                height={field.height}
                readOnly={field.readOnly}
                language={field.language}
                autoFocus={field.autoFocus}
                tooltip={tooltip}
                statusBar={true}
                onValidityChange={(isValid) => {
                    if (!isValid) {
                        if (!invalidFields.has(field.key)) {
                            invalidFields.add(field.key);
                        }
                    } else {
                        if (invalidFields.has(field.key)) {
                            invalidFields.delete(field.key);
                        }
                    }
                    onValidityChange();
                }}
            />
        </InputDecorator>
    );
};

export const DialogStatic: React.FC<{
    item: IDialogStatic;
    structure: Record<string, any>;
    onValidityChange: () => void;
}> = (props) => {
    const { item, structure, onValidityChange } = props;
    const text = resolveStringFactory(item.text, structure);
    const style = resolveCSSPropertiesFactory(item.style, structure);

    React.useEffect(() => {
        onValidityChange();
    }, [text, style, onValidityChange]);

    return (
        <Typography component="div" variant="body1" style={style}>
            {text}
        </Typography>
    );
};