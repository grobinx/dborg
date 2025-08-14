import { alpha, Palette, ThemeOptions } from "@mui/material";
import { borderRadius, rootSizeProperties } from "./consts";
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
                transition: "all 0.2s ease-in-out",
                borderRadius: borderRadius,
                backgroundColor: "transparent",
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                whiteSpace: "nowrap",
                border: `1px solid ${palette.divider}`,

                "&.disabled": {
                    cursor: "not-allowed",
                    opacity: 0.6,
                    pointerEvents: "none",
                },

                "&.selected": {
                    // Style dla stanu wybranego
                },

                "&.size-small": {
                    ...rootSizeProperties.small
                },

                "&.size-medium": {
                    ...rootSizeProperties.medium
                },

                "&.size-large": {
                    ...rootSizeProperties.large
                },

                "&.focused": {
                    borderColor: 'transparent',
                    outlineWidth: 2,
                    outlineStyle: 'solid',
                    outlineOffset: -2,
                },

                ...themeColors.reduce((acc, color) => {
                    acc[`&.color-${color}`] = {
                        backgroundColor: alpha(palette[color].main, 0.2),
                        color: palette.text.primary,
                        //outline: `1px solid ${palette[color].main}`,
                        //outlineOffset: "-1px",

                        "&.hover:not(.disabled):not(.loading)": {
                            backgroundColor: alpha(palette[color].main, 0.3),
                            '&.focused': {
                                //backgroundColor: alpha(palette[color].main, 0.4),
                            },
                            '&.selected': {
                                backgroundColor: alpha(palette[color].main, 0.4),
                            },
                            '&.has-value': {
                                backgroundColor: alpha(palette[color].main, 0.5),
                            }
                        },

                        "&.active:not(.disabled):not(.loading)": {
                            position: "relative",
                            transform: "scale(0.98)",
                            overflow: "hidden",
                            backgroundColor: alpha(palette[color].dark, 0.4),
                        },

                        "&.focused": {
                            transition: "outline-color 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                            outlineColor: palette[color].main,
                            //backgroundColor: alpha(palette[color].main, 0.5),
                        },

                        '&.selected': {
                            backgroundColor: alpha(palette[color].main, 0.5),
                        },

                        // Style dla różnych pressed states
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
                transition: "opacity 0.2s ease-in-out",
                padding: "0 0.5rem",
                '&.loading': {
                    opacity: 0,
                }
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
            loadingIndicator: {
                width: "1em",
                height: "1em",
                border: "2px solid transparent",
                borderTop: "2px solid currentColor",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",

                "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                },
            },
            loadingContent: {
                fontSize: "0.875rem",
                opacity: 0.8,
            }
        }
    };
};
