import { alpha, darken, lighten, Palette, ThemeOptions } from "@mui/material";
import { ContainerButtonComponent } from "@renderer/themes/theme.d/ContainerButton";
import { borderRadius } from "./consts";
import { themeColors } from "@renderer/types/colors";

export const ContainerButtonLayout = (palette: Palette, _root: ThemeOptions): ContainerButtonComponent => {
    return {
        styleOverrides: {
            root: {
                outline: "none",
                cursor: "pointer",
                display: "flex",
                color: palette.mode === "dark" ? darken(palette.sideBar.contrastText, 0.2) : lighten(palette.sideBar.contrastText, 0.2),
                lineHeight: 0,
                fontSize: "inherit",
                border: 'none',
                borderRadius: borderRadius,
                padding: 4,
                backgroundColor: palette.background.sideBar,
                '& .IconWrapper-root': {
                    fontSize: "2em",
                    transition: "filter 140ms ease, color 140ms ease",
                    filter: "none",
                },
                '&.placement-right': {
                    justifyContent: "flex-end",
                },
                ...themeColors.reduce((acc, color) => {
                    const hoverGlow = alpha(palette[color].main, palette.mode === "light" ? 0.45 : 0.75);
                    const selectedHoverGlow = alpha(palette[color].main, palette.mode === "light" ? 0.55 : 0.9);

                    acc[`&.color-${color}`] = {
                        color: palette.mode === "light" ? darken(palette[color].main, 0.2) : lighten(palette[color].main, 0.2),

                        "&.hover:not(.disabled):not(.loading), &.focused-keyboard:not(.disabled):not(.loading)": {
                            color: palette.mode === "light" ? darken(palette[color].main, 0.6) : lighten(palette[color].main, 0.6),
                            backgroundColor: alpha(palette[color].main, 0.3),

                            "& .IconWrapper-root": {
                                filter: `drop-shadow(0 0 1px ${hoverGlow}) drop-shadow(0 0 6px ${hoverGlow})`,
                            },
                            "& .MuiTypography-root": {
                                textShadow: `0 0 6px ${hoverGlow}`,
                            },

                            "&.selected": {
                                backgroundColor: alpha(palette[color].main, 0.4),
                                "& .IconWrapper-root": {
                                    filter: `drop-shadow(0 0 2px ${selectedHoverGlow}) drop-shadow(0 0 10px ${selectedHoverGlow})`,
                                },
                                "& .MuiTypography-root": {
                                    textShadow: `0 0 8px ${selectedHoverGlow}`,
                                },
                            },
                        },

                        "&.selected": {
                            color: palette.mode === "light" ? darken(palette[color].main, 0.6) : lighten(palette[color].main, 0.6),
                            backgroundColor: alpha(palette[color].main, 0.5),
                            outline: "1px solid " + (palette.mode === "light" ? darken(palette[color].main, 0.6) : lighten(palette[color].main, 0.6)),
                            boxShadow: (_root.shadows?.[4]) ?? "none",
                        },
                    };
                    return acc;
                }, {}),
                '& .MuiTypography-root': {
                    padding: "2px 6px",
                    transition: "text-shadow 140ms ease, color 140ms ease",
                    textShadow: "none",
                },
                "&.disabled": {
                    cursor: "not-allowed",
                    opacity: 0.6,
                    pointerEvents: "none",
                    backgroundColor: palette.background.sideBar,
                },
                '&.orientation-horizontal': {
                    maxWidth: "10rem",
                },
                '&.orientation-vertical': {
                    maxWidth: "7rem",
                },
                '&.expanded': {
                    minWidth: "4rem",
                },
                '&:not(.expanded)': {
                    minWidth: 0,
                },
            },
            content: {
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "100%",
                '&.placement-left': {
                    flexDirection: "row",
                },
                '&.placement-right': {
                    flexDirection: "row-reverse",
                },
                '&.placement-top, &.placement-bottom': {
                    flexDirection: "column",
                },
            }
        }
    }
};
