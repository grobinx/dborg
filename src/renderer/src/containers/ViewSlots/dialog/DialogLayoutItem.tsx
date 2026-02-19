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
    isDialogTextareaField,
} from "../../../../../../plugins/manager/renderer/CustomSlots";
import { DialogTextField, DialogNumberField, DialogSelectField, DialogBooleanField, DialogEditorField, DialogTextareaField } from "./DialogFields";
import { DialogRow } from "./DialogLayout";
import { DialogColumn } from "./DialogLayout";
import { DialogTabs } from "./DialogTabs";

export const DialogLayoutItem: React.FC<{
    item: DialogLayoutItemKind;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
    invalidFields: Set<string>;
    onValidityChange: () => void;
}> = (props) => {
    const {
        item,
        structure,
        onChange,
        invalidFields,
        onValidityChange,
    } = props;

    if (isDialogTextField(item)) {
        return <DialogTextField
            field={item}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
        />;
    }

    if (isDialogTextareaField(item)) {
        return <DialogTextareaField
            field={item}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
        />;
    }

    if (isDialogNumberField(item)) {
        return <DialogNumberField
            field={item}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
        />;
    }

    if (isDialogBooleanField(item)) {
        return <DialogBooleanField
            field={item}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
        />;
    }

    if (isDialogSelectField(item)) {
        return <DialogSelectField
            field={item}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
        />;
    }

    if (isDialogEditorField(item)) {
        return <DialogEditorField
            field={item}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
        />;
    }

    if (isDialogRow(item)) {
        return <DialogRow
            row={item}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
        />;
    }

    if (isDialogColumn(item)) {
        return <DialogColumn 
            column={item} 
            structure={structure} 
            onChange={onChange} 
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
        />;
    }

    if (isDialogTabs(item)) {
        return <DialogTabs
            dialogTabs={item}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
        />;
    }

    return null;
};
