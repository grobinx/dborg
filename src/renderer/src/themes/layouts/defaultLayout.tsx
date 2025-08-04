import { alpha, darken, Fade, lighten, Palette, ThemeOptions } from "@mui/material";
import root from "./root";
import { p } from "react-router/dist/development/fog-of-war-CvttGpNz";
import { PaletteColors } from "@renderer/components/inputs/base/types";

const layout = (palette: Palette, root: ThemeOptions): ThemeOptions => {
    const borderRadius = 3;
    const paddingSmall = 2;
    const paddingMedium = 4;
    const paddingLarge = 8;

    return {
        shape: {
            borderRadius: borderRadius,
        },

        typography: {
            label: {
                fontSize: "1rem",
                lineHeight: 1.5,
                fontWeight: 400,
                fontFamily: (root.typography as any).fontFamily,
            },
            description: {
                fontSize: "0.9rem",
                lineHeight: 1.4,
                fontWeight: 400,
                fontFamily: (root.typography as any).fontFamily,
            },
            monospace: {
                fontFamily: (root.typography as any).monospaceFontFamily,
                fontSize: "1rem",
                lineHeight: 1.4,
                fontWeight: 400,
            },
            button: {
                textTransform: 'none',
            }
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    html: {
                        fontSize: `${(root.typography as any).fontSize}px`,
                        fontFamily: (root.typography as any).fontFamily,
                    },
                },
            },
            MuiTypography: {
                defaultProps: {
                    variantMapping: {
                        label: 'label',
                        description: 'div',
                    },
                }
            },
            MuiTooltip: {
                defaultProps: {
                    arrow: true,
                    enterDelay: 500,
                    slotProps: {
                        //popper: { open: true, },
                        tooltip: {
                            sx: {
                                opacity: 1,
                                backgroundColor: palette.background.tooltip,
                                borderRadius: 1,
                                boxShadow: "0px 8px 10px rgba(0, 0, 0, 0.4)",
                                border: `1px solid ${palette.divider}`,
                                fontSize: "0.875rem",
                            }
                        },
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
                    slotProps: {
                        input: {
                            sx: {
                                borderRadius: 1,
                                backgroundColor: palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.5)",
                            }
                        }
                    },
                }
            },
            MuiSelect: {
                defaultProps: {
                    size: "small",
                    slotProps: {
                        input: {
                            sx: {
                                borderRadius: 1,
                                backgroundColor: palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.5)",
                            }
                        }
                    },
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
                    },
                },
                defaultProps: {
                    sx: {
                        padding: "2px 8px",
                        minWidth: 0,
                        height: "min-content",
                        minHeight: 32,
                        borderRight: '1px solid',
                        borderLeft: '1px solid',
                        borderTop: '1px solid',
                        borderColor: palette.action.disabled,
                        backgroundColor: "transparent",
                        "&.Mui-selected": {
                            backgroundColor: palette.action.selected,
                            borderColor: palette.mode === "dark" ? palette.secondary.dark : palette.secondary.light,
                        },
                        '& label': {
                            cursor: "pointer",
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
                        height: "min-content",
                        minHeight: 32,
                    },
                    slotProps: {
                        indicator: {
                            sx: {
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
            MuiAlert: {
                defaultProps: {
                    variant: "filled",
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
                        color: palette.mode === "dark" ? darken(palette.sideBar.contrastText, 0.2) : lighten(palette.sideBar.contrastText, 0.2),
                        '& .IconWrapper-root': {
                            fontSize: "1.8em",
                        },
                        '&:hover': {
                            color: palette.sideBar.contrastText,
                        },
                        '&.selected': {
                            outlineColor: palette.sideBar.contrastText,
                            outlineWidth: 1,
                            outlineStyle: 'solid',
                            backgroundColor: palette.mode === "dark" ? lighten(palette.background.sideBar, 0.1) : darken(palette.background.sideBar, 0.1),
                            color: palette.sideBar.contrastText,
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
                        color: palette.mode === "dark" ? darken(palette.sideBar.contrastText, 0.2) : lighten(palette.sideBar.contrastText, 0.2),
                        '&:hover': {
                            color: palette.sideBar.contrastText,
                        },
                        '& .IconWrapper-root': {
                            fontSize: "1.8em",
                        },
                        '&.selected': {
                            backgroundColor: palette.mode === "dark" ? lighten(palette.background.sideBar, 0.2) : darken(palette.background.sideBar, 0.2),
                            color: palette.sideBar.contrastText,
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
                            backgroundColor: palette.error.main
                        },
                        '&.LogoWindowControlButton:hover': {
                            backgroundColor: palette.primary.main
                        },
                    }
                }
            },
            StatusBar: {
                defaultProps: {
                    paddingLeft: 1,
                    paddingRight: 1,
                    //marginBottom: 1,
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
                                '& .item': {
                                    display: "flex",
                                    flexDirection: "column",
                                    //flexWrap: "wrap",
                                    gap: 4,
                                    padding: 10,
                                },
                                '& .item:hover': {
                                    background: palette.action.hover,
                                },
                                '& .MuiFormControl-root.MuiTextField-root': {
                                    // flexDirection: "row",
                                    // alignItems: "center",
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
                        checkBoxField: {
                            sx: {
                                padding: 4,
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
                                paddingY: 4,
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
            },
            TabsPanel: {
                styleOverrides: {
                    root: {
                        '&.ToolsPanel': {
                            borderTop: '1px solid',
                            borderColor: palette.mode === "dark" ? palette.statusBar.dark : palette.statusBar.light,
                        }
                    },
                    header: {
                        '&.position-top': {
                            borderBottom: `1px solid ${palette.background.menuBar}`,
                        },
                        '&.position-bottom': {
                            borderTop: `1px solid ${palette.background.menuBar}`,
                        },
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
            },
            SettingInputControl: {
                styleOverrides: {
                    root: {
                        backgroundColor: palette.mode === "dark" ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
                        margin: 1,
                        padding: 8,
                        flexDirection: "row",
                        '&:hover': {
                            backgroundColor: palette.action.hover,
                        },
                        '&.Mui-selected': {
                            outline: `1px solid ${palette.secondary.main}`,
                            backgroundColor: palette.action.selected,
                        },
                        '& .menu': {
                            order: 1,
                        },
                        '& .indicator': {
                            width: 4,
                            height: "100%",
                            marginRight: 8,
                            alignSelf: "center",
                            borderRadius: 2,
                        },
                        '&.changed > .indicator': {
                            backgroundColor: alpha(palette.warning.main, 0.3),
                        },
                        '&.default > .indicator': {
                            backgroundColor: alpha(palette.primary.main, 0.3),
                        },
                        '&:not(:hover) .menu:not(.open)': {
                            visibility: "hidden", // Ukrycie przycisku, ale zachowanie miejsca
                        },
                    },
                    internal: {
                        gap: 4,
                        marginLeft: 0,
                        marginRight: 8,
                    },
                    input: {
                        gap: 8,
                        '& .policy': {
                            display: "flex",
                            flexDirection: "row",
                            height: "100%",
                            fontSize: "0.7em",
                            alignItems: "end",
                            '& .block': {
                                lineHeight: 1,
                                marginLeft: 4,
                                border: `1px solid ${palette.divider}`,
                                borderRadius: 2,
                                padding: 4,
                                '&:hover': {
                                    backgroundColor: palette.action.hover,
                                    cursor: "default",
                                },
                            }
                        },
                        '& .BaseSlider': {
                            '& .slider-value': {
                                fontSize: "0.9rem",
                                color: palette.text.primary,
                                padding: 4,
                                border: `1px solid ${palette.divider}`,
                                borderRadius: 2,
                                width: 50,
                                textAlign: "center",
                            },
                            '& .slider-value.start': {
                                marginRight: 16,
                            },
                            '& .slider-value.end': {
                                marginLeft: 16,
                            },
                        },
                        '& .BaseCheckbox': {
                            paddingTop: 0,
                            paddingLeft: 0,
                            alignSelf: "start",
                        },
                        '& input': {
                            fontSize: "inherit",
                        }
                    },
                    label: {
                        color: palette.text.primary,
                        marginBottom: 4,
                        '& .group': {
                            color: palette.text.secondary,
                            marginRight: 4,
                        },
                        '& .required': {
                            color: palette.error.main,
                            margin: "0 4px",
                        },
                        '& .flags': {
                            marginLeft: 8,
                            fontSize: "0.9em",
                            '& em': {
                                verticalAlign: "middle", // Wyrównanie do linii bazowej
                            },
                            '& em:not(:last-child)::after': {
                                content: '"·"', // Kropka na środku
                                margin: '0 4px', // Odstęp po bokach kropki
                                color: palette.text.secondary, // Kolor kropki
                            },
                        },
                        '& .tags': {
                            display: "flex", // Ustawienie układu dla tagów
                            justifyContent: "flex-end", // Wyrównanie do prawej
                            gap: 4, // Odstęp między tagami
                            '& .tag': {
                                alignContent: "center", // Wyrównanie tekstu w tagach
                                display: "inline-block", // Ustawienie jako elementy inline-block
                                padding: "0px 8px", // Wewnętrzne odstępy
                                fontSize: "0.75em", // Rozmiar czcionki
                                fontWeight: 500, // Grubość czcionki
                                color: palette.text.primary, // Kolor tekstu
                                backgroundColor: palette.action.hover, // Tło
                                borderRadius: 4, // Zaokrąglone rogi
                                border: `1px solid ${palette.divider}`, // Obramowanie
                                whiteSpace: "nowrap", // Zapobiega zawijaniu tekstu
                                textTransform: "uppercase", // Opcjonalnie: tekst wielkimi literami
                            },
                        },
                    },
                    description: {
                        color: palette.text.secondary,
                        '&:has(>.BaseCheckbox)': {
                            cursor: "pointer",
                        },
                    },
                    effect: {
                        color: palette.text.secondary,
                        marginTop: 4,
                    }
                },
                defaultProps: {
                }
            },
            Code: {
                styleOverrides: {
                    root: {
                        backgroundColor: 'rgba(245, 245, 245, 0.3)',
                        fontFamily: 'monospace',
                        padding: '0.1rem 0.3rem',
                        borderRadius: '3px',
                        fontSize: '0.9em',
                        '&:not(pre > &)': {
                            backgroundColor: 'rgba(245, 245, 245, 0.3)', // Styl dla <code> poza <pre>
                        },
                        'pre > &': {
                            backgroundColor: 'rgba(0, 0, 0, 0.1)', // Styl dla <code> wewnątrz <pre>
                            padding: '8px',
                            borderRadius: '5px',
                            display: 'block',
                        },
                    }
                }
            },
            FormattedText: {
                styleOverrides: {
                    root: {
                        '& p': {
                            whiteSpace: "pre-wrap",
                            display: "flex",
                            alignItems: "center",
                            margin: 0,
                        },
                        '& ul': {
                            whiteSpace: "pre-wrap",
                            display: "flex",
                            alignItems: "center",
                            margin: 0,
                        }
                    }
                }
            },
            TextField: {
                styleOverrides: {
                    root: {
                        fontSize: "1rem",
                        border: `1px solid ${palette.divider}`,
                        borderRadius: borderRadius,
                        padding: paddingMedium,
                        gap: paddingMedium,
                        '&:hover': {
                            borderColor: palette.mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
                        },
                        '&.focused': {
                            outlineColor: palette.primary.main,
                            outlineWidth: 2,
                            outlineStyle: 'solid',
                            outlineOffset: -2,
                            borderColor: 'transparent',
                            ...PaletteColors.reduce((acc, color) => {
                                acc[`&.color-${color}`] = {
                                    outlineColor: palette[color].main,
                                };
                                return acc;
                            }, {}),
                        },
                        ...PaletteColors.reduce((acc, color) => {
                            acc[`&.color-${color}`] = {
                                backgroundColor: alpha(palette[color].main, 0.1),
                            };
                            return acc;
                        }, {}),
                        '&.size-small': {
                            fontSize: "0.9em",
                            padding: paddingSmall,
                            gap: paddingSmall,
                        },
                        '&.size-large': {
                            fontSize: "1.2em",
                            padding: paddingLarge,
                            gap: paddingLarge,
                        },
                    },
                    input: {
                        fontFamily: "inherit",
                        padding: 2,
                        fontSize: "inherit",
                        backgroundColor: 'transparent',
                        color: palette.text.primary,
                        border: "none",
                        boxShadow: "none",
                        outline: "none",
                        '&[type="number"]::-webkit-inner-spin-button, &[type="number"]::-webkit-outer-spin-button': {
                            WebkitAppearance: "none",
                            margin: 0,
                        },
                        '&[type="number"]': {
                            MozAppearance: "textfield",
                        },
                    },
                    placeholder: {
                        color: palette.text.disabled,
                    },
                    adornment: {
                        alignItems: 'center',
                        '&.type-number.position-input': {
                            flexDirection: 'column',
                            justifyContent: "center",
                            alignItems: "center",
                            width: '2em',
                        }
                    },
                    numberStepper: {
                        display: 'flex',
                        flexGrow: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        color: palette.text.primary,
                        width: '100%',
                        height: 0,
                        '&:hover': {
                            backgroundColor: palette.action.hover,
                        },
                    }
                }
            },
            InputDecorator: {
                styleOverrides: {
                    root: {
                        cursor: "default",
                        fontSize: "1rem",
                        gap: paddingMedium,
                        padding: paddingMedium,
                        borderRadius: borderRadius,
                        backgroundColor: palette.mode === "dark" ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
                        '&:has(.InputDecorator-indicator)': {
                            paddingRight: paddingMedium * 2 + 4,
                        },
                        '&:hover': {
                            backgroundColor: palette.action.hover,
                        },
                        '&.size-small': {
                            padding: `${paddingSmall}px ${paddingMedium}px `,
                            '&:has(.InputDecorator-indicator)': {
                                paddingRight: paddingSmall * 2 + 3,
                            },
                            gap: paddingSmall,
                        },
                        '&.size-large': {
                            padding: paddingLarge,
                            '&:has(.InputDecorator-indicator)': {
                                paddingRight: paddingLarge * 2 + 5,
                            },
                            gap: paddingLarge,
                        },
                        '&.selected': {
                            backgroundColor: palette.action.selected,
                        }
                    },
                    label: {
                        color: palette.text.primary,
                        marginBottom: paddingMedium / 2,
                        fontSize: "1em",
                        '&.size-small': {
                            marginBottom: paddingSmall / 2,
                            fontSize: "0.95em",
                        },
                        '&.size-large': {
                            marginBottom: paddingLarge / 2,
                            fontSize: "1.05em",
                        },
                    },
                    labelText: {
                        '&.required::after': {
                            content: '" *"',
                            color: palette.error.main,
                        }
                    },
                    description: {
                        marginTop: paddingMedium / 2,
                        '&.size-small': {
                            marginTop: paddingSmall / 2,
                            fontSize: "0.85em",
                        },
                        '&.size-large': {
                            marginTop: paddingLarge / 2,
                            fontSize: "0.95em",
                        },
                        color: palette.text.secondary,
                        fontSize: "0.9rem",
                    },
                    indicator: {
                        width: 4,
                        //height: "100%",
                        alignSelf: "stretch",
                        borderRadius: 2,
                        '&.changed': {
                            backgroundColor: alpha(palette.warning.main, 0.4),
                        },
                        '&.default': {
                            backgroundColor: alpha(palette.primary.main, 0.4),
                        },
                        '&.size-small': {
                            width: 3,
                        },
                        '&.size-large': {
                            width: 5,
                        },
                    },
                    restrictions: {
                        fontSize: "0.7em",
                        alignItems: "end",
                        color: palette.text.secondary,
                        gap: paddingMedium / 2,
                    },
                    restriction: {
                        borderRadius: borderRadius,
                        backgroundColor: palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                        lineHeight: 1,
                        padding: "2px 4px",
                    },
                    validity: {
                        margin: 1,
                    }
                }
            }
        }
    }
};

export default layout;