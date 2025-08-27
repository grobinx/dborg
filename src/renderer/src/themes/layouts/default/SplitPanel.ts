import { Palette, ThemeOptions } from "@mui/material";
import { SplitPanelComponent } from "@renderer/themes/theme.d/SplitPanel";

export const SplitPanelLayout = (palette: Palette, _root: ThemeOptions): SplitPanelComponent => {
    return {
        styleOverrides: {
            splitter: {
                backgroundColor: palette.divider,
                "&[data-panel-group-direction='horizontal']": {
                    width: "2px", // Szerokość uchwytu dla poziomego podziału
                    height: "100%",
                },
                "&[data-panel-group-direction='vertical']": {
                    height: "2px", // Wysokość uchwytu dla pionowego podziału
                    width: "100%",
                },
                "&[data-resize-handle-state='hover']": {
                    backgroundColor: palette.primary.main,
                },
                "&[data-resize-handle-state='drag']": {
                    backgroundColor: palette.primary.main,
                },
            }
        }
    }
};
