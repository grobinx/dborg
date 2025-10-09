import { styled, SxProps, useThemeProps } from "@mui/material";
import { ThemeColor, themeColors } from "@renderer/types/colors";
import { Size } from "@renderer/types/sizes";
import clsx from "@renderer/utils/clsx";
import React from "react";

export interface UnboundBadgeProps {
    content?: React.ReactNode; // The content to display inside the badge
    size?: Size; // Diameter of the badge
    color?: ThemeColor; // Color type from MUI theme
    unmountOnHide?: boolean; // Whether to unmount the badge when hidden
    style?: React.CSSProperties; // Additional styles
    sx?: SxProps; // MUI sx prop for styling
    className?: string; // Additional class names
    [key: `data-${string}`]: any; // Data attributes
}

// Styled UnboundBadge container
const StyledUnboundBadgeRoot = styled("div", {
    name: "UnboundBadge",
    slot: "root",
})<UnboundBadgeProps>(({ }) => ({
}));

const UnboundBadge: React.FC<UnboundBadgeProps> = (props) => {
    const {
        content,
        size = "medium",
        color = "primary",
        unmountOnHide = false,
        ...other 
    } = useThemeProps({ name: "UnboundBadge", props: props, });
    const [isVisible, setIsVisible] = React.useState(content); // Controls rendering
    const [isAnimating, setIsAnimating] = React.useState(content); // Controls animation

    React.useEffect(() => {
        if (!content) {
            setIsAnimating(false); // Trigger fade-out animation
            setTimeout(() => setIsVisible(false), 300); // Remove from DOM after animation
        } else {
            setIsVisible(true); // Ensure it's rendered
            setTimeout(() => setIsAnimating(true), 0); // Trigger fade-in animation
        }
    }, [content]);

    return (
        <>
            {(isVisible || !unmountOnHide) && (
                <StyledUnboundBadgeRoot
                    className={clsx(
                        "UnboundBadge-root",
                        isAnimating && "visible",
                        `size-${size}`,
                        `color-${color}`
                    )}
                    {...other}
                >
                    {content}
                </StyledUnboundBadgeRoot>
            )}
        </>
    );
};

export default UnboundBadge;