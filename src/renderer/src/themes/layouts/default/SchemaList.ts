import { Palette, ThemeOptions } from "@mui/material";
import zIndex from "@mui/material/styles/zIndex";
import { SchemaListComponent } from "@renderer/themes/theme.d/SchemaList";

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
                gap: 4,
            },
            item: {
                '&.profile': {
                    padding: "4px 8px",
                },
                '&.header': {
                    padding: "2px 8px",
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    backgroundColor: palette.background.paper,
                }
            },
            driverIcon: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '5rem',
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
                width: '3rem',
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
            }
        }
    }
};
