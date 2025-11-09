import { alpha, Palette, ThemeOptions } from "@mui/material";
import { listItemSizeProperties } from "./consts";
import { themeColors } from "@renderer/types/colors";
import { blendColors } from "@renderer/utils/colors";
import { BaseListComponent } from "@renderer/themes/theme.d/BaseList";

export const BaseListLayout = (palette: Palette, _root: ThemeOptions): BaseListComponent => {
    return {
        styleOverrides: {
            root: {
                outline: 'none',
                listStyle: 'none',
                margin: 0,
                padding: 0,
                overflow: 'auto',
                width: '100%',
                height: '100%',
                flex: 1,
            },
            item: {
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                transition: "all 0.2s ease-in-out",
                alignContent: 'center',
                alignItems: 'center',
                "&.size-small": { ...listItemSizeProperties.small },
                "&.size-medium": { ...listItemSizeProperties.medium },
                "&.size-large": { ...listItemSizeProperties.large },
                '&.size-default': { fontSize: "1rem" },
                outline: '1px solid transparent',
                outlineOffset: -1,
                ...themeColors.reduce((acc, color) => {
                    acc[`&.color-${color}`] = {
                        color: palette.text.primary,
                        '&.selected': {
                            backgroundColor: alpha(palette[color].main, 0.2),
                        },
                        '.focused &': {
                            "&.focused": {
                                outlineColor: palette[color].main,
                            },
                        },
                        "&.focused": {
                            '&:not(.selected)': {
                                backgroundColor: alpha(palette[color].main, 0.1),
                            },
                            '&.selected': {
                                backgroundColor: alpha(palette[color].main, 0.3),
                            },
                        },
                        "&:hover:not(.header)": {
                            backgroundColor: alpha(palette[color].main, 0.1),
                            '&.selected': {
                                backgroundColor: blendColors(
                                    alpha(palette[color].main, 0.3),
                                    alpha(palette[color].main, 0.2)
                                ),
                            },
                        },
                        "&.header": {
                            backgroundColor: palette[color].main,
                            color: palette[color].contrastText,
                        },
                    };
                    return acc;
                }, {} as Record<string, any>),
                '&.color-default': {
                    '&.selected': {
                        backgroundColor: palette.action.selected,
                    },
                    '.focused &': {
                        "&.focused": {
                            outlineColor: palette.action.focus,
                        },
                    },
                    "&.focused": {
                        '&:not(.selected)': {
                            backgroundColor: palette.action.focus,
                        },
                        '&.selected': {
                            backgroundColor: blendColors(palette.action.selected, palette.action.selected),
                        },
                    },
                    '&:hover:not(.header)': {
                        backgroundColor: palette.action.hover,
                        '&.selected': {
                            backgroundColor: blendColors(palette.action.selected, palette.action.hover),
                        },
                    },
                    "&.header": {
                        backgroundColor: palette.background.header,
                        color: palette.text.primary,
                    },
                },
            },
        }
    };
};