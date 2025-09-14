import { alpha, darken, Fade, lighten, Palette, ThemeOptions } from "@mui/material";
import { InputFieldLayout } from "./default/InputField";
import { CodeLayout } from "./default/Code";
import { InputDecoratorLayout } from "./default/InputDecorator";
import { borderRadius } from "./default/consts";
import { ButtonLayout } from "./default/Button";
import { IconButtonLayout } from "./default/IconButton";
import { ToolButtonLayout } from "./default/ToolButton";
import { ZoomStateLayout } from "./default/ZoomState";
import { IconWrapperLayout } from "./default/IconWrapper";
import { FormattedTextLayout } from "./default/FormattedText";
import { SplitPanelLayout } from "./default/SplitPanel";
import { ConsoleLogPanelLayout } from "./default/ConsoleLogPanel";
import { WindowControlButtonLayout } from "./default/WindowControlButton";
import { SideBarLayout } from "./default/SideBar";
import { ToastListLayout } from "./default/ToastList";
import { StatusBarLayout } from "./default/StatusBar";
import { MenuBarLayout } from "./default/MenuBar";
import { SchemaAssistantLayout } from "./default/SchemaAssistant";
import { DriverSelectLayout } from "./default/DriverSelect";
import { StatusBarButtonLayout } from "./default/StatusBarButton";
import { DriverSummaryLayout } from "./default/DriverSummary";
import { SchemaParametersLayout } from "./default/SchemaParameters";
import { SchemaSummaryLayout } from "./default/SchemaSummary";
import { SchemaListLayout } from "./default/SchemaList";
import { TabsPanelLayout } from "./default/TabsPanel";
import { TabPanelLayout } from "./default/TabPanel";
import { ContainerButtonLayout } from "./default/ContainerButton";
import { ViewButtonLayout } from "./default/ViewButton";

const layout = (palette: Palette, root: ThemeOptions): ThemeOptions => {

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
            MuiChip: {
                styleOverrides: {
                    root: {
                        borderRadius: borderRadius,
                        '& .MuiChip-label': {
                            //padding: '4px 8px',
                        }
                    },
                }
            },

            IconWrapper: IconWrapperLayout(palette, root),
            ContainerButton: ContainerButtonLayout(palette, root),
            ViewButton: ViewButtonLayout(palette, root),
            SideBar: SideBarLayout(palette, root),
            ZoomState: ZoomStateLayout(palette, root),
            MenuBar: MenuBarLayout(palette, root),
            WindowControlButton: WindowControlButtonLayout(palette, root),
            StatusBar: StatusBarLayout(palette, root),
            StatusBarButton: StatusBarButtonLayout(palette, root),
            SchemaAssistant: SchemaAssistantLayout(palette, root),
            DriverSelect: DriverSelectLayout(palette, root),
            DriverSummary: DriverSummaryLayout(palette, root),
            SchemaParameters: SchemaParametersLayout(palette, root),
            SchemaSummary: SchemaSummaryLayout(palette, root),
            SchemaList: SchemaListLayout(palette, root),
            TabsPanel: TabsPanelLayout(palette, root),
            TabPanel: TabPanelLayout(palette, root),
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
            UnboundBadge: {
                defaultProps: {
                    unmountOnHide: true,
                }
            },
            ToastList: ToastListLayout(palette, root),
            ConsoleLogPanel: ConsoleLogPanelLayout(palette, root),
            SplitPanel: SplitPanelLayout(palette, root),
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
            Code: CodeLayout(palette, root),
            FormattedText: FormattedTextLayout(palette, root),
            InputField: InputFieldLayout(palette, root),
            InputDecorator: InputDecoratorLayout(palette, root),
            Button: ButtonLayout(palette, root),
            IconButton: IconButtonLayout(palette, root),
            ToolButton: ToolButtonLayout(palette, root),
        }
    }
};

export default layout;