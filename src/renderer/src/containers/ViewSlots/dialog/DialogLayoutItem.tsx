import React from "react";
import {
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
    isDialogStatic,
    isDialogList,
} from "../../../../../../plugins/manager/renderer/CustomSlots";
import { DialogTextField, DialogNumberField, DialogSelectField, DialogBooleanField, DialogEditorField, DialogTextareaField, DialogStatic } from "./DialogFields";
import { DialogRow } from "./DialogLayout";
import { DialogColumn } from "./DialogLayout";
import { DialogTabs } from "./DialogTabs";
import { DialogList } from "./DialogList";

export const DialogLayoutItem: React.FC<{
    item: DialogLayoutItemKind;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
    invalidFields: Set<string>;
    onValidityChange: () => void;
    disabled?: boolean;
}> = (props) => {
    const {
        item,
        structure,
        onChange,
        invalidFields,
        onValidityChange,
        disabled,
    } = props;

    if (isDialogTextField(item)) {
        return <DialogTextField
            field={item}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
            disabled={disabled}
        />;
    }

    if (isDialogTextareaField(item)) {
        return <DialogTextareaField
            field={item}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
            disabled={disabled}
        />;
    }

    if (isDialogNumberField(item)) {
        return <DialogNumberField
            field={item}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
            disabled={disabled}
        />;
    }

    if (isDialogBooleanField(item)) {
        return <DialogBooleanField
            field={item}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
            disabled={disabled}
        />;
    }

    if (isDialogSelectField(item)) {
        return <DialogSelectField
            field={item}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
            disabled={disabled}
        />;
    }

    if (isDialogEditorField(item)) {
        return <DialogEditorField
            field={item}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
            disabled={disabled}
        />;
    }

    if (isDialogRow(item)) {
        return <DialogRow
            row={item}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
            disabled={disabled}
        />;
    }

    if (isDialogColumn(item)) {
        return <DialogColumn
            column={item}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
            disabled={disabled}
        />;
    }

    if (isDialogTabs(item)) {
        return <DialogTabs
            dialogTabs={item}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
            disabled={disabled}
        />;
    }

    if (isDialogList(item)) {
        return <DialogList
            list={item}
            structure={structure}
            onChange={onChange}
            invalidFields={invalidFields}
            onValidityChange={onValidityChange}
            disabled={disabled}
        />;
    }

    if (isDialogStatic(item)) {
        return <DialogStatic item={item} structure={structure} onValidityChange={onValidityChange} />;
    }

    return null;
};
