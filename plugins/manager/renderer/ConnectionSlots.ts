import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { ContentSlotKindFactory, ISlot, TabSlotsFactory, ContentSlotFactory, ActionsFactory, DialogsSlotFactory, IPinnableTabSlot, ITabSlot } from "./CustomSlots";

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

/**
 * Type representing the different types of connection actions that can be registered by plugins
 */
export type ConnectionActionType =
    /** Editor on universal SQL Editor tab */
    | "sql-editor"
    /** Result grid on universal SQL Result tab */
    | "sql-result"
    ;

export interface ConnectionActions<T> {
    /**
     * List of actions to be registered for the specified type. Each action includes an ID, label, optional icon, optional key sequence, and a run function that defines the behavior when the action is executed.
     */
    actions: ActionsFactory<T>;
    /**
     * Optional dialogs slot factory for actions that require user input through dialogs. This allows plugins to provide custom dialog components for their actions, enhancing the user experience when interacting with the plugin's features.
     */
    dialogs?: DialogsSlotFactory;
}

/**
 * Interface representing a callback function for registering actions
 * @param session The database session for which the actions are being registered
 */
export type ConnectionActionsFactory<T> = (session: IDatabaseSession) => ConnectionActions<T> | null;

/**
 * Interface representing a connection sql result tab slot
 */
export interface ConnectionSqlResultTab extends ITabSlot {}

export type ConnectionSqlResultTabFactory = (session: IDatabaseSession) => ConnectionSqlResultTab[] | null;