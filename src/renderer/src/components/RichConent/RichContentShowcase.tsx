import React, { useMemo, useState } from "react";
import {
    Box,
    Paper,
    Tabs,
    Tab,
    Typography,
    Container,
    useTheme,
    Stack,
    FormControlLabel,
    Switch,
    Chip,
    Divider,
} from "@mui/material";
import { RichContainer, RichRenderer } from "./index";
import { richContentExamples } from "./richContentExamples";
import { RichNode } from "./types";
import { Button } from "../buttons/Button";

const countNodes = (nodes: RichNode[]): number => {
    const countNode = (node: RichNode): number => {
        if (node === null || node === undefined) {
            return 0;
        }

        if (typeof node === "string" || typeof node === "number") {
            return 1;
        }
        if (Array.isArray(node)) {
            return 1 + node.map(n => countNode(n)).reduce((acc, count) => acc + count, 0);
        }

        switch (node.type) {
            case "group":
            case "row":
            case "column":
            case "alert":
                return 1 + node.items.reduce((acc: number, n) => acc + countNode(n), 0);
            case "list":
                return 1 + node.items.reduce((acc: number, n) => acc + countNode(n), 0);
            case "listitem":
                return 1 + node.items.reduce((acc: number, n) => acc + countNode(n), 0);
            default:
                return 1;
        }
    };


    return nodes.reduce((acc: number, node) => acc + countNode(node), 0);
};

const collectNodeTypes = (nodes: RichNode[]): string[] => {
    const set = new Set<string>();

    const walk = (node: RichNode) => {
        if (node === null || node === undefined) {
            return;
        }
        if (typeof node === "string" || typeof node === "number") {
            set.add("text");
            return;
        }
        if (Array.isArray(node)) {
            set.add("row");
            node.forEach(walk);
            return;
        }
        set.add(node.type);
        if (node.type === "group" || node.type === "row" || node.type === "column" || node.type === "alert") {
            node.items.forEach(walk);
        } else if (node.type === "list") {
            node.items.forEach(walk);
        } else if (node.type === "listitem") {
            node.items.forEach(walk);
        }
    };

    nodes.forEach(walk);
    return Array.from(set).sort();
};

/**
 * Zaawansowany komponent testowy Rich Content.
 * Pokazuje rendering, statystyki, JSON i przełączniki diagnostyczne.
 */
const RichContentShowcase: React.FC = () => {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(0);
    const [showFrames, setShowFrames] = useState(true);
    const [showJson, setShowJson] = useState(false);
    const [compactMode, setCompactMode] = useState(false);

    const exampleKeys = useMemo(() => Object.keys(richContentExamples), []);
    const currentKey = exampleKeys[activeTab];
    const currentExample = richContentExamples[currentKey] as RichNode[];

    const totalNodeCount = useMemo(() => countNodes(currentExample), [currentExample]);
    const usedTypes = useMemo(() => collectNodeTypes(currentExample), [currentExample]);

    const randomTab = () => {
        const next = Math.floor(Math.random() * exampleKeys.length);
        setActiveTab(next);
    };

    return (
        <Container maxWidth="xl" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Playground do walidacji wszystkich typów węzłów, zagnieżdżeń, severity i layoutów.
            </Typography>

            <Paper>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }}>
                    <FormControlLabel
                        control={<Switch checked={showFrames} onChange={(e) => setShowFrames(e.target.checked)} />}
                        label="Pokaż ramki elementów"
                    />
                    <FormControlLabel
                        control={<Switch checked={showJson} onChange={(e) => setShowJson(e.target.checked)} />}
                        label="Pokaż JSON"
                    />
                    <FormControlLabel
                        control={<Switch checked={compactMode} onChange={(e) => setCompactMode(e.target.checked)} />}
                        label="Compact mode"
                    />
                    <Button size="small" onClick={randomTab}>
                        Losowy scenariusz
                    </Button>
                    <Button
                        size="small"
                        onClick={() => console.log("Current key:", currentKey, "Current nodes:", currentExample)}
                    >
                        Log do konsoli
                    </Button>
                </Stack>
            </Paper>

            <Paper sx={{ mb: 2 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {exampleKeys.map((key) => (
                        <Tab key={key} label={key} />
                    ))}
                </Tabs>
            </Paper>

            <Paper
                sx={{
                    p: compactMode ? 1.5 : 3,
                    overflowY: "auto",
                    overscrollBehavior: "contain",
                }}
            >
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Chip size="small" label={`Example: ${currentKey}`} />
                    <Chip size="small" color="primary" label={`Top-level items: ${currentExample.length}`} />
                    <Chip size="small" color="secondary" label={`Total nodes (recursive): ${totalNodeCount}`} />
                    <Chip size="small" variant="outlined" label={`Types used: ${usedTypes.length}`} />
                </Stack>

                <Divider sx={{ mb: 2 }} />

                <RichContainer node={{ items: currentExample }} />

                {showJson && (
                    <Box
                        sx={{
                            mt: 3,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1,
                            p: 2,
                            backgroundColor: theme.palette.action.hover,
                            overflowX: "auto",
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Debug JSON
                        </Typography>
                        <pre style={{ margin: 0, fontSize: 12 }}>
                            {JSON.stringify(currentExample, null, 2)}
                        </pre>
                    </Box>
                )}
            </Paper>

            <Paper sx={{ mt: 2, p: 2 }}>
                <Typography variant="caption" component="div">
                    Node types in this scenario:
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", rowGap: 1 }}>
                    {usedTypes.map((t) => (
                        <Chip key={t} size="small" label={t} />
                    ))}
                </Stack>
            </Paper>
        </Container>
    );
};

export default RichContentShowcase;