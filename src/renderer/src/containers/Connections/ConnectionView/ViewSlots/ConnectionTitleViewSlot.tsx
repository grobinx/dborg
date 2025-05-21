import React from "react";
import { Box, Typography, IconButton, Stack, useTheme } from "@mui/material";
import { TitleConnectionViewSlot } from "plugins/manager/renderer/Plugin";
import { useTranslation } from "react-i18next";
import ActionButton from "@renderer/components/CommandPalette/ActionButton";
import { resolve } from "path";
import { resolveIcon } from "@renderer/themes/icons";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import { styled } from "@mui/material/styles";

const StyledConnectionTitleViewSlot = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 4,
    paddingLeft: 4,
}));

interface ConnectionTitleViewSlotProps {
    slot: TitleConnectionViewSlot;
    session: IDatabaseSession;
    ref?: React.Ref<HTMLDivElement>;
    dataGridRef?: React.RefObject<DataGridActionContext<any> | null>;
}

export const ConnectionTitleViewSlot: React.FC<ConnectionTitleViewSlotProps> = ({
    slot, session, ref, dataGridRef
}) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <StyledConnectionTitleViewSlot ref={ref}>
            {slot.icon && resolveIcon(theme, slot.icon)}
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
                {typeof slot.title === "function" ? slot.title() : slot.title}
            </Typography>
            <div style={{ flexGrow: 1 }} />
            {slot.actions && slot.actions.length > 0 && (
                <TabPanelButtons>
                    {slot.actions.map((action) => {
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

export default ConnectionTitleViewSlot;