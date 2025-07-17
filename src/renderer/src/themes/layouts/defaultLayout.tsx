import { darken, Fade, lighten, Palette, ThemeOptions } from "@mui/material";

const layout = (palette: Palette): ThemeOptions => {
    return {
        components: {
            MuiTypography: {
                styleOverrides: {
                    button: {
                        textTransform: 'none',
                    }
                }
            },
            MuiTooltip: {
                defaultProps: {
                    arrow: true,
                    slotProps: {
                        //popper: { open: true, },
                        tooltip: { style: { opacity: 1, backgroundColor: palette.background.tooltip, borderRadius: 5 } },
                        arrow: { style: { color: palette.background.tooltip } },
                    }
                }
            },
            MuiButton: {
                defaultProps: {
                    variant: "outlined",
                },
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                    }
                },
            },
            MuiButtonGroup: {
                defaultProps: {
                    variant: "outlined",
                },
                styleOverrides: {
                    grouped: {
                        '&.ToolButton-root': {
                            minWidth: 0,
                        },
                    }
                }
            },
            MuiDialog: {
                defaultProps: {
                    slotProps: {
                        container: {
                            sx: {
                                '& .MuiListItemButton-root': {
                                    paddingX: 8,
                                    paddingY: 4,
                                },
                            }
                        },
                    },
                },
            },
            MuiDialogContent: {
                defaultProps: {
                    dividers: true,
                }
            },
            MuiTextField: {
                defaultProps: {
                    size: "small",
                }
            },
            MuiCheckbox: {
                defaultProps: {
                    size: "small",
                }
            },
            MuiTab: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        minHeight: 0,
                    },
                },
                defaultProps: {
                    sx: {
                        borderRight: '1px solid',
                        borderLeft: '1px solid',
                        borderColor: palette.action.disabled,
                        paddingX: 8,
                        paddingY: 4,
                        minHeight: "1.8rem",
                        minWidth: 0,
                        transition: "background-color 0.3s ease",
                        backgroundColor: "transparent",
                        "&.Mui-selected": {
                            backgroundColor: palette.action.selected,
                            borderRight: '1px solid',
                            borderColor: palette.mode === "dark" ? palette.secondary.dark : palette.secondary.light,
                        }
                    },
                },
            },
            MuiTabs: {
                defaultProps: {
                    variant: "scrollable",
                    scrollButtons: "auto",
                    indicatorColor: "secondary",
                    textColor: "inherit",
                    sx: {
                        minHeight: 0,
                    },
                    slotProps: {
                        indicator: {
                            sx: {
                                height: 4,
                                backgroundColor: palette.primary.main,
                            }
                        },
                    }
                }
            },
            MuiAppBar: {
                defaultProps: {
                    color: "default"
                },
                styleOverrides: {
                    root: {
                        paddingRight: 1,
                    }
                }
            },
            MuiListItemText: {
                defaultProps: {
                    sx: {
                        margin: 0,
                    }
                }
            },
            MuiMenu: {
                defaultProps: {
                    slots: {
                        transition: Fade,
                    },
                    slotProps: {
                        transition: {
                            timeout: 0,
                        }
                    }
                }
            },
            MuiMenuItem: {
                defaultProps: {
                    sx: {
                        paddingY: 2
                    },
                },
            },
            MuiListItemIcon: {
                defaultProps: {
                    sx: {
                        minWidth: 32,
                    }
                }
            },

            IconWrapper: {
                styleOverrides: {
                    root: {
                        '&.connected': {
                            color: palette.success.main,
                        },
                        '&.disconnected': {
                            color: palette.warning.main
                        },
                        '&.connections svg > path:nth-of-type(1)': {
                            fill: palette.success.main
                        },
                        '&.new-connection svg > path:nth-of-type(1)': {
                            fill: palette.primary.main
                        },
                        '&.database-views svg path:nth-of-type(1)': {
                            color: palette.warning.main
                        },
                        '&.error': {
                            color: palette.error.main,
                        },
                        '&.warning': {
                            color: palette.warning.main,
                        },
                    }
                }
            },
            ContainerButton: {
                defaultProps: {
                    size: "small",
                    variant: "text",
                },
                styleOverrides: {
                    root: {
                        '& .IconWrapper-root': {
                            fontSize: "1.8em",
                        },
                        '&.Mui-selected': {
                            outlineColor: palette.sideBar.icon,
                            outlineWidth: 1,
                            outlineStyle: 'solid',
                            backgroundColor: palette.mode === "dark" ? lighten(palette.background.sideBar, 0.1) : darken(palette.background.sideBar, 0.1),
                        },
                        '& .MuiTypography-root': {
                            paddingLeft: 6,
                            paddingRight: 6,
                            paddingTop: 2,
                            paddingBottom: 2,
                            lineHeight: 1.5,
                        }
                    }
                }
            },
            ViewButton: {
                defaultProps: {
                    size: "small",
                    variant: "text",
                },
                styleOverrides: {
                    root: {
                        '& .IconWrapper-root': {
                            fontSize: "1.8em",
                        },
                        '&.Mui-selected': {
                            backgroundColor: palette.mode === "dark" ? lighten(palette.background.sideBar, 0.2) : darken(palette.background.sideBar, 0.2),
                        },
                        '& .MuiTypography-root': {
                            paddingLeft: 6,
                            paddingRight: 6,
                            paddingTop: 2,
                            paddingBottom: 2,
                            lineHeight: 1.5,
                        }
                    }
                }
            },
            SideBar: {
                styleOverrides: {
                    root: {
                        gap: 4,
                        padding: 4,
                        '& .MuiStack-root': {
                            gap: 4,
                        },
                        '&.placement-left': {
                            borderRight: '1px solid',
                            borderColor: palette.mode === "dark" ? palette.sideBar.dark : palette.sideBar.light,
                        },
                        '&.placement-right': {
                            borderLeft: '1px solid',
                            borderColor: palette.mode === "dark" ? palette.sideBar.dark : palette.sideBar.light,
                        },
                        '&.placement-top': {
                            borderBottom: '1px solid',
                            borderColor: palette.mode === "dark" ? palette.sideBar.dark : palette.sideBar.light,
                        },
                        '&.placement-bottom': {
                            borderTop: '1px solid',
                            borderColor: palette.mode === "dark" ? palette.sideBar.dark : palette.sideBar.light,
                        },
                    }
                }
            },
            ZoomState: {
                defaultProps: {
                },
                styleOverrides: {
                    root: {
                        //fontSize: "0.8rem"
                        backgroundColor:
                            palette.mode === "dark" ?
                                lighten(palette.background.menuBar, 0.1) :
                                darken(palette.background.menuBar, 0.1),
                        paddingLeft: 6,
                        paddingRight: 6,
                        paddingTop: 2,
                        paddingBottom: 2,
                        margin: 2,
                        borderRadius: 4
                    },
                    value: {
                        //fontSize: "0.8rem",
                        paddingLeft: 4
                    }
                }
            },
            MenuBar: {
                styleOverrides: {
                    root: {
                        borderBottom: '1px solid',
                        borderColor: palette.mode === "dark" ? palette.menuBar.dark : palette.menuBar.light,
                    },
                    title: {
                        paddingLeft: 6,
                    }
                }
            },
            WindowControlButton: {
                defaultProps: {
                    size: "small",
                    variant: "text",
                },
                styleOverrides: {
                    root: {
                        width: 42,
                        height: 32,
                        borderRadius: 0,
                        '&.LogoWindowControlButton': {
                            '& .LogoIcon': {
                                width: '1.3rem',
                                height: '1.3rem',
                            }
                        },
                        '&.CloseWindowControlButton:hover': {
                            backgroundColor: palette.mode === "dark" ? palette.error.dark : palette.error.light
                        },
                        '&.LogoWindowControlButton:hover': {
                            backgroundColor: palette.mode === "dark" ? palette.primary.dark : palette.primary.light
                        },
                    }
                }
            },
            StatusBar: {
                defaultProps: {
                    paddingLeft: 1,
                    paddingRight: 1,
                    marginBottom: 1,
                    borderTop: '1px solid',
                    borderColor: palette.mode === "dark" ? palette.statusBar.dark : palette.statusBar.light,
                    fontSize: "0.9rem",
                    //divider: <Divider orientation="vertical" flexItem />,
                    sx: {
                        gap: 4,
                    }
                },
            },
            StatusBarButton: {
                defaultProps: {
                    size: "small",
                    variant: "text",
                    sx: {
                        lineHeight: "1rem",
                        minWidth: 0,
                        borderRadius: 0,
                        columnGap: 4,
                        '& .IconWrapper-root': {
                            fontSize: "1.2em",
                        }
                    }
                }
            },
            SchemaAssistant: {
                defaultProps: {
                    slotProps: {
                        button: {
                        },
                        stepperTitle: {
                            variant: "body1"
                        },
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
                        paddingBottom: 6,
                        borderBottom: "1px solid",
                        borderColor: palette.action.focus,
                        width: "100%",
                        paddingLeft: 16,
                        paddingRight: 16,
                        display: "flex"
                    },
                    buttons: {
                        paddingTop: 6,
                        borderTop: "1px solid",
                        borderColor: palette.action.focus,
                        width: "100%",
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 16
                    },
                    stepper: {
                        width: "95%",
                    },
                    content: {
                        width: "95%",
                    }
                }
            },
            DriverSelect: {
                defaultProps: {
                    padding: 4,
                    gap: 8,
                    slotProps: {
                        button: {
                        },
                    }
                }
            },
            DriverSummary: {
                defaultProps: {
                    direction: "row",
                    sx: {
                        '& .MuiBox-root': {
                            paddingLeft: 10
                        }
                    },
                }
            },
            SchemaParameters: {
                defaultProps: {
                    slotProps: {
                        schemaParameters: {
                            sx: {
                                paddingRight: 8,
                                '> .MuiBox-root': {
                                    paddingBottom: 16,
                                },
                                '> .MuiBox-root > .MuiTextField-root': {
                                    width: "100%",
                                }
                            }
                            //paddingX: 16,
                        },
                        schemaGroup: {
                            paddingBottom: 16,
                        },
                        groupProperties: {
                            borderTop: "1px solid",
                            borderColor: palette.action.focus,
                            marginTop: 2,
                            paddingTop: 6,
                            //gap: 10,
                            sx: {
                                '& label.MuiFormControlLabel-root': {
                                    marginLeft: 0
                                },
                                '& .MuiFormHelperText-root': {
                                    marginTop: 2,
                                    fontSize: "0.9rem",
                                    lineHeight: 1.2
                                },
                                '& .MuiBox-root': {
                                    display: "flex",
                                    flexDirection: "row",
                                    flexWrap: "wrap",
                                    gap: 10,
                                    padding: 10,
                                },
                                '& .MuiBox-root:hover': {
                                    background: palette.action.hover,
                                },
                                '& .MuiFormControl-root.MuiTextField-root': {
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 8,
                                },
                            }
                        },
                        schemaDriver: {
                            paddingBottom: 16,
                            sx: {
                                '& .MuiBox-root': {
                                    paddingLeft: 10
                                },
                                alignItems: "end"
                            }
                        },
                        textField: {
                            size: "small",
                            variant: "outlined",
                            sx: {
                                '& input[type="color"]': {
                                    width: "1.6rem"
                                }
                            }
                        },
                        checkBoxField: {
                            sx: {
                                padding: 4,
                            }
                        },
                        menu: {
                            slotProps: {
                                paper: {
                                    sx: {
                                        maxHeight: "45vh"
                                    }
                                }
                            }
                        },
                    }
                }
            },
            SchemaSummary: {
                defaultProps: {
                    slotProps: {
                        list: {
                            dense: true,
                        },
                    }
                }
            },
            SchemaList: {
                defaultProps: {
                    sx: {
                        fontSize: "1.2rem",
                    },
                    slotProps: {
                        list: {
                            dense: true,
                        },
                        item: {
                            sx: {
                                '& .status': {
                                    marginRight: 12,
                                    fontSize: "1.2em",
                                    '& .MuiBadge-badge': {
                                        right: -5,
                                    }
                                },
                                '& .driver': {
                                    marginTop: 6,
                                }
                            },
                        },
                        itemButton: {
                            sx: {
                                gap: 8,
                                paddingY: 0,
                                transition: "background-color 0.3s ease",
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
            },
            TabsPanel: {
                styleOverrides: {
                    root: {
                        '&.ToolsPanel': {
                            borderTop: '1px solid',
                            borderColor: palette.mode === "dark" ? palette.statusBar.dark : palette.statusBar.light,
                        }
                    }
                }
            },
            TabPanelButtons: {
                defaultProps: {
                    sx: {
                        padding: 2,
                        gap: 2,
                    }
                }
            },
            ToolButton: {
                defaultProps: {
                    variant: "text",
                    sx: {
                        borderRadius: 1,
                    }
                },
            },
            ToolTextField: {
                defaultProps: {
                    variant: "outlined",
                    size: "small",
                    sx: {
                        '& input': {
                            fontSize: "0.8rem",
                            paddingX: 4,
                            paddingY: 0,
                        },
                        '& .MuiSelect-select': {
                            fontSize: "0.8rem",
                            paddingX: 4,
                            paddingY: 0,
                        },
                        '& .MuiInputBase-root': {
                            padding: 2,
                        },
                    }
                }
            },
            ToolSelect: {
                defaultProps: {
                    variant: "outlined",
                    size: "small",
                    sx: {
                        '& .MuiSelect-select': {
                            fontSize: "0.8rem",
                            paddingX: 4,
                            paddingY: 0,
                        }
                    }
                }
            },
            TabPanelLabel: {
                defaultProps: {
                    sx: {
                        gap: 6,
                    }
                }
            },
            UnboundBadge: {
                defaultProps: {
                    unmountOnHide: true,
                }
            },
            ToastList: {
                defaultProps: {
                    slotProps: {
                        alert: {
                            variant: "filled",
                        },
                        transition: {
                            component: "Slide",
                            slotProps: {
                                slide: {
                                    direction: "right",
                                },
                            }
                        }
                    }
                },
                styleOverrides: {
                    root: {
                        left: 32,
                        bottom: 32,
                    }
                }
            },
            ConsoleLogPanel: {
                defaultProps: {
                    sx: {
                        padding: 2,
                    },
                    slotProps: {
                        item: {
                            sx: {
                                cursor: "pointer",
                                '&.Mui-selected': {
                                    backgroundColor: palette.action.selected
                                },
                                "&:hover": {
                                    backgroundColor: palette.action.hover,
                                },
                            }
                        },
                        details: {
                            sx: {
                                "&.no-selection": {
                                    color: palette.text.disabled,
                                    fontStyle: "italic",
                                    textAlign: "center",
                                },
                            }
                        },
                    },
                }
            },
            SplitPanel: {
                styleOverrides: {
                    splitter: {
                        backgroundColor: palette.divider,
                        "&[data-panel-group-direction='horizontal']": {
                            width: "2px", // Szerokość uchwytu dla poziomego podziału
                            height: "100%",
                        },
                        "&[data-panel-group-direction='vertical']": {
                            height: "2px", // Wysokość uchwytu dla pionowego podziału
                            width: "100%",
                        },
                        "&[data-resize-handle-state='hover']": {
                            backgroundColor: palette.primary.main,
                        },
                        "&[data-resize-handle-state='drag']": {
                            backgroundColor: palette.primary.main,
                        },
                    }
                }
            }
        }
    }
};

export default layout;