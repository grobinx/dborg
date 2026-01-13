import React from "react";
import {
    SlotFactoryContext,
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
    slotContext: SlotFactoryContext;
    structure: Record<string, any>;
}> = (props) => {
    const {
        item,
        slotContext,
        structure,
    } = props;

    if (isDialogTextField(item)) {
        return <DialogTextField field={item} slotContext={slotContext} structure={structure} />;
    }

    if (isDialogNumberField(item)) {
        return <DialogNumberField field={item} slotContext={slotContext} structure={structure} />;
    }

    if (isDialogBooleanField(item)) {
        return <DialogBooleanField field={item} slotContext={slotContext} structure={structure} />;
    }

    if (isDialogSelectField(item)) {
        return <DialogSelectField field={item} slotContext={slotContext} structure={structure} />;
    }

    if (isDialogRow(item)) {
        return <DialogRow row={item} slotContext={slotContext} structure={structure} />;
    }

    if (isDialogColumn(item)) {
        return <DialogColumn column={item} slotContext={slotContext} structure={structure} />;
    }

    return null;
};
