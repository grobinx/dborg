import { alpha, Palette, ThemeOptions } from "@mui/material";
import { borderRadius, paddingLarge, paddingMedium, paddingSmall, buttonSizeProperties } from "./consts";
import { themeColors } from "@renderer/types/colors";
import { ButtonComponent } from "@renderer/themes/theme.d/Button";


export const ButtonLayout = (palette: Palette, _root: ThemeOptions): ButtonComponent => {
    return {
        styleOverrides: {
            root: {
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                //border: "none",
                cursor: "pointer",
                userSelect: "none",
                textDecoration: "none",
                fontFamily: "inherit",
                fontSize: "inherit",
                fontWeight: 600,
                lineHeight: 1,
                borderRadius: borderRadius,
                backgroundColor: "transparent",
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                whiteSpace: "nowrap",
                border: `1px solid ${palette.divider}`,
                outlineColor: 'transparent',
                outlineWidth: 0,
                outlineStyle: 'solid',
                outlineOffset: -2,
                "& .IconWrapper-root": {
                    transition: "filter 140ms ease, color 140ms ease",
                    filter: "none",
                },

                "&.disabled": {
                    opacity: 0.6,
                    pointerEvents: "none",
                    cursor: "not-allowed",
                },

                "&.selected": {
                    // Style dla stanu wybranego
                },

                "&.size-small": {
                    ...buttonSizeProperties.small
                },

                "&.size-medium": {
                    ...buttonSizeProperties.medium
                },

                "&.size-large": {
                    ...buttonSizeProperties.large
                },

                "&.focused": {
                    borderColor: 'transparent',
                },

                ...themeColors.reduce((acc, color) => {
                    const hoverGlow = alpha(palette[color].main, palette.mode === "light" ? 0.45 : 0.75);
                    const selectedHoverGlow = alpha(palette[color].main, palette.mode === "light" ? 0.55 : 0.9);

                    acc[`&.color-${color}`] = {
                        "&:not(.flat)": {
                            backgroundColor: alpha(palette[color].main, 0.2),
                        },
                        color: palette.text.primary,

                        "&.hover:not(.disabled):not(.loading), &.focused-keyboard:not(.disabled):not(.loading)": {
                            boxShadow: `0 2px 8px 0 ${alpha(palette[color].main, 0.18)}`,
                            backgroundColor: alpha(palette[color].main, 0.3),

                            "& .IconWrapper-root": {
                                filter: `drop-shadow(0 0 1px ${hoverGlow}) drop-shadow(0 0 6px ${hoverGlow})`,
                            },

                            "&.selected": {
                                backgroundColor: alpha(palette[color].main, 0.4),
                                "& .IconWrapper-root": {
                                    filter: `drop-shadow(0 0 2px ${selectedHoverGlow}) drop-shadow(0 0 10px ${selectedHoverGlow})`,
                                },
                            },

                            "&.has-value": {
                                backgroundColor: alpha(palette[color].main, 0.5),
                                "& .IconWrapper-root": {
                                    filter: `drop-shadow(0 0 2px ${selectedHoverGlow}) drop-shadow(0 0 10px ${selectedHoverGlow})`,
                                },
                            },
                        },

                        "&.active:not(.disabled):not(.loading)": {
                            backgroundColor: alpha(palette[color].dark, 0.4),
                        },

                        "&.focused": {
                            outlineWidth: 2,
                            outlineColor: palette[color].main,
                        },

                        "&.selected": {
                            backgroundColor: alpha(palette[color].main, 0.5),
                        },

                        "&.has-value": {
                            backgroundColor: alpha(palette[color].main, 0.6),
                        },
                    };
                    return acc;
                }, {}),

                "&.loading": {
                    cursor: "wait",
                    pointerEvents: "none",
                    color: palette.text.disabled,
                    outline: `1px solid ${palette.text.disabled}`,
                    outlineOffset: -1,
                },
            },
            content: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 0.5rem",
                transition: "text-shadow 140ms ease, color 140ms ease, transform 120ms ease",
                textShadow: "none",

                ...themeColors.reduce((acc, color) => {
                    const hoverGlow = alpha(palette[color].main, palette.mode === "light" ? 0.45 : 0.75);
                    const selectedHoverGlow = alpha(palette[color].main, palette.mode === "light" ? 0.55 : 0.9);

                    acc[`&.color-${color}.hover:not(.disabled):not(.loading), &.color-${color}.focused-keyboard:not(.disabled):not(.loading)`] = {
                        textShadow: `0 0 6px ${hoverGlow}`,
                        "&.selected, &.has-value": {
                            textShadow: `0 0 8px ${selectedHoverGlow}`,
                        },
                    };

                    return acc;
                }, {}),

                "&.loading": {
                    opacity: 0,
                },
                "&.active:not(.disabled):not(.loading)": {
                    transform: "scale(0.9)",
                },
                "&.size-small": {
                    gap: paddingSmall,
                },

                "&.size-medium": {
                    gap: paddingMedium,
                },

                "&.size-large": {
                    gap: paddingLarge,
                },
            },
            loading: {
                display: "flex",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
            },
            loadingContent: {
                fontSize: "0.875em",
                opacity: 0.8,
            }
        }
    };
};
