import { Palette, ThemeOptions } from "@mui/material";
import { WindowControlButtonComponent } from "@renderer/themes/theme.d/WindowControlButton";

export const WindowControlButtonLayout = (palette: Palette, _root: ThemeOptions): WindowControlButtonComponent => {
    return {
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
    }
};
