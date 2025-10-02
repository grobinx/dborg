import React from "react";
import { StatusBarButton } from "@renderer/app/StatusBar";
import { Messages, useMessages } from "@renderer/contexts/MessageContext";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { SchemaRecord } from "@renderer/app/SchemaConnectionManager";
import * as api from "../../../../api/db";
import { appStatusBarButtons } from "@renderer/app/AppStatusBarRegistry";

interface ConnectionStatus {
    status: "connecting" | "connected" | "error";
    name: string;
}

const ConnectionStatusBar: React.FC = () => {
    const theme = useTheme();
    const { subscribe, unsubscribe } = useMessages();
    const [connectionStatuses, setConnectionStatuses] = React.useState<Record<string, ConnectionStatus>>({});
    const [iconStates, setIconStates] = React.useState<Record<string, boolean>>({}); // Przechowuje stan ikon (true = Connected, false = Disconnected)
    const { t } = useTranslation();

    React.useEffect(() => {
        const connectionInfoHandle = (schema: SchemaRecord) => {
            setConnectionStatuses((prev) => ({
                ...prev,
                [schema.sch_id]: {
                    status: "connecting",
                    name: schema.sch_name,
                },
            }));

            // Ustaw przełączanie ikon dla statusu "connecting"
            setIconStates((prev) => ({
                ...prev,
                [schema.sch_id]: true, // Domyślnie zaczynamy od ikony "Connected"
            }));
        };

        const connectionSuccessHandle = (connectionInfo: api.ConnectionInfo) => {
            const schema = (connectionInfo.userData['schema'] as SchemaRecord)
            setConnectionStatuses((prev) => ({
                ...prev,
                [schema.sch_id]: {
                    status: "connected",
                    name: schema.sch_name,
                },
            }));

            setIconStates((prev) => {
                const updated = { ...prev };
                delete updated[schema.sch_id];
                return updated;
            });

            // Usuń status po 5 sekundach
            setTimeout(() => {
                setConnectionStatuses((prev) => {
                    const updated = { ...prev };
                    delete updated[schema.sch_id];
                    return updated;
                });
            }, 5000);
        };

        const connectionErrorHandle = (_error: any, schema: SchemaRecord) => {
            setConnectionStatuses((prev) => ({
                ...prev,
                [schema.sch_id]: {
                    status: "error",
                    name: schema.sch_name,
                },
            }));

            setIconStates((prev) => {
                const updated = { ...prev };
                delete updated[schema.sch_id];
                return updated;
            });
            // Usuń status po 5 sekundach
            setTimeout(() => {
                setConnectionStatuses((prev) => {
                    const updated = { ...prev };
                    delete updated[schema.sch_id];
                    return updated;
                });
            }, 5000);
        };

        const connectionCancelHandle = (schema: SchemaRecord) => {
            setConnectionStatuses((prev) => {
                const updated = { ...prev };
                delete updated[schema.sch_id]; // Usuń status dla danego schematu
                return updated;
            });
            setIconStates((prev) => {
                const updated = { ...prev };
                delete updated[schema.sch_id];
                return updated;
            });
        };

        // Rejestracja wiadomości
        subscribe(Messages.SCHEMA_CONNECT_INFO, connectionInfoHandle);
        subscribe(Messages.SCHEMA_CONNECT_SUCCESS, connectionSuccessHandle);
        subscribe(Messages.SCHEMA_CONNECT_ERROR, connectionErrorHandle);
        subscribe(Messages.SCHEMA_CONNECT_CANCEL, connectionCancelHandle);

        return () => {
            // Wyrejestrowanie wiadomości
            unsubscribe(Messages.SCHEMA_CONNECT_INFO, connectionInfoHandle);
            unsubscribe(Messages.SCHEMA_CONNECT_SUCCESS, connectionSuccessHandle);
            unsubscribe(Messages.SCHEMA_CONNECT_ERROR, connectionErrorHandle);
            unsubscribe(Messages.SCHEMA_CONNECT_CANCEL, connectionCancelHandle);
        };
    }, [subscribe, unsubscribe]);

    // Ustaw interwał do przełączania ikon dla statusu "connecting"
    React.useEffect(() => {
        const intervalId = setInterval(() => {
            setIconStates((prev) => {
                const updated = { ...prev };
                Object.keys(connectionStatuses).forEach((sch_id) => {
                    if (connectionStatuses[sch_id].status === "connecting") {
                        updated[sch_id] = !prev[sch_id]; // Przełączaj między true i false
                    }
                });
                return updated;
            });
        }, 500);

        return () => clearInterval(intervalId); // Wyczyszczenie interwału przy odmontowaniu komponentu
    }, [connectionStatuses]);

    if (Object.keys(connectionStatuses).length === 0) {
        return null;
    }

    return (
        <>
            {Object.entries(connectionStatuses).map(([sch_id, status]) => (
                <StatusBarButton key={sch_id}>
                    {status.status === "connecting" && <theme.icons.Loading />}
                    {status.status === "connecting" && (
                        <>
                            {iconStates[sch_id] ? (
                                <theme.icons.Connected />
                            ) : (
                                <theme.icons.Disconnected />
                            )}
                        </>
                    )}
                    {status.status === "connected" && <theme.icons.Connected />}
                    {status.status === "error" && <theme.icons.Error />}
                    <span>{status.name}</span>
                </StatusBarButton>
            ))}
        </>
    );
};

Promise.resolve().then(() => {
    if (!appStatusBarButtons.hidden.has("ConnectionStatusBar")) {
        appStatusBarButtons.hidden.set("ConnectionStatusBar", ConnectionStatusBar);
    }
});

export default ConnectionStatusBar;