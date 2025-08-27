import { Palette, ThemeOptions } from "@mui/material";
import { MenuBarComponent } from "@renderer/themes/theme.d/MenuBar";
import { StatusBarComponent } from "@renderer/themes/theme.d/StatusBar";

export const MenuBarLayout = (palette: Palette, _root: ThemeOptions): MenuBarComponent => {
    return {
        styleOverrides: {
            root: {
                borderBottom: '1px solid',
                borderColor: palette.mode === "dark" ? palette.menuBar.dark : palette.menuBar.light,
            },
            title: {
                paddingLeft: 6,
            }
        }
    }
};
