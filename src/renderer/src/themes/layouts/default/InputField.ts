import { alpha, Palette, ThemeOptions } from "@mui/material";
import { borderRadius, rootSizeProperties } from "./consts";
import { themeColors } from "@renderer/types/colors";
import { InputFieldComponent } from "@renderer/themes/theme.d/InputField";


export const InputFieldLayout = (palette: Palette, _root: ThemeOptions): InputFieldComponent => {
    return {
        styleOverrides: {
            root: {
                transition: "all 0.2s ease-in-out",
                border: `1px solid ${palette.divider}`,
                borderRadius: borderRadius,
                '&:hover': {
                    borderColor: palette.mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
                    transition: "border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                },
                '&.focused': {
                    outlineWidth: 2,
                    outlineStyle: 'solid',
                    outlineOffset: -2,
                    borderColor: 'transparent',
                    transition: "outline-color 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    ...themeColors.reduce((acc, color) => {
                        acc[`&.color-${color}`] = {
                            outlineColor: palette[color].main,
                        };
                        return acc;
                    }, {}),
                    //boxShadow: `0 0 7px 0px ${alpha(palette.text.primary, 0.5)}`,
                },
                ...themeColors.reduce((acc, color) => {
                    acc[`&.color-${color}`] = {
                        backgroundColor: alpha(palette[color].main, 0.2),
                    };
                    return acc;
                }, {}),
                '&.size-small': {
                    ...rootSizeProperties.small,
                },
                '&.size-medium': {
                    ...rootSizeProperties.medium,
                },
                '&.size-large': {
                    ...rootSizeProperties.large,
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
            customInput: {
                alignSelf: "center",
                outline: "none",
            },
            placeholder: {
                color: palette.text.disabled,
                position: "absolute",
                top: "50%", // Wyśrodkowanie w pionie
                left: "8px", // Wyśrodkowanie w poziomie
                transform: "translateY(-50%)", // Przesunięcie o połowę wysokości
                pointerEvents: "none", // Zapobiega interakcji z placeholderem
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
