import { alpha, Palette, ThemeOptions } from "@mui/material";
import zIndex from "@mui/material/styles/zIndex";
import { SchemaListComponent } from "@renderer/themes/theme.d/SchemaList";
import { themeColors } from "@renderer/types/colors";
import { blendColors } from "@renderer/utils/colors";

export const SchemaListLayout = (palette: Palette, _root: ThemeOptions): SchemaListComponent => {
    return {
        styleOverrides: {
            container: {
                gap: 16,
                padding: 16,
                width: "90%",
                margin: "auto",
                fontSize: "1rem",
            },
            title: {
                //justifyItems: "center",
                flexDirection: "row",
                display: "flex",
                paddingBottom: 6,
                borderBottom: "1px solid",
                borderColor: palette.action.focus,
                width: "100%",
                paddingLeft: 16,
                paddingRight: 16,
                gap: 8,
            },
            content: {
                width: "90%",
            },
            root: {
                display: 'flex',
                flexDirection: 'column',
                outline: 'none',
                listStyle: 'none',
                margin: 0,
                padding: 0,
                overflow: 'auto',
                width: '100%',
                height: '100%',
                flex: 1,
                gap: 4,
            },
            item: {
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                transition: "all 0.2s ease-in-out",
                alignContent: 'center',
                alignItems: 'center',
                outline: '2px solid transparent',
                outlineOffset: -1,
                '&.profile': {
                    padding: "4px 8px",
                },
                '&.header': {
                    padding: "2px 8px",
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    backgroundColor: palette.background.paper,
                    color: palette.text.secondary,
                },
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
                                    alpha(palette[color].main, 0.2), 
                                    alpha(palette[color].main, 0.1)
                                )
                            },
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
                },
            },
            driverIcon: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '4.5rem',
                '& .icon': {
                    display: 'flex',
                    '& img': {
                        width: 32,
                        height: 32,
                    }
                },
                '& .name': {
                    fontSize: '0.6rem',
                }
            },
            statusIcon: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '4rem',
                fontSize: '1.4rem',
            },
            actionButtons: {
                display: 'flex',
                flexDirection: 'row',
                gap: 4,
                visibility: "hidden",
                '&.selected, .SchemaList-item:hover &': {
                    '&:not(.sort-buttons)': {
                        visibility: "visible",
                    }
                },
                '.SchemaList-item:hover &': {
                    '&.sort-buttons': {
                        visibility: "visible",
                    }
                },
            },
            groupHeader: {
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexDirection: 'row',
                cursor: 'default',
            },
            groupName: {
                fontSize: "1.5rem",
                fontWeight: 600,
                lineHeight: 1.3,
            },
            profile: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                width: '100%',
            },
            profileName: {
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                gap: 2,
            },
            primaryText: {
                fontSize: "1.2rem",
                fontWeight: 600,
            },
            secondaryText: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                fontSize: "0.9rem",
                fontWeight: 400,
                gap: 8,
                '& .last-selected, & .db-version, & .group-name': {
                    color: palette.text.secondary,
                }
            }
        }
    }
};
