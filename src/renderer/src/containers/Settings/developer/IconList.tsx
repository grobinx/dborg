import { Box, Grid2 as Grid, Paper, Stack, Typography, useTheme } from "@mui/material";
import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import { TextField } from "@renderer/components/inputs/TextField";
import TabPanelContent, { TabPanelContentOwnProps } from "@renderer/components/TabsPanel/TabPanelContent";
import { ThemeIcons, iconAliases } from "@renderer/themes/icons";
import React from "react";

export const IconListContent: React.FC<TabPanelContentOwnProps> = (props) => {
    const theme = useTheme();
    const icons = theme.icons as ThemeIcons;

    const [search, setSearch] = React.useState("");

    const filteredIcons = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return Object.entries(icons);

        return Object.entries(icons).filter(([name]) => {
            if (name.toLowerCase().includes(q)) return true;

            const aliases = iconAliases[name as keyof ThemeIcons] ?? [];
            return aliases.some(alias => alias.toLowerCase().includes(q));
        });
    }, [icons, search]);

    return (
        <TabPanelContent
            {...props}
            sx={{ width: "100%", height: "100%", padding: 8 }}
        >
            <InputDecorator indicator={false} disableBlink>
                <TextField
                    placeholder="np. close, add, warning..."
                    value={search}
                    onChange={(value) => setSearch(value)}
                />
            </InputDecorator>

            <Typography variant="body2" color="text.secondary" width="100%">
                Wyników: {filteredIcons.length}
            </Typography>

            <Stack spacing={6} width="100%" sx={{ overflow: "auto" }}>
                <Grid container spacing={8}>
                    {filteredIcons.map(([name, IconComponent]) => (
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
                                    boxShadow: 2,
                                    transition: theme.transitions.create("box-shadow", {
                                        duration: theme.transitions.duration.shorter,
                                    }),
                                    "&:hover": {
                                        boxShadow: 5,
                                        backgroundColor: theme.palette.action.hover,
                                        cursor: "pointer",
                                    },
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
                                <Typography noWrap>{name}</Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {filteredIcons.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                        Brak ikon pasujących do frazy.
                    </Typography>
                )}
            </Stack>
        </TabPanelContent>
    );
};
