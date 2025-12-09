import { ContentSlotKindFactory, ISlot, TabSlotsFactory, ContentSlotFactory } from "./CustomSlots";

export type ConnectionViewSlotType =
    "integrated"
    | "root";

export type ConnectionViewSlotKind = IConnectionIntegratedSlot | IConnectionRootSlot;

/**
 * Interface representing a connection view slot
 */
export interface IConnectionViewSlot extends ISlot {
    /**
     * Type of the slot
     */
    type: ConnectionViewSlotType;
}

export interface IConnectionRootSlot extends IConnectionViewSlot {
    type: "root";
    slot: ContentSlotKindFactory;
}

export interface IConnectionIntegratedSlot extends IConnectionViewSlot {
    type: "integrated";
    side?: ContentSlotFactory;
    editors?: TabSlotsFactory;
    results?: TabSlotsFactory;
}
