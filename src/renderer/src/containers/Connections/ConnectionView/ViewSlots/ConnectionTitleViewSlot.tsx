import React from "react";
import { Box, Typography, IconButton, Stack, useTheme } from "@mui/material";
import { TitleConnectionViewSlot } from "plugins/manager/renderer/Plugin";
import { useTranslation } from "react-i18next";
import ActionButton from "@renderer/components/CommandPalette/ActionButton";
import { resolve } from "path";
import { resolveIcon } from "@renderer/themes/icons";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";

interface ConnectionTitleViewSlotProps {
    slot: TitleConnectionViewSlot;
    session: IDatabaseSession;
    ref?: React.Ref<HTMLDivElement>;
}

export const ConnectionTitleViewSlot: React.FC<ConnectionTitleViewSlotProps> = ({ slot, session, ref }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <Stack ref={ref} direction="row" alignItems="center">
            {slot.icon && resolveIcon(theme, slot.icon)}
            <Typography variant="h6">
                {slot.tKey ? t(slot.tKey, slot.title) : slot.title}
            </Typography>
            {/* {slot.actions && slot.actions.length > 0 && (
                <Stack direction="row" spacing={1}>
                    {slot.actions.map((btn) => (
                        <ActionButton
                            key={btn.id}
                            actionId={btn.id}
                            variant="text"
                            size="small"
                            color="inherit"
                            onClick={(e) => {
                                e.stopPropagation();
                                btn.action();
                            }}
                        />
                    ))}
                </Stack>
            )} */}
        </Stack>
    );
};

export default ConnectionTitleViewSlot;