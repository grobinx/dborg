import {
    Typography, useThemeProps,
    Box, styled, StackProps, Stack, useTheme,
} from "@mui/material";
import { useDatabase } from "@renderer/contexts/DatabaseContext";
import React from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@renderer/contexts/ToastContext";
import { Messages, useMessages } from "@renderer/contexts/MessageContext";
import { DateTime } from "luxon";
import CommandPalette from "@renderer/components/CommandPalette/CommandPalette";
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
import { Group, useGroup } from "@renderer/hooks/useGroup";
import { useSearch } from "@renderer/hooks/useSearch";
import { SchemaRecord, useSchema } from "@renderer/contexts/SchemaContext";
import { useApplicationContext } from "@renderer/contexts/ApplicationContext";
import { useScrollIntoView } from "@renderer/hooks/useScrollIntoView";
import clsx from "@renderer/utils/clsx";
import { BaseList } from "@renderer/components/inputs/base/BaseList";

const Store_SchemaList_groupList = "schemaListGroupList"; // Define the key for session storage
const Store_SchemaList_sortList = "schemaListSortList"; // Define the key for session storage

interface Schema extends SchemaRecord {
    driverName?: string;
    driverIcon?: string;
    connected?: number;
}

interface GroupHeader {
    title: string;
    first_sch_id?: string;
}

const isGroupHeader = (item: Schema | GroupHeader): item is GroupHeader => {
    return typeof item === "object" && "title" in item;
};

const isSchema = (item: Schema | GroupHeader): item is Schema => {
    return typeof item === "object" && "sch_id" in item && "driverName" in item;
};

export interface SchemaListProps extends StackProps {
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

const SchemaListContainer = styled(Stack, {
    name: 'SchemaList', // The component name
    slot: 'container', // The slot name
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
    overflow: "hidden",
    height: "100%",
    display: "block",
}));

const SchemaListTitle = styled(Box, {
    name: 'SchemaList', // The component name
    slot: 'title', // The slot name
})();

const SchemaListDriverIcon = styled('div', {
    name: 'SchemaList',
    slot: 'driverIcon',
})(() => ({
}));

const SchemaListStatusIcon = styled('div', {
    name: 'SchemaList',
    slot: 'statusIcon',
})(() => ({
}));

const SchemaListActionButtons = styled('div', {
    name: 'SchemaList',
    slot: 'actionButtons',
})(() => ({
}));

const SchemaListGroupHeader = styled('div', {
    name: 'SchemaList',
    slot: 'groupHeader',
})(() => ({
}));

const SchemaListProfile = styled('div', {
    name: 'SchemaList',
    slot: 'profile',
})(() => ({
}));

const SchemaListGroupName = styled('div', {
    name: 'SchemaList',
    slot: 'groupName',
})(() => ({
}));

const SchemaListProfileName = styled('div', {
    name: 'SchemaList',
    slot: 'profileName',
})(() => ({
}));

const SchemaListPrimaryText = styled('div', {
    name: 'SchemaList',
    slot: 'primaryText',
})(() => ({
}));

const SchemaListSecondaryText = styled('div', {
    name: 'SchemaList',
    slot: 'secondaryText',
})(() => ({
}));

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

const schemaGroup: Group<Schema> = {
    fields: [{
        name: 'sch_group',
    }],
    cache: true,
}

const searchFields: (keyof Schema)[] = ['driverName', 'sch_group', 'sch_name'];

const SchemaList: React.FC<SchemaListOwnProps> = (props) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const { className, ...other } = useThemeProps({ name: 'SchemaList', props });
    const [searchDelay] = useSetting<number>("app", "search.delay");
    const [groupList, setGroupList] = React.useState<Boolean | undefined>(JSON.parse(window.localStorage.getItem(Store_SchemaList_groupList) ?? "false"));
    const [sortList, setSortList] = React.useState<Boolean | undefined>(JSON.parse(window.localStorage.getItem(Store_SchemaList_sortList) ?? "false"));
    const [search, setSearch] = React.useState('');
    const { initialized, schemas, getSchema, disconnectFromAllDatabases, reloadSchemas, connectToDatabase, testConnection, deleteSchema, swapSchemasOrder } = useSchema();
    const { sessions } = useApplicationContext();
    const [data, setData] = React.useState<Schema[] | null>(null);
    const sortedData = useSort(data, schemaIndexes, groupList ? (sortList ? 'groupLastUsed' : 'groupOrder') : (sortList ? 'lastUsed' : 'order'));
    const [searchedData, highlightText] = useSearch(sortedData, searchFields, search, undefined, searchDelay);
    const groupedData = useGroup(searchedData, schemaGroup);
    const displayData = React.useMemo(() => {
        console.debug("SchemaList: preparing display data");
        if (!groupList) {
            return searchedData;
        }
        const resultData: (Schema | GroupHeader)[] = [];
        let group: string | undefined = undefined;
        const undefinedGroup = t("ungrouped", "Ungrouped");
        searchedData?.forEach((item) => {
            if ((item.sch_group ?? undefinedGroup) !== group) {
                group = item.sch_group ?? undefinedGroup;
                resultData.push({ title: group, first_sch_id: item.sch_id });
            }
            resultData.push(item);
        });
        return resultData;
    }, [searchedData, groupList, t]);
    const { drivers, connections } = useDatabase();
    const addToast = useToast();
    const { queueMessage } = useMessages();
    const [connecting, setConnecting] = React.useState<string[]>([]);
    const [disconnecting, setDisconnecting] = React.useState<string[]>([]);
    const [erroring, setErroring] = React.useState<string[]>([]);
    const [deleting, setDeleting] = React.useState<string[]>([]);
    const [testing, setTesting] = React.useState<string[]>([]);
    const actions = React.useRef<ActionManager<SchemaListContext>>(new ActionManager());
    const [selectedItem, setSelectedItem, handleSearchKeyDown] = useKeyboardNavigation({
        items: searchedData ?? [],
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
            keybindings: ["Ctrl+Shift+C"],
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
            keybindings: ["Ctrl+D"],
            icon: "Disconnected",
            run: (context, schemaId) => {
                context.disconnect(schemaId);
            },
            visible: (_context, _schemaId, connected) => (connected ?? 0) > 0,
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

    const moveDown = (schemaId: string) => {
        if (!searchedData || searchedData.length === 0 || !schemaId) return;

        const currentIndex = searchedData.findIndex((schema) => schema.sch_id === schemaId);
        const nextIndex = currentIndex + 1;

        if (nextIndex < searchedData.length) {
            const nextSchema = searchedData[nextIndex];
            if (groupList && (nextSchema.sch_group ?? "ungrouped") !== (searchedData[currentIndex].sch_group ?? "ungrouped")) {
                return; // Prevent moving to a different group
            }
            swapSchemasOrder(schemaId, nextSchema.sch_id);
        }
    }

    const moveUp = (schemaId: string) => {
        if (!searchedData || searchedData.length === 0 || !schemaId) return;

        const currentIndex = searchedData.findIndex((schema) => schema.sch_id === schemaId);
        const previousIndex = currentIndex - 1;
        if (previousIndex >= 0) {
            const previousSchema = searchedData[previousIndex];
            if (groupList && (previousSchema.sch_group ?? "ungrouped") !== (searchedData[currentIndex].sch_group ?? "ungrouped")) {
                return; // Prevent moving to a different group
            }
            swapSchemasOrder(schemaId, previousSchema.sch_id);
        }
    }

    const moveGroupUp = (schemaId: string) => {
        if (!groupedData || groupedData.length === 0 || !schemaId) return;

        const currentIndex = groupedData.findIndex(group => group.some(schema => schema.sch_id === schemaId));
        const previousIndex = currentIndex - 1;
        if (previousIndex >= 0) {
            const currentGroup = groupedData[currentIndex];
            const previousGroup = groupedData[previousIndex];
            swapSchemasOrder(currentGroup[0].sch_id, previousGroup[0].sch_id, true);
        }
    }

    const moveGroupDown = (schemaId: string) => {
        if (!groupedData || groupedData.length === 0 || !schemaId) return;

        const currentIndex = groupedData.findIndex(group => group.some(schema => schema.sch_id === schemaId));
        const nextIndex = currentIndex + 1;
        if (nextIndex < groupedData.length) {
            const currentGroup = groupedData[currentIndex];
            const nextGroup = groupedData[nextIndex];
            swapSchemasOrder(currentGroup[0].sch_id, nextGroup[0].sch_id, true);
        }
    }

    const renderStatusIcon = (record: Schema) => {
        let icon: React.ReactNode = null;
        if (connecting.includes(record.sch_id)) {
            icon = <theme.icons.Loading />;
        } else if (erroring.includes(record.sch_id)) {
            icon = <theme.icons.Error />;
        } else if (record.connected ?? 0 > 0) {
            icon = (
                <div style={{ position: "relative" }}>
                    <theme.icons.Connected />
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
        } else {
            icon = <theme.icons.Disconnected />;
        }
        return (
            <SchemaListStatusIcon className="StatusIcon-statusIcon">
                {icon}
            </SchemaListStatusIcon>
        );
    };

    const renderDriverIcon = (record: Schema) => {
        return (
            <SchemaListDriverIcon className="DriverIcon-driverIcon">
                <div className="icon">{record.driverIcon && <img src={record.driverIcon} />}</div>
                <div className="name">{highlightText(record.driverName!)}</div>
            </SchemaListDriverIcon>
        );
    };

    const renderPrimaryText = (record: Schema) => {
        return (
            <SchemaListPrimaryText className="SchemaList-primaryText" style={{ color: record.sch_color }}>
                {highlightText(record.sch_name!)}
            </SchemaListPrimaryText>
        );
    };

    const renderSecondaryText = (record: Schema) => {
        const neverText = t("never", "Never");
        const groupText = record.sch_group ?? t("ungrouped", "Ungrouped");
        const lastSelectedText = record.sch_last_selected
            ? DateTime.fromSQL(record.sch_last_selected ?? '')?.toRelative() ?? neverText
            : neverText;

        return (
            <SchemaListSecondaryText className="SchemaList-secondaryText">
                {!groupList && (
                    <span key="group" className="group">
                        {t("group", "Group: {{group}}", { group: groupText })}
                    </span>
                )}
                <span key="lastSelected" className="last-selected">
                    {t("schema-last-selected", "Selected: {{lastSelected}}", { lastSelected: lastSelectedText })}
                </span>
                {record.sch_db_version && (
                    <span key="dbVersion" className="db-version">
                        {t("schema-db-version", "Version: {{version}}", { version: record.sch_db_version })}
                    </span>
                )}
            </SchemaListSecondaryText>
        );
    };

    const renderProfileName = (record: Schema) => {
        return (
            <SchemaListProfileName className="SchemaList-profileName">
                {renderPrimaryText(record)}
                {renderSecondaryText(record)}
            </SchemaListProfileName>
        );
    }

    const renderHeaderSortButtons = (sch_id: string) => {
        if (sortList) return null;
        return (
            <SchemaListActionButtons
                className={clsx(
                    "SchemaList-actionButtons",
                    sch_id === selectedItem && "selected",
                    "sort-buttons"
                )}
            >
                <ButtonGroup size="small" dense>
                    <ToolButton
                        height={"2em"}
                        onClick={(_e) => { moveGroupUp(sch_id); }}
                    >
                        <theme.icons.ExpandLess />
                    </ToolButton>
                    <ToolButton
                        height={"2em"}
                        onClick={(_e) => { moveGroupDown(sch_id); }}
                    >
                        <theme.icons.ExpandMore />
                    </ToolButton>
                </ButtonGroup>
            </SchemaListActionButtons>
        );
    };

    const renderSchemaSortButtons = (record: Schema) => {
        if (sortList) return null;
        return (
            <SchemaListActionButtons
                className={clsx(
                    "SchemaList-actionButtons",
                    record.sch_id === selectedItem && "selected",
                    "sort-buttons"
                )}
            >
                <ButtonGroup size="small" dense orientation="vertical">
                    <ToolButton
                        onClick={(_e) => { moveUp(record.sch_id); }}
                    >
                        <theme.icons.ExpandLess />
                    </ToolButton>
                    <ToolButton
                        onClick={(_e) => { moveDown(record.sch_id); }}
                    >
                        <theme.icons.ExpandMore />
                    </ToolButton>
                </ButtonGroup>
            </SchemaListActionButtons>
        );
    }

    const renderHeader = (item: GroupHeader) => {
        return (
            <SchemaListGroupHeader
                className="SchemaList-groupHeader"
            >
                {renderHeaderSortButtons(item.first_sch_id!)}
                <SchemaListGroupName className="SchemaList-groupName">
                    {highlightText(item.title)}
                </SchemaListGroupName>
            </SchemaListGroupHeader>
        )
    };

    const renderProfile = (record: Schema) => {
        return (
            <SchemaListProfile
                className={clsx(
                    "SchemaList-profile",
                    record.sch_id === selectedItem && "selected"
                )}
                onClick={() => setSelectedItem(record.sch_id)}
            >
                {renderSchemaSortButtons(record)}
                {renderDriverIcon(record)}
                {renderStatusIcon(record)}
                {renderProfileName(record)}
                {renderProfileActionButtons(record)}
            </SchemaListProfile>
        );
    };

    const renderProfileActionButtons = (record: Schema) => {
        return (
            <SchemaListActionButtons
                className={clsx(
                    "SchemaList-actionButtons",
                    record.sch_id === selectedItem && "selected"
                )}
            >
                <ButtonGroup>
                    <ActionButton
                        key="disconnect"
                        actionManager={actions.current}
                        actionId={disconnectAllActionId}
                        actionArgs={[record.sch_id, record.connected]}
                        getContext={() => context}
                        size="medium"
                        color="info"
                        loading={disconnecting.includes(record.sch_id)}
                    />
                    <ActionButton
                        key="connect"
                        actionManager={actions.current}
                        actionId={connectActionId}
                        actionArgs={[record.sch_id]}
                        getContext={() => context}
                        size="medium"
                        color="info"
                        loading={connecting.includes(record.sch_id)}
                    />
                </ButtonGroup>
                <ButtonGroup>
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
                <ButtonGroup>
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
            </SchemaListActionButtons>
        );
    };

    useScrollIntoView({
        containerId: "schema-list-content",
        targetId: selectedItem,
        stickyHeader: '[id^="group-"]',
    })

    React.useEffect(() => {
        if (!selectedItem) return;
        const el = document.getElementById(selectedItem);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [selectedItem]);

    return (
        <SchemaListContainer {...other} className={clsx(className, "SchemaList-container")}>
            <SchemaListTitle className="SchemaList-title">
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
                className="SchemaList-content"
            >
                {initialized && displayData &&
                    <BaseList
                        componentName="SchemaList"
                        id="schema-list-content"
                        items={displayData}
                        color="default"
                        size="default"
                        renderItem={item => {
                            if (isGroupHeader(item)) {
                                return renderHeader(item);
                            }
                            return renderProfile(item);
                        }}
                        isSelected={item => isSchema(item) && item.sch_id === selectedItem}
                        isFocused={item => isSchema(item) && item.sch_id === selectedItem}
                        getItemId={item => isSchema(item) ? item.sch_id : `group-${item.title}`}
                        getItemClassName={item => isSchema(item) ? 'profile' : 'header'}
                        onKeyDown={handleSearchKeyDown}
                    />
                }
                {!initialized && <Typography>Loading data...</Typography>}
            </SchemaListContent>
        </SchemaListContainer>
    );
};

export default SchemaList;
