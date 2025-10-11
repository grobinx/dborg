import {
    Typography, ListItem, ListItemButton, ListItemText, useThemeProps,
    Box, List, styled, StackProps, Stack, useTheme, ListItemIcon, BoxProps,
    ListItemButtonProps, ListItemIconProps, ListItemTextProps,
    ListProps,
    ListItemProps,
    ListSubheader,
    Button,
    ListSubheaderProps,
} from "@mui/material";
import { useDatabase } from "@renderer/contexts/DatabaseContext";
import React from "react";
import { useTranslation } from "react-i18next";
import { ConnectionInfo } from "src/api/db";
import { IconWrapperOwnProps, IconWrapperProps } from "@renderer/themes/icons";
import { useToast } from "@renderer/contexts/ToastContext";
import { Messages, useMessages } from "@renderer/contexts/MessageContext";
import { SchemaRecord } from "@renderer/app/SchemaConnectionManager";
import * as api from "../../../../api/db";
import { DateTime } from "luxon";
import CommandPalette, { highlightText } from "@renderer/components/CommandPalette/CommandPalette";
import Tooltip from "@renderer/components/Tooltip";
import { SearchField } from "@renderer/components/inputs/SearchField";
import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import { IconButton } from "@renderer/components/buttons/IconButton";
import ButtonGroup from "@renderer/components/buttons/ButtonGroup";
import { ToolButton } from "@renderer/components/buttons/ToolButton";
import { useKeyboardNavigation } from "@renderer/hooks/useKeyboardNavigation";
import debounce from "@renderer/utils/debounce";
import { useSetting } from "@renderer/contexts/SettingsContext";
import UnboundBadge from "@renderer/components/UnboundBadge";
import { ActionManager } from "@renderer/components/CommandPalette/ActionManager";
import ActionButton from "@renderer/components/CommandPalette/ActionButton";

const Store_SchemaList_groupList = "schemaListGroupList"; // Define the key for session storage
const Store_SchemaList_sortList = "schemaListSortList"; // Define the key for session storage

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
        subheader?: ListSubheaderProps,
        icon?: IconWrapperOwnProps,
        itemButton?: ListItemButtonProps,
        itemIcon?: ListItemIconProps,
        itemText?: ListItemTextProps
    }
}

interface SchemaListOwnProps extends SchemaListProps {
}

interface SchemaListContext {
    connect: (schemaId: string) => void;
    delete: (schemaId: string) => void;
    test: (schemaId: string) => void;
    edit: (schemaId: string) => void;
    clone: (schemaId: string) => void;
    disconnect: (schemaId: string) => void;
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

const refreshActionId = "profile-list-refresh";
const groupActionId = "profile-list-group";
const sortActionId = "profile-list-sort";
const connectActionId = "profile-list-connect";
const deleteActionId = "profile-list-delete";
const testActionId = "profile-list-test";
const editActionId = "profile-list-edit";
const cloneActionId = "profile-list-clone";
const disconnectAllActionId = "profile-list-disconnect-all";

const SchemaList: React.FC<SchemaListOwnProps> = (props) => {
    const theme = useTheme();
    const { className, slotProps, ...other } = useThemeProps({ name: 'SchemaList', props });
    const [searchDelay] = useSetting<number>("app", "search.delay");
    const [loading, setLoading] = React.useState(true);
    const [groupList, setGroupList] = React.useState<Boolean | undefined>(JSON.parse(window.localStorage.getItem(Store_SchemaList_groupList) ?? "false"));
    const [sortList, setSortList] = React.useState<Boolean | undefined>(JSON.parse(window.localStorage.getItem(Store_SchemaList_sortList) ?? "false"));
    const [data, setData] = React.useState<Schema[] | null>(null);
    const [displayData, setDisplayData] = React.useState<Schema[] | null>();
    const { drivers, connections } = useDatabase();
    const { t } = useTranslation();
    const [connectionList, setConnectionList] = React.useState<ConnectionInfo[] | null>();
    const [search, setSearch] = React.useState('');
    const { addToast } = useToast();
    const { sendMessage, queueMessage, subscribe, unsubscribe } = useMessages();
    const [connecting, setConnecting] = React.useState<string[]>([]);
    const [disconnecting, setDisconnecting] = React.useState<string[]>([]);
    const [deleting, setDeleting] = React.useState<string[]>([]);
    const [testing, setTesting] = React.useState<string[]>([]);
    const actions = React.useRef<ActionManager<SchemaListContext>>(new ActionManager());
    const [selectedItem, setSelectedItem, handleSearchKeyDown] = useKeyboardNavigation({
        items: displayData ?? [],
        getId: (item) => item.sch_id,
        actionManager: actions.current,
        getContext: () => (context),
        keyBindings: [{ key: "F1", handler: () => setOpenCommandPalette(true) }],
    });
    const [openCommandPalette, setOpenCommandPalette] = React.useState(false);
    const searchRef = React.useRef<HTMLInputElement>(null);

    console.count("SchemaList render");

    const t_connectionSchema = t("connection-profiles", "Connection profiles");

    React.useEffect(() => {
        actions.current.registerAction({
            id: refreshActionId,
            label: t("refresh-profile-list", "Refresh profile list"),
            keybindings: ["F5"],
            icon: "Refresh",
            run: () => {
                queueMessage(Messages.RELOAD_SCHEMAS);
            }
        }, {
            id: groupActionId,
            label: t("group-profile-list", "Group profile list"),
            keybindings: ["Ctrl+K", "Ctrl+G"],
            icon: "GroupList",
            run: () => {
                setGroupList(prev => !prev);
            },
        }, {
            id: sortActionId,
            label: t("sort-profile-list", "Sort profile list"),
            keybindings: ["Ctrl+K", "Ctrl+S"],
            icon: "Sort",
            run: () => {
                setSortList(prev => !prev);
            },
        }, {
            id: connectActionId,
            label: t("connect-to-database", "Connect to database"),
            keybindings: ["Enter"],
            icon: "Connected",
            run: (context, schemaId) => {
                context.connect(schemaId);
            }
        }, {
            id: deleteActionId,
            label: t("delete-profile", "Delete profile"),
            keybindings: ["F8"],
            icon: "Delete",
            run: (context, schemaId) => {
                context.delete(schemaId);
            },
        }, {
            id: testActionId,
            label: t("test-connection", "Test connection"),
            keybindings: ["Ctrl+T"],
            icon: "ConnectionTest",
            run: (context, schemaId) => {
                context.test(schemaId);
            }
        }, {
            id: editActionId,
            label: t("edit-profile", "Edit profile"),
            keybindings: ["Ctrl+E"],
            icon: "EditConnectionSchema",
            run: (context, schemaId) => {
                context.edit(schemaId);
            }
        }, {
            id: cloneActionId,
            label: t("clone-profile", "Clone profile"),
            keybindings: ["Ctrl+D"],
            icon: "CloneConnectionSchema",
            run: (context, schemaId) => {
                context.clone(schemaId);
            }
        }, {
            id: disconnectAllActionId,
            label: (_context, _schemaId, connected) => {
                return (connected ?? 0) > 1 ?
                    t("disconnect-multiple", "Disconnect all connections to database")
                    : t("disconnect", "Disconnect from database")
            },
            keybindings: ["Ctrl+Shift+D"],
            icon: "Disconnected",
            run: (context, schemaId) => {
                context.disconnect(schemaId);
            }
        });
    }, []);

    const context: SchemaListContext = {
        connect: (schemaId?: string) => {
            if ((schemaId ?? selectedItem) != null) {
                handleConnect((schemaId ?? selectedItem) as string);
            }
        },
        delete: (schemaId?: string) => {
            if ((schemaId ?? selectedItem) != null) {
                handleDelete((schemaId ?? selectedItem) as string);
            }
        },
        test: (schemaId?: string) => {
            if ((schemaId ?? selectedItem) != null) {
                const record = data?.find(r => r.sch_id === (schemaId ?? selectedItem));
                if (record) {
                    handleTestConnection(record);
                }
            }
        },
        edit: (schemaId?: string) => {
            if ((schemaId ?? selectedItem) != null) {
                queueMessage(Messages.EDIT_SCHEMA, (schemaId ?? selectedItem) as string);
            }
        },
        clone: (schemaId?: string) => {
            if ((schemaId ?? selectedItem) != null) {
                queueMessage(Messages.CLONE_EDIT_SCHEMA, (schemaId ?? selectedItem) as string);
            }
        },
        disconnect: (schemaId?: string) => {
            if ((schemaId ?? selectedItem) != null) {
                handleDisconnectAll((schemaId ?? selectedItem) as string);
            }
        }
    };

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
        window.localStorage.setItem(Store_SchemaList_sortList, JSON.stringify(sortList));
    }, [sortList]);

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
                    t("profile-list-load-error", "Failed to load profile list!"),
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

    // sort wyjęty poza useEffect i memoizowany względem groupList
    const sort = React.useCallback((list: Schema[] | null): Schema[] | null => {
        if (!list) return null;

        if (groupList) {
            const grouped = list.reduce<Record<string, Schema[]>>((acc, schema) => {
                const key = schema.sch_group ?? "ungrouped";
                (acc[key] ??= []).push(schema);
                return acc;
            }, {});

            let sortedGroups: [string, Schema[]][] = [];
            if (sortList) {
                sortedGroups = Object.entries(grouped).sort(([, a], [, b]) => {
                    const latestA = Math.max(...a.map(s => DateTime.fromSQL(s.sch_last_selected ?? '').toMillis() || 0));
                    const latestB = Math.max(...b.map(s => DateTime.fromSQL(s.sch_last_selected ?? '').toMillis() || 0));
                    return latestB - latestA;
                });
            }
            else {
                sortedGroups = Object.entries(grouped).sort(([, a], [, b]) => {
                    const latestA = Math.min(...a.map(s => s.sch_order || 0));
                    const latestB = Math.min(...b.map(s => s.sch_order || 0));
                    return latestA - latestB;
                });
            }

            return sortedGroups.flatMap(([, group]) =>
                group.sort((a, b) => {
                    if (!sortList) {
                        const orderA = a.sch_order ?? 0; // Użyj 0, jeśli sch_order jest undefined
                        const orderB = b.sch_order ?? 0; // Użyj 0, jeśli sch_order jest undefined

                        if (orderA !== orderB) {
                            return orderA - orderB; // Sortuj według sch_order
                        }
                    }

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

        return [...list].sort((a, b) => {
            if (!sortList) {
                const orderA = a.sch_order ?? 0; // Użyj 0, jeśli sch_order jest undefined
                const orderB = b.sch_order ?? 0; // Użyj 0, jeśli sch_order jest undefined

                if (orderA !== orderB) {
                    return orderA - orderB; // Sortuj według sch_order
                }
            }

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
    }, [groupList, sortList]);

    const searchList = (search: string, list: Schema[] | null): Schema[] | null => {
        if (search.trim() === '') {
            return list;
        }
        const parts = search.toLowerCase().split(' ').map(v => v.trim()).filter(v => v !== '');
        const filtered = list?.filter(record =>
            parts.every(value =>
                JSON.stringify([record.driverName, record.sch_group ?? t("ungrouped", "Ungrouped"), record.sch_name])
                    .toLowerCase()
                    .includes(value)
            )
        );
        return filtered ?? null;
    }

    React.useEffect(() => {
        const debouncedSearch = debounce(() => {
            setDisplayData(sort(searchList(search, data)));
        }, searchDelay);
        debouncedSearch();
        return () => debouncedSearch.cancel();
    }, [search, data, sort, searchDelay, groupList, sortList]);

    const handleDelete = React.useCallback(async (id: string) => {
        setDeleting((prev) => [...prev, id]);
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
        } finally {
            setDeleting((prev) => prev.filter((schemaId) => schemaId !== id));
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
                setConnecting((prev) => prev.filter((id) => id !== schemaId));
            }
        };

        setConnecting((prev) => [...prev, schemaId]);

        connect();
    }, [data, t_connectionSchema]);

    const handleDisconnectAll = React.useCallback(async (schemaId: string) => {
        setDisconnecting((prev) => [...prev, schemaId]);
        try {
            await sendMessage(Messages.SCHEMA_DISCONNECT_ALL, schemaId);
        } finally {
            setDisconnecting((prev) => prev.filter((id) => id !== schemaId));
        }
    }, []);

    const handleConnectSuccess = React.useCallback((connection: ConnectionInfo) => {
        if (connection) {
            refreshConnectionList();
            setData(connectionStatus(data));
        }
    }, [refreshConnectionList, connectionStatus, data]);

    //document.getElementById(displayData[nextIndex].sch_id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });

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
                <div style={{ position: "relative" }}>
                    <theme.icons.Connected {...slotProps?.icon} />
                    <UnboundBadge
                        content={(record.connected ?? 0) > 1 ? record.connected : 0}
                        sx={{
                            position: "absolute",
                            top: '-1em',
                            right: '-1em',
                        }}
                        size="small"
                    />
                </div>
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
            <span key="order" className="order">
                {t("schema-order", "Order: {{order}}", { order: record.sch_order })}
            </span>,
        ];
    };

    React.useEffect(() => {
        if (!selectedItem) return;
        const el = document.getElementById(selectedItem);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [selectedItem]);

    return (
        <SchemaListRoot {...other} className={(className ?? '') + " SchemaList-root"}>
            <SchemaListTitle {...slotProps?.title} className="SchemaList-title">
                <Typography variant="h4">{t_connectionSchema}</Typography>
                <Stack flexGrow={1} />
                <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <CommandPalette
                        manager={actions.current!}
                        open={openCommandPalette}
                        onClose={() => setOpenCommandPalette(false)}
                        getContext={() => context}
                        parentRef={searchRef}
                    />
                    <InputDecorator indicator={false}>
                        <SearchField
                            placeholder={t("search---", "Search...")}
                            value={search}
                            onChange={setSearch}
                            inputProps={{
                                autoFocus: true,
                                onKeyDown: handleSearchKeyDown,
                            }}
                            inputRef={searchRef}
                            autoFocus
                            size="large"
                        />
                    </InputDecorator>
                    <ButtonGroup>
                        <ActionButton
                            actionManager={actions.current}
                            actionId={groupActionId}
                            getContext={() => context}
                            size="large"
                            toggle={"true"}
                            value={groupList ? "true" : null}
                        />
                        <ActionButton
                            actionManager={actions.current}
                            actionId={sortActionId}
                            getContext={() => context}
                            size="large"
                            toggle={"true"}
                            value={sortList ? "true" : null}
                        />
                    </ButtonGroup>
                    <ActionButton
                        actionManager={actions.current}
                        actionId={refreshActionId}
                        getContext={() => context}
                        size="large"
                    />
                </Box>
            </SchemaListTitle>
            <SchemaListContent
                {...slotProps?.content}
                className="SchemaList-content"
            >
                {!loading &&
                    <List {...slotProps?.list} onKeyDown={handleSearchKeyDown}>
                        {data !== null && displayData?.map((record) => {
                            const group = record.sch_group ?? t("ungrouped", "Ungrouped");
                            return (
                                <React.Fragment key={record.sch_id}>
                                    {(groupList && (displayData.findIndex(r => r.sch_group === record.sch_group) === displayData.indexOf(record))) && (
                                        <ListSubheader {...slotProps?.subheader}>
                                            <Typography variant="h6" style={{ width: "100%" }}>
                                                {!sortList &&
                                                    <ButtonGroup className="drag" size="small" dense sx={{ marginRight: 8 }}>
                                                        <Tooltip title={t("move-up", "Move up")} placement="left">
                                                            <ToolButton
                                                                height={"2em"}
                                                            >
                                                                <theme.icons.ExpandLess {...slotProps?.icon} />
                                                            </ToolButton>
                                                        </Tooltip>
                                                        <Tooltip title={t("move-down", "Move down")} placement="right">
                                                            <ToolButton
                                                                height={"2em"}
                                                            >
                                                                <theme.icons.ExpandMore {...slotProps?.icon} />
                                                            </ToolButton>
                                                        </Tooltip>
                                                    </ButtonGroup>
                                                }
                                                {highlightText(group, search, theme)}
                                            </Typography>
                                        </ListSubheader>
                                    )}
                                    <ListItem {...slotProps?.item} id={record.sch_id}>
                                        <ListItemButton
                                            onClick={() => setSelectedItem(record.sch_id)}
                                            //onDoubleClick={() => handleConnect(record.sch_id)}
                                            {...slotProps?.itemButton}
                                            selected={record.sch_id === selectedItem}
                                            disableRipple
                                        >
                                            {!sortList &&
                                                <ButtonGroup className="drag" size="small" dense orientation="vertical">
                                                    <Tooltip title={t("move-up", "Move up")} placement="left">
                                                        <ToolButton
                                                        >
                                                            <theme.icons.ExpandLess {...slotProps?.icon} />
                                                        </ToolButton>
                                                    </Tooltip>
                                                    <Tooltip title={t("move-down", "Move down")} placement="left">
                                                        <ToolButton
                                                        >
                                                            <theme.icons.ExpandMore {...slotProps?.icon} />
                                                        </ToolButton>
                                                    </Tooltip>
                                                </ButtonGroup>
                                            }
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
                                                slotProps={{
                                                    primary: {
                                                        variant: "h6",
                                                    }
                                                }}
                                            />
                                            <ButtonGroup className="actions">
                                                {((record.connected ?? 0) > 0) && (
                                                    <ActionButton
                                                        actionManager={actions.current}
                                                        actionId={disconnectAllActionId}
                                                        actionArgs={[record.sch_id, record.connected]}
                                                        getContext={() => context}
                                                        size="medium"
                                                        color="info"
                                                        loading={disconnecting.includes(record.sch_id)}
                                                    />
                                                )}
                                                <ActionButton
                                                    actionManager={actions.current}
                                                    actionId={connectActionId}
                                                    actionArgs={[record.sch_id]}
                                                    getContext={() => context}
                                                    size="medium"
                                                    color="info"
                                                    loading={connecting.includes(record.sch_id)}
                                                />
                                            </ButtonGroup>
                                            <ButtonGroup className="actions">
                                                <ActionButton
                                                    actionManager={actions.current}
                                                    actionId={testActionId}
                                                    actionArgs={[record.sch_id]}
                                                    getContext={() => context}
                                                    size="medium"
                                                    color="success"
                                                    loading={testing.includes(record.sch_id)}
                                                />
                                                <ActionButton
                                                    actionManager={actions.current}
                                                    actionId={editActionId}
                                                    actionArgs={[record.sch_id]}
                                                    getContext={() => context}
                                                    size="medium"
                                                    color="primary"
                                                />
                                                <ActionButton
                                                    actionManager={actions.current}
                                                    actionId={cloneActionId}
                                                    actionArgs={[record.sch_id]}
                                                    getContext={() => context}
                                                    size="medium"
                                                    color="primary"
                                                />
                                            </ButtonGroup>
                                            <ButtonGroup className="actions">
                                                <ActionButton
                                                    className="delete"
                                                    actionManager={actions.current}
                                                    actionId={deleteActionId}
                                                    actionArgs={[record.sch_id]}
                                                    getContext={() => context}
                                                    size="medium"
                                                    color="error"
                                                    loading={deleting.includes(record.sch_id)}
                                                />
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
