import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import ActionButton from "@renderer/components/CommandPalette/ActionButton";
import { resolveIcon } from "@renderer/themes/icons";
import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import { styled, useThemeProps } from "@mui/material/styles";
import { ITitleSlot, resolveActionIdsFactory, resolveReactNodeFactory } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import { useRefSlot } from "./RefSlotContext";

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
    const [actions, setActions] = React.useState<string[]>([]);
    const [title, setTitle] = React.useState<React.ReactNode | null>(null);
    const [refresh, setRefresh] = React.useState(false);
    const [icon, setIcon] = React.useState<React.ReactNode | null>(null);
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const { getRefSlot } = useRefSlot();

    React.useEffect(() => {
        setActions(resolveActionIdsFactory(slot.actions, refreshSlot) ?? []);
        setTitle(resolveReactNodeFactory(slot.title, refreshSlot) ?? "");
        setIcon(resolveIcon(theme, slot.icon));
    }, [slot.actions, slot.title, slot.icon, refresh]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, () => {
            setRefresh(prev => !prev);
        });
        return unregisterRefresh;
    }, [slot.id]);

    const isSimpleTitle = ["string", "number", "boolean"].includes(typeof title);

    return (
        <StyledTitleSlot
            ref={ref}
            key={slot.id}
            className={`TitleSlot-root ${className ?? ""}`}
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
            {actions.length > 0 && (
                <TabPanelButtons>
                    {actions.map((action) => {
                        if (!slot.actionSlotId) return null;
                        const dataGridRef = getRefSlot<DataGridActionContext<any>>(slot.actionSlotId, "datagrid");
                        const context = dataGridRef?.current;
                        const actionManager = context?.actionManager();
                        if (!actionManager || !context) return null;
                        return (
                            <ActionButton
                                key={action}
                                actionId={action}
                                getContext={() => context}
                                actionManager={actionManager}
                            />
                        );
                    })}
                </TabPanelButtons>
            )}
        </StyledTitleSlot>
    );
};

export default TitleSlot;