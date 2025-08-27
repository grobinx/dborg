import { Palette, ThemeOptions } from "@mui/material";
import { DriverSelectComponent } from "@renderer/themes/theme.d/DriverSelect";

export const DriverSelectLayout = (_palette: Palette, _root: ThemeOptions): DriverSelectComponent => {
    return {
        defaultProps: {
            padding: 4,
            gap: 8,
            slotProps: {
                button: {
                },
            }
        }
    }
};
