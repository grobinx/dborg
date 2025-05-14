import React from "react";
import { Stack, styled, Tooltip, useTheme, useThemeProps, Badge } from "@mui/material"; // Importuj Badge z Material-UI
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import ToolButton from "@renderer/components/ToolButton";
import { useTranslation } from "react-i18next";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { Messages, useMessages } from "@renderer/contexts/MessageContext";
import { EditorsTabs } from "./ConnectionView/EdiorsTabs";
import { SplitPanel, SplitPanelGroup, Splitter } from "@renderer/components/SplitPanel";
import { UseListenersType } from "@renderer/hooks/useListeners";
import "./ConnectionStatusBar";
import ResultsTabs from "./ConnectionView/ResultsTabs";
import { SQL_RESULT_SQL_QUERY_EXECUTING } from "./ConnectionView/SqlResultPanel";
import UnboundBadge from "@renderer/components/UnboundBadge";
import EditorContentManager from "@renderer/contexts/EditorContentManager";

const StyledConnection = styled(Stack, {
    name: "Connection",
    slot: "root",
})(({ /*theme*/ }) => ({
    // Add styles for the list container if needed
    height: "100%",
}));

export interface ConnectionProps extends React.ComponentProps<typeof StyledConnection> {
}

interface ConnectionsOwnProps extends ConnectionProps {
    session: IDatabaseSession;
}

export const ConnectionContent: React.FC<ConnectionsOwnProps> = (props) => {
    const { session, ...other } = useThemeProps({ name: "Connection", props });

    // Utwórz instancję EditorContentManager
    const editorContentManager = React.useMemo(() => new EditorContentManager(session.schema.sch_id), [session.schema.sch_id]);

    return (
        <StyledConnection className="Connection-root" {...other}>
            <SplitPanelGroup direction="vertical" autoSaveId={`connection-panel-${session.schema.sch_id}`}>
                <SplitPanel>
                    <EditorsTabs session={session} editorContentManager={editorContentManager} />
                </SplitPanel>
                <Splitter />
                <SplitPanel defaultSize={20}>
                    <ResultsTabs session={session} />
                </SplitPanel>
            </SplitPanelGroup>
        </StyledConnection>
    );
};

export const ConnectionButtons: React.FC<{ session: IDatabaseSession }> = ({ session }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const { sendMessage } = useMessages();

    return (
        <TabPanelButtons>
            <Tooltip title={t("disconnect", "Close connection")}>
                <span>
                    <ToolButton
                        color="warning"
                        onClick={() => sendMessage(Messages.SCHEMA_DISCONNECT, session.info.uniqueId)}
                    >
                        <theme.icons.Disconnected />
                    </ToolButton>
                </span>
            </Tooltip>
        </TabPanelButtons>
    );
};

export const ConnectionLabel: React.FC<{ session: IDatabaseSession }> = ({ session }) => {
    const theme = useTheme();
    const [executingFromList, setExecutingFromList] = React.useState<string[]>([]); // Lista message.from
    const [showLoading, setShowLoading] = React.useState(false); // Stan dla opóźnionego efektu ładowania
    const { subscribe, unsubscribe } = useMessages();

    React.useEffect(() => {
        const handleQueryExecuting = (message: { to: string; from: string; status: boolean }) => {
            if (message.to !== session.info.uniqueId) {
                return; // Ignoruj wiadomości, które nie są skierowane do tego połączenia
            }

            setExecutingFromList((prevList) => {
                if (message.status) {
                    // Dodaj `from` do listy, jeśli status to true
                    return prevList.includes(message.from) ? prevList : [...prevList, message.from];
                } else {
                    // Usuń `from` z listy, jeśli status to false
                    return prevList.filter((from) => from !== message.from);
                }
            });
        };

        subscribe(SQL_RESULT_SQL_QUERY_EXECUTING, handleQueryExecuting);

        return () => {
            unsubscribe(SQL_RESULT_SQL_QUERY_EXECUTING, handleQueryExecuting);
        };
    }, [session.info.uniqueId]);

    React.useEffect(() => {
        let timeout: NodeJS.Timeout | null = null;

        if (executingFromList.length > 0) {
            timeout = setTimeout(() => {
                setShowLoading(true); // Pokaż efekt ładowania po 1000 ms
            }, 1000);
        } else {
            setShowLoading(false); // Ukryj efekt ładowania natychmiast, gdy lista jest pusta
            if (timeout) {
                clearTimeout(timeout);
            }
        }

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [executingFromList]);

    return (
        <TabPanelLabel>
            {showLoading ? (
                <>
                    <theme.icons.Loading key="icon" />
                    {executingFromList.length > 1 && <UnboundBadge key="badge" content={executingFromList.length} size="small" />}
                </>
            ) : session.info.connected ? (
                <theme.icons.Connected /> // Wyświetl ikonę Connected, gdy połączenie jest aktywne
            ) : (
                <theme.icons.Disconnected /> // Wyświetl ikonę Disconnected, gdy połączenie jest nieaktywne
            )}
            <span style={{ color: session.schema.sch_color }}>{session.schema.sch_name}</span>
        </TabPanelLabel>
    );
};
