import { useNotificationAdmin } from "../../contexts/NotificationContext";
import { Paper, Alert, Zoom, Collapse, Grow, Fade, Slide, useTheme } from "@mui/material";
import { AppSettings } from "@renderer/app.config";
import { useSettings } from "@renderer/contexts/SettingsContext";
import { TransitionGroup } from "react-transition-group";
import { styled, useThemeProps } from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";

export const alertSeverityMap: Record<string, "error" | "warning" | "success" | "info" | undefined> = {
    error: "error",
    warning: "warning",
    success: "success",
    info: "info",
    hint: "info", // Use info for hint as well
};

export const alertIconMap: Record<"error" | "warning" | "success" | "info" | "hint", string> = {
    error: "Error",
    warning: "Warning",
    success: "Success",
    info: "Info",
    hint: "Hint", // Use info for hint as well
};

// Map of transition names to components
const transitionMap = {
    Collapse,
    Fade,
    Grow,
    Slide,
    Zoom,
};

// Styled TransitionGroup component
const NotificationToastListRoot = styled(TransitionGroup, {
    name: "NotificationToastList",
    slot: "root",
})(({ /*theme*/ }) => ({
    position: "fixed",
    left: 16,
    bottom: 16,
    zIndex: 1300,
    gap: 8,
    display: "flex",
    flexDirection: "column-reverse",
    alignItems: "flex-start",
}));

// Styled Paper component extending MUI's Paper
const StyledPaper = styled(Paper, {
    name: "NotificationToastList",
    slot: "paper",
})(({ /*theme*/ }) => ({
}));

// Styled Alert component extending MUI's Alert
const StyledAlert = styled(Alert, {
    name: "NotificationToastList",
    slot: "alert",
})(({ /*theme*/ }) => ({
}));

export interface NotificationToastListProps extends React.HTMLAttributes<HTMLDivElement> {
    slotProps?: {
        paper?: React.ComponentProps<typeof Paper>;
        alert?: React.ComponentProps<typeof Alert>;
        transition?: TransitionProps & {
            component?: keyof typeof transitionMap;
            slotProps?: {
                zoom?: Omit<React.ComponentProps<typeof Zoom>, "children">;
                collapse?: Omit<React.ComponentProps<typeof Collapse>, "children">;
                grow?: Omit<React.ComponentProps<typeof Grow>, "children">;
                slide?: Omit<React.ComponentProps<typeof Slide>, "children">;
                fade?: Omit<React.ComponentProps<typeof Fade>, "children">;
            }
        };
    };
}

const NotificationToastList: React.FC<NotificationToastListProps> = (props) => {
    const { notifications, dispatchNotification, showedNotification } = useNotificationAdmin();
    const [settings] = useSettings<AppSettings>("app");
    const theme = useTheme();

    // Use theme props to allow customization via slotProps
    const { slotProps, ...rootProps } = useThemeProps({
        name: "NotificationToastList",
        props: props,
    });

    // Get the transition component from the map, default to Zoom
    const { component: transitionComponent, slotProps: transtionSlotProps, ...transitionProps } = slotProps?.transition ?? {};
    const TransitionComponent = transitionMap[transitionComponent ?? "Zoom"] ?? Zoom;

    return (
        <NotificationToastListRoot
            className={"NotificationToastList-root"}
            {...rootProps} // Pass slotProps for NotificationToastListRoot
        >
            {notifications
                .filter(({ close, toast }) => !close && toast)
                .sort((a, b) => a.posted - b.posted) // Sort by oldest first
                .slice(0, settings.max_toast) // Take the oldest up to the max_toast limit
                .map(({ id, type, message, shown, reason }) => {
                    if (!shown) {
                        Promise.resolve().then(() => showedNotification(id)); // Mark as shown
                    }
                    return (
                        <TransitionComponent key={id} {...transitionProps} {...transtionSlotProps?.[(transitionComponent ?? "zoom")?.toLowerCase()]}>
                            <StyledPaper
                                {...slotProps?.paper}
                                className={"NotificationToastList-paper"}
                            >
                                <StyledAlert
                                    icon={theme.icons[alertIconMap[type]]()}
                                    severity={alertSeverityMap[type]}
                                    onClose={() => dispatchNotification(id)}
                                    {...slotProps?.alert} // Pass slotProps for Alert
                                >
                                    {type === "error" && (
                                        <>
                                            {message}
                                            {typeof reason === "object" && reason !== null && "message" in reason && (
                                                <code><pre>{(reason as { message: string }).message}</pre></code>
                                            )}
                                            {typeof reason === "object" && reason !== null && "hint" in reason && (
                                                <div style={{ marginTop: "8px", fontStyle: "italic", color: theme.palette.text.secondary }}>{(reason as { hint: string }).hint}</div>
                                            )}
                                        </>
                                    )}
                                    {type !== "error" && message}
                                </StyledAlert>
                            </StyledPaper>
                        </TransitionComponent>
                    );
                })
            }
        </NotificationToastListRoot>
    );
};

export default NotificationToastList;
