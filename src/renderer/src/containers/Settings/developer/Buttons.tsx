import { Grid2, Stack, useTheme } from "@mui/material";
import { BaseButton } from "@renderer/components/buttons/BaseButton";
import TabPanelContent, { TabPanelContentOwnProps } from "@renderer/components/TabsPanel/TabPanelContent";
import { Size, Sizes } from "@renderer/types/sizes";
import React from "react";
import Logo from "../../../../../../resources/dborg.png";
import { ButtonRefHandle } from "@renderer/components/buttons/BaseButtonProps";
import ButtonGroup from "../../../components/buttons/ButtonGroup";
import { Button } from "@renderer/components/buttons/Button";

export const ButtonsContent: React.FC<TabPanelContentOwnProps> = (props) => {
    const theme = useTheme();

    // 3 osobne referencje zamiast struktury
    const smallButtonRef = React.useRef<ButtonRefHandle | null>(null);
    const mediumButtonRef = React.useRef<ButtonRefHandle | null>(null);
    const largeButtonRef = React.useRef<ButtonRefHandle | null>(null);

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
                        <Grid2 container gap={4} padding={4}>
                            <Grid2>
                                {React.useMemo(() => (
                                    <Button
                                        color="primary"
                                        onClick={() => console.log('clicked')}
                                        size={size}
                                    >
                                        Save Changes
                                    </Button>
                                ), [size])}
                            </Grid2>

                            <Grid2>
                                {React.useMemo(() => (
                                    <Button
                                        color="secondary"
                                        size={size}
                                    >
                                        <theme.icons.Search />
                                        Save File
                                    </Button>
                                ), [size])}
                            </Grid2>

                            <Grid2>
                                {React.useMemo(() => (
                                    <Button
                                        color="error"
                                        size={size}
                                        aria-label="Delete"
                                    >
                                        <theme.icons.Delete />
                                    </Button>
                                ), [size])}
                            </Grid2>

                            <Grid2>
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
                            </Grid2>

                            <Grid2>
                                {React.useMemo(() => (
                                    <Button
                                        color="info"
                                        size={size}
                                        onClick={() => {
                                            const buttonRef = getButtonRef(size);
                                            buttonRef.current?.cycleValues();
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
                            </Grid2>

                            <Grid2>
                                {React.useMemo(() => (
                                    <Button
                                        color="success"
                                        toggle={[null, 'on']}
                                        size={size}
                                        sx={{ width: 70 }}
                                        ref={getButtonRef(size)}
                                        onChange={(value) => setButtonValues(prev => ({ ...prev, [size]: value }))}
                                    >
                                        {getButtonRef(size).current?.getValue() || 'Power'}
                                    </Button>
                                ), [size, buttonValues[size]])}
                            </Grid2>
                        </Grid2>
                    </Stack>
                ))}
            </Stack>

            {/* Nowa sekcja z ButtonGroup */}
            <Stack key="ButtonGroupList" direction="row" width="100%" gap={8}>
                {Sizes.map((size) => (
                    <Stack key={size} direction={"column"} width="100%">
                        ButtonGroup, size: {size}
                        <Grid2 container gap={4} padding={4}>

                            {/* Horizontal ButtonGroup */}
                            <Grid2>
                                <ButtonGroup orientation="horizontal" size={size} color="primary" sameWidth exclusive value="left">
                                    <Button toggle="left">Left</Button>
                                    <Button toggle="center">Center</Button>
                                    <Button toggle="right">Right</Button>
                                </ButtonGroup>
                            </Grid2>

                            {/* ButtonGroup z ikonami */}
                            <Grid2>
                                <ButtonGroup orientation="horizontal" size={size} color="secondary">
                                    <Button><theme.icons.Search /></Button>
                                    <Button><theme.icons.Delete /></Button>
                                    <Button><theme.icons.Info /></Button>
                                </ButtonGroup>
                            </Grid2>

                            {/* ButtonGroup z values (toggle buttons) */}
                            <Grid2>
                                <ButtonGroup orientation="horizontal" size={size} color="success" sameWidth>
                                    <Button toggle='bold' onChange={(v) => console.log('Bold:', v)}>
                                        <strong>B</strong>
                                    </Button>
                                    <Button toggle='italic' onChange={(v) => console.log('Italic:', v)}>
                                        <em>I</em>
                                    </Button>
                                    <Button toggle='underline' onChange={(v) => console.log('Underline:', v)}>
                                        <u>U</u>
                                    </Button>
                                </ButtonGroup>
                            </Grid2>

                            {/* Vertical ButtonGroup */}
                            <Grid2>
                                <ButtonGroup orientation="vertical" size={size}>
                                    <Button color="primary">Top</Button>
                                    <Button color="secondary">Middle</Button>
                                    <Button color="error">Bottom</Button>
                                </ButtonGroup>
                            </Grid2>

                            {/* Single button w ButtonGroup */}
                            <Grid2>
                                <ButtonGroup size={size} color="info">
                                    <Button>Single Button</Button>
                                </ButtonGroup>
                            </Grid2>

                            {/* Disabled ButtonGroup */}
                            <Grid2>
                                <ButtonGroup orientation="horizontal" size={size} color="error" disabled>
                                    <Button>Disabled</Button>
                                    <Button>Group</Button>
                                </ButtonGroup>
                            </Grid2>

                        </Grid2>
                    </Stack>
                ))}
            </Stack>
        </TabPanelContent>
    );
};