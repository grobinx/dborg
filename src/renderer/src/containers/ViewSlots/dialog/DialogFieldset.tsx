import React from "react";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export const DialogFieldset: React.FC<{
    label?: string | null;
    children: React.ReactNode;
    sx?: SxProps<Theme>;
    legendSx?: SxProps<Theme>;
}> = ({ label, children, sx, legendSx }) => {
    if (!label) return <>{children}</>;

    return (
        <Box
            component="fieldset"
            sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                px: 8,
                pt: 8,
                pb: 6,
                m: 0,
                minWidth: 0,
                ...sx,
            }}
        >
            <Typography
                component="legend"
                variant="label"
                sx={{ px: 4, ...legendSx }}
            >
                {label}
            </Typography>
            {children}
        </Box>
    );
};