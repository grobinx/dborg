import { Palette, ThemeOptions } from "@mui/material";
import { TabPanelComponent } from "@renderer/themes/theme.d/TabPanel";

export const TabPanelLayout = (_palette: Palette, _root: ThemeOptions): TabPanelComponent => {
    return {
        styleOverrides: {
            buttons: {
                padding: "2px 4px",
                gap: 2,
            },
            label: {
                gap: 6,
            }
        }
    }
};
