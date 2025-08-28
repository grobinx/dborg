import { Palette, ThemeOptions } from "@mui/material";
import { SchemaSummaryComponent } from "@renderer/themes/theme.d/SchemaSummary";

export const SchemaSummaryLayout = (_palette: Palette, _root: ThemeOptions): SchemaSummaryComponent => {
    return {
        defaultProps: {
            slotProps: {
                list: {
                    dense: true,
                },
            }
        }
    }
};
