import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import { NumberField } from "@renderer/components/inputs/NumberField";
import { SelectField } from "@renderer/components/inputs/SelectField";
import { TextField } from "@renderer/components/inputs/TextField";
import { 
    INumberField, ISelectField, ITextField, 
    resolveBooleanFactory, resolveSelectOptionsFactory 
} from "../../../../../../plugins/manager/renderer/CustomSlots";
import React from "react";

export const ToolSelectedField: React.FC<{ action: ISelectField, refreshSlot: (id: string) => void }> = (props) => {
    const {
        action,
        refreshSlot,
    } = props;

    const [value, setValue] = React.useState<any | undefined>(action.defaultValue);

    return (
        <InputDecorator indicator={false} disableBlink>
            <SelectField
                placeholder={action.placeholder}
                value={value}
                onChange={setValue}
                onChanged={action.onChange}
                disabled={resolveBooleanFactory(action.disabled, refreshSlot)}
                size="small"
                width={action.width}
                options={resolveSelectOptionsFactory(action.options, refreshSlot) || []}
                tooltip={action.tooltip}
            />
        </InputDecorator>
    );
};

export const ToolTextField: React.FC<{ action: ITextField, refreshSlot: (id: string) => void }> = (props) => {
    const {
        action,
        refreshSlot,
    } = props;

    const [value, setValue] = React.useState<string>(action.defaultValue ?? "");

    return (
        <InputDecorator indicator={false} disableBlink>
            <TextField
                placeholder={action.placeholder}
                value={value}
                onChange={setValue}
                onChanged={action.onChange}
                disabled={resolveBooleanFactory(action.disabled, refreshSlot)}
                size="small"
                width={action.width}
                minLength={action.minLength}
                maxLength={action.maxLength}
                tooltip={action.tooltip}
            />
        </InputDecorator>
    );
};

export const ToolNumberField: React.FC<{ action: INumberField, refreshSlot: (id: string) => void }> = (props) => {
    const {
        action,
        refreshSlot,
    } = props;

    const [value, setValue] = React.useState<number | null>(action.defaultValue ?? action.min ?? null);

    return (
        <InputDecorator indicator={false} disableBlink>
            <NumberField
                placeholder={action.placeholder}
                value={value}
                onChange={value => setValue(value ?? null)}
                onChanged={value => action.onChange(value ?? action.defaultValue ?? action.min ?? null)}
                disabled={resolveBooleanFactory(action.disabled, refreshSlot)}
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

