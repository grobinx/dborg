import React from "react";
import { styled, Box, Theme, useThemeProps, SxProps } from "@mui/material";
import { Size } from "@renderer/types/sizes";
import { ThemeColor } from "@renderer/types/colors";

export interface UnboundBadgeProps {
    content?: React.ReactNode; // The content to display inside the badge
    size?: Size; // Diameter of the badge
    border?: string; // Optional border for the badge
    color?: ThemeColor; // Color type from MUI theme
    unmountOnHide?: boolean; // Whether to unmount the badge when hidden
    style?: React.CSSProperties; // Additional styles
    sx?: SxProps; // MUI sx prop for styling
    className?: string; // Additional class names
    [key: `data-${string}`]: any; // Data attributes
}

// Styled UnboundBadge container
const StyledUnboundBadgeRoot = styled(Box, {
    name: "UnboundBadge",
    slot: "root",
})<UnboundBadgeProps>(({ theme, size, border, color }) => {
    const sizeMap = {
        small: 0.8,
        medium: 1,
        large: 1.2,
    };

    const badgeSize = sizeMap[size as keyof typeof sizeMap] || sizeMap.medium;

    return {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: `${badgeSize * 1.6}em`,
        height: `${badgeSize * 1.6}em`,
        borderRadius: "50%",
        backgroundColor: theme.palette[color as keyof Theme["palette"]]?.["main"] || theme.palette.primary.main,
        color: theme.palette[color as keyof Theme["palette"]]?.["contrastText"] || theme.palette.primary.contrastText,
        fontSize: `${badgeSize * 0.9}em`,
        fontWeight: theme.typography.fontWeightBold,
        border: border || "none",
        paddingLeft: "0.4em",
        paddingRight: "0.4em",
        transition: "opacity 0.3s ease, transform 0.3s ease", // Smooth transition
    };
});

const UnboundBadge: React.FC<UnboundBadgeProps> = (props) => {
    const { content, size = "medium", color, border, unmountOnHide = false, style, sx, ...other } = useThemeProps({ name: "UnboundBadge", props: props, });
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
                        ...style,
                    }}
                    sx={sx}
                    {...other}
                >
                    {content}
                </StyledUnboundBadgeRoot>
            )}
        </>
    );
};

export default UnboundBadge;