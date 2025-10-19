import {
    Typography, ListItem, ListItemButton, ListItemText, useThemeProps,
    Box, List, styled, StackProps, Stack, useTheme, ListItemIcon, BoxProps,
    ListItemButtonProps, ListItemIconProps, ListItemTextProps,
    ListProps,
    ListItemProps,
    ListSubheader,
    ListSubheaderProps,
} from "@mui/material";
import { useDatabase } from "@renderer/contexts/DatabaseContext";
import React from "react";
import { useTranslation } from "react-i18next";
import { ConnectionInfo } from "src/api/db";
import { IconWrapperOwnProps } from "@renderer/themes/icons";
import { useToast } from "@renderer/contexts/ToastContext";
import { Messages, useMessages } from "@renderer/contexts/MessageContext";
import * as api from "../../../../api/db";
import { DateTime } from "luxon";
import CommandPalette, { highlightText } from "@renderer/components/CommandPalette/CommandPalette";
import { SearchField } from "@renderer/components/inputs/SearchField";
import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import ButtonGroup from "@renderer/components/buttons/ButtonGroup";
import { ToolButton } from "@renderer/components/buttons/ToolButton";
import { useKeyboardNavigation } from "@renderer/hooks/useKeyboardNavigation";
import { useSetting } from "@renderer/contexts/SettingsContext";
import UnboundBadge from "@renderer/components/UnboundBadge";
import { ActionManager } from "@renderer/components/CommandPalette/ActionManager";
import ActionButton from "@renderer/components/CommandPalette/ActionButton";
import { Indexes, useSort } from "@renderer/hooks/useSort";
import { Groups, useGroup } from "@renderer/hooks/useGroup";
import { useSearch } from "@renderer/hooks/useSearch";
import { SchemaRecord, useSchema } from "@renderer/contexts/SchemaContext";
import { useApplicationContext } from "@renderer/contexts/ApplicationContext";

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

const schemaIndexes: Indexes<Schema> = {
    lastUsed: {
        fields: [
            { name: 'sch_last_selected', nullsLast: false, order: 'desc' },
            { name: 'sch_updated' },
            { name: 'sch_name' },
        ],
        cache: true,
    },
    order: {
        fields: [
            { name: 'sch_order' },
        ],
        cache: true,
    },
    groupLastUsed: {
        fields: [
            {
                name: 'sch_group',
                getGroupedValue: (data) => {
                    return Math.max(...data.map(d => DateTime.fromSQL(d.sch_last_selected ?? '').toMillis() || 0));
                },
                order: 'desc',
            },
            { name: 'sch_last_selected', nullsLast: false, order: 'desc', }
        ],
        cache: true,
    },
    groupOrder: {
        fields: [
            {
                name: 'sch_group',
                getGroupedValue: (data) => {
                    return Math.min(...data.map(d => d.sch_order ?? Infinity));
                },
            },
            { name: 'sch_order' }
        ],
        cache: true,
    },
};

const schemaGroups: Groups<Schema> = {
    groupName: {
        fields: [{
            name: 'sch_group',
        }],
        cache: true,
    }
}

const searchFields: (keyof Schema)[] = ['driverName', 'sch_group', 'sch_name'];

const SchemaList: React.FC<SchemaListOwnProps> = (props) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const { className, slotProps, ...other } = useThemeProps({ name: 'SchemaList', props });
    const [searchDelay] = useSetting<number>("app", "search.delay");
    const [groupList, setGroupList] = React.useState<Boolean | undefined>(JSON.parse(window.localStorage.getItem(Store_SchemaList_groupList) ?? "false"));
    const [sortList, setSortList] = React.useState<Boolean | undefined>(JSON.parse(window.localStorage.getItem(Store_SchemaList_sortList) ?? "false"));
    const [search, setSearch] = React.useState('');
    const { initialized, schemas, getSchema, disconnectFromAllDatabases, reloadSchemas, connectToDatabase, testConnection, deleteSchema, swapSchemasOrder } = useSchema();
    const { sessions } = useApplicationContext();
    const [data, setData] = React.useState<Schema[] | null>(null);
    const [sortedData] = useSort(data, schemaIndexes, groupList ? (sortList ? 'groupLastUsed' : 'groupOrder') : (sortList ? 'lastUsed' : 'order'));
    const [groupedData] = useGroup(sortedData, schemaGroups, 'groupName');
    const [displayData, searchedText] = useSearch(sortedData, searchFields, search, undefined, searchDelay);
    const { drivers, connections } = useDatabase();
    const { addToast } = useToast();
    const { queueMessage } = useMessages();
    const [connecting, setConnecting] = React.useState<string[]>([]);
    const [disconnecting, setDisconnecting] = React.useState<string[]>([]);
    const [erroring, setErroring] = React.useState<string[]>([]);
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
                reloadSchemas();
            }
        }, {
            id: groupActionId,
            label: t("group-profile-list", "Group profile list"),
            tooltip: t("group-profile-list-tooltip", "Group profile list by group name"),
            keybindings: ["Ctrl+K", "Ctrl+G"],
            icon: "GroupList",
            run: () => {
                setGroupList(prev => !prev);
            },
        }, {
            id: sortActionId,
            label: t("sort-profile-list", "Sort profile list"),
            tooltip: t("sort-profile-list-tooltip", "Sort profile list by last used"),
            keybindings: ["Ctrl+K", "Ctrl+O"],
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
                const record = getSchema((schemaId ?? selectedItem) as string);
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

    const connectionStatus = async (data: Schema[] | null): Promise<Schema[] | null> => {
        if (!data) {
            return null;
        }
        const connectionList = await connections.list();
        if (!connectionList) {
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

    React.useEffect(() => {
        window.localStorage.setItem(Store_SchemaList_groupList, JSON.stringify(groupList));
    }, [groupList]);

    React.useEffect(() => {
        window.localStorage.setItem(Store_SchemaList_sortList, JSON.stringify(sortList));
    }, [sortList]);

    React.useEffect(() => {
        if (!initialized) {
            return;
        }
        connectionStatus(schemas).then((data) => {
            setData(data);
        });
    }, [initialized, schemas, sessions]);

    const handleDelete = async (id: string) => {
        setDeleting((prev) => [...prev, id]);
        try {
            await deleteSchema(id);
        } catch (error) {
            addToast("error",
                t("schema-delete-error", "Failed to delete the connection schema!"),
                { source: t_connectionSchema, reason: error }
            );
        } finally {
            setDeleting((prev) => prev.filter((schemaId) => schemaId !== id));
        }
    };

    // Function to handle testing the schema connection
    const handleTestConnection = async (schema: Schema) => {
        setTesting((prev) => [...prev, schema.sch_id]);
        try {
            await testConnection(schema.sch_drv_unique_id, schema.sch_use_password, schema.sch_properties, schema.sch_name);
        } catch (error) {
            setErroring((prev) => [...prev, schema.sch_id]);
        } finally {
            setTesting((prev) => prev.filter((id) => id !== schema.sch_id));
        }
    };

    const handleConnect = async (schemaId: string) => {
        setConnecting((prev) => [...prev, schemaId]);
        setErroring((prev) => prev.filter((id) => id !== schemaId));
        try {
            await connectToDatabase(schemaId);
        } catch (error) {
            setErroring((prev) => [...prev, schemaId]);
        } finally {
            setConnecting((prev) => prev.filter((id) => id !== schemaId));
        }
    };

    const handleDisconnectAll = async (schemaId: string) => {
        setDisconnecting((prev) => [...prev, schemaId]);
        try {
            await disconnectFromAllDatabases(schemaId);
        } catch (error) {
            setErroring((prev) => [...prev, schemaId]);
        } finally {
            setDisconnecting((prev) => prev.filter((id) => id !== schemaId));
        }
    };

    const swapSchemaOrder = async (sourceSchemaId: string, targetSchemaId: string, group?: boolean) => {
        try {
            await swapSchemasOrder(sourceSchemaId, targetSchemaId, group);
        } catch (error) {
            addToast("error",
                t("schema-order-update-error", "Failed to update schema order!"),
                { source: t_connectionSchema, reason: error }
            );
            return;
        }
    }

    const moveDown = (schemaId: string) => {
        if (!sortedData || sortedData.length === 0 || !schemaId) return;

        const currentIndex = sortedData.findIndex((schema) => schema.sch_id === schemaId);
        const nextIndex = currentIndex + 1;

        if (nextIndex < sortedData.length) {
            const nextSchema = sortedData[nextIndex];
            if (groupList && (nextSchema.sch_group ?? "ungrouped") !== (sortedData[currentIndex].sch_group ?? "ungrouped")) {
                return; // Prevent moving to a different group
            }
            swapSchemaOrder(schemaId, nextSchema.sch_id);
        }
    }

    const moveUp = (schemaId: string) => {
        if (!sortedData || sortedData.length === 0 || !schemaId) return;

        const currentIndex = sortedData.findIndex((schema) => schema.sch_id === schemaId);
        const previousIndex = currentIndex - 1;
        if (previousIndex >= 0) {
            const previousSchema = sortedData[previousIndex];
            if (groupList && (previousSchema.sch_group ?? "ungrouped") !== (sortedData[currentIndex].sch_group ?? "ungrouped")) {
                return; // Prevent moving to a different group
            }
            swapSchemaOrder(schemaId, previousSchema.sch_id);
        }
    }

    const moveGroupUp = (schemaId: string) => {
        if (!groupedData || groupedData.length === 0 || !schemaId) return;

        const currentIndex = groupedData.findIndex(group => group.some(schema => schema.sch_id === schemaId));
        const previousIndex = currentIndex - 1;
        if (previousIndex >= 0) {
            const currentGroup = groupedData[currentIndex];
            const previousGroup = groupedData[previousIndex];
            swapSchemaOrder(currentGroup[0].sch_id, previousGroup[0].sch_id, true);
        }
    }

    const moveDownGroup = (schemaId: string) => {
        if (!groupedData || groupedData.length === 0 || !schemaId) return;

        const currentIndex = groupedData.findIndex(group => group.some(schema => schema.sch_id === schemaId));
        const nextIndex = currentIndex + 1;
        if (nextIndex < groupedData.length) {
            const currentGroup = groupedData[currentIndex];
            const nextGroup = groupedData[nextIndex];
            swapSchemaOrder(currentGroup[0].sch_id, nextGroup[0].sch_id, true);
        }
    }

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
        if (erroring.includes(record.sch_id)) {
            return <theme.icons.Error {...slotProps?.icon} />;
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
            </span>
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
                {initialized &&
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
                                                        <ToolButton
                                                            height={"2em"}
                                                            onClick={(_e) => { moveGroupUp(record.sch_id); }}
                                                        >
                                                            <theme.icons.ExpandLess {...slotProps?.icon} />
                                                        </ToolButton>
                                                        <ToolButton
                                                            height={"2em"}
                                                            onClick={(_e) => { moveDownGroup(record.sch_id); }}
                                                        >
                                                            <theme.icons.ExpandMore {...slotProps?.icon} />
                                                        </ToolButton>
                                                    </ButtonGroup>
                                                }
                                                {highlightText(group, searchedText, theme)}
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
                                                    <ToolButton
                                                        onClick={(_e) => { moveUp(record.sch_id); }}
                                                    >
                                                        <theme.icons.ExpandLess {...slotProps?.icon} />
                                                    </ToolButton>
                                                    <ToolButton
                                                        onClick={(_e) => { moveDown(record.sch_id); }}
                                                    >
                                                        <theme.icons.ExpandMore {...slotProps?.icon} />
                                                    </ToolButton>
                                                </ButtonGroup>
                                            }
                                            <ListItemIcon className="driver" {...slotProps?.itemIcon}>
                                                {record.driverIcon && <img src={record.driverIcon} />}
                                                <Typography variant="caption" className="name">{highlightText(record.driverName!, searchedText, theme)}</Typography>
                                            </ListItemIcon>
                                            <ListItemIcon className="status" {...slotProps?.itemIcon}>
                                                {renderStatusIcon(record)}
                                            </ListItemIcon>
                                            <ListItemText
                                                {...slotProps?.itemText}
                                                primary={<span style={{ color: record.sch_color }}>{highlightText(record.sch_name, searchedText, theme)}</span>}
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
                {!initialized && <Typography>Loading data...</Typography>}
            </SchemaListContent>
        </SchemaListRoot>
    );
};

export default SchemaList;
