import { alpha, lighten, createTheme } from "@mui/material/styles";
import { createPaletteColor } from "../../utils/colors";
import { colors } from "@mui/material";
import { light } from "@mui/material/styles/createPalette";

// Użyj createTheme zamiast createPalette
const theme = createTheme({
    palette: {
        mode: 'light',
        main: createPaletteColor(colors.grey[600], colors.grey[50]),
        sideBar: createPaletteColor(colors.blueGrey[400], colors.blueGrey[900]),
        menuBar: createPaletteColor(colors.blueGrey[400], colors.blueGrey[900]),
        statusBar: createPaletteColor(colors.blueGrey[400], colors.blueGrey[900]),
        table: createPaletteColor(colors.blueGrey[300], colors.blueGrey[900]),
        background: {
            sideBar: lighten(colors.blueGrey[100], 0.5),
            menuBar: lighten(colors.blueGrey[100], 0.2),
            statusBar: lighten(colors.blueGrey[100], 0.5),
            table: {
                header: colors.green[200],
                container: lighten(colors.blueGrey[50], 0.6),
                footer: colors.brown[100],
                selected: colors.amber[100],
            },
            tooltip: colors.blueGrey[800],
        },
        dataType: {
            boolean: colors.purple[800],
            datetime: colors.green[800],
            number: colors.red[800],
            string: colors.grey[900],
            object: colors.grey[900],
            binary: colors.grey[900],
            null: colors.grey[500],
            error: colors.red[700],
            array: undefined, //colors.blue[800],
        },
        text: {
            primary: '#0f0f0f',
            secondary: colors.grey[600],
            //icon: '#ffee58'
        },
        action: {
            focus: alpha(colors.blueGrey[900], 0.2),
            hover: alpha(colors.blueGrey[900], 0.04),
            selected: alpha(colors.blueGrey[900], 0.08),
            disabled: colors.grey[300],
            disabledBackground: colors.grey[100],
            hoverOpacity: 0.04,
            focusOpacity: 0.12,
            selectedOpacity: 0.08,
            activatedOpacity: 0.12,
        },
        divider: colors.grey[400],
    }
});

// Eksportuj tylko paletę
const palette = theme.palette;
export default palette;