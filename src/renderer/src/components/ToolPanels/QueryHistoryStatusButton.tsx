import { useTheme } from "@mui/material";
import { appStatusBarButtons } from "@renderer/app/App";
import { StatusBarButton } from "@renderer/app/StatusBar";
import { useQueryHistory } from "@renderer/contexts/QueryHistoryContext";
import { useTranslation } from "react-i18next";
import * as Messages from '../../app/Messages';
import { useMessages } from "@renderer/contexts/MessageContext";

const QueryHistoryStatusButton: React.FC = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const { queryHistory } = useQueryHistory();
    const { sendMessage } = useMessages();

    return (
        <StatusBarButton
            key="query-history-status-button"
            toolTip={t("queryHistory-status-button-tooltip", "Query History")}
            onClick={() => {
                sendMessage(Messages.TOGGLE_TOOLS_TABS_PANEL, "tools-tabs-panel", "query-history");
            }}
        >
            <theme.icons.QueryHistory />
            <span>{queryHistory.length}</span>
        </StatusBarButton>
    );
};

Promise.resolve().then(() => {
    if (!appStatusBarButtons.static.has("QueryHistoryStatusButton")) {
        appStatusBarButtons.static.set("QueryHistoryStatusButton", QueryHistoryStatusButton);
    }
});

export default QueryHistoryStatusButton;
