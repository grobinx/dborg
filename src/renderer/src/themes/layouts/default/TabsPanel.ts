import { Palette, ThemeOptions } from "@mui/material";
import { TabsPanelComponent } from "@renderer/themes/theme.d/TabsPanel";

export const TabsPanelLayout = (palette: Palette, _root: ThemeOptions): TabsPanelComponent => {
    return {
        styleOverrides: {
            root: {
                '&.ToolsPanel': {
                    borderTop: '1px solid',
                    borderColor: palette.mode === "dark" ? palette.statusBar.dark : palette.statusBar.light,
                }
            },
            header: {
                '&.position-top': {
                    borderBottom: `1px solid ${palette.background.menuBar}`,
                },
                '&.position-bottom': {
                    borderTop: `1px solid ${palette.background.menuBar}`,
                },
            }
        }
    }
};
