import { ThemeOptions } from "@mui/material";

const root: ThemeOptions = {
    spacing: 1,
    typography: {
        fontFamily: "Segoe WPC,Segoe UI,sans-serif",
        fontSize: 14,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                "*::-webkit-scrollbar": {
                    width: "12px",
                    height: "12px",
                    backgroundColor: "transparent",
                },
                "*::-webkit-scrollbar-track": {
                    WebkitBoxShadow: "inset 0 0 6px rgba(128, 128, 128, 0.3)"
                },
                "*::-webkit-scrollbar-thumb": {
                    backgroundColor: "rgba(128, 128, 128, 0.3)",
                    borderRadius: 3
                }
            }
        }
    }
}

export default root;