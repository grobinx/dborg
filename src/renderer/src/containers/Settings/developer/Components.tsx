import { Box, Grid2 as Grid, Paper, Stack, Typography, useTheme } from "@mui/material";
import { AnyOption, CompactList } from "@renderer/components/inputs/base/CompactList";
import TabPanelContent, { TabPanelContentOwnProps } from "@renderer/components/TabsPanel/TabPanelContent";
import { FormattedContent } from "@renderer/components/useful/FormattedText";
import { ThemeIcons } from "@renderer/themes/icons";
import { Sizes } from "@renderer/types/sizes";
import React from "react";

export const ComponentsContent: React.FC<TabPanelContentOwnProps> = (props) => {
    const theme = useTheme(); // Pobierz motyw, aby uzyskać dostęp do ikon
    const icons = theme.icons as ThemeIcons; // Rzutowanie na ThemeIcons
    const descriptions: FormattedContent[] = [
        "This is a description for Option 1.",
        "This is a description for Option 2, which is a bit longer than the first one.",
        "Option 3 has its own unique description that provides more details about its purpose.",
        "Here is the description for Option 4, explaining its features and benefits.",
        "Finally, Option 5 comes with a concise description to summarize its key points.",
        [["pl", "To jest opis dla Opcji 1."], ["en", "This is a description for Option 1."]],
        [["pl", "To jest opis dla Opcji 2, który jest trochę dłuższy niż pierwszy."], ["en", "This is a description for Option 2, which is a bit longer than the first one."]],
        [["pl", "Opcja 3 ma swój unikalny opis, który dostarcza więcej szczegółów na temat jej przeznaczenia."], ["en", "Option 3 has its own unique description that provides more details about its purpose."]],
        [["pl", "Oto opis dla Opcji 4, wyjaśniający jej cechy i korzyści."], ["en", "Here is the description for Option 4, explaining its features and benefits."]],
        [["pl", "Wreszcie, Opcja 5 ma zwięzły opis podsumowujący jej kluczowe punkty."], ["en", "Finally, Option 5 comes with a concise description to summarize its key points."]],
        [["pl", "To jest rozwijalny opis dla Opcji 1.", "rozszerzalny"], ["en", "This is an expandable description for Option 1.", "expandable"]],
        [["pl", "To jest rozwijalny opis dla Opcji 2.", "rozszerzalny"], ["en", "This is an expandable description for Option 2, which is a bit longer than the first one.", "expandable"]],
        [["pl", "To jest rozwijalny opis dla Opcji 3.", "rozszerzalny"], ["en", "Option 3 has its own unique expandable description that provides more details about its purpose.", "expandable"]],
        [["pl", "To jest rozwijalny opis dla Opcji 4.", "rozszerzalny"], ["en", "Here is the expandable description for Option 4, explaining its features and benefits.", "expandable"]],
        [["pl", "To jest rozwijalny opis dla Opcji 5.", "rozszerzalny"], ["en", "Finally, Option 5 comes with a concise expandable description to summarize its key points.", "expandable"]],
    ];
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
                description: Math.random() < 0.8 ? descriptions[Math.floor(Math.random() * descriptions.length)] : undefined,
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
                                lines={6}
                                dense={false}
                                //sx={{ maxHeight: 300 }}
                                description="tooltip"
                            />
                        ), [size])}
                    </Stack>
                ))}
            </Stack>
        </TabPanelContent >
    );
};
