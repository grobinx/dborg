import { alpha, lighten, createTheme } from "@mui/material/styles";
import { createPaletteColor } from "../../utils/colors";
import { colors } from "@mui/material";

const theme = createTheme({
    palette: {
        mode: "light",

        // Core MUI colors (slightly softened)
        primary: createPaletteColor(colors.indigo[600], colors.indigo[50]),
        secondary: createPaletteColor(colors.deepPurple[500], colors.deepPurple[50]),
        error: createPaletteColor(colors.red[600], colors.red[50]),
        warning: createPaletteColor(colors.orange[700], colors.orange[50]),
        info: createPaletteColor(colors.lightBlue[600], colors.lightBlue[50]),
        success: createPaletteColor(colors.green[600], colors.green[50]),

        contrastThreshold: 3,
        tonalOffset: 0.2,

        // App-specific semantic colors (muted "space" look)
        main: createPaletteColor(colors.grey[300], colors.grey[900]),
        sideBar: createPaletteColor(colors.blueGrey[300], colors.blueGrey[800]),
        menuBar: createPaletteColor(colors.blueGrey[300], colors.blueGrey[800]),
        statusBar: createPaletteColor(colors.grey[300], colors.grey[800]),
        table: createPaletteColor(colors.grey[300], colors.grey[800]),

        // Backgrounds — toned down, less bright than before
        background: {
            default: "#eef6fb",
            paper: "#f6f9fb",
            sideBar: lighten("#eef6fb", 0.01),
            menuBar: lighten("#eef6fb", 0.005),
            statusBar: "#eef7fa",
            table: {
                header: "#e8f3fa",
                container: lighten("#f6f9fb", 0.01),
                footer: "#f0f6fa",
                selected: "#def0fb",
            },
            tooltip: "#145670",
            header: "#f3f8fb",
        },

        // Data type colors — slightly desaturated accents
        dataType: {
            boolean: colors.teal[900],
            datetime: colors.cyan[900],
            number: colors.deepOrange[900],
            string: colors.amber[900],
            object: colors.deepPurple[900],
            binary: colors.grey[900],
            null: colors.grey[500],
            error: colors.red[700],
            array: colors.blue[800],
        },

        // Text tuned for softer contrast
        text: {
            primary: "#0b374f",
            secondary: colors.blueGrey[700],
            disabled: colors.blueGrey[400],
        },

        // Actions — subtler glows
        action: {
            active: alpha(colors.lightBlue[700], 0.42),
            focus: alpha(colors.lightBlue[700], 0.12),
            hover: alpha(colors.lightBlue[700], 0.06),
            selected: alpha(colors.lightBlue[700], 0.10),
            disabled: colors.grey[300],
            disabledBackground: colors.grey[100],
            hoverOpacity: 0.06,
            focusOpacity: 0.12,
            selectedOpacity: 0.12,
            activatedOpacity: 0.16,
        },

        // Divider and helpers (a bit stronger than before)
        divider: alpha(colors.blueGrey[900], 0.12),
        common: { black: "#000000", white: "#ffffff" },
    },
});

const palette = theme.palette;
export default palette;