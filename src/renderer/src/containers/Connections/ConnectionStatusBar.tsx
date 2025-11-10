import React from "react";
import { StatusBarButton } from "@renderer/app/StatusBar";
import { Messages, useMessages } from "@renderer/contexts/MessageContext";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import * as api from "../../../../api/db";
import { appStatusBarButtons } from "@renderer/app/AppStatusBarRegistry";
import { ProfileRecord, useProfiles } from "@renderer/contexts/ProfilesContext";

interface ConnectionStatus {
    status: "connecting" | "connected" | "error";
    name: string;
}

const ConnectionStatusBar: React.FC = () => {
    const theme = useTheme();
    const [connectionStatuses, setConnectionStatuses] = React.useState<Record<string, ConnectionStatus>>({});
    const [iconStates, setIconStates] = React.useState<Record<string, boolean>>({}); // Przechowuje stan ikon (true = Connected, false = Disconnected)
    const { onEvent } = useProfiles();

    React.useEffect(() => {
        const connectionInfoHandle = (schema: ProfileRecord) => {
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

        const connectionSuccessHandle = (schema: ProfileRecord) => {
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

        const connectionErrorHandle = (_error: any, schema: ProfileRecord) => {
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

        const connectionCancelHandle = (schema: ProfileRecord) => {
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

        const offEvent = onEvent("connecting", (event) => {
            const schema = event.schema;
            switch (event.status) {
                case "started":
                    connectionInfoHandle(schema);
                    break;
                case "success":
                    connectionSuccessHandle(schema);
                    break;
                case "error":
                    connectionErrorHandle(event.error, schema);
                    break;
                case "cancel":
                    connectionCancelHandle(schema);
                    break;
            }
        });
        return offEvent;
    }, []);

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