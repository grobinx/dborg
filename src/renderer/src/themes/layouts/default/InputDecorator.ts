import { alpha, Palette, ThemeOptions } from "@mui/material";
import { InputDecoratorComponent } from "@renderer/themes/theme.d/InputDecorator";
import { borderRadius, paddingLarge, paddingMedium, paddingSmall } from "./consts";

export const InputDecoratorLayout = (palette: Palette, _root: ThemeOptions): InputDecoratorComponent => {
    return {
        styleOverrides: {
            root: {
                cursor: "default",
                fontSize: "1rem",
                borderRadius: borderRadius,
                backgroundColor: palette.mode === "dark" ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)",
                '&:has(.InputDecorator-indicator)': {
                    paddingRight: paddingMedium * 2 + 4,
                },
                '&:hover': {
                    backgroundColor: palette.action.hover,
                    transition: "background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                },
                '&.size-small': {
                    padding: `${paddingSmall}px ${paddingMedium}px `,
                    '&:has(.InputDecorator-indicator)': {
                        paddingRight: paddingSmall * 2 + 3,
                    },
                    gap: paddingSmall,
                },
                '&.size-medium': {
                    padding: `${paddingMedium}px ${paddingMedium}px `,
                    '&:has(.InputDecorator-indicator)': {
                        paddingRight: paddingMedium * 2 + 3,
                    },
                    gap: paddingMedium,
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
                },
                '&.bare': {
                    padding: 0,
                },
            },
            label: {
                color: palette.text.primary,
                '&.size-small': {
                    marginBottom: paddingSmall / 2,
                    fontSize: "0.95rem",
                },
                '&.size-medium': {
                    marginBottom: paddingMedium / 2,
                    fontSize: "1rem",
                },
                '&.size-large': {
                    marginBottom: paddingLarge / 2,
                    fontSize: "1.05rem",
                },
            },
            labelText: {
                '&.required::after': {
                    content: '" *"',
                    color: palette.error.main,
                }
            },
            description: {
                '&.size-small': {
                    marginTop: paddingSmall / 2,
                    fontSize: "0.85rem",
                },
                '&.size-medium': {
                    marginTop: paddingMedium / 2,
                    fontSize: "0.9rem",
                },
                '&.size-large': {
                    marginTop: paddingLarge / 2,
                    fontSize: "0.95rem",
                },
                color: palette.text.secondary,
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
                fontSize: "0.7rem",
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
                zIndex: 1000,
            },
        }
    };
}
