import React from "react";
import { Box, Stack, StackProps, styled, Typography, TypographyProps, useThemeProps, useTheme } from "@mui/material";
import { IconWrapper, IconWrapperOwnProps, IconWrapperProps, IconWrapperSize } from "@renderer/themes/icons";
import { DriverInfo } from "src/api/db";
import { useTranslation } from "react-i18next";
import { useDialogs } from "@toolpad/core";
import DriverInfoDialog from "@renderer/dialogs/DriverInfoDialog";
import Tooltip from "@renderer/components/Tooltip";
import { ToolButton } from "@renderer/components/buttons/ToolButton";

const iconSizes: Record<IconWrapperSize, number> = {
    small: 32,
    medium: 64,
    large: 128,
};

const DriverSummaryIconStyled = styled(IconWrapper)(({ size, theme }) => ({
    width: iconSizes[size ?? "medium"],
    height: iconSizes[size ?? "medium"],
    transition: theme.transitions.create(["width", "height"], {
        duration: theme.transitions.duration.standard,
    }),
}));

export function DriverSummaryIcon(props: IconWrapperOwnProps): React.JSX.Element {
    const { className, ...other } = useThemeProps({ name: "IconWrapper", props });
    return (
        <DriverSummaryIconStyled {...other} className={(className ?? "") + " DriverSummary-icon"}>
            {props.children}
        </DriverSummaryIconStyled>
    );
}

export interface DriverSummaryProps extends StackProps {
    driver?: DriverInfo;
    slotProps?: {
        driverIcon?: IconWrapperOwnProps;
        driverName?: TypographyProps;
        driverDescription?: TypographyProps;
    };
}

export default function DriverSummary(props: DriverSummaryProps): React.JSX.Element {
    const theme = useTheme();
    const { className, driver, slotProps, ...other } = useThemeProps({ name: "DriverSummary", props });
    const dialogs = useDialogs();
    const { t } = useTranslation();

    return (
        <Stack className={(className ?? "") + " DriverSummary-root"} {...other}>
            {driver ? ([
                <Box key="icon">
                    <DriverSummaryIcon {...slotProps?.driverIcon}>
                        <img
                            src={driver.icon}
                            width={iconSizes[slotProps?.driverIcon?.size ?? "medium"]}
                            height={iconSizes[slotProps?.driverIcon?.size ?? "medium"]}
                            alt={`${driver.name} icon`}
                        />
                    </DriverSummaryIcon>
                </Box>,
                <Box textAlign="left" key="text">
                    <Typography variant="h5" {...slotProps?.driverName}>
                        {driver.name}
                    </Typography>
                    <Typography variant="body1" {...slotProps?.driverDescription}>
                        {driver.description}
                    </Typography>
                </Box>,
                <Box key="buttons">
                    <Tooltip title={t("driver-info", "Driver information")}>
                        <ToolButton
                            component="div"
                            aria-label="driver info"
                            onClick={event => {
                                event.stopPropagation();
                                dialogs.open(DriverInfoDialog, { driver });
                            }}
                            color="info"
                        >
                            <theme.icons.Info />
                        </ToolButton>
                    </Tooltip>
                </Box>
            ]) : (
                <Typography>No driver</Typography>
            )}
        </Stack>
    );
}
