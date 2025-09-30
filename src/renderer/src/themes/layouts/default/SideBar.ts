import { Palette, ThemeOptions } from "@mui/material";
import { SideBarComponent } from "@renderer/themes/theme.d/SideBar";

export const SideBarLayout = (palette: Palette, _root: ThemeOptions): SideBarComponent => {
    return {
        styleOverrides: {
            root: {
                gap: 4,
                padding: 4,
                fontSize: "1rem",
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
    }
};
