import { TAB_PANEL_CHANGED, TAB_PANEL_CLICK, TAB_PANEL_LENGTH, TabPanelChangedMessage } from "@renderer/app/Messages";
import { useMessages } from "@renderer/contexts/MessageContext";
import { useEffect, useRef, useState } from "react";

export const useTabs = (
    tabsItemID: string | undefined, 
    itemID: string | undefined,
    onTabClick?: () => void
) => {
    const [active, setActive] = useState(false);
    const activeRef = useRef(active);
    const [length, setLength] = useState(0);
    const { subscribe } = useMessages();

    useEffect(() => {
        activeRef.current = active;
    }, [active]);

    useEffect(() => {
        const handleSwitchTabMessage = (message: TabPanelChangedMessage) => {
            if (tabsItemID === message.tabsItemID) {
                setActive(message.itemID === itemID);
            }
        };

        const handleTabPanelClick = (message: TabPanelChangedMessage) => {
            if (tabsItemID === message.tabsItemID && message.itemID === itemID && onTabClick) {
                onTabClick();
            }
        };

        const handleTabsLengthChange = (message: { tabsItemID: string; length: number }) => {
            if (tabsItemID === message.tabsItemID) {
                setLength(message.length);
            }
        };

        const unsubscribeSwitchTabMessage = subscribe(TAB_PANEL_CHANGED, handleSwitchTabMessage);
        const unsubscribeTabClick = subscribe(TAB_PANEL_CLICK, handleTabPanelClick);
        const unsubscribeTabLength = subscribe(TAB_PANEL_LENGTH, handleTabsLengthChange);

        return () => {
            unsubscribeSwitchTabMessage();
            unsubscribeTabClick();
            unsubscribeTabLength();
        };
    }, [tabsItemID, itemID, onTabClick]);

    return { 
        tabIsActive: active,
        tabIsActiveRef: activeRef,
        tabsCount: length 
    };
};

