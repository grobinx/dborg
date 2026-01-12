import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import { NumberField } from "@renderer/components/inputs/NumberField";
import { SelectField } from "@renderer/components/inputs/SelectField";
import { TextField } from "@renderer/components/inputs/TextField";
import { BooleanField } from "@renderer/components/inputs/BooleanField";
import {
    SlotFactoryContext,
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
    slotContext: SlotFactoryContext;
    structure: Record<string, any>;
}> = (props) => {
    const {
        field,
        slotContext,
        structure,
    } = props;

    const label = resolveStringFactory(field.label, slotContext);
    const tooltip = resolveStringFactory(field.tooltip, slotContext);
    const helperText = resolveStringFactory(field.helperText, slotContext);
    const disabled = resolveBooleanFactory(field.disabled, slotContext);
    const required = resolveBooleanFactory(field.required, slotContext);

    return (
        <InputDecorator indicator={false} disableBlink label={label} description={helperText}>
            <TextField
                value={structure[field.key] ?? field.defaultValue ?? ""}
                onChange={(value) => structure[field.key] = value}
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
    slotContext: SlotFactoryContext;
    structure: Record<string, any>;
}> = (props) => {
    const {
        field,
        slotContext,
        structure,
    } = props;

    const label = resolveStringFactory(field.label, slotContext);
    const tooltip = resolveStringFactory(field.tooltip, slotContext);
    const helperText = resolveStringFactory(field.helperText, slotContext);
    const disabled = resolveBooleanFactory(field.disabled, slotContext);
    const required = resolveBooleanFactory(field.required, slotContext);

    return (
        <InputDecorator indicator={false} disableBlink label={label} description={helperText}>
            <NumberField
                value={structure[field.key] ?? field.defaultValue ?? field.min ?? null}
                onChange={(value) => structure[field.key] = value}
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
    slotContext: SlotFactoryContext;
    structure: Record<string, any>;
}> = (props) => {
    const {
        field,
        slotContext,
        structure,
    } = props;

    const label = resolveStringFactory(field.label, slotContext);
    const tooltip = resolveStringFactory(field.tooltip, slotContext);
    const helperText = resolveStringFactory(field.helperText, slotContext);
    const disabled = resolveBooleanFactory(field.disabled, slotContext);
    const required = resolveBooleanFactory(field.required, slotContext);
    const options = resolveSelectOptionsFactory(field.options, slotContext) || [];

    return (
        <InputDecorator indicator={false} disableBlink label={label} description={helperText}>
            <SelectField
                value={structure[field.key] ?? field.defaultValue}
                onChange={(value) => structure[field.key] = value}
                disabled={disabled}
                required={required}
                width={field.width}
                options={options}
                tooltip={tooltip}
            />
        </InputDecorator>
    );
};

export const DialogBooleanField: React.FC<{
    field: IDialogBooleanField;
    slotContext: SlotFactoryContext;
    structure: Record<string, any>;
}> = (props) => {
    const {
        field,
        slotContext,
        structure,
    } = props;

    const label = resolveStringFactory(field.label, slotContext);
    const tooltip = resolveStringFactory(field.tooltip, slotContext);
    const helperText = resolveStringFactory(field.helperText, slotContext);
    const disabled = resolveBooleanFactory(field.disabled, slotContext);
    const required = resolveBooleanFactory(field.required, slotContext);

    return (
        <InputDecorator indicator={false} disableBlink description={helperText}>
            <BooleanField
                value={structure[field.key] ?? field.defaultValue ?? false}
                onChange={(value) => structure[field.key] = value}
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
