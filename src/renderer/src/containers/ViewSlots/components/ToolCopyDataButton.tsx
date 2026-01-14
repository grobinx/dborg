import React from "react";
import { ICopyData, SlotRuntimeContext } from "../../../../../../plugins/manager/renderer/CustomSlots";
import { CopyDataButton } from "@renderer/components/CopyDataButton";
import { RefreshSlotFunction } from "../ViewSlotContext";

export const ToolCopyDataButton: React.FC<{ action: ICopyData, runtimeContext: SlotRuntimeContext }> = (props) => {
    const { action, runtimeContext } = props;

    return (
        <CopyDataButton
            getData={() => action.getData(runtimeContext)}
            formats={action.formats}
        />
    );
};