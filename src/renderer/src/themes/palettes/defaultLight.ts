import { alpha, lighten, createTheme } from "@mui/material/styles";
import { createPaletteColor } from "../../utils/colors";
import { colors } from "@mui/material";

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
                selected: alpha(colors.amber[900], 0.2),
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
        }
    }
});

// Eksportuj tylko paletę
const palette = theme.palette;
export default palette;