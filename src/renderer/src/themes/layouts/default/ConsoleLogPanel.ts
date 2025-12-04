import { Palette, ThemeOptions } from "@mui/material";
import { ConsoleLogPanelComponent } from "@renderer/themes/theme.d/ConsoleLogPanel";

export const ConsoleLogPanelLayout = (palette: Palette, _root: ThemeOptions): ConsoleLogPanelComponent => {
    return {
        styleOverrides: {
            details: {
                "&.no-selection": {
                    color: palette.text.disabled,
                    fontStyle: "italic",
                    textAlign: "center",
                },
            },
        }
    }
};
