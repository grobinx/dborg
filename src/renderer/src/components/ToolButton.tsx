import React from "react";
import { styled, Button, ButtonProps, useThemeProps } from "@mui/material";
import { resolveColor } from "@renderer/themes/utils";

const StyledToolButton = styled(Button, {
    name: "ToolButton",
    slot: "root",
    shouldForwardProp: (prop) => prop !== "sizeButton" && prop !== "selected",
})<{
    sizeButton: 'small' | 'medium' | 'large';
    selected?: boolean;
    color?: string;
    variant?: 'text' | 'outlined' | 'contained';
}>(({
    sizeButton,
    selected,
    color,
    variant,
    theme
}) => ({
    minWidth: 0,
    display: "flex",
    ...(sizeButton === "large" && {
        minHeight: "1.7rem",
        padding: "0.5rem",
        fontSize: "1.2em",
    }),
    ...(sizeButton === "medium" && {
        minHeight: "1.5rem",
        padding: "0.25rem",
        fontSize: "1.1em",
    }),
    ...(sizeButton === "small" && {
        minHeight: "1rem",
        padding: "0.1rem",
        fontSize: "1em",
    }),
    ...(selected && variant === "text" && {
        backgroundColor: resolveColor(color || "primary", theme)["dark"],
        color: resolveColor(color || "primary", theme)["contrastText"],
    }),
    ...(selected && variant === "outlined" && {
        backgroundColor: resolveColor(color || "primary", theme)["dark"],
        color: resolveColor(color || "primary", theme)["contrastText"],
    }),
    ...(selected && variant === "contained" && {
        backgroundColor: resolveColor(color || "primary", theme)["dark"],
        color: resolveColor(color || "primary", theme)["contrastText"],
        boxShadow: theme.shadows[4],
    }),
}));

export interface ToolButtonProps extends ButtonProps {
    selected?: boolean;
}

const ToolButton: React.FC<ToolButtonProps> = (props) => {
    const { children, size = "medium", selected = false, ...other } = useThemeProps({ name: "ToolButton", props });
    return (
        <StyledToolButton
            {...other}
            size={size}
            sizeButton={size}
            selected={selected}
            color={other.color}
            className={`ToolButton-root ${other.className || ""} ${selected ? " Mui-selected" : ""}`}
            {...{ component: "div" }}
        >
            {children}
        </StyledToolButton>
    );
};

export default ToolButton;