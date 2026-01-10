import React from "react";
import { ICopyData, SlotFactoryContext } from "../../../../../../plugins/manager/renderer/CustomSlots";
import { CopyDataButton } from "@renderer/components/CopyDataButton";
import { RefreshSlotFunction } from "../RefreshSlotContext";

export const ToolCopyDataButton: React.FC<{ action: ICopyData, slotContext: SlotFactoryContext }> = (props) => {
    const { action, slotContext } = props;

    return (
        <CopyDataButton
            getData={() => action.getData(slotContext)}
            formats={action.formats}
        />
    );
};