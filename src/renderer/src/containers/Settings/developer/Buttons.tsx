import { Grid2 as Grid, Stack, useTheme } from "@mui/material";
import TabPanelContent, { TabPanelContentOwnProps } from "@renderer/components/TabsPanel/TabPanelContent";
import { Size, Sizes } from "@renderer/types/sizes";
import React from "react";
import Logo from "../../../../../../resources/dborg.png";
import ButtonGroup from "../../../components/buttons/ButtonGroup";
import { Button } from "@renderer/components/buttons/Button";
import { IconButton } from "@renderer/components/buttons/IconButton";
import { ToolButton } from "@renderer/components/buttons/ToolButton";

export const ButtonsContent: React.FC<TabPanelContentOwnProps> = (props) => {
    const theme = useTheme();

    // 3 osobne referencje zamiast struktury
    const smallButtonRef = React.useRef<HTMLButtonElement | null>(null);
    const mediumButtonRef = React.useRef<HTMLButtonElement | null>(null);
    const largeButtonRef = React.useRef<HTMLButtonElement | null>(null);

    // State do śledzenia wartości przycisków dla re-renderowania
    const [buttonValues, setButtonValues] = React.useState<Record<Size, string | null>>({
        small: null,
        medium: null,
        large: null
    });

    // Helper function do pobrania odpowiedniej referencji
    const getButtonRef = (size: Size) => {
        switch (size) {
            case 'small': return smallButtonRef;
            case 'medium': return mediumButtonRef;
            case 'large': return largeButtonRef;
            default: return smallButtonRef;
        }
    };

    console.count("ButtonsContent render");

    return (
        <TabPanelContent {...props} sx={{ width: "100%", height: "100%", overflow: "auto", padding: 8, }}>
            <Stack key="ButtonList" direction="row" width="100%" gap={8}>
                {Sizes.map((size) => (
                    <Stack key={size} direction={"column"} width="100%">
                        Button, size: {size}
                        <Grid container gap={4} padding={4}>
                            <Grid>
                                {React.useMemo(() => (
                                    <Button
                                        color="primary"
                                        onClick={() => console.log('clicked')}
                                        size={size}
                                    >
                                        Save Changes
                                    </Button>
                                ), [size])}
                            </Grid>

                            <Grid>
                                {React.useMemo(() => (
                                    <Button
                                        color="secondary"
                                        size={size}
                                    >
                                        <theme.icons.Search />
                                        Save File
                                    </Button>
                                ), [size])}
                            </Grid>

                            <Grid>
                                {React.useMemo(() => (
                                    <IconButton
                                        color="error"
                                        size={size}
                                        aria-label="Delete"
                                        dense
                                    >
                                        <theme.icons.Delete />
                                    </IconButton>
                                ), [size])}
                            </Grid>

                            <Grid>
                                {React.useMemo(() => (
                                    <Button
                                        loading="![](Loading) Saving..."
                                        size={size}
                                        color="warning"
                                        showLoadingIndicator={false}
                                    >
                                        <theme.icons.Clipboard />
                                        Save state
                                    </Button>
                                ), [size])}
                            </Grid>

                            <Grid>
                                {React.useMemo(() => (
                                    <Button
                                        color="info"
                                        size={size}
                                        onClick={() => {
                                            const buttonRef = getButtonRef(size);
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <img src={Logo} style={{ width: "1.3em", height: "1.3em" }} alt="" />
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>Primary Action</div>
                                                <div style={{ fontSize: '0.8em', opacity: 0.7 }}>Subtitle</div>
                                            </div>
                                            <theme.icons.Info style={{ fontSize: "1.3em" }} />
                                        </div>
                                    </Button>
                                ), [size])}
                            </Grid>

                            <Grid>
                                {React.useMemo(() => (
                                    <Button
                                        color="success"
                                        toggle={[null, 'on']}
                                        size={size}
                                        sx={{ width: 70 }}
                                        ref={getButtonRef(size)}
                                        onChange={(value) => setButtonValues(prev => ({ ...prev, [size]: value }))}
                                    >
                                        {buttonValues[size] || 'Power'}
                                    </Button>
                                ), [size, buttonValues[size]])}
                            </Grid>
                        </Grid>
                    </Stack>
                ))}
            </Stack>

            {/* Sekcja z ButtonGroup */}
            <Stack key="ButtonGroupList" direction="row" width="100%" gap={8}>
                {Sizes.map((size) => (
                    <Stack key={size} direction={"column"} width="100%">
                        ButtonGroup, size: {size}
                        <Grid container gap={4} padding={4}>

                            {/* Horizontal ButtonGroup */}
                            <Grid>
                                <ButtonGroup orientation="horizontal" size={size} color="primary" sameSize exclusive value="left">
                                    <Button toggle="left">Left</Button>
                                    <Button toggle="center">Center</Button>
                                    <Button toggle="right">Right</Button>
                                </ButtonGroup>
                            </Grid>

                            {/* ButtonGroup z ikonami */}
                            <Grid>
                                <ButtonGroup orientation="horizontal" size={size} color="secondary" sameSize>
                                    <IconButton><theme.icons.Search /></IconButton>
                                    <IconButton><theme.icons.Delete /></IconButton>
                                    <IconButton><theme.icons.Info /></IconButton>
                                </ButtonGroup>
                            </Grid>

                            {/* ButtonGroup z values (toggle buttons) */}
                            <Grid>
                                <ButtonGroup orientation="horizontal" size={size} color="success" sameSize>
                                    <IconButton toggle='bold' onChange={(v) => console.log('Bold:', v)}>
                                        <strong>B</strong>
                                    </IconButton>
                                    <IconButton toggle='italic' onChange={(v) => console.log('Italic:', v)}>
                                        <em>I</em>
                                    </IconButton>
                                    <IconButton toggle='underline' onChange={(v) => console.log('Underline:', v)}>
                                        <u>U</u>
                                    </IconButton>
                                    <IconButton toggle='strikethrough' onChange={(v) => console.log('Strikethrough:', v)}>
                                        <s>S</s>
                                    </IconButton>
                                </ButtonGroup>
                            </Grid>

                            {/* Vertical ButtonGroup */}
                            <Grid>
                                <ButtonGroup orientation="vertical" size={size}>
                                    <Button color="primary">Top</Button>
                                    <Button color="secondary">Middle</Button>
                                    <Button color="error">Bottom</Button>
                                </ButtonGroup>
                            </Grid>

                            {/* Single button w ButtonGroup */}
                            <Grid>
                                <ButtonGroup size={size} color="info">
                                    <Button>Single Button</Button>
                                </ButtonGroup>
                            </Grid>

                            {/* Disabled ButtonGroup */}
                            <Grid>
                                <ButtonGroup orientation="horizontal" size={size} color="error" disabled>
                                    <Button>Disabled</Button>
                                    <Button>Group</Button>
                                </ButtonGroup>
                            </Grid>

                        </Grid>
                    </Stack>
                ))}
            </Stack>

            {/* Sekcja z ToolButtonami */}
            <Stack direction="row" spacing={1}>
                {Sizes.map((size) => (
                    <Stack key={size} direction={"column"} width="100%">
                        ToolButton, size: {size}
                        <Grid container gap={4} padding={4}>
                            <Grid>
                                <ToolButton size={size} color="primary" onClick={() => console.log('Primary ToolButton clicked')}>
                                    <theme.icons.MaximizeWindow />
                                </ToolButton>
                            </Grid>
                            <Grid>
                                <ToolButton size={size} color="secondary" onClick={() => console.log('Secondary ToolButton clicked')}>
                                    <theme.icons.MinimizeWindow />
                                </ToolButton>
                            </Grid>
                            <Grid>
                                <ToolButton size={size} color="error" onClick={() => console.log('Error ToolButton clicked')}>
                                    <theme.icons.CloseWindow />
                                </ToolButton>
                            </Grid>
                            <Grid>
                                <ButtonGroup orientation="horizontal" size={size} color="warning">
                                    <ToolButton><theme.icons.Warning /></ToolButton>
                                    <ToolButton><theme.icons.Error /></ToolButton>
                                    <ToolButton><theme.icons.Info /></ToolButton>
                                </ButtonGroup>
                            </Grid>
                        </Grid>
                    </Stack>
                ))}
            </Stack>
        </TabPanelContent>
    );
};