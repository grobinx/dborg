import {
    Typography, ListItem, ListItemButton, ListItemText, useThemeProps,
    Box, List, styled, StackProps, Stack, useTheme, ListItemIcon, BoxProps,
    ListItemButtonProps, ListItemIconProps, ListItemTextProps,
    ListProps,
    ListItemProps,
    TextField,
    ListSubheader,
    Badge,
    ButtonGroup
} from "@mui/material";
import { useDatabase } from "@renderer/contexts/DatabaseContext";
import React from "react";
import { useTranslation } from "react-i18next";
import { ConnectionInfo } from "src/api/db";
import { IconWrapperProps } from "@renderer/themes/icons";
import { useToast } from "@renderer/contexts/ToastContext";
import { Messages, useMessages } from "@renderer/contexts/MessageContext";
import { SchemaRecord } from "@renderer/app/SchemaConnectionManager";
import * as api from "../../../../api/db";
import { DateTime } from "luxon";
import ToolButton from "@renderer/components/ToolButton";
import { highlightText } from "@renderer/components/CommandPalette/CommandPalette";
import Tooltip from "@renderer/components/Tooltip";

const Store_SchemaList_groupList = "schemaListGroupList"; // Define the key for session storage

interface Schema extends SchemaRecord {
    driverName?: string;
    driverIcon?: string;
    connected?: number;
}

export interface SchemaListProps extends StackProps {
    slotProps?: {
        title?: BoxProps,
        content?: BoxProps,
        list?: ListProps,
        item?: ListItemProps,
        icon?: IconWrapperProps,
        itemButton?: ListItemButtonProps,
        itemIcon?: ListItemIconProps,
        itemText?: ListItemTextProps
    }
}

interface SchemaListOwnProps extends SchemaListProps {
}

const SchemaListRoot = styled(Stack, {
    name: 'SchemaList', // The component name
    slot: 'root', // The slot name
})(() => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
}));

const SchemaListContent = styled(Box, {
    name: 'SchemaList', // The component name
    slot: 'content', // The slot name
})(() => ({
    overflow: "auto",
    height: "100%",
    display: "block",
}));

const SchemaListTitle = styled(Box, {
    name: 'SchemaList', // The component name
    slot: 'title', // The slot name
})();

const SchemaList: React.FC<SchemaListOwnProps> = (props) => {
    const theme = useTheme();
    const { className, slotProps, ...other } = useThemeProps({ name: 'SchemaList', props });
    const [loading, setLoading] = React.useState(true);
    const [groupList, setGroupList] = React.useState(JSON.parse(window.localStorage.getItem(Store_SchemaList_groupList) ?? "false"));
    const [data, setData] = React.useState<Schema[] | null>(null);
    const [displayData, setDisplayData] = React.useState<Schema[] | null>();
    const { drivers, connections } = useDatabase();
    const { t } = useTranslation();
    const [connectionList, setConnectionList] = React.useState<ConnectionInfo[] | null>();
    const [search, setSearch] = React.useState('');
    const { addToast } = useToast();
    const [selectedItem, setSelectedItem] = React.useState('');
    const { sendMessage, subscribe, unsubscribe } = useMessages();
    const [connecting, setConnecting] = React.useState<string[]>([]);
    const [testing, setTesting] = React.useState<string[]>([]);

    const t_connectionSchema = t("connection-schemas", "Connection schemas");

    const connectionStatus = (data: Schema[] | null): Schema[] | null => {
        if (!data) {
            return null;
        }

        const updatedData = data.map(record => {
            const connection = connectionList?.filter(
                connection => String((connection.userData?.schema as SchemaRecord)?.sch_id) === String(record.sch_id)
            ) || [];
            const driver = drivers.find(record.sch_drv_unique_id as string);
            return {
                ...record,
                connected: connection.length, // Ensure `connected` is 0 if no matches are found
                driverName: driver?.name,
                driverIcon: driver?.icon,
            };
        });

        return updatedData;
    };

    /**
     * Refresh the connection list and update the state.
     */
    const refreshConnectionList = async () => {
        try {
            setConnectionList(await connections.list());
        }
        catch (error) {
            addToast(
                "error",
                t("connection-list-load-error", "Failed to load connection list!"),
                {
                    source: t_connectionSchema,
                    reason: error,
                }
            );
        }
    };

    React.useEffect(() => {
        refreshConnectionList();
    }, [connections]);

    React.useEffect(() => {
        window.localStorage.setItem(Store_SchemaList_groupList, JSON.stringify(groupList));
    }, [groupList]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                if (!connectionList) {
                    return; // Ensure connectionList is available before fetching data
                }
                const schemas = await sendMessage(Messages.FETCH_SCHEMAS) as Schema[];
                setData(connectionStatus(schemas));
            } catch (error) {
                addToast(
                    "error",
                    t("schema-list-load-error", "Failed to load schema list!"),
                    {
                        source: t_connectionSchema,
                        reason: error,
                    }
                );
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [connectionList, drivers]); // Ensure connectionList is ready before fetching data

    React.useEffect(() => {
        const sort = (data: Schema[] | null): Schema[] | null => {
            if (!data) {
                return null;
            }

            if (groupList) {
                // Grupowanie danych według `sch_group`
                const groupedData = data.reduce<Record<string, Schema[]>>((groups, schema) => {
                    const groupKey = schema.sch_group ?? "ungrouped";
                    if (!groups[groupKey]) {
                        groups[groupKey] = [];
                    }
                    groups[groupKey].push(schema);
                    return groups;
                }, {});

                // Sortowanie grup na podstawie najnowszego `sch_last_selected` w każdej grupie
                const sortedGroups = Object.entries(groupedData)
                    .sort(([, groupA], [, groupB]) => {
                        const latestA = Math.max(
                            ...groupA.map(schema => DateTime.fromSQL(schema.sch_last_selected ?? '').toMillis() || 0)
                        );
                        const latestB = Math.max(
                            ...groupB.map(schema => DateTime.fromSQL(schema.sch_last_selected ?? '').toMillis() || 0)
                        );
                        return latestB - latestA; // Najnowsze grupy na górze
                    });

                // Spłaszczenie posortowanych grup do jednej listy
                return sortedGroups.flatMap(([, group]) =>
                    group.sort((a, b) => {
                        if (a.sch_last_selected !== b.sch_last_selected) {
                            return (
                                (DateTime.fromSQL(b.sch_last_selected ?? '').toMillis() || 0) -
                                (DateTime.fromSQL(a.sch_last_selected ?? '').toMillis() || 0)
                            );
                        }
                        if (a.sch_updated !== b.sch_updated) {
                            return (
                                (DateTime.fromSQL(b.sch_updated ?? '').toMillis() || 0) -
                                (DateTime.fromSQL(a.sch_updated ?? '').toMillis() || 0)
                            );
                        }
                        return a.sch_name.localeCompare(b.sch_name);
                    })
                );
            }

            // Sortowanie bez grupowania
            return [...data].sort((a, b) => {
                if (a.sch_last_selected !== b.sch_last_selected) {
                    return (
                        (DateTime.fromSQL(b.sch_last_selected ?? '').toMillis() || 0) -
                        (DateTime.fromSQL(a.sch_last_selected ?? '').toMillis() || 0)
                    );
                }
                if (a.sch_updated !== b.sch_updated) {
                    return (
                        (DateTime.fromSQL(b.sch_updated ?? '').toMillis() || 0) -
                        (DateTime.fromSQL(a.sch_updated ?? '').toMillis() || 0)
                    );
                }
                return a.sch_name.localeCompare(b.sch_name);
            });
        };

        if (!search.trim()) {
            setDisplayData(sort(data));
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            const filteredData = data?.filter(record =>
                JSON.stringify([record.driverName, record.sch_group, record.sch_name]).toLowerCase().includes(search.toLowerCase())
            );
            setDisplayData(sort(filteredData ?? null));
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [data, search, groupList]);

    const handleDelete = React.useCallback(async (id: string) => {
        try {
            await sendMessage(Messages.SCHEMA_DELETE, id);
        } catch (error) {
            addToast(
                "error",
                t("schema-delete-error", "Failed to delete the connection schema!"),
                {
                    source: t_connectionSchema,
                    reason: error,
                }
            );
        }
    }, [t_connectionSchema]);

    // Function to handle testing the schema connection
    const handleTestConnection = React.useCallback((schema: Schema) => {
        setTesting((prev) => [...prev, schema.sch_id]);
        sendMessage(Messages.SCHEMA_TEST_CONNECTION, schema.sch_drv_unique_id, schema.sch_use_password, schema.sch_properties, schema.sch_name)
            .finally(() => {
                setTesting((prev) => prev.filter((id) => id !== schema.sch_id));
            });
    }, []);

    const handleConnect = React.useCallback((schemaId: string) => {
        let timeoutId: NodeJS.Timeout;

        const connect = async () => {
            const schemaName = data?.find((record) => record.sch_id === schemaId)?.sch_name;
            try {
                await sendMessage(Messages.SCHEMA_CONNECT, schemaId) as api.ConnectionInfo;
            } catch (error) {
                addToast(
                    "error",
                    t("schema-connection-error", "Failed to connect to {{name}}!", { name: schemaName ?? schemaId }),
                    {
                        source: t_connectionSchema,
                        reason: error,
                    }
                );
            } finally {
                clearTimeout(timeoutId);
                setConnecting((prev) => prev.filter((id) => id !== schemaId));
            }
        };

        const delay = 300;
        timeoutId = setTimeout(() => {
            setConnecting((prev) => [...prev, schemaId]);
        }, delay);

        connect();
    }, [data, refreshConnectionList, connectionStatus, t_connectionSchema]);

    const handleConnectSuccess = React.useCallback((connection: ConnectionInfo) => {
        if (connection) {
            refreshConnectionList();
            setData(connectionStatus(data));
        }
    }, [refreshConnectionList, connectionStatus, data]);

    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!displayData || displayData.length === 0) {
            return;
        }

        const currentIndex = displayData.findIndex(record => record.sch_id === selectedItem);
        let nextIndex = currentIndex;

        if (event.key === "ArrowDown") {
            nextIndex = (currentIndex + 1) % displayData.length;
        }
        else if (event.key === "ArrowUp") {
            nextIndex = (currentIndex - 1 + displayData.length) % displayData.length;
        }
        else if (event.key === "Enter") {
            handleConnect(selectedItem);
        }

        if (nextIndex !== currentIndex && nextIndex >= 0) {
            setSelectedItem(displayData[nextIndex].sch_id);
            document.getElementById(displayData[nextIndex].sch_id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    };

    React.useEffect(() => {
        const handleSchemaCreateSuccess = (newSchema: Schema) => {
            setData((prevData) => connectionStatus([...(prevData ?? []), newSchema]));
        };

        const handleSchemaUpdate = (updatedSchema: Schema) => {
            setData((prevData) =>
                connectionStatus(
                    prevData?.map((schema) =>
                        schema.sch_id === updatedSchema.sch_id ? updatedSchema : schema
                    ) ?? null
                )
            );
        };

        const handleSchemaDeleteSuccess = (deletedSchemaId: string) => {
            setData((prevData) => prevData?.filter((schema) => schema.sch_id !== deletedSchemaId) ?? null);
        };

        const handleReloadSchemasSuccess = () => {
            refreshConnectionList();
        }

        const handleSchemaDisconnectSuccess = () => {
            refreshConnectionList();
        }

        subscribe(Messages.SCHEMA_CREATE_SUCCESS, handleSchemaCreateSuccess);
        subscribe(Messages.SCHEMA_UPDATE_SUCCESS, handleSchemaUpdate);
        subscribe(Messages.SCHEMA_DELETE_SUCCESS, handleSchemaDeleteSuccess);
        subscribe(Messages.RELOAD_SCHEMAS_SUCCESS, handleReloadSchemasSuccess);
        subscribe(Messages.SCHEMA_DISCONNECT_SUCCESS, handleSchemaDisconnectSuccess);
        subscribe(Messages.SCHEMA_CONNECT_SUCCESS, handleConnectSuccess);

        return () => {
            unsubscribe(Messages.SCHEMA_CREATE_SUCCESS, handleSchemaCreateSuccess);
            unsubscribe(Messages.SCHEMA_UPDATE_SUCCESS, handleSchemaUpdate);
            unsubscribe(Messages.SCHEMA_DELETE_SUCCESS, handleSchemaDeleteSuccess);
            unsubscribe(Messages.RELOAD_SCHEMAS_SUCCESS, handleReloadSchemasSuccess);
            unsubscribe(Messages.SCHEMA_DISCONNECT_SUCCESS, handleSchemaDisconnectSuccess);
            unsubscribe(Messages.SCHEMA_CONNECT_SUCCESS, handleConnectSuccess);
        };
    }, [subscribe, unsubscribe, connectionStatus, setData, handleConnectSuccess]);

    const renderStatusIcon = (record: Schema) => {
        if (connecting.includes(record.sch_id)) {
            return <theme.icons.Loading {...slotProps?.icon} />;
        }
        if (record.connected ?? 0 > 0) {
            return (
                <Badge
                    badgeContent={(record.connected ?? 0) > 1 ? record.connected : 0}
                    color="primary"
                >
                    <theme.icons.Connected {...slotProps?.icon} />
                </Badge>
            );
        }
        return <theme.icons.Disconnected {...slotProps?.icon} />;
    };

    const renderSecondaryText = (record: Schema) => {
        const neverText = t("never", "Never");
        const groupText = record.sch_group ?? t("ungrouped", "Ungrouped");
        const lastSelectedText = record.sch_last_selected
            ? DateTime.fromSQL(record.sch_last_selected ?? '')?.toRelative() ?? neverText
            : neverText;

        return [
            !groupList && (
                <span key="group" className="group">
                    {t("group", "Group: {{group}}", { group: groupText })}
                </span>
            ),
            <span key="lastSelected" className="last-selected">
                {t("schema-last-selected", "Last Selected: {{lastSelected}}", { lastSelected: lastSelectedText })}
            </span>,
            record.sch_db_version && (
                <span key="dbVersion" className="db-version">
                    {t("schema-db-version", "Version: {{version}}", { version: record.sch_db_version })}
                </span>
            ),
        ];
    };

    return (
        <SchemaListRoot {...other} className={(className ?? '') + " SchemaList-root"}>
            <SchemaListTitle {...slotProps?.title} className="SchemaList-title">
                <Typography variant="h4">{t_connectionSchema}</Typography>
                <Stack flexGrow={1} />
                <TextField
                    label={t("search", "Search...")}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    autoFocus
                />
                <Tooltip title={t("group-schema-list", "Group schema list")}>
                    <ToolButton
                        size="large"
                        className="group-list"
                        value="group-list"
                        onClick={() => setGroupList((prev) => !prev)}
                        selected={groupList}
                    >
                        <theme.icons.GroupList {...slotProps?.icon} />
                    </ToolButton>
                </Tooltip>
                <Tooltip title={t("refresh-schema-list", "Refresh schema list")}>
                    <ToolButton
                        size="large"
                        className="refresh"
                        onClick={() => {
                            sendMessage(Messages.RELOAD_SCHEMAS);
                        }}
                    >
                        <theme.icons.Refresh {...slotProps?.icon} />
                    </ToolButton>
                </Tooltip>
            </SchemaListTitle>
            <SchemaListContent
                {...slotProps?.content}
                className="SchemaList-content"
            >
                {!loading &&
                    <List {...slotProps?.list}>
                        {data !== null && displayData?.map((record) => {
                            const group = record.sch_group ?? t("ungrouped", "Ungrouped");
                            return (
                                <React.Fragment key={record.sch_id}>
                                    {(groupList && (displayData.findIndex(r => r.sch_group === record.sch_group) === displayData.indexOf(record))) && (
                                        <ListSubheader>
                                            <Typography variant="h6" style={{ width: "100%" }}>
                                                {highlightText(group, search, theme)}
                                            </Typography>
                                        </ListSubheader>
                                    )}
                                    <ListItem {...slotProps?.item} id={record.sch_id}>
                                        <ListItemButton
                                            onClick={() => handleConnect(record.sch_id)}
                                            {...slotProps?.itemButton}
                                            selected={record.sch_id === selectedItem}
                                            disabled={connecting.includes(record.sch_id)}
                                        >
                                            <ListItemIcon className="driver" {...slotProps?.itemIcon}>
                                                {record.driverIcon && <img src={record.driverIcon} />}
                                                <Typography variant="caption" className="name">{highlightText(record.driverName!, search, theme)}</Typography>
                                            </ListItemIcon>
                                            <ListItemIcon className="status" {...slotProps?.itemIcon}>
                                                {renderStatusIcon(record)}
                                            </ListItemIcon>
                                            <ListItemText
                                                {...slotProps?.itemText}
                                                primary={<span style={{ color: record.sch_color }}>{highlightText(record.sch_name, search, theme)}</span>}
                                                secondary={renderSecondaryText(record)}
                                            />
                                            <ButtonGroup className="actions">
                                                <Tooltip title={t("text-connection", "Test connection")}>
                                                    <span>
                                                        <ToolButton
                                                            size="large"
                                                            className="test"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                if (!testing.includes(record.sch_id)) {
                                                                    handleTestConnection(record);
                                                                }
                                                            }}
                                                            color="success"
                                                        >
                                                            {testing.includes(record.sch_id) ?
                                                                <theme.icons.Loading {...slotProps?.icon} /> :
                                                                <theme.icons.ConnectionTest {...slotProps?.icon} />
                                                            }
                                                        </ToolButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title={t("edit-schema", "Edit Schema")}>
                                                    <ToolButton
                                                        size="large"
                                                        className="edit"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            sendMessage(Messages.EDIT_SCHEMA, record.sch_id);
                                                        }}
                                                        color="primary"
                                                    >
                                                        <theme.icons.EditConnectionSchema {...slotProps?.icon} />
                                                    </ToolButton>
                                                </Tooltip>
                                                <Tooltip title={t("clone-edit-schema", "Clone and edit as new schema")}>
                                                    <ToolButton
                                                        size="large"
                                                        className="clone"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            sendMessage(Messages.CLONE_EDIT_SCHEMA, record.sch_id);
                                                        }}
                                                        color="primary"
                                                    >
                                                        <theme.icons.CloneConnectionSchema {...slotProps?.icon} />
                                                    </ToolButton>
                                                </Tooltip>
                                            </ButtonGroup>
                                            <ButtonGroup className="actions">
                                                <Tooltip title={t("delete-schema", "Delete schema")}>
                                                    <ToolButton
                                                        size="large"
                                                        className="delete"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            handleDelete(record.sch_id);
                                                        }}
                                                        color="error"
                                                    >
                                                        <theme.icons.Delete {...slotProps?.icon} />
                                                    </ToolButton>
                                                </Tooltip>
                                            </ButtonGroup>
                                        </ListItemButton>
                                    </ListItem>
                                </React.Fragment>
                            );
                        })}
                    </List>
                }
                {loading && <Typography>Loading data...</Typography>}
            </SchemaListContent>
        </SchemaListRoot>
    );
};

export default SchemaList;
