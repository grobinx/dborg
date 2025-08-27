import { Palette, ThemeOptions } from "@mui/material";
import { ConsoleLogPanelComponent } from "@renderer/themes/theme.d/ConsoleLogPanel";

export const ConsoleLogPanelLayout = (palette: Palette, _root: ThemeOptions): ConsoleLogPanelComponent => {
    return {
        defaultProps: {
            slotProps: {
                item: {
                    sx: {
                        cursor: "pointer",
                        '&.Mui-selected': {
                            backgroundColor: palette.action.selected
                        },
                        "&:hover": {
                            backgroundColor: palette.action.hover,
                        },
                    }
                },
                details: {
                    sx: {
                        "&.no-selection": {
                            color: palette.text.disabled,
                            fontStyle: "italic",
                            textAlign: "center",
                        },
                    }
                },
            },
        }
    }
};
