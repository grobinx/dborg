import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import ActionButton from "@renderer/components/CommandPalette/ActionButton";
import { resolveIcon } from "@renderer/themes/icons";
import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import { styled, useThemeProps } from "@mui/material/styles";
import { isITextField, ITitleSlot, resolveActionsFactory, resolveReactNodeFactory } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import { useRefSlot } from "./RefSlotContext";
import { ActionDescriptor, isActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import ToolTextField from "@renderer/components/ToolTextField";
import { isCommandDescriptor } from "@renderer/components/CommandPalette/CommandManager";
import { useActionComponents } from "./helpers";

interface TitleSlotProps extends Omit<React.ComponentProps<typeof Box>, "slot"> {
}

interface TitleSlotOwnProps extends TitleSlotProps {
    slot: ITitleSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const StyledTitleSlot = styled(Box)(() => ({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 4,
    paddingLeft: 4,
}));

const TitleSlot: React.FC<TitleSlotOwnProps> = (props) => {
    const { slot, ref, className, ...other } = useThemeProps({ name: "TitleSlot", props });
    const theme = useTheme();
    const { t } = useTranslation();
    const [title, setTitle] = React.useState<React.ReactNode>(null);
    const [refresh, setRefresh] = React.useState(false);
    const [icon, setIcon] = React.useState<React.ReactNode>(null);
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const { getRefSlot } = useRefSlot();
    const { actionComponents, actionManager, commandManager } =
        useActionComponents(slot.actions, slot.actionSlotId, getRefSlot, refreshSlot, {}, refresh);

    React.useEffect(() => {
        setTitle(resolveReactNodeFactory(slot.title, refreshSlot) ?? "");
        setIcon(resolveIcon(theme, slot.icon));
    }, [slot.title, slot.icon, refresh]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, () => {
            setRefresh(prev => !prev);
        });
        return unregisterRefresh;
    }, [slot.id]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (commandManager && commandManager.executeCommand(event, {})) {
            event.preventDefault();
            return;
        }
        if (actionManager && actionManager.executeActionByKeybinding(event, {})) {
            event.preventDefault();
            return;
        }
    };

    const isSimpleTitle = ["string", "number", "boolean"].includes(typeof title);

    return (
        <StyledTitleSlot
            ref={ref}
            className={`TitleSlot-root ${className ?? ""}`}
            onKeyDown={handleKeyDown}
            {...other}
        >
            {icon}
            {isSimpleTitle ? (
                <Typography
                    variant="subtitle2"
                    noWrap
                    sx={{
                        maxWidth: 320,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                    }}
                >
                    {title}
                </Typography>
            ) : (
                title
            )}
            <div style={{ flexGrow: 1 }} />
            {actionComponents.length > 0 && (
                <TabPanelButtons>
                    {actionComponents}
                </TabPanelButtons>
            )}
        </StyledTitleSlot>
    );
};

export default TitleSlot;