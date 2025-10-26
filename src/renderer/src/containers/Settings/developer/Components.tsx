import { Box, Grid2 as Grid, Paper, Stack, Typography, useTheme } from "@mui/material";
import { AnyOption, CompactList } from "@renderer/components/inputs/base/CompactList";
import TabPanelContent, { TabPanelContentOwnProps } from "@renderer/components/TabsPanel/TabPanelContent";
import { ThemeIcons } from "@renderer/themes/icons";
import { Sizes } from "@renderer/types/sizes";
import React from "react";

export const ComponentsContent: React.FC<TabPanelContentOwnProps> = (props) => {
    const theme = useTheme(); // Pobierz motyw, aby uzyskać dostęp do ikon
    const icons = theme.icons as ThemeIcons; // Rzutowanie na ThemeIcons
    const options = React.useMemo(() => {
        const arr: AnyOption[] = [];
        for (let i = 0; i < 2000; i++) {
            if (i % 100 === 0) {
                arr.push({
                    label: `Header ${i / 100 + 1}`,
                });
            }
            arr.push({
                value: `option-${i + 1}`,
                label: `Option ${i + 1}`,
            });
        }
        return arr;
    }, []);

    return (
        <TabPanelContent {...props}
            sx={{ width: "100%", height: "100%", overflow: "auto", padding: 8, }}
        >
            <Stack key="textFields" direction="row" width="100%" gap={8}>
                {Sizes.map((size) => (
                    <Stack key={size} direction={"column"} width="100%">
                        CompactList, size: {size}
                        {React.useMemo(() => (
                            <CompactList
                                key={size}
                                size={size}
                                options={options}
                                headerSticky
                                color="main"
                                //lines={6}
                                dense={false}
                                sx={{ maxHeight: 300 }}
                            />
                        ), [size])}
                    </Stack>
                ))}
            </Stack>
        </TabPanelContent >
    );
};
