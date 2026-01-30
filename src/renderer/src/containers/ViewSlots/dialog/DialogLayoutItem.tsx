import React from "react";
import {
    SlotRuntimeContext,
    DialogLayoutItemKind,
    isDialogTextField,
    isDialogNumberField,
    isDialogBooleanField,
    isDialogSelectField,
    isDialogRow,
    isDialogColumn,
    isDialogTabs,
    isDialogEditorField,
} from "../../../../../../plugins/manager/renderer/CustomSlots";
import { DialogTextField, DialogNumberField, DialogSelectField, DialogBooleanField, DialogEditorField } from "./DialogFields";
import { DialogRow } from "./DialogLayout";
import { DialogColumn } from "./DialogLayout";
import { DialogTabs } from "./DialogTabs";

export const DialogLayoutItem: React.FC<{
    item: DialogLayoutItemKind;
    runtimeContext: SlotRuntimeContext;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
    invalidFields: Set<string>;
    onValidityChange: () => void;
}> = (props) => {
    const {
        item,
        runtimeContext,
        structure,
        onChange,
        invalidFields,
        onValidityChange,
    } = props;

    if (isDialogTextField(item)) {
        return <DialogTextField
            field={item}
            runtimeContext={runtimeContext}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
        />;
    }

    if (isDialogNumberField(item)) {
        return <DialogNumberField
            field={item}
            runtimeContext={runtimeContext}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
        />;
    }

    if (isDialogBooleanField(item)) {
        return <DialogBooleanField
            field={item}
            runtimeContext={runtimeContext}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
        />;
    }

    if (isDialogSelectField(item)) {
        return <DialogSelectField
            field={item}
            runtimeContext={runtimeContext}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
        />;
    }

    if (isDialogEditorField(item)) {
        return <DialogEditorField
            field={item}
            runtimeContext={runtimeContext}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
        />;
    }

    if (isDialogRow(item)) {
        return <DialogRow
            row={item}
            runtimeContext={runtimeContext}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
        />;
    }

    if (isDialogColumn(item)) {
        return <DialogColumn 
            column={item} 
            runtimeContext={runtimeContext} 
            structure={structure} 
            onChange={onChange} 
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
        />;
    }

    if (isDialogTabs(item)) {
        return <DialogTabs
            dialogTabs={item}
            runtimeContext={runtimeContext}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
        />;
    }

    return null;
};
