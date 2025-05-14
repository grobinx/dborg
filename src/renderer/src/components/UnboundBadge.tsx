import React from "react";
import { styled, Box, Theme, useThemeProps } from "@mui/material";

type SizeType = "small" | "medium" | "large";

export interface UnboundBadgeProps {
    content?: React.ReactNode; // The content to display inside the badge
    size?: SizeType; // Diameter of the badge
    border?: string; // Optional border for the badge
    color?: keyof Theme["palette"]; // Color type from MUI theme
    unmountOnHide?: boolean; // Whether to unmount the badge when hidden
}

// Styled UnboundBadge container
const StyledUnboundBadgeRoot = styled(Box, {
    name: "UnboundBadge",
    slot: "root",
})<UnboundBadgeProps>(({ theme, size, border, color }) => {
    const sizeMap = {
        small: theme.typography.fontSize * 0.8,
        medium: theme.typography.fontSize * 1,
        large: theme.typography.fontSize * 1.2,
    };

    const badgeSize = sizeMap[size as keyof typeof sizeMap] || sizeMap.medium;

    return {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: badgeSize * 1.6,
        height: badgeSize * 1.6,
        borderRadius: `${badgeSize}px`,
        backgroundColor: theme.palette[color as keyof Theme["palette"]]?.["main"] || theme.palette.primary.main,
        color: theme.palette[color as keyof Theme["palette"]]?.["contrastText"] || theme.palette.primary.contrastText,
        fontSize: badgeSize * 0.9,
        fontWeight: theme.typography.fontWeightBold,
        border: border || "none",
        paddingLeft: "0.3em",
        paddingRight: "0.4em",
        transition: "opacity 0.3s ease, transform 0.3s ease", // Smooth transition
    };
});

const UnboundBadge: React.FC<UnboundBadgeProps> = (props) => {
    const { content, size = "medium", color, border, unmountOnHide = false, ...other } = useThemeProps({ name: "UnboundBadge", props: props, });
    const [isVisible, setIsVisible] = React.useState(content !== 0); // Controls rendering
    const [isAnimating, setIsAnimating] = React.useState(content !== 0); // Controls animation

    React.useEffect(() => {
        if (content === 0) {
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
                    className="UnboundBadge-root"
                    size={size}
                    color={color}
                    border={border}
                    style={{
                        opacity: isAnimating ? 1 : 0,
                        transform: isAnimating ? "scale(1)" : "scale(0.8)",
                    }}
                    {...other}
                >
                    {content}
                </StyledUnboundBadgeRoot>
            )}
        </>
    );
};

export default UnboundBadge;