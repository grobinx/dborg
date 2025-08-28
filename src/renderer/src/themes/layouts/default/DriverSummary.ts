import { alpha, Palette, ThemeOptions } from "@mui/material";
import { DriverSummaryComponent } from "@renderer/themes/theme.d/DriverSummary";
import { themeColors } from "@renderer/types/colors";

export const DriverSummaryLayout = (_palette: Palette, _root: ThemeOptions): DriverSummaryComponent => {
    return {
        defaultProps: {
            direction: "row",
            sx: {
                '& .MuiBox-root': {
                    paddingLeft: 10
                }
            },
        }
    }
};
