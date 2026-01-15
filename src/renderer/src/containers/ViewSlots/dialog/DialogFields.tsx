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
    resolveStringFactory
} from "../../../../../../plugins/manager/renderer/CustomSlots";
import React from "react";

export const DialogTextField: React.FC<{
    field: IDialogTextField;
    runtimeContext: SlotRuntimeContext;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
}> = (props) => {
    const {
        field,
        runtimeContext,
        structure,
        onChange,
    } = props;

    const label = resolveStringFactory(field.label, runtimeContext);
    const tooltip = resolveStringFactory(field.tooltip, runtimeContext);
    const helperText = resolveStringFactory(field.helperText, runtimeContext);
    const disabled = resolveBooleanFactory(field.disabled, runtimeContext);
    const required = resolveBooleanFactory(field.required, runtimeContext);

    return (
        <InputDecorator indicator={false} disableBlink label={label} description={helperText}>
            <TextField
                value={structure[field.key]}
                onChange={(value) => onChange({ ...structure, [field.key]: value })}
                disabled={disabled}
                required={required}
                width={field.width}
                minLength={field.minLength}
                maxLength={field.maxLength}
                tooltip={tooltip}
            />
        </InputDecorator>
    );
};

export const DialogNumberField: React.FC<{
    field: IDialogNumberField;
    runtimeContext: SlotRuntimeContext;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
}> = (props) => {
    const {
        field,
        runtimeContext,
        structure,
        onChange,
    } = props;

    const label = resolveStringFactory(field.label, runtimeContext);
    const tooltip = resolveStringFactory(field.tooltip, runtimeContext);
    const helperText = resolveStringFactory(field.helperText, runtimeContext);
    const disabled = resolveBooleanFactory(field.disabled, runtimeContext);
    const required = resolveBooleanFactory(field.required, runtimeContext);

    return (
        <InputDecorator indicator={false} disableBlink label={label} description={helperText}>
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
            />
        </InputDecorator>
    );
};

export const DialogSelectField: React.FC<{
    field: IDialogSelectField;
    runtimeContext: SlotRuntimeContext;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
}> = (props) => {
    const {
        field,
        runtimeContext,
        structure,
        onChange,
    } = props;

    const label = resolveStringFactory(field.label, runtimeContext);
    const tooltip = resolveStringFactory(field.tooltip, runtimeContext);
    const helperText = resolveStringFactory(field.helperText, runtimeContext);
    const disabled = resolveBooleanFactory(field.disabled, runtimeContext);
    const required = resolveBooleanFactory(field.required, runtimeContext);
    const options = resolveSelectOptionsFactory(field.options, runtimeContext) || [];

    return (
        <InputDecorator indicator={false} disableBlink label={label} description={helperText}>
            <SelectField
                value={structure[field.key]}
                onChange={(value) => onChange({ ...structure, [field.key]: value })}
                disabled={disabled}
                required={required}
                width={field.width}
                options={options}
                tooltip={tooltip}
                searchable={true}
            />
        </InputDecorator>
    );
};

export const DialogBooleanField: React.FC<{
    field: IDialogBooleanField;
    runtimeContext: SlotRuntimeContext;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
}> = (props) => {
    const {
        field,
        runtimeContext,
        structure,
        onChange,
    } = props;

    const label = resolveStringFactory(field.label, runtimeContext);
    const tooltip = resolveStringFactory(field.tooltip, runtimeContext);
    const helperText = resolveStringFactory(field.helperText, runtimeContext);
    const disabled = resolveBooleanFactory(field.disabled, runtimeContext);
    const required = resolveBooleanFactory(field.required, runtimeContext);

    return (
        <InputDecorator indicator={false} disableBlink description={helperText}>
            <BooleanField
                value={structure[field.key]}
                onChange={(value) => onChange({ ...structure, [field.key]: value })}
                disabled={disabled}
                required={required}
                width={field.width}
                label={label}
                tooltip={tooltip}
                indeterminate={field.indeterminate}
            />
        </InputDecorator>
    );
};
