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
} from "../../../../../../plugins/manager/renderer/CustomSlots";
import { DialogTextField, DialogNumberField, DialogSelectField, DialogBooleanField } from "./DialogFields";
import { DialogRow } from "./DialogLayout";
import { DialogColumn } from "./DialogLayout";

export const DialogLayoutItem: React.FC<{
    item: DialogLayoutItemKind;
    runtimeContext: SlotRuntimeContext;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
}> = (props) => {
    const {
        item,
        runtimeContext,
        structure,
        onChange,
    } = props;

    if (isDialogTextField(item)) {
        return <DialogTextField field={item} runtimeContext={runtimeContext} structure={structure} onChange={onChange} />;
    }

    if (isDialogNumberField(item)) {
        return <DialogNumberField field={item} runtimeContext={runtimeContext} structure={structure} onChange={onChange} />;
    }

    if (isDialogBooleanField(item)) {
        return <DialogBooleanField field={item} runtimeContext={runtimeContext} structure={structure} onChange={onChange} />;
    }

    if (isDialogSelectField(item)) {
        return <DialogSelectField field={item} runtimeContext={runtimeContext} structure={structure} onChange={onChange} />;
    }

    if (isDialogRow(item)) {
        return <DialogRow row={item} runtimeContext={runtimeContext} structure={structure} onChange={onChange} />;
    }

    if (isDialogColumn(item)) {
        return <DialogColumn column={item} runtimeContext={runtimeContext} structure={structure} onChange={onChange} />;
    }

    return null;
};
