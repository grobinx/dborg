import {
    Typography,
    Box, styled, StackProps, Stack, useTheme,
} from "@mui/material";
import { useDatabase } from "@renderer/contexts/DatabaseContext";
import React from "react";
import { Trans, useTranslation } from "react-i18next";
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
import { Indexes, useSort } from "@renderer/hooks/useSort";
import { Group, useGroup } from "@renderer/hooks/useGroup";
import { useSearch } from "@renderer/hooks/useSearch";
import { useProfiles } from "@renderer/contexts/ProfilesContext";
import { useApplicationContext } from "@renderer/contexts/ApplicationContext";
import { useScrollIntoView } from "@renderer/hooks/useScrollIntoView";
import clsx from "@renderer/utils/clsx";
import { BaseList } from "@renderer/components/inputs/base/BaseList";
import { ProfileRecord } from "src/api/entities";

const Store_ProfileList_groupList = "profileListGroupList"; // Define the key for session storage
const Store_ProfileList_sortList = "profileListSortList"; // Define the key for session storage

interface Profile extends ProfileRecord {
    driverName?: string;
    driverIcon?: string;
    connected?: number;
}

interface GroupHeader {
    title: string;
    first_sch_id?: string;
}

const isGroupHeader = (item: Profile | GroupHeader): item is GroupHeader => {
    return typeof item === "object" && "title" in item;
};

const isProfile = (item: Profile | GroupHeader): item is Profile => {
    return typeof item === "object" && "sch_id" in item && "driverName" in item;
};

export interface ProfileListProps extends StackProps {
}

interface ProfileListOwnProps extends ProfileListProps {
}

interface ProfileListContext {
    connect: (profileId: string) => void;
    delete: (profileId: string) => void;
    test: (profileId: string) => void;
    edit: (sprofileId: string) => void;
    clone: (profileId: string) => void;
    disconnect: (profileId: string) => void;
    connected?: number;
}

const ProfileListContainer = styled(Stack, {
    name: 'ProfileList', // The component name
    slot: 'container', // The slot name
})(() => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
}));

const ProfileListContent = styled(Box, {
    name: 'ProfileList', // The component name
    slot: 'content', // The slot name
})(() => ({
    overflow: "hidden",
    height: "100%",
    display: "block",
}));

const ProfileListTitle = styled(Box, {
    name: 'ProfileList', // The component name
    slot: 'title', // The slot name
})();

const ProfileListDriverIcon = styled('div', {
    name: 'ProfileList',
    slot: 'driverIcon',
})(() => ({
}));

const ProfileListStatusIcon = styled('div', {
    name: 'ProfileList',
    slot: 'statusIcon',
})(() => ({
}));

const ProfileListActionButtons = styled('div', {
    name: 'ProfileList',
    slot: 'actionButtons',
})(() => ({
}));

const ProfileListGroupHeader = styled('div', {
    name: 'ProfileList',
    slot: 'groupHeader',
})(() => ({
}));

const ProfileListProfile = styled('div', {
    name: 'ProfileList',
    slot: 'profile',
})(() => ({
}));

const ProfileListGroupName = styled('div', {
    name: 'ProfileList',
    slot: 'groupName',
})(() => ({
}));

const ProfileListProfileName = styled('div', {
    name: 'ProfileList',
    slot: 'profileName',
})(() => ({
}));

const ProfileListPrimaryText = styled('div', {
    name: 'ProfileList',
    slot: 'primaryText',
})(() => ({
}));

const ProfileListSecondaryText = styled('div', {
    name: 'ProfileList',
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

const profileIndexes: Indexes<Profile> = {
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

const profileGroup: Group<Profile> = {
    fields: [{
        name: 'sch_group',
    }],
    cache: true,
}

const searchFields: (keyof Profile)[] = ['driverName', 'sch_group', 'sch_name'];

const ProfileList: React.FC<ProfileListOwnProps> = (props) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const { className, ...other } = props;
    const [searchDelay] = useSetting<number>("app", "search.delay");
    const [groupList, setGroupList] = React.useState<boolean | undefined>(JSON.parse(window.localStorage.getItem(Store_ProfileList_groupList) ?? "false"));
    const [sortList, setSortList] = React.useState<boolean | undefined>(JSON.parse(window.localStorage.getItem(Store_ProfileList_sortList) ?? "false"));
    const [search, setSearch] = React.useState('');
    const { initialized, profiles, getProfile, disconnectProfile, reloadProfiles, connectToDatabase, testConnection, deleteProfile, swapProfilesOrder } = useProfiles();
    const { sessions } = useApplicationContext();
    const [data, setData] = React.useState<Profile[] | null>(null);
    const sortedData = useSort(data, profileIndexes, groupList ? (sortList ? 'groupLastUsed' : 'groupOrder') : (sortList ? 'lastUsed' : 'order'));
    const [searchedData, highlightText] = useSearch(sortedData, searchFields, search, undefined, searchDelay);
    const groupedData = useGroup(sortedData, profileGroup);
    const displayData = React.useMemo(() => {
        if (!groupList || !searchedData) {
            return searchedData;
        }
        const resultData: (Profile | GroupHeader)[] = [];
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
    const actions = React.useRef<ActionManager<ProfileListContext>>(new ActionManager());
    const [selectedItem, setSelectedItem, handleSearchKeyDown] = useKeyboardNavigation({
        items: searchedData ?? [],
        getId: (item) => item.sch_id,
        actionManager: actions.current,
        actionContext: () => (context),
        actions: [{ shortcut: "F1", handler: () => setOpenCommandPalette(true) }],
    });
    const [openCommandPalette, setOpenCommandPalette] = React.useState(false);
    const searchRef = React.useRef<HTMLInputElement>(null);

    console.count("ProfileList render");

    const t_connectionProfile = t("connection-profiles", "Connection profiles");

    React.useEffect(() => {
        actions.current.registerAction({
            id: refreshActionId,
            label: t("refresh-profile-list", "Refresh profile list"),
            keybindings: ["F5"],
            icon: "Refresh",
            run: () => {
                reloadProfiles();
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
            run: (context, profileId) => {
                context.connect(profileId);
            }
        }, {
            id: deleteActionId,
            label: t("delete-profile", "Delete profile"),
            keybindings: ["F8"],
            icon: "Delete",
            run: (context, profileId) => {
                context.delete(profileId);
            },
        }, {
            id: testActionId,
            label: t("test-connection", "Test connection"),
            keybindings: ["Ctrl+T"],
            icon: "ConnectionTest",
            run: (context, profileId) => {
                context.test(profileId);
            }
        }, {
            id: editActionId,
            label: t("edit-profile", "Edit profile"),
            keybindings: ["Ctrl+E"],
            icon: "EditConnectionSchema",
            run: (context, profileId) => {
                context.edit(profileId);
            }
        }, {
            id: cloneActionId,
            label: t("clone-profile", "Clone profile"),
            keybindings: ["Ctrl+Shift+C"],
            icon: "CloneConnectionSchema",
            run: (context, profileId) => {
                context.clone(profileId);
            }
        }, {
            id: disconnectAllActionId,
            label: (_context, _profileId, connected) => {
                return (connected ?? 0) > 1 ?
                    t("disconnect-multiple", "Disconnect all connections to database")
                    : t("disconnect", "Disconnect from database")
            },
            keybindings: ["Ctrl+D"],
            icon: "Disconnected",
            run: (context, profileId) => {
                context.disconnect(profileId);
            },
            visible: (context, _profileId, connected) => (connected ?? context.connected ?? 0) > 0,
        });
    }, []);

    const context: ProfileListContext = {
        connect: (profileId?: string) => {
            if ((profileId ?? selectedItem) != null) {
                handleConnect((profileId ?? selectedItem) as string);
            }
        },
        delete: (profileId?: string) => {
            if ((profileId ?? selectedItem) != null) {
                handleDelete((profileId ?? selectedItem) as string);
            }
        },
        test: (profileId?: string) => {
            if ((profileId ?? selectedItem) != null) {
                const record = getProfile((profileId ?? selectedItem) as string);
                if (record) {
                    handleTestConnection(record);
                }
            }
        },
        edit: (profileId?: string) => {
            if ((profileId ?? selectedItem) != null) {
                queueMessage(Messages.EDIT_PROFILE, (profileId ?? selectedItem) as string);
            }
        },
        clone: (profileId?: string) => {
            if ((profileId ?? selectedItem) != null) {
                queueMessage(Messages.CLONE_EDIT_PROFILE, (profileId ?? selectedItem) as string);
            }
        },
        disconnect: (profileId?: string) => {
            if ((profileId ?? selectedItem) != null) {
                handleDisconnectAll((profileId ?? selectedItem) as string);
            }
        },
        connected: (data?.find(p => p.sch_id === (selectedItem ?? ''))?.connected)
    };

    React.useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!profiles) {
                setData(null);
                return;
            }
            const connectionList = await connections.list();
            const counts: Record<string, number> = {};
            (connectionList ?? []).forEach(conn => {
                const id = String((conn.userData?.profile as ProfileRecord)?.sch_id ?? "");
                if (id) counts[id] = (counts[id] ?? 0) + 1;
            });
            const updated: Profile[] = profiles.map(record => {
                const driver = drivers.find(record.sch_drv_unique_id as string);
                return {
                    ...record,
                    connected: counts[String(record.sch_id)] ?? 0,
                    driverName: driver?.name,
                    driverIcon: driver?.icon,
                };
            });
            if (!cancelled) setData(updated);
        })();
        return () => { cancelled = true; };
    }, [groupList, sortList, profiles, sessions, drivers, connections]);

    React.useEffect(() => {
        window.localStorage.setItem(Store_ProfileList_groupList, JSON.stringify(groupList));
    }, [groupList]);

    React.useEffect(() => {
        window.localStorage.setItem(Store_ProfileList_sortList, JSON.stringify(sortList));
    }, [sortList]);

    const handleDelete = async (id: string) => {
        setDeleting((prev) => [...prev, id]);
        try {
            await deleteProfile(id);
        } catch (error) {
            addToast("error",
                t("profile-delete-error", "Failed to delete the connection profile!"),
                { source: t_connectionProfile, reason: error }
            );
        } finally {
            setDeleting((prev) => prev.filter((profileId) => profileId !== id));
        }
    };

    // Function to handle testing the profile connection
    const handleTestConnection = async (profile: Profile) => {
        setTesting((prev) => [...prev, profile.sch_id]);
        try {
            await testConnection(profile.sch_drv_unique_id, profile.sch_use_password, profile.sch_properties, profile.sch_name);
        } catch (error) {
            setErroring((prev) => [...prev, profile.sch_id]);
        } finally {
            setTesting((prev) => prev.filter((id) => id !== profile.sch_id));
        }
    };

    const handleConnect = async (profileId: string) => {
        setConnecting((prev) => [...prev, profileId]);
        setErroring((prev) => prev.filter((id) => id !== profileId));
        try {
            await connectToDatabase(profileId);
        } catch (error) {
            setErroring((prev) => [...prev, profileId]);
        } finally {
            setConnecting((prev) => prev.filter((id) => id !== profileId));
        }
    };

    const handleDisconnectAll = async (profileId: string) => {
        setDisconnecting((prev) => [...prev, profileId]);
        try {
            await disconnectProfile(profileId);
        } catch (error) {
            addToast("error",
                t("profile-disconnect-error", "Failed to disconnect from database!"),
                { reason: error }
            );
            setErroring((prev) => [...prev, profileId]);
        } finally {
            setDisconnecting((prev) => prev.filter((id) => id !== profileId));
        }
    };

    const moveDown = React.useCallback((profileId: string) => {
        if (!searchedData || searchedData.length === 0 || !profileId) return;

        const currentIndex = searchedData.findIndex((profile) => profile.sch_id === profileId);
        const nextIndex = currentIndex + 1;

        if (nextIndex < searchedData.length) {
            const nextProfile = searchedData[nextIndex];
            if (groupList && (nextProfile.sch_group ?? "ungrouped") !== (searchedData[currentIndex].sch_group ?? "ungrouped")) {
                return; // Prevent moving to a different group
            }
            swapProfilesOrder(profileId, nextProfile.sch_id);
        }
    }, [searchedData, groupList, swapProfilesOrder]);

    const moveUp = React.useCallback((profileId: string) => {
        if (!searchedData || searchedData.length === 0 || !profileId) return;

        const currentIndex = searchedData.findIndex((profile) => profile.sch_id === profileId);
        const previousIndex = currentIndex - 1;
        if (previousIndex >= 0) {
            const previousProfile = searchedData[previousIndex];
            if (groupList && (previousProfile.sch_group ?? "ungrouped") !== (searchedData[currentIndex].sch_group ?? "ungrouped")) {
                return; // Prevent moving to a different group
            }
            swapProfilesOrder(profileId, previousProfile.sch_id);
        }
    }, [searchedData, groupList, swapProfilesOrder]);

    const moveGroupUp = React.useCallback((profileId: string) => {
        if (!groupedData || groupedData.length === 0 || !profileId) return;

        const currentIndex = groupedData.findIndex(group => group.some(profile => profile.sch_id === profileId));
        const previousIndex = currentIndex - 1;
        if (previousIndex >= 0) {
            const currentGroup = groupedData[currentIndex];
            const previousGroup = groupedData[previousIndex];
            swapProfilesOrder(currentGroup[0].sch_id, previousGroup[0].sch_id, true);
        }
    }, [groupedData, swapProfilesOrder]);

    const moveGroupDown = React.useCallback((profileId: string) => {
        if (!groupedData || groupedData.length === 0 || !profileId) return;

        const currentIndex = groupedData.findIndex(group => group.some(profile => profile.sch_id === profileId));
        const nextIndex = currentIndex + 1;
        if (nextIndex < groupedData.length) {
            const currentGroup = groupedData[currentIndex];
            const nextGroup = groupedData[nextIndex];
            swapProfilesOrder(currentGroup[0].sch_id, nextGroup[0].sch_id, true);
        }
    }, [groupedData, swapProfilesOrder]);

    const renderStatusIcon = React.useCallback((record: Profile, connecting: string[], erroring: string[]) => {
        let icon: React.ReactNode = null;
        if (connecting.includes(record.sch_id)) {
            icon = <theme.icons.Loading />;
        } else if (erroring.includes(record.sch_id)) {
            icon = <theme.icons.Error />;
        } else if ((record?.connected ?? 0) > 0) {
            icon = (
                <div style={{ position: "relative" }}>
                    <theme.icons.Connected />
                    <UnboundBadge
                        content={(record?.connected ?? 0) > 1 ? (record?.connected ?? 0) : 0}
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
            <ProfileListStatusIcon className="StatusIcon-statusIcon" key="status-icon">
                {icon}
            </ProfileListStatusIcon>
        );
    }, [theme]);

    const renderDriverIcon = React.useCallback((record: Profile) => {
        return (
            <ProfileListDriverIcon className="DriverIcon-driverIcon">
                <div className="icon">{record.driverIcon && <img src={record.driverIcon} />}</div>
                <div className="name">{highlightText(record.driverName!)}</div>
            </ProfileListDriverIcon>
        );
    }, [highlightText]);

    const renderPrimaryText = React.useCallback((record: Profile) => {
        return (
            <ProfileListPrimaryText className="ProfileList-primaryText" style={{ color: record.sch_color }}>
                {highlightText(record.sch_name!)}
            </ProfileListPrimaryText>
        );
    }, [highlightText]);

    const renderSecondaryText = React.useCallback((record: Profile) => {
        const neverText = t("never", "Never");
        const groupText = record.sch_group ?? t("ungrouped", "Ungrouped");
        const lastSelectedText = record.sch_last_selected
            ? DateTime.fromSQL(record.sch_last_selected ?? '')?.toRelative() ?? neverText
            : neverText;

        return (
            <ProfileListSecondaryText className="ProfileList-secondaryText">
                {!groupList && (
                    <span className="group-name">
                        <Trans i18nKey="profile-group-name" values={{ group: groupText }}>
                            Group: <strong>{groupText}</strong>
                        </Trans>
                    </span>
                )}
                <span className="last-selected">
                    <Trans i18nKey="profile-last-selected" values={{ lastSelected: lastSelectedText }}>
                        Selected: <strong>{lastSelectedText}</strong>
                    </Trans>
                </span>
                {record.sch_db_version && (
                    <span className="db-version">
                        <Trans i18nKey="profile-db-version" values={{ version: record.sch_db_version }}>
                            Version: <strong>{record.sch_db_version}</strong>
                        </Trans>
                    </span>
                )}
            </ProfileListSecondaryText>
        );
    }, [t]);

    const renderProfileName = React.useCallback((record: Profile) => {
        return (
            <ProfileListProfileName className="ProfileList-profileName">
                {renderPrimaryText(record)}
                {renderSecondaryText(record)}
            </ProfileListProfileName>
        );
    }, [renderPrimaryText, renderSecondaryText]);

    const renderHeaderSortButtons = React.useCallback((sch_id: string) => {
        if (sortList) return null;
        return (
            <ProfileListActionButtons
                className={clsx(
                    "ProfileList-actionButtons",
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
            </ProfileListActionButtons>
        );
    }, [selectedItem, sortList, moveGroupUp, moveGroupDown]);

    const renderProfileSortButtons = React.useCallback((record: Profile) => {
        if (sortList) return null;
        return (
            <ProfileListActionButtons
                className={clsx(
                    "ProfileList-actionButtons",
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
            </ProfileListActionButtons>
        );
    }, [selectedItem, sortList, moveUp, moveDown]);

    const renderHeader = React.useCallback((item: GroupHeader) => {
        return (
            <ProfileListGroupHeader className="ProfileList-groupHeader">
                {renderHeaderSortButtons(item.first_sch_id!)}
                <ProfileListGroupName className="ProfileList-groupName">
                    {highlightText(item.title)}
                </ProfileListGroupName>
            </ProfileListGroupHeader>
        );
    }, [renderHeaderSortButtons, highlightText]);


    const renderProfileActionButtons = React.useCallback((record: Profile) => {
        return (
            <ProfileListActionButtons
                className={clsx(
                    "ProfileList-actionButtons",
                    record.sch_id === selectedItem && "selected"
                )}
            >
                <ButtonGroup>
                    <ToolButton
                        key="disconnect"
                        actionManager={actions.current}
                        action={disconnectAllActionId}
                        actionArgs={[record.sch_id, record.connected]}
                        actionContext={() => context}
                        size="medium"
                        color="info"
                        loading={disconnecting.includes(record.sch_id)}
                    />
                    <ToolButton
                        key="connect"
                        actionManager={actions.current}
                        action={connectActionId}
                        actionArgs={[record.sch_id]}
                        actionContext={() => context}
                        size="medium"
                        color="info"
                        loading={connecting.includes(record.sch_id)}
                    />
                </ButtonGroup>
                <ButtonGroup>
                    <ToolButton
                        actionManager={actions.current}
                        action={testActionId}
                        actionArgs={[record.sch_id]}
                        actionContext={() => context}
                        size="medium"
                        color="success"
                        loading={testing.includes(record.sch_id)}
                    />
                    <ToolButton
                        actionManager={actions.current}
                        action={editActionId}
                        actionArgs={[record.sch_id]}
                        actionContext={() => context}
                        size="medium"
                        color="primary"
                    />
                    <ToolButton
                        actionManager={actions.current}
                        action={cloneActionId}
                        actionArgs={[record.sch_id]}
                        actionContext={() => context}
                        size="medium"
                        color="primary"
                    />
                </ButtonGroup>
                <ButtonGroup>
                    <ToolButton
                        className="delete"
                        actionManager={actions.current}
                        action={deleteActionId}
                        actionArgs={[record.sch_id]}
                        actionContext={() => context}
                        size="medium"
                        color="error"
                        loading={deleting.includes(record.sch_id)}
                    />
                </ButtonGroup>
            </ProfileListActionButtons>
        );
    }, [selectedItem, context, disconnecting, connecting, testing, deleting]);

    const renderProfile = React.useCallback((record: Profile) => {
        return (
            <ProfileListProfile
                className={clsx(
                    "ProfileList-profile",
                    record.sch_id === selectedItem && "selected"
                )}
                onClick={() => setSelectedItem(record.sch_id)}
                onDoubleClick={() => actions.current.executeAction(connectActionId, context, record.sch_id)}
            >
                {renderProfileSortButtons(record)}
                {renderDriverIcon(record)}
                {renderStatusIcon(record, connecting, erroring)}
                {renderProfileName(record)}
                {renderProfileActionButtons(record)}
            </ProfileListProfile>
        );
    }, [selectedItem, connecting, erroring, renderProfileSortButtons, renderDriverIcon, renderStatusIcon, renderProfileName, renderProfileActionButtons]);

    useScrollIntoView({
        containerId: "profile-list-content",
        targetId: selectedItem,
        stickyHeader: '[id^="group-"]',
    })

    return (
        <ProfileListContainer {...other} className={clsx(className, "ProfileList-container")}>
            <ProfileListTitle className="ProfileList-title">
                <Typography variant="h4">{t_connectionProfile}</Typography>
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
                        <ToolButton
                            actionManager={actions.current}
                            action={groupActionId}
                            actionContext={() => context}
                            size="large"
                            toggle={"true"}
                            value={groupList ? "true" : null}
                        />
                        <ToolButton
                            actionManager={actions.current}
                            action={sortActionId}
                            actionContext={() => context}
                            size="large"
                            toggle={"true"}
                            value={sortList ? "true" : null}
                        />
                    </ButtonGroup>
                    <ToolButton
                        actionManager={actions.current}
                        action={refreshActionId}
                        actionContext={() => context}
                        size="large"
                    />
                </Box>
            </ProfileListTitle>
            <ProfileListContent
                className="ProfileList-content"
            >
                {initialized && displayData &&
                    <BaseList
                        componentName="ProfileList"
                        id="profile-list-content"
                        items={displayData}
                        color="default"
                        size="default"
                        renderItem={item => {
                            if (isGroupHeader(item)) {
                                return renderHeader(item);
                            }
                            return renderProfile(item);
                        }}
                        renderEmpty={() => {
                            return (
                                <Typography>{t("no-profiles-found", "No profiles found.")}</Typography>
                            )
                        }}
                        isSelected={item => isProfile(item) && item.sch_id === selectedItem}
                        isFocused={item => isProfile(item) && item.sch_id === selectedItem}
                        getItemId={item => isProfile(item) ? item.sch_id : `group-${item.title}`}
                        getItemClassName={item => isProfile(item) ? 'profile' : 'header'}
                        onKeyDown={handleSearchKeyDown}
                    />
                }
                {(!initialized || !displayData) && <Typography>Loading data...</Typography>}
            </ProfileListContent>
        </ProfileListContainer>
    );
};

export default ProfileList;
