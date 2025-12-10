import { ExportFormat, exportToClipboard, exportFormats } from "@renderer/utils/arrayTo";
import React from "react";
import ButtonGroup from "./buttons/ButtonGroup";
import { ToolButton } from "./buttons/ToolButton";
import { useTheme, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import Tooltip from "./Tooltip";
import { useTranslation } from "react-i18next";

export interface CopyDataButtonProps<T extends Record<string, any> = Record<string, any>> {
    getData: () => T[];
    formats?: ExportFormat[];
    defaultFormat?: ExportFormat;
}

export const CopyDataButton = <T extends Record<string, any> = Record<string, any>,>(props: CopyDataButtonProps<T>) => {
    const {
        getData,
        formats,
        defaultFormat = "csv",
    } = props;

    const theme = useTheme();
    const { t } = useTranslation();
    const [selectedFormat, setSelectedFormat] = React.useState<ExportFormat>(defaultFormat);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const availableFormats = formats ?? (Object.keys(exportFormats) as ExportFormat[]);

    const handleCopy = async (format: ExportFormat) => {
        const data = getData();
        await exportToClipboard(data, format as any);
        setSelectedFormat(format);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMenuItemClick = async (format: ExportFormat) => {
        await handleCopy(format);
        handleMenuClose();
    };

    return (
        <>
            <ButtonGroup>
                <Tooltip title={t("copy-as", "Copy as {{format}}", { format: exportFormats[selectedFormat].label })}>
                    <ToolButton
                        onClick={() => handleCopy(selectedFormat)}
                        size="small"
                    >
                        <theme.icons.Copy />
                    </ToolButton>
                </Tooltip>
                <Tooltip title={t("select-format-and-export", "Select format and export")}>
                    <ToolButton
                        onClick={handleMenuOpen}
                        size="small"
                    >
                        <theme.icons.ExpandMore />
                    </ToolButton>
                </Tooltip>
            </ButtonGroup>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                {availableFormats.map((format) => (
                    <MenuItem
                        key={format}
                        selected={format === selectedFormat}
                        onClick={() => handleMenuItemClick(format)}
                    >
                        <ListItemText primary={exportFormats[format].label} />
                    </MenuItem>
                ))}
            </Menu>
        </>
    )
}
