import React from "react";
import { StatusBarButton } from "@renderer/app/StatusBar";
import { useTheme } from "@mui/material";
import { appStatusBarButtons } from "@renderer/app/AppStatusBarRegistry";
import { useProfiles } from "@renderer/contexts/ProfilesContext";
import { ProfileRecord } from "../../../../api/entities";

interface ConnectionStatus {
    status: "connecting" | "connected" | "error";
    name: string;
}

const ConnectionStatusBarButton: React.FC = () => {
    const theme = useTheme();
    const [connectionStatuses, setConnectionStatuses] = React.useState<Record<string, ConnectionStatus>>({});
    const [iconStates, setIconStates] = React.useState<Record<string, boolean>>({}); // Przechowuje stan ikon (true = Connected, false = Disconnected)
    const { onEvent } = useProfiles();

    React.useEffect(() => {
        const connectionInfoHandle = (profile: ProfileRecord) => {
            setConnectionStatuses((prev) => ({
                ...prev,
                [profile.sch_id]: {
                    status: "connecting",
                    name: profile.sch_name,
                },
            }));

            // Ustaw przełączanie ikon dla statusu "connecting"
            setIconStates((prev) => ({
                ...prev,
                [profile.sch_id]: true, // Domyślnie zaczynamy od ikony "Connected"
            }));
        };

        const connectionSuccessHandle = (profile: ProfileRecord) => {
            setConnectionStatuses((prev) => ({
                ...prev,
                [profile.sch_id]: {
                    status: "connected",
                    name: profile.sch_name,
                },
            }));

            setIconStates((prev) => {
                const updated = { ...prev };
                delete updated[profile.sch_id];
                return updated;
            });

            // Usuń status po 5 sekundach
            setTimeout(() => {
                setConnectionStatuses((prev) => {
                    const updated = { ...prev };
                    delete updated[profile.sch_id];
                    return updated;
                });
            }, 5000);
        };

        const connectionErrorHandle = (_error: any, profile: ProfileRecord) => {
            setConnectionStatuses((prev) => ({
                ...prev,
                [profile.sch_id]: {
                    status: "error",
                    name: profile.sch_name,
                },
            }));

            setIconStates((prev) => {
                const updated = { ...prev };
                delete updated[profile.sch_id];
                return updated;
            });
            // Usuń status po 5 sekundach
            setTimeout(() => {
                setConnectionStatuses((prev) => {
                    const updated = { ...prev };
                    delete updated[profile.sch_id];
                    return updated;
                });
            }, 5000);
        };

        const connectionCancelHandle = (profile: ProfileRecord) => {
            setConnectionStatuses((prev) => {
                const updated = { ...prev };
                delete updated[profile.sch_id]; // Usuń status dla danego profilu
                return updated;
            });
            setIconStates((prev) => {
                const updated = { ...prev };
                delete updated[profile.sch_id];
                return updated;
            });
        };

        const offEvent = onEvent("connecting", (event) => {
            const profile = event.profile;
            switch (event.status) {
                case "started":
                    connectionInfoHandle(profile);
                    break;
                case "success":
                    connectionSuccessHandle(profile);
                    break;
                case "error":
                    connectionErrorHandle(event.error, profile);
                    break;
                case "cancel":
                    connectionCancelHandle(profile);
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
    if (!appStatusBarButtons.hidden.has("ConnectionStatusBarButton")) {
        appStatusBarButtons.hidden.set("ConnectionStatusBarButton", ConnectionStatusBarButton);
    }
});

export default ConnectionStatusBarButton;