import { Palette, ThemeOptions } from "@mui/material";
import { UnboundBadgeComponent } from "@renderer/themes/theme.d/UnboundBadge";
import { themeColors } from "@renderer/types/colors";

export const UnboundBadgeLayout = (palette: Palette, _root: ThemeOptions): UnboundBadgeComponent => {
    return {
        defaultProps: {
            unmountOnHide: true,
        },
        styleOverrides: {
            root: {
                transition: "all 0.2s ease-in-out",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "1em",
                fontWeight: 500,
                minWidth: "1.6em",
                height: "1.6em",
                padding: "0 0.3em",
                ...themeColors.reduce((acc, color) => {
                    acc[`&.color-${color}`] = {
                        backgroundColor: palette[color].main,
                        color: palette[color].contrastText,
                    };
                    return acc;
                }, {}),
                '&.size-small': {
                    fontSize: "0.5em",
                },
                '&.size-medium': {
                    fontSize: "0.7em",
                },
                '&.size-large': {
                    fontSize: "0.9em",
                },
                '&.visible': {
                    opacity: 1,
                    transform: "scale(1)",
                },
                '&:not(.visible)': {
                    opacity: 0,
                    transform: "scale(0.8)",
                },
            }
        }
    }
};
