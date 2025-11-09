import { alpha, Palette, ThemeOptions } from "@mui/material";
import { borderRadius, paddingLarge, paddingMedium, paddingSmall, inputSizeProperties } from "./consts";
import { themeColors } from "@renderer/types/colors";
import { InputFieldComponent } from "@renderer/themes/theme.d/InputField";
import { LineWeight } from "@mui/icons-material";


export const InputFieldLayout = (palette: Palette, _root: ThemeOptions): InputFieldComponent => {
    return {
        styleOverrides: {
            root: {
                transition: "all 0.2s ease-in-out",
                outline: "2px solid transparent",
                outlineOffset: -2,
                lineHeight: 1.5,
                '&:not(.type-boolean)': {
                    border: `1px solid ${palette.divider}`,
                    borderRadius: borderRadius,
                    '&.hover': {
                        borderColor: palette.mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
                        transition: "border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    },
                    '&.hover:not(.focused)': {
                        //boxShadow: `inset 0 0 3px 0px ${alpha(palette.text.primary, 0.5)}`,
                    },
                    ...themeColors.reduce((acc, color) => {
                        acc[`&.color-${color}`] = {
                            backgroundColor: alpha(palette[color].main, 0.1),
                        };
                        return acc;
                    }, {}),
                    '&.color-default': {
                        backgroundColor: alpha(palette.background.paper, 0.1),
                    },
                },
                '&.focused:not(.type-boolean)': {
                    outlineWidth: 2,
                    outlineStyle: 'solid',
                    borderColor: 'transparent',
                    transition: "outline-color 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    ...themeColors.reduce((acc, color) => {
                        acc[`&.color-${color}`] = {
                            outlineColor: palette[color].main,
                        };
                        return acc;
                    }, {}),
                    '&.color-default': {
                        outlineColor: palette.action.focus,
                    },
                    //boxShadow: `inset 0 0 7px 0px ${alpha(palette.text.primary, 0.5)}`,
                },
                '&.size-small': {
                    ...inputSizeProperties.small,
                },
                '&.size-medium': {
                    ...inputSizeProperties.medium,
                },
                '&.size-large': {
                    ...inputSizeProperties.large,
                },
                '&.size-default': {
                    padding: 4,
                    fontSize: "1rem",
                },
                '&.disabled': {
                    pointerEvents: 'none',
                    opacity: 0.6,
                    cursor: 'not-allowed',
                },
                '&.type-boolean': {
                    height: "auto",
                    paddingLeft: 0,
                    '& .checkbox-icon': {
                        fontSize: "1.4em",
                    }
                },
                '&.type-textarea': {
                    height: "auto",
                },
                '&.type-tags': {
                    height: "auto",
                },
                '&.type-tags.dense': {
                    height: "auto",
                    '& .MuiChip-root': {
                        height: 'auto',
                        lineHeight: 1.2,
                    }
            }
        },
        input: {
            fontFamily: "inherit",
            fontSize: "inherit",
            lineHeight: 1.5,
            '&.dense': {
                lineHeight: 1.2,
            },
            padding: 0,
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
            '&.type-tags': {
                minWidth: "5rem",
                width: "auto",
            },
        },
        customInput: {
            lineHeight: 1.5,
            cursor: "pointer",
            display: "flex",
            flexDirection: "row",
            alignSelf: "center",
            alignItems: "center",
            height: "100%",
            minWidth: 0,
            maxWidth: "100%",
            overflowX: "auto",
            overflowY: "hidden",
            '&::-webkit-scrollbar': {
                display: 'none', // Chrome/Safari/Edge
            },
            padding: 0,
            whiteSpace: "nowrap",
            '&.size-small': {
                gap: paddingSmall,
            },
            '&.size-medium': {
                gap: paddingMedium,
            },
            '&.size-large': {
                gap: paddingLarge,
            },
            outline: "none",
            '& .type-boolean': {
                alignItems: "flex-start",
                padding: 2,
                '.focused & .checkbox-icon': {
                    outline: "2px solid",
                    borderRadius: borderRadius,
                    ...themeColors.reduce((acc, color) => {
                        acc[`.color-${color} &`] = {
                            outlineColor: palette[color].main,
                        };
                        return acc;
                    }, {}),
                    '.color-default &': {
                        outlineColor: palette.action.focus,
                    },
                }
            },
        },
        main: {
            '&.size-small': {
                gap: paddingSmall,
            },
            '&.size-medium': {
                gap: paddingMedium,
            },
            '&.size-large': {
                gap: paddingLarge,
            },
        },
        placeholder: {
            color: palette.text.disabled,
            position: "absolute",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
        },
        adornment: {
            alignItems: 'center',
            '&.type-number.position-input': {
                flexDirection: 'column',
                justifyContent: "center",
                alignItems: "center",
                width: '2rem',
            },
            '&.tags-container': {
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                overflowX: 'auto',
                overflowY: 'hidden',
                '&::-webkit-scrollbar': {
                    display: 'none', // Chrome/Safari/Edge
                },
                gap: paddingMedium,
                '& .MuiChip-root': {
                    fontSize: "inherit",
                    maxWidth: "10rem",
                },
                '&.size-small': {
                    gap: paddingSmall,
                },
                '&.size-medium': {
                    gap: paddingMedium,
                },
                '&.size-large': {
                    gap: paddingLarge,
                },
            },
        },
        numberStepper: {
            display: 'flex',
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            cursor: 'pointer',
            padding: 0,
            color: palette.text.primary,
            width: '90%',
            height: 0,
            '& span': {
                fontSize: '0.8rem',
                transform: 'scaleY(0.5)',
            },
            '&:hover': {
                backgroundColor: palette.action.hover,
            },
        },
        colorIndicator: {
            border: `1px solid ${palette.primary.main}`,
            borderRadius: borderRadius,
            '&.size-small': {
                width: '14px',
                height: '14px',
            },
            '&.size-medium': {
                width: '18px',
                height: '18px',
            },
            '&.size-large': {
                width: '22px',
                height: '22px',
            },
        }
    }
};
};
