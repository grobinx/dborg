import { alpha, Palette, ThemeOptions } from "@mui/material";
import { DescribedListComponent } from "@renderer/themes/theme.d/DescribedList";
import { listItemSizeProperties } from "./consts";
import { themeColors } from "@renderer/types/colors";
import { blendColors } from "@renderer/utils/colors";

export const DescribedListLayout = (palette: Palette, _root: ThemeOptions): DescribedListComponent => {
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
                "&.size-small": { ...listItemSizeProperties.small, padding: 0 },
                "&.size-medium": { ...listItemSizeProperties.medium, padding: 0 },
                "&.size-large": { ...listItemSizeProperties.large, padding: 0 },
                '&.size-default': { padding: 0 },
                outline: '1px solid transparent',
                outlineOffset: -1,
                ...themeColors.reduce((acc, color) => {
                    acc[`&.color-${color}`] = {
                        color: palette.text.primary,
                        '&.selected': {
                            backgroundColor: alpha(palette[color].main, 0.2),
                        },
                        "&.focused": {
                            outlineColor: palette[color].main,
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
                    '&.focused': {
                        outlineColor: palette.action.focus,
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
                '&.header': {
                    cursor: 'default',
                    '.sticky &': {
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                    }
                },
                '&.divider, &.divider.dense': {
                    padding: 0,
                    borderTop: `1px solid ${palette.divider}`,
                    margin: '2px 0',
                    height: 'auto',
                    minHeight: 0,
                },
            },
            header: {
                display: 'flex',
                flexDirection: 'row',
                fontWeight: 'bold',
                '&.size-small': { padding: listItemSizeProperties.small.padding },
                '&.size-medium': { padding: listItemSizeProperties.medium.padding },
                '&.size-large': { padding: listItemSizeProperties.large.padding },
                '&.size-default': { padding: '2px 4px' },
            },
            option: {
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                width: '100%',
                '&.size-small': { padding: listItemSizeProperties.small.padding },
                '&.size-medium': { padding: listItemSizeProperties.medium.padding },
                '&.size-large': { padding: listItemSizeProperties.large.padding },
                '&.size-default': { padding: '2px 4px' },
            },
            container: {
                display: 'flex',
                width: '100%',
                height: '100%',
                flexDirection: 'column',
                userSelect: 'none',
                '&.sidebar': {
                    flexDirection: 'row',
                },
                ...themeColors.reduce((acc, color) => {
                    acc[`&.color-${color}`] = {
                        backgroundColor: alpha(palette[color].main, 0.1),
                    };
                    return acc;
                }, {}),
                '&.color-default': {
                    backgroundColor: "transparent",
                },
                '&.sidebar ul': {
                    borderRight: `1px solid ${palette.divider}`,
                },
            },
            description: {
                display: 'flex',
                flex: '0 0 auto',
                "&.size-small": { fontSize: listItemSizeProperties.small.fontSize, padding: listItemSizeProperties.small.padding },
                "&.size-medium": { fontSize: listItemSizeProperties.medium.fontSize, padding: listItemSizeProperties.medium.padding },
                "&.size-large": { fontSize: listItemSizeProperties.large.fontSize, padding: listItemSizeProperties.large.padding },
                '&.size-default': { padding: '2px 4px' },
                '&.footer': {
                    borderTop: `1px solid ${palette.divider}`,
                },
                '&.header': {
                    borderBottom: `1px solid ${palette.divider}`,
                },
            }
        }
    };
};