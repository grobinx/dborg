import { Palette, ThemeOptions } from "@mui/material";
import { StatusBarComponent } from "@renderer/themes/theme.d/StatusBar";

export const StatusBarLayout = (palette: Palette, _root: ThemeOptions): StatusBarComponent => {
    return {
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
        styleOverrides: {
            root: {
                backgroundColor: palette.background.statusBar,
            }
        }
    }
};
