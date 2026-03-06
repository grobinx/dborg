import React from "react";
import {
    Alert,
    AlertColor,
    AlertProps,
    Collapse,
    CollapseProps,
    styled,
    useTheme,
    useThemeProps,
} from "@mui/material";
import { resolveIcon } from "@renderer/themes/icons";
import { ToolButton } from "./buttons/ToolButton";

export type BannerSeverity = "error" | "warning" | "success" | "info" | "hint";

const severityMap: Record<BannerSeverity, AlertColor> = {
    error: "error",
    warning: "warning",
    success: "success",
    info: "info",
    hint: "info",
};

const iconMap: Record<BannerSeverity, "Error" | "Warning" | "Success" | "Info" | "Hint"> = {
    error: "Error",
    warning: "Warning",
    success: "Success",
    info: "Info",
    hint: "Hint",
};

const StyledBannerRoot = styled("div", {
    name: "Banner",
    slot: "root",
})(() => ({
    width: "100%",
    display: "block",
    boxSizing: "border-box",
    flex: "0 0 auto",
}));

const StyledBannerAlert = styled(Alert, {
    name: "Banner",
    slot: "alert",
})(({ theme }) => ({
    width: "100%",
    borderRadius: 0,
    alignItems: "center",
    padding: "4px 8px",
    gap: 8,
    "&.dense": {
        padding: "2px 4px",
    },
    "& .MuiAlert-icon": {
        padding: 0,
        marginRight: theme.spacing(1),
        fontSize: "1.1rem",
        alignItems: "center",
    },
    "& .MuiAlert-message": {
        width: "100%",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        fontSize: theme.typography.body2.fontSize,
    },
    "&.dense .MuiAlert-message": {
        gap: 1,
    },
    "& .MuiAlert-action": {
        padding: 0,
        marginRight: 0,
        alignItems: "center",
        display: "flex",
    },
}));

const StyledBannerTitle = styled("div", {
    name: "Banner",
    slot: "title",
})(({ theme }) => ({
    fontWeight: 600,
    lineHeight: 1.25,
    fontSize: theme.typography.body2.fontSize,
}));

const StyledBannerMessage = styled("div", {
    name: "Banner",
    slot: "message",
})(() => ({
    lineHeight: 1.35,
    overflowWrap: "anywhere",
}));

export interface BannerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    severity?: BannerSeverity;
    title?: React.ReactNode;
    closeable?: boolean;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean, event?: React.SyntheticEvent) => void;
    onClose?: (event?: React.SyntheticEvent) => void;
    icon?: React.ReactNode | false;
    dense?: boolean;
    variant?: AlertProps["variant"];
    alertProps?: Omit<AlertProps, "severity" | "icon" | "variant" | "onClose" | "action">;
    collapseProps?: Omit<CollapseProps, "in" | "children">;
    ref?: React.Ref<HTMLDivElement>;
}

const Banner: React.FC<BannerProps> = (props) => {
    const {
        className,
        severity = "info",
        title,
        children,
        closeable = true,
        open: openProp,
        defaultOpen = false,
        onOpenChange,
        onClose,
        icon,
        dense = false,
        variant = "standard",
        alertProps,
        collapseProps,
        ref,
        ...other
    } = useThemeProps({
        name: "Banner",
        props,
    });

    const theme = useTheme();
    const controlled = openProp !== undefined;
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
    const open = controlled ? Boolean(openProp) : uncontrolledOpen;

    const previousContentRef = React.useRef<{
        title: React.ReactNode;
        children: React.ReactNode;
    } | null>(null);

    const handleClose = React.useCallback(
        (event?: React.SyntheticEvent) => {
            if (!controlled) {
                setUncontrolledOpen(false);
            }
            onClose?.(event);
            onOpenChange?.(false, event);
        },
        [controlled, onClose, onOpenChange]
    );

    const rootClassName = ["Banner-root", className].filter(Boolean).join(" ");
    const alertClassName = ["Banner-alert", dense ? "dense" : "", alertProps?.className].filter(Boolean).join(" ");

    React.useEffect(() => {
        if (controlled) {
            return;
        }

        if (React.Children.count(children) === 0 && !title) {
            if (uncontrolledOpen) {
                setUncontrolledOpen(false);
                onOpenChange?.(false);
            }
            return;
        }

        const previous = previousContentRef.current;
        previousContentRef.current = { title, children };

        // Przy pierwszym renderze z zawartością, otwórz banner
        if (!previous) {
            if (!uncontrolledOpen) {
                setUncontrolledOpen(true);
                onOpenChange?.(true);
            }
            return;
        }

        const contentChanged = previous.title !== title || previous.children !== children;
        if (contentChanged && !uncontrolledOpen) {
            setUncontrolledOpen(true);
            onOpenChange?.(true);
        }
    }, [controlled, title, children, uncontrolledOpen, onOpenChange]);

    return (
        <StyledBannerRoot className={rootClassName} ref={ref} {...other}>
            <Collapse in={open} timeout={120} unmountOnExit {...collapseProps}>
                <StyledBannerAlert
                    {...alertProps}
                    className={alertClassName}
                    severity={severityMap[severity]}
                    variant={variant}
                    icon={resolveIcon(theme, iconMap[severity])}
                    action={
                        closeable ? (
                            <ToolButton
                                size="small"
                                aria-label="close banner"
                                onClick={(event) => handleClose(event)}
                            >
                                <theme.icons.Close />
                            </ToolButton>
                        ) : undefined
                    }
                >
                    {title ? <StyledBannerTitle className="Banner-title">{title}</StyledBannerTitle> : null}
                    <StyledBannerMessage className="Banner-message">{children}</StyledBannerMessage>
                </StyledBannerAlert>
            </Collapse>
        </StyledBannerRoot>
    );
};

export default Banner;