import { Palette, ThemeOptions } from "@mui/material";
import { SchemaListComponent } from "@renderer/themes/theme.d/SchemaList";

export const SchemaListLayout = (palette: Palette, _root: ThemeOptions): SchemaListComponent => {
    return {
        defaultProps: {
            sx: {
                fontSize: "1rem",
            },
            slotProps: {
                list: {
                    dense: true,
                },
                item: {
                    sx: {
                        paddingY: 2,
                        '& .status': {
                            marginRight: 12,
                            fontSize: "1.2em",
                            '& .MuiBadge-badge': {
                                right: -5,
                            }
                        },
                        '& .driver': {
                            marginTop: 6,
                        },
                        '&:not(:hover) :not(.Mui-selected)': {
                            '& .actions': {
                                visibility: "hidden",
                            }
                        }
                    },
                },
                itemButton: {
                    sx: {
                        gap: 8,
                        paddingY: 0,
                        //transition: "background-color 0.3s ease",
                    }
                },
                itemText: {
                    sx: {
                        '& .MuiListItemText-primary': {
                            fontSize: "1em"
                        },
                        '& .MuiListItemText-secondary': {
                            display: "flex",
                            flexDirection: "row",
                            gap: 8,
                            '& .db-version': {
                                fontWeight: 600,
                            }
                        }
                    }
                },
                itemIcon: {
                    sx: {
                        minWidth: 0,
                        padding: 4,
                        flexDirection: "column",
                        alignItems: "center",
                        '&.driver': {
                            minWidth: 78,
                            '& .name': {
                                fontSize: "0.6rem",
                            }
                        },
                        '& img': {
                            width: 24,
                            height: 24,
                        },
                    }
                }
            }
        },
        styleOverrides: {
            root: {
                gap: 16,
                padding: 16,
                width: "90%",
                margin: "auto"
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
            }
        }
    }
};
