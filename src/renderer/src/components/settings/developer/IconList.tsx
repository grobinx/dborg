import { Box, Grid2, Paper, Typography, useTheme } from "@mui/material";
import { ThemeIcons } from "@renderer/themes/icons";

export const IconsList: React.FC = () => {
    const theme = useTheme(); // Pobierz motyw, aby uzyskać dostęp do ikon
    const icons = theme.icons as ThemeIcons; // Rzutowanie na ThemeIcons

    return (
        <Box sx={{ padding: 2, overflow: "auto", height: "600px" }}>
            <Grid2 container spacing={4}>
                {Object.entries(icons).map(([name, IconComponent]) => (
                    <Grid2 size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={name}>
                        <Paper
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                textAlign: "center",
                                padding: 8,
                                border: "1px solid",
                                borderColor: theme.palette.divider,
                                '&:hover': {
                                    backgroundColor: theme.palette.action.hover,
                                    cursor: "pointer",
                                }
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    width: 48,
                                    height: 48,
                                    marginBottom: 1,
                                    backgroundColor: theme.palette.action.hover,
                                    borderRadius: "50%",
                                    fontSize: 28,
                                }}
                            >
                                <IconComponent />
                            </Box>
                            <Typography noWrap>
                                {name}
                            </Typography>
                        </Paper>
                    </Grid2>
                ))}
            </Grid2>
        </Box>
    );
};
