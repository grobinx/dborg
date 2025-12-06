import React, { useEffect } from "react";
import { Divider, Menu, MenuItem, Stack, StackProps, useTheme, useThemeProps } from "@mui/material";
import { styled } from '@mui/material/styles';
import ContainerButton, { Placement } from "./ContainerButton";
import { useTranslation } from "react-i18next";
import ViewButton from "./ViewButton";
import { useMessages } from "@renderer/contexts/MessageContext";
import * as Messages from "../Messages";
import { useContainers, View } from "@renderer/contexts/ApplicationContext";
import { resolveIcon } from "@renderer/themes/icons";

const Store_siedBarExpanded = 'siedBarExpanded';

const SideBarRoot = styled(Stack, {
    name: 'SideBar', // The component name
    slot: 'root', // The slot name
})(({ theme }) => ({
    backgroundColor: theme.palette.background.sideBar,
    color: theme.palette.sideBar?.contrastText,
    // ':hover': {
    //     backgroundColor: theme.palette.appSideBar?.light
    // }
}));

export interface SideBarProps extends StackProps {
}

interface SideBarOwnProps extends SideBarProps {
    placement?: Placement,
}

// Utility function to update session storage
const updateSessionStorage = (key: string, value: string) => {
    const currentValue = window.sessionStorage.getItem(key);
    if (currentValue !== value) {
        window.sessionStorage.setItem(key, value);
    }
};

const SideBar: React.FC<SideBarOwnProps> = (props) => {
    const theme = useTheme();
    const { className, placement, children, ...others } = useThemeProps({ name: 'SideBar', props });
    const [horizontal, setHorizontal] = React.useState(false);
    const { t } = useTranslation();
    const [isFocused, setIsFocused] = React.useState(false);
    const { queueMessage, subscribe, unsubscribe } = useMessages();
    const { containers, selectedContainer, views, selectedView } = useContainers();
    const [expanded, setExpanded] = React.useState(window.sessionStorage.getItem(Store_siedBarExpanded) === "true" || false);
    const [contextMenu, setContextMenu] = React.useState<{ mouseX: number, mouseY: number } | null>(null);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => {
        setIsFocused(false);
        document.activeElement instanceof HTMLElement && document.activeElement.blur();
    };

    React.useEffect(() => {
        setHorizontal(["left", "right"].includes(placement ?? "left"));
    }, [placement]);

    useEffect(() => {
        const handleToogleExpand = () => {
            setExpanded((prev) => {
                updateSessionStorage(Store_siedBarExpanded, JSON.stringify(expanded));
                return !prev;
            });
        };

        subscribe(Messages.SIDE_BAR_BUTTON_TOGGLE_EXPAND, handleToogleExpand);
        return () => {
            unsubscribe(Messages.SIDE_BAR_BUTTON_TOGGLE_EXPAND, handleToogleExpand);
        };
    }, []);

    const viewButtons = React.useMemo(() => {
        return views?.map(({ id, icon, label, tooltip }, index) => (
            <ViewButton
                key={id}
                selected={selectedView?.id === id}
                onClick={() => queueMessage(Messages.SWITCH_VIEW, id)}
                icon={resolveIcon(theme, icon)}
                label={label}
                expanded={expanded}
                placement={placement}
                index={index}
                toolTip={tooltip}
            />
        ));
    }, [views, selectedView, theme, expanded, placement]);

    // Handle sidebar context menu
    const handleSideBarContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
        setContextMenu(contextMenu === null ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6 } : null);
    };

    const handleSideBarContextMenuClose = (itemID?: Placement | "expand") => {
        if (itemID === "expand") {
            queueMessage(Messages.SIDE_BAR_BUTTON_TOGGLE_EXPAND);
        } else if (itemID) {
            queueMessage(Messages.CHANGE_SIDE_BAR_PLACEMENT, itemID);
        }
        setContextMenu(null);
    };

    return (
        <SideBarRoot
            {...others}
            direction={horizontal ? "column" : "row"}
            className={(className ?? "") + " SideBar-root" + " placement-" + placement}
            onContextMenu={handleSideBarContextMenu}
            aria-hidden={!isFocused ? true : false}
            onFocus={handleFocus}
            onBlur={handleBlur}
        >
            {containers?.filter(container => container.section === "first").map((container) => {
                return (
                    <ContainerButton
                        key={container.type}
                        selected={selectedContainer?.type === container.type}
                        onClick={() => queueMessage(Messages.SWITCH_CONTAINER, container.type)}
                        expanded={expanded}
                        placement={placement}
                        icon={resolveIcon(theme, container.icon)}
                        label={container.label}
                        toolTip={container.tooltip}
                        disabled={container.disabled ? container.disabled() : false}
                    />
                );
            })}
            <Divider orientation={horizontal ? "horizontal" : "vertical"} flexItem />
            <Stack direction={horizontal ? "column" : "row"}>
                {children}
            </Stack>
            <Stack direction={horizontal ? "column" : "row"} flexGrow={1}>
                {(selectedContainer?.section === "first" && views) && viewButtons}
            </Stack>
            <Stack direction={horizontal ? "column-reverse" : "row-reverse"} flexGrow={1}>
                {(selectedContainer?.section === "last" && views) && viewButtons}
            </Stack>
            <Divider orientation={horizontal ? "horizontal" : "vertical"} flexItem />
            {containers?.filter(container => container.section === "last").map((container) => {
                return (
                    <ContainerButton
                        key={container.type}
                        selected={selectedContainer?.type === container.type}
                        onClick={() => queueMessage(Messages.SWITCH_CONTAINER, container.type)}
                        expanded={expanded}
                        placement={placement}
                        icon={resolveIcon(theme, container.icon)}
                        label={container.label}
                        toolTip={container.tooltip}
                        disabled={container.disabled ? container.disabled() : false}
                    />
                );
            })}
            <Menu
                open={contextMenu !== null}
                onClose={() => handleSideBarContextMenuClose()}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
                aria-hidden={false}
            >
                {["left", "right", "top", "bottom"].map((pos) => (
                    <MenuItem
                        key={pos}
                        onClick={() => handleSideBarContextMenuClose(pos as Placement)}
                        disabled={placement === pos}
                    >
                        {pos.charAt(0).toUpperCase() + pos.slice(1)}
                    </MenuItem>
                ))}
                <Divider />
                <MenuItem onClick={() => handleSideBarContextMenuClose("expand")}>
                    {expanded ? "Collapse" : "Expand"}
                </MenuItem>
            </Menu>
        </SideBarRoot >
    );
}

export default SideBar;
