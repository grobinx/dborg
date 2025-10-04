import { alpha, darken, createTheme } from "@mui/material/styles";
import { createPaletteColor } from "../../utils/colors";
import { colors } from "@mui/material";

const theme = createTheme({
    palette: {
        mode: 'dark',
        main: createPaletteColor(colors.grey[600], colors.grey[50]),
        sideBar: createPaletteColor(colors.blueGrey[700], colors.blueGrey[100]),
        menuBar: createPaletteColor(colors.blueGrey[700], colors.blueGrey[100]),
        statusBar: createPaletteColor(colors.blueGrey[700], colors.blueGrey[100]),
        table: createPaletteColor(colors.blueGrey[700], colors.blueGrey[100]),
        background: {
            sideBar: darken(colors.blueGrey[900], 0.5),
            menuBar: darken(colors.blueGrey[900], 0.2),
            statusBar: darken(colors.blueGrey[900], 0.5),
            table: {
                header: darken(colors.teal[900], 0.2),
                container: darken(colors.blueGrey[900], 0.2),
                footer: colors.brown[900],
                selected: darken(colors.lime[900], 0.5),
            },
            tooltip: darken(colors.blueGrey[900], 0.2),
        },
        dataType: {
            boolean: colors.purple[200],
            datetime: colors.green[200],
            number: colors.red[200],
            string: colors.grey[100],
            object: colors.grey[100],
            binary: colors.grey[100],
            null: colors.grey[600],
            error: colors.red[300],
            array: undefined, // colors.blue[200],
        },
        text: {
            primary: '#f0f0f0',
            secondary: colors.grey[400],
            //icon: '#ffee58'
        }
    }
});

const palette = theme.palette;
export default palette;