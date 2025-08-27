import { Palette, ThemeOptions } from "@mui/material";
import { IconWrapperComponent } from "@renderer/themes/theme.d/IconWrapper";

export const IconWrapperLayout = (palette: Palette, _root: ThemeOptions): IconWrapperComponent => {
    return {
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
    }
};
