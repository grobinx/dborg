import { alpha, Palette, ThemeOptions } from "@mui/material";
import { TreeComponent } from "@renderer/themes/theme.d/Tree";
import { listItemSizeProperties } from "./consts";
import { themeColors } from "@renderer/types/colors";

export const TreeLayout = (palette: Palette, _root: ThemeOptions): TreeComponent => {
    return {
        styleOverrides: {
            root: {
                width: "100%",
                height: "100%",
                flexGrow: 1,
                overflowY: "auto",
                overflowX: "hidden",
                display: 'flex',
            },
            inner: {
                padding: 8,
                width: '100%',
                height: '100%',
            },
            tree: {
                transition: "all 0.2s ease-in-out",
                outline: 'none',
                height: '100%',
                width: '100%',
                overflowY: 'auto',
                ...themeColors.reduce((acc, color) => {
                    acc[`&.color-${color}`] = {
                        backgroundColor: alpha(palette[color].main, 0.1),
                    };
                    return acc;
                }, {}),
                '&.color-default': {
                    backgroundColor: "transparent",
                },
            },
            node: {
                transition: "all 0.2s ease-in-out",
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                userSelect: 'none',
                outline: `1px solid transparent`,
                border: 'none',
                "&.size-small": { ...listItemSizeProperties.small, padding: '0.05em calc(var(--node-level, 0) * 8px + 8px)', },
                "&.size-medium": { ...listItemSizeProperties.medium, padding: '0.1em calc(var(--node-level, 0) * 8px + 8px)', },
                "&.size-large": { ...listItemSizeProperties.large, padding: '0.15em calc(var(--node-level, 0) * 8px + 8px)', },
                "&.size-default": { padding: '0.1em calc(var(--node-level, 0) * 8px + 8px)', },
                padding: '0.05em calc(var(--node-level, 0) * 8px + 8px)',
                outlineOffset: -1,
                ...themeColors.reduce((acc, color) => {
                    acc[`&.color-${color}`] = {
                        color: palette.text.primary,

                        '&.selected': {
                            backgroundColor: alpha(palette[color].main, 0.4),
                            ".focused &": {
                                outlineColor: palette[color].main,
                                //backgroundColor: alpha(palette[color].main, 0.5),
                            },
                        },

                        "&:hover": {
                            backgroundColor: alpha(palette[color].main, 0.2),
                            '&.selected': {
                                backgroundColor: alpha(palette[color].main, 0.6),
                            },
                        },
                    };
                    return acc;
                }, {}),
                '&.color-default': {
                    '&.selected': {
                        backgroundColor: palette.action.selected,
                        '.focused &': {
                            outline: `1px solid ${palette.action.focus}`,
                        },
                    },
                    '&:hover': {
                        backgroundColor: palette.action.hover,
                    },
                },
            },
            toggleIcon: {
                width: '1.5em',
            },
            label: {
                alignContent: 'center',
            },
        }
    };
};