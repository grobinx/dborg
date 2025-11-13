import { alpha, Palette, ThemeOptions } from "@mui/material";
import { listItemSizeProperties } from "./consts";
import { themeColors } from "@renderer/types/colors";
import { SelectFieldComponent } from "@renderer/themes/theme.d/SelectField";

export const SelectFieldLayout = (palette: Palette, _root: ThemeOptions): SelectFieldComponent => {
    return {
        styleOverrides: {
            listBox: {
                display: "flex",
                flexDirection: "column",
                width: "100%",
            },
            search: {
                width: "100%",
                ...themeColors.reduce((acc, color) => {
                    acc[`&.color-${color}`] = {
                        backgroundColor: alpha(palette[color].main, 0.1),
                    };
                    return acc;
                }, {}),
                '&.size-small': { padding: listItemSizeProperties.small.padding },
                '&.size-medium': { padding: listItemSizeProperties.medium.padding },
                '&.size-large': { padding: listItemSizeProperties.large.padding },
                '&.size-default': { padding: '2px 4px' },
            }
        }
    };
};
