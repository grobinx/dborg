import React from "react";
import { Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import ActionButton from "@renderer/components/CommandPalette/ActionButton";
import { resolveIcon } from "@renderer/themes/icons";
import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import { styled } from "@mui/material/styles";
import { ITitleSlot, resolveActionIdsFactory, resolveReactNodeFactory } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";

const StyledConnectionTitleViewSlot = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 4,
    paddingLeft: 4,
}));

interface TitleSlotProps {
    slot: ITitleSlot;
    ref?: React.Ref<HTMLDivElement>;
    dataGridRef?: React.RefObject<DataGridActionContext<any> | null>;
}

const TitleSlot: React.FC<TitleSlotProps> = ({
    slot, ref, dataGridRef
}) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const [actions, setActions] = React.useState<string[]>([]);
    const [title, setTitle] = React.useState<React.ReactNode | null>(null);
    const [refresh, setRefresh] = React.useState(false);
    const [icon, setIcon] = React.useState<React.ReactNode | null>(null);
    const { registerRefresh, refreshSlot } = useRefreshSlot();

    React.useEffect(() => {
        setActions(resolveActionIdsFactory(slot.actions, refreshSlot) ?? []);
        setTitle(resolveReactNodeFactory(slot.title, refreshSlot) ?? "");
        setIcon(resolveIcon(theme, slot.icon));
    }, [slot.actions, slot.title, slot.icon, refresh]);

    React.useEffect(() => {
        const unregister = registerRefresh(slot.id, () => {
            setTimeout(() => {
                setRefresh(prev => !prev);
            }, 0);
        });
        return unregister;
    }, [slot.id]);

    const isSimpleTitle = ["string", "number", "boolean"].includes(typeof title);

    return (
        <StyledConnectionTitleViewSlot ref={ref} key={slot.id}>
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
        </StyledConnectionTitleViewSlot>
    );
};

export default TitleSlot;