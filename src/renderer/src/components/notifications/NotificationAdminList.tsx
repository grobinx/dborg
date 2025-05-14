import React, { useEffect } from "react";
import {
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Collapse,
    styled,
    Tooltip,
    useTheme,
    useThemeProps,
    TextField,
} from "@mui/material";
import { useNotificationAdmin } from "@renderer/contexts/NotificationContext";
import { alertIconMap } from "@renderer/components/notifications/NotificationToastList";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import UnboundBadge from "../UnboundBadge";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import ToolButton from "@renderer/components/ToolButton";
import { useTranslation } from "react-i18next";
import { useMessages } from "@renderer/contexts/MessageContext";
import { DateTime } from "luxon";

const SEARCH_NOTIFICATIONS = "search-notifications";

const StyledNotificationAdminList = styled(List, {
    name: "NotificationAdminList",
    slot: "root",
})(({ /*theme*/ }) => ({
    // Add styles for the list container if needed
    height: "100%",
    overflowY: "auto",
}));

export interface NotificationAdminListProps extends React.ComponentProps<typeof List> {
    slotProps?: {
        item?: React.ComponentProps<typeof ListItem>;
        itemIcon?: React.ComponentProps<typeof ListItemIcon>;
        itemText?: React.ComponentProps<typeof ListItemText>;
        itemButton?: React.ComponentProps<typeof Button>;
    };
}

interface NotificationAdminListOwnProps extends NotificationAdminListProps { }

const NotificationAdminList: React.FC<NotificationAdminListOwnProps> = (props) => {
    const { notifications, removeNotification } = useNotificationAdmin();
    const { slotProps, ...other } = useThemeProps({ name: "NotificationAdminList", props: props });
    const theme = useTheme();
    const [selectedNotificationId, setSelectedNotificationId] = React.useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = React.useState("");
    const { subscribe, unsubscribe } = useMessages();

    const handleSelect = (id: string) => {
        setSelectedNotificationId((prev) => (prev === id ? null : id)); // Toggle selection
    };

    const toggleGroup = (source: string) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [source]: !prev[source],
        }));
    };

    const removeGroupNotifications = (source: string) => {
        notifications
            .filter((notification) => notification.source === source)
            .forEach((notification) => removeNotification(notification.id));
    };

    // Define colors for each notification type
    const getIconColor = (type: string) => {
        switch (type) {
            case "error":
                return theme.palette.error.main;
            case "warning":
                return theme.palette.warning.main;
            case "info":
                return theme.palette.info.main;
            case "success":
                return theme.palette.success.main;
            default:
                return theme.palette.text.primary;
        }
    };

    const filteredNotifications = notifications
        .filter((notification) => {
            const messageMatches = notification.message.toLowerCase().includes(searchQuery.toLowerCase());
            const reasonMatches = notification.reason
                ? Object.values(notification.reason).some((value) =>
                    String(value).toLowerCase().includes(searchQuery.toLowerCase())
                )
                : false;
            return messageMatches || reasonMatches;
        })
        .sort((a, b) => (b.time || 0) - (a.time || 0)); // Sort by time, newest first

    // Group notifications by source
    const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
        const source = notification.source || "Unknown"; // Default to "Unknown" if no source
        if (!groups[source]) {
            groups[source] = [];
        }
        groups[source].push(notification);
        return groups;
    }, {} as Record<string, typeof notifications>);

    useEffect(() => {
        const handleSearchNotifications = (query: string) => {
            setSearchQuery(query);
        };

        subscribe(SEARCH_NOTIFICATIONS, handleSearchNotifications);
        return () => {
            unsubscribe(SEARCH_NOTIFICATIONS, handleSearchNotifications);
        };
    }, [subscribe, unsubscribe]);

    return (
        <StyledNotificationAdminList className="NotificationAdminList-root" disablePadding {...other}>
            {Object.entries(groupedNotifications).map(([source, group]) => (
                <React.Fragment key={source}>
                    <ListItem
                        key={source}
                        disablePadding
                        disableGutters
                        onClick={() => toggleGroup(source)}
                        {...slotProps?.item}
                        className="NotificationAdminList-group-header"
                    >
                        {expandedGroups[source] ? <theme.icons.ExpandLess /> : <theme.icons.ExpandMore />}
                        <ListItemText
                            primary={source}
                            {...slotProps?.itemText}
                        />
                        <div style={{ flexGrow: 1 }} />
                        <Button
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent toggling the group when clicking the button
                                removeGroupNotifications(source);
                            }}
                            {...slotProps?.itemButton}
                        >
                            <theme.icons.Close />
                        </Button>
                    </ListItem>
                    {/* Grouped Notifications */}
                    <Collapse in={expandedGroups[source]} timeout="auto" unmountOnExit>
                        {group.map((notification) => (
                            <React.Fragment key={notification.id}>
                                <ListItem
                                    key={notification.id}
                                    disablePadding
                                    disableGutters
                                    {...slotProps?.item}
                                    onClick={() => handleSelect(notification.id)}
                                    className={"NotificationAdminList-group-item" + (notification.id === selectedNotificationId ? " Mui-selected" : "")} // Add class for selected item
                                >
                                    <ListItemIcon
                                        {...slotProps?.itemIcon}
                                        sx={{ ...slotProps?.itemIcon?.sx, color: getIconColor(notification.type) }} // Apply dynamic color
                                    >
                                        {theme.icons[alertIconMap[notification.type]]()}
                                    </ListItemIcon>
                                    <ListItemText
                                        style={{ flexDirection: "column" }}
                                        primary={notification.message + (notification.time ? " (" + DateTime.fromMillis(notification.time).toRelative() + ")" : "")}
                                        {...slotProps?.itemText}
                                    />
                                    {notification.reason ? (notification.id === selectedNotificationId ? <theme.icons.ExpandLess /> : <theme.icons.ExpandMore />) : null}
                                    <div style={{ flexGrow: 1 }} />
                                    <Button onClick={() => removeNotification(notification.id)} {...slotProps?.itemButton}>
                                        <theme.icons.Close />
                                    </Button>
                                </ListItem>
                                {notification.reason ? (
                                    <Collapse in={notification.id === selectedNotificationId} timeout="auto" unmountOnExit>
                                        {Object.getOwnPropertyNames(notification.reason).map((key) => (
                                            <ListItem
                                                key={key}
                                                disablePadding
                                                disableGutters
                                                className="NotificationAdminList-reason-item"
                                                {...slotProps?.item}
                                            >
                                                <ListItemText
                                                    secondary={
                                                        <React.Fragment>
                                                            <strong>{key}:</strong> {String((notification.reason as Record<string, unknown>)[key])}
                                                        </React.Fragment>
                                                    }
                                                    {...slotProps?.itemText}
                                                />
                                            </ListItem>
                                        ))}
                                    </Collapse>
                                ) : null}
                            </React.Fragment>
                        ))}
                    </Collapse>
                </React.Fragment>
            ))}
        </StyledNotificationAdminList>
    );
};

export const NotificationAdminListButtons: React.FC = () => {
    const { notifications, removeNotification } = useNotificationAdmin();
    const theme = useTheme();
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = React.useState("");
    const { sendMessage } = useMessages();

    return <TabPanelButtons>
        <TextField
            placeholder={t("search", "Search...")}
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); sendMessage(SEARCH_NOTIFICATIONS, e.target.value); }}
            disabled={notifications.length === 0}
        />
        <Tooltip title={t("notifications-clear-all", "Clear all notifications")}>
            <span>
                <ToolButton
                    disabled={notifications.length === 0}
                    onClick={() => notifications.forEach(notification => removeNotification(notification.id))}
                >
                    <theme.icons.Delete />
                </ToolButton>
            </span>
        </Tooltip>
    </TabPanelButtons>;
}

export const NotificationAdminListLabel: React.FC = () => {
    const { notifications } = useNotificationAdmin();

    return <TabPanelLabel>
        <span>Notifications</span>
        <UnboundBadge
            content={notifications.length}
            size="small"
            color="primary"
        />
    </TabPanelLabel>;
}

export default NotificationAdminList;