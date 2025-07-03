import React from "react";
import { StatusBarButton } from "@renderer/app/StatusBar";
import { Messages, useMessages } from "@renderer/contexts/MessageContext";
import { useTheme, Menu, MenuItem, IconButton, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { useTranslation } from "react-i18next";
import { appStatusBarButtons } from "@renderer/app/App";
import ToolButton from "@renderer/components/ToolButton";

interface GetMetadataStatus {
    status: "start" | "process" | "error" | "success" | "end";
    name: string;
    progress: string;
}

const MetadataCollctorStatusBar: React.FC = () => {
    const theme = useTheme();
    const { subscribe, unsubscribe } = useMessages();
    const [metadataStatuses, setMetadataStatuses] = React.useState<Record<string, GetMetadataStatus>>({});
    const { t } = useTranslation();

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleCancel = (connectionId: string) => {
        // Wyślij wiadomość anulowania (przykład)
        console.log(`Canceling metadata collection for connection: ${connectionId}`);
        // Możesz tutaj dodać logikę anulowania
    };

    React.useEffect(() => {
        const metadataStartHandle = (message: Messages.SessionGetMetadataStart) => {
            setMetadataStatuses((prev) => ({
                ...prev,
                [message.connectionId]: {
                    status: "start",
                    name: message.schema.sch_name,
                    progress: t("started", "Started"),
                },
            }));
        };

        const metadataProgressHandle = (message: Messages.SessionGetMetadataProgress) => {
            setMetadataStatuses((prev) => ({
                ...prev,
                [message.connectionId]: {
                    status: "process",
                    name: prev[message.connectionId].name,
                    progress: message.progress,
                },
            }));
        };

        const connectionErrorHandle = (message: Messages.SessionGetMetadataError) => {
            setMetadataStatuses((prev) => ({
                ...prev,
                [message.connectionId]: {
                    status: "error",
                    name: prev[message.connectionId].name,
                    progress: message.error,
                },
            }));
        };

        const metadataSuccessHandle = (message: Messages.SessionGetMetadataSuccess) => {
            setMetadataStatuses((prev) => ({
                ...prev,
                [message.connectionId]: {
                    status: "success",
                    name: prev[message.connectionId].name,
                    progress: t("ready", "Ready"),
                },
            }));
        };

        const metadataEndHandle = (message: Messages.SessionGetMetadataEnd) => {
            setMetadataStatuses((prev) => ({
                ...prev,
                [message.connectionId]: {
                    status: "end",
                    name: prev[message.connectionId].name,
                    progress: prev[message.connectionId].progress,
                },
            }));

            // Usuń status po 5 sekundach
            setTimeout(() => {
                setMetadataStatuses((prev) => {
                    const updated = { ...prev };
                    delete updated[message.connectionId];
                    return updated;
                });
            }, 5000);
        };

        // Rejestracja wiadomości
        subscribe(Messages.SESSION_GET_METADATA_START, metadataStartHandle);
        subscribe(Messages.SESSION_GET_METADATA_PROGRESS, metadataProgressHandle);
        subscribe(Messages.SESSION_GET_METADATA_SUCCESS, metadataSuccessHandle);
        subscribe(Messages.SESSION_GET_METADATA_ERROR, connectionErrorHandle);
        subscribe(Messages.SESSION_GET_METADATA_END, metadataEndHandle);

        return () => {
            // Wyrejestrowanie wiadomości
            unsubscribe(Messages.SESSION_GET_METADATA_START, metadataStartHandle);
            unsubscribe(Messages.SESSION_GET_METADATA_PROGRESS, metadataProgressHandle);
            unsubscribe(Messages.SESSION_GET_METADATA_SUCCESS, metadataSuccessHandle);
            unsubscribe(Messages.SESSION_GET_METADATA_ERROR, connectionErrorHandle);
            unsubscribe(Messages.SESSION_GET_METADATA_END, metadataEndHandle);
        };
    }, [subscribe, unsubscribe]);

    // Ukryj menu, gdy metadataStatuses stanie się puste
    React.useEffect(() => {
        if (Object.keys(metadataStatuses).length === 0) {
            setAnchorEl(null);
        }
    }, [metadataStatuses]);

    if (Object.keys(metadataStatuses).length === 0) {
        return null;
    }

    const metadataCount = Object.keys(metadataStatuses).length;

    return (
        <>
            <StatusBarButton onClick={handleOpenMenu}>
                {metadataCount > 1 ? (
                    <>
                        <theme.icons.Loading />
                        <span>{t("collecting-metadata-for-connections",
                            "Collecting data for {{count}} connections", {
                            count: metadataCount,
                        })}</span>
                    </>
                ) : (
                    (() => {
                        const status = Object.values(metadataStatuses)[0] as GetMetadataStatus; // Ensure correct typing
                        return (
                            <>
                                {status.status !== "end" && <theme.icons.Loading />}
                                {status.status === "error" && <theme.icons.Error />}
                                <span>{t(
                                    "collecting-metadata-for-connection",
                                    "Collecting {{name}} {{progress}}", {
                                    name: status.name,
                                    progress: status.progress,
                                })}</span>
                            </>
                        );
                    })()
                )}
            </StatusBarButton>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                anchorOrigin={{
                    vertical: "top", // Menu pojawia się powyżej przycisku
                    horizontal: "left",
                }}
                transformOrigin={{
                    vertical: "bottom", // Punkt odniesienia dla transformacji to dolna część menu
                    horizontal: "left",
                }}
                slotProps={{
                    paper: {
                        sx: {
                            width: "35%",
                            maxHeight: "400px", // Maksymalna wysokość menu
                            overflowY: "auto", // Przewijanie w pionie, jeśli zawartość jest zbyt długa
                        },
                    },
                }}
            >
                {Object.entries(metadataStatuses).map(([connectionId, status]) => (
                    <ListItem key={connectionId}>
                        <ListItemIcon>
                            {status.status !== "end" && <theme.icons.Loading />}
                            {status.status === "error" && <theme.icons.Error />}
                        </ListItemIcon>
                        <ListItemText
                            primary={status.name + " " + status.progress}
                            slotProps={{
                                primary: {
                                    sx: {
                                        whiteSpace: "nowrap", // Zapobiega zawijaniu tekstu
                                        overflow: "hidden", // Ukrywa nadmiar tekstu
                                        textOverflow: "ellipsis", // Dodaje wielokropek, jeśli tekst jest zbyt długi
                                    },
                                },
                            }}
                        />
                        <ToolButton
                            onClick={() => handleCancel(connectionId)}
                            label={t("cancel", "Cancel")}
                        >
                            <theme.icons.Close />
                        </ToolButton>
                    </ListItem>
                ))}
            </Menu>
        </>
    );
};

Promise.resolve().then(() => {
    if (!appStatusBarButtons.hided.has("MetadataCollctorStatusBar")) {
        appStatusBarButtons.hided.set("MetadataCollctorStatusBar", MetadataCollctorStatusBar);
    }
});

export default MetadataCollctorStatusBar;