import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import { NumberField } from "@renderer/components/inputs/NumberField";
import { SelectField } from "@renderer/components/inputs/SelectField";
import { TextField } from "@renderer/components/inputs/TextField";
import { 
    SlotFactoryContext,
    INumberField, ISearchField, ISelectField, ITextField, 
    resolveBooleanFactory, resolveSelectOptionsFactory, 
    IBooleanField,
    resolveStringFactory
} from "../../../../../../plugins/manager/renderer/CustomSlots";
import React from "react";
import { SearchField } from "@renderer/components/inputs/SearchField";
import { BooleanField } from "@renderer/components/inputs/BooleanField";

export const ToolSelectedField: React.FC<{ action: ISelectField, slotContext: SlotFactoryContext }> = (props) => {
    const {
        action,
        slotContext,
    } = props;

    const [value, setValue] = React.useState<any | undefined>(action.defaultValue);

    return (
        <InputDecorator indicator={false} disableBlink>
            <SelectField
                placeholder={action.placeholder}
                value={value}
                onChange={setValue}
                onChanged={action.onChange}
                disabled={resolveBooleanFactory(action.disabled, slotContext)}
                size="small"
                width={action.width}
                options={resolveSelectOptionsFactory(action.options, slotContext) || []}
                tooltip={action.tooltip}
            />
        </InputDecorator>
    );
};

export const ToolTextField: React.FC<{ action: ITextField, slotContext: SlotFactoryContext }> = (props) => {
    const {
        action,
        slotContext,
    } = props;

    const [value, setValue] = React.useState<string>(action.defaultValue ?? "");

    return (
        <InputDecorator indicator={false} disableBlink>
            <TextField
                placeholder={action.placeholder}
                value={value}
                onChange={setValue}
                onChanged={action.onChange}
                disabled={resolveBooleanFactory(action.disabled, slotContext)}
                size="small"
                width={action.width}
                minLength={action.minLength}
                maxLength={action.maxLength}
                tooltip={action.tooltip}
            />
        </InputDecorator>
    );
};

export const ToolSearchField: React.FC<{ action: ISearchField, slotContext: SlotFactoryContext }> = (props) => {
    const {
        action,
        slotContext,
    } = props;

    const [value, setValue] = React.useState<string>(action.defaultValue ?? "");

    return (
        <InputDecorator indicator={false} disableBlink>
            <SearchField
                placeholder={action.placeholder}
                value={value}
                onChange={setValue}
                onChanged={action.onChange}
                disabled={resolveBooleanFactory(action.disabled, slotContext)}
                size="small"
                width={action.width}
                minLength={action.minLength}
                maxLength={action.maxLength}
                tooltip={action.tooltip}
            />
        </InputDecorator>
    );
};

export const ToolNumberField: React.FC<{ action: INumberField, slotContext: SlotFactoryContext }> = (props) => {
    const {
        action,
        slotContext,
    } = props;

    const [value, setValue] = React.useState<number | null>(action.defaultValue ?? action.min ?? null);

    return (
        <InputDecorator indicator={false} disableBlink>
            <NumberField
                placeholder={action.placeholder}
                value={value}
                onChange={value => setValue(value ?? null)}
                onChanged={value => action.onChange(value ?? action.defaultValue ?? action.min ?? null)}
                disabled={resolveBooleanFactory(action.disabled, slotContext)}
                size="small"
                width={action.width}
                min={action.min}
                max={action.max}
                step={action.step}
                tooltip={action.tooltip}
            />
        </InputDecorator>
    );
};

export const ToolBooleanField: React.FC<{ action: IBooleanField, slotContext: SlotFactoryContext }> = (props) => {
    const {
        action,
        slotContext,
    } = props;
    const [value, setValue] = React.useState<boolean | null>(action.defaultValue ?? false);

    return (
        <InputDecorator indicator={false} disableBlink>
            <BooleanField
                value={value}
                onChange={setValue}
                onChanged={action.onChange}
                disabled={resolveBooleanFactory(action.disabled, slotContext)}
                size="small"
                width={action.width}
                label={action.label}
                tooltip={action.tooltip}
            />
        </InputDecorator>
    );
}
