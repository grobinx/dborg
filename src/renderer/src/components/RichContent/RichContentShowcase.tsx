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
import { RichContainer, RichNode, RichRenderer } from "./index";
import { richContentExamples } from "./richContentExamples";
import { Button } from "../buttons/Button";

/**
 * Zaawansowany komponent testowy Rich Content.
 * Pokazuje rendering, statystyki, JSON i przełączniki diagnostyczne.
 */
const RichContentShowcase: React.FC = () => {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(0);
    const [showJson, setShowJson] = useState(false);
    const [compactMode, setCompactMode] = useState(false);

    const exampleKeys = useMemo(() => Object.keys(richContentExamples), []);
    const currentKey = exampleKeys[activeTab];
    const currentExample = richContentExamples[currentKey] as RichNode[];

    return (
        <Container maxWidth="xl" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Playground do walidacji wszystkich typów węzłów, zagnieżdżeń, severity i layoutów.
            </Typography>

            <Paper>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }}>
                    <FormControlLabel
                        control={<Switch size="small" checked={showJson} onChange={(e) => setShowJson(e.target.checked)} />}
                        label="Pokaż JSON"
                    />
                    <FormControlLabel
                        control={<Switch size="small" checked={compactMode} onChange={(e) => setCompactMode(e.target.checked)} />}
                        label="Compact mode"
                    />
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
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    minHeight: 0,
                    p: compactMode ? 1.5 : 3,
                    overscrollBehavior: "contain",
                    height: "100%",
                }}
            >
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Chip size="small" label={`Example: ${currentKey}`} />
                    <Chip size="small" color="primary" label={`Top-level items: ${currentExample.length}`} />
                </Stack>

                <Divider sx={{ mb: 2 }} />

                <Stack sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                    <RichContainer
                        key={currentKey}
                        node={{
                            items: currentExample,
                            height: "auto",
                        }}
                    />
                </Stack>

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

        </Container>
    );
};

export default RichContentShowcase;

