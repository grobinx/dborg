import { darken, lighten, Palette, ThemeOptions } from "@mui/material";
import { WindowControlButtonComponent } from "@renderer/themes/theme.d/WindowControlButton";

export const WindowControlButtonLayout = (palette: Palette, _root: ThemeOptions): WindowControlButtonComponent => {
    return {
        styleOverrides: {
            root: {
                transition: "all 0.2s ease-in-out",
                display: "flex",
                color: palette.mode === "dark" ? lighten(palette.menuBar.main, 0.6) : darken(palette.menuBar.main, 0.6),
                backgroundColor: palette.background.menuBar,
                width: 42,
                height: 32,
                border: 'none',
                alignItems: "center",
                justifyContent: "center",
                '&.LogoWindowControlButton': {
                    '& .LogoIcon': {
                        width: '1.3rem',
                        height: '1.3rem',
                    }
                },
                '&.hover': {
                    backgroundColor: palette.action.hover,
                    '&.CloseWindowControlButton': {
                        backgroundColor: palette.error.main,
                        color: palette.error.contrastText
                    },
                    '&.LogoWindowControlButton': {
                        backgroundColor: palette.primary.main,
                        color: palette.primary.contrastText
                    },
                },
            },
        }
    }
};
