import React from "react";
import { ICopyData } from "../../../../../../plugins/manager/renderer/CustomSlots";
import { CopyDataButton } from "@renderer/components/CopyDataButton";
import { RefreshSlotFunction } from "../RefreshSlotContext";

export const ToolCopyDataButton: React.FC<{ action: ICopyData, refreshSlot: RefreshSlotFunction }> = (props) => {
    const { action, refreshSlot } = props;

    return (
        <CopyDataButton
            getData={() => action.getData(refreshSlot)}
            formats={action.formats}
        />
    );
};