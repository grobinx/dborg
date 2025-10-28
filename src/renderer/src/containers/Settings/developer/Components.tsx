import { Box, Grid2 as Grid, Paper, Stack, Typography, useTheme } from "@mui/material";
import { Button } from "@renderer/components/buttons/Button";
import ButtonGroup from "@renderer/components/buttons/ButtonGroup";
import { AnyOption, CompactList } from "@renderer/components/inputs/base/CompactList";
import TabPanelContent, { TabPanelContentOwnProps } from "@renderer/components/TabsPanel/TabPanelContent";
import Tree, { TreeNode } from "@renderer/components/Tree";
import { FormattedContent, FormattedContentItem } from "@renderer/components/useful/FormattedText";
import { ThemeIcons } from "@renderer/themes/icons";
import { ThemeColor, themeColors } from "@renderer/types/colors";
import { Size, Sizes } from "@renderer/types/sizes";
import React from "react";

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomTree(total: number, opts?: { maxChildren?: number; maxDepth?: number }): TreeNode[] {
    const maxChildren = Math.max(0, opts?.maxChildren ?? 4);
    const maxDepth = Math.max(1, opts?.maxDepth ?? 4);

    let remaining = total;
    let counter = 0;

    const nextKey = () => `node-${String(++counter).padStart(4, "0")}`;
    const makeNode = (): TreeNode => ({ key: nextKey(), title: `Node ${counter}` });

    const roots: TreeNode[] = [];

    // Start: kilka korzeni
    const initialRoots = Math.min(remaining, randomInt(3, Math.min(8, remaining)));
    for (let i = 0; i < initialRoots; i++) {
        roots.push(makeNode());
        remaining--;
    }

    let currentLevel = roots;

    for (let depth = 1; depth < maxDepth && remaining > 0; depth++) {
        const nextLevel: TreeNode[] = [];

        for (const parent of currentLevel) {
            if (remaining <= 0) break;
            const possible = Math.min(maxChildren, remaining);
            const childrenCount = possible > 0 ? randomInt(0, possible) : 0;

            if (childrenCount > 0) {
                parent.children = [];
                for (let i = 0; i < childrenCount && remaining > 0; i++) {
                    const child = makeNode();
                    parent.children.push(child);
                    nextLevel.push(child);
                    remaining--;
                }
            }
        }

        if (nextLevel.length === 0) break;
        currentLevel = nextLevel;
    }

    // Jeśli zostały niewykorzystane węzły, dodaj jako kolejne korzenie
    while (remaining > 0) {
        roots.push(makeNode());
        remaining--;
    }

    return roots;
}

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
        for (let i = 0; i < 1000; i++) {
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

    const treeNodes = React.useMemo<TreeNode[]>(() => {
        return generateRandomTree(100, { maxChildren: 10, maxDepth: 10 });
    }, []);

    const [color, setColor] = React.useState<ThemeColor | 'default'>("main");
    const [dense, setDense] = React.useState<boolean>(false);

    return (
        <TabPanelContent {...props}
            sx={{ width: "100%", height: "100%", overflow: "auto", padding: 8, }}
        >
            <ButtonGroup>
                <Button
                    toggle={[...themeColors, 'default']}
                    onChange={(value) => {
                        setColor(value as ThemeColor | 'default');
                    }}
                >
                    Color: {color}
                </Button>
                <Button toggle="dense" onChange={(value) => setDense(!!value)}>Dense: {dense ? "true" : "false"}</Button>
            </ButtonGroup>
            <Stack key="compactList" direction="row" width="100%" gap={8}>
                {Sizes.map((size) => (
                    <Stack key={size} direction={"column"} width="100%">
                        CompactList, size: {size}
                        {React.useMemo(() => (
                            <CompactList
                                key={size}
                                size={size}
                                options={options}
                                headerSticky
                                color={color}
                                lines={6}
                                dense={dense}
                                //sx={{ maxHeight: 300 }}
                                description="footer"
                            />
                        ), [size, color, dense])}
                    </Stack>
                ))}
            </Stack>
            <Stack key="tree" direction="row" width="100%" gap={8}>
                {[...Sizes, 'default'].map((size) => (
                    <Stack key={size} direction={"column"} width="100%">
                        Tree, size: {size}
                        {React.useMemo(() => (
                            <Tree
                                key={size}
                                size={size as Size | 'default'}
                                color={color}
                                nodes={treeNodes}
                                sx={{ height: 200 }}
                                autoExpand={10}
                                dense={dense}
                            />
                        ), [size, color, dense])}
                    </Stack>
                ))}
            </Stack>
        </TabPanelContent >
    );
};
