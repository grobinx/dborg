import { Box, Grid2 as Grid, Paper, Stack, Typography, useTheme } from "@mui/material";
import TabPanelContent, { TabPanelContentOwnProps } from "@renderer/components/TabsPanel/TabPanelContent";
import { ThemeIcons } from "@renderer/themes/icons";

export const IconListContent: React.FC<TabPanelContentOwnProps> = (props) => {
    const theme = useTheme(); // Pobierz motyw, aby uzyskać dostęp do ikon
    const icons = theme.icons as ThemeIcons; // Rzutowanie na ThemeIcons

    return (
        <TabPanelContent {...props}
            sx={{ width: "100%", height: "100%", overflow: "auto", padding: 8, }}
        >
            <Grid container spacing={8}>
                {Object.entries(icons).map(([name, IconComponent]) => (
                    <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={name}>
                        <Paper
                            elevation={0}
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                textAlign: "center",
                                padding: 10,
                                border: "1px solid",
                                borderColor: theme.palette.divider,
                                boxShadow: 2, // = theme.shadows[3]
                                transition: theme.transitions.create('box-shadow', { duration: theme.transitions.duration.shorter }),
                                '&:hover': {
                                    boxShadow: 5, // = theme.shadows[5]
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
                    </Grid>
                ))}
            </Grid>
        </TabPanelContent >
    );
};
