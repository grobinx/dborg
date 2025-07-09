import React from "react";
import { styled, useTheme } from "@mui/material/styles";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import Tooltip from "@mui/material/Tooltip";
import ToolButton from "../ToolButton";
import { useConsole } from "@renderer/contexts/ConsoleContext";
import { useTranslation } from "react-i18next";
import TabPanelContent, { TabPanelContentProps } from "../TabsPanel/TabPanelContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";

const StyledConsoleLogPanel = styled(List, {
    name: "ConsoleLogPanel",
    slot: "root",
})(({ /*theme*/ }) => ({
    // Add styles for the list container if needed
    height: "100%",
    width: "100%",
    overflowY: "auto",
}));


export const ConsoleLogsPanel: React.FC<TabPanelContentProps> = () => {
    const { logs } = useConsole();
    const { t } = useTranslation();

    return (
        <TabPanelContent>
            <StyledConsoleLogPanel className="ConsoleLogsPanel-root" disablePadding>
                {[...logs].reverse().map((log, index) => (
                    <ListItem
                        key={index}
                        alignItems="flex-start"
                        disablePadding
                        disableGutters
                    >
                        <ListItemText
                            primary={
                                <Typography variant="subtitle2" color="textSecondary">
                                    {t("level", "Level")}: {log.level.toUpperCase()}
                                </Typography>
                            }
                            secondary={
                                <Typography variant="body2" color="textPrimary">
                                    {Array.isArray(log.message) ? log.message.join(" ") : String(log.message)}
                                </Typography>
                            }
                        />
                    </ListItem>
                ))}
            </StyledConsoleLogPanel>
        </TabPanelContent>
    );
};

export const ConsoleLogsPanelLabel: React.FC = () => {
    return (
        <TabPanelLabel>
            <span>Console Logs</span>
        </TabPanelLabel>
    );
};

export const ConsoleLogsPanelButtons: React.FC = () => {
    const { logs } = useConsole();
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <TabPanelButtons>
            <Tooltip title={t("consoleLogs-clear-all", "Clear console logs")}>
                <span>
                    <ToolButton
                        disabled={logs.length === 0}
                        onClick={() => console.clear()}
                    >
                        <theme.icons.Delete />
                    </ToolButton>
                </span>
            </Tooltip>
        </TabPanelButtons>
    );
};

export default ConsoleLogsPanel;