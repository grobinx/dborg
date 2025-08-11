import { Grid2, Stack, useTheme } from "@mui/material";
import { BaseButton } from "@renderer/components/buttons/BaseButton";
import TabPanelContent, { TabPanelContentOwnProps } from "@renderer/components/TabsPanel/TabPanelContent";
import { Size, Sizes } from "@renderer/types/sizes";
import React from "react";
import Logo from "../../../../../../resources/dborg.png";
import { ButtonRefHandle } from "@renderer/components/buttons/BaseButtonProps";
import ButtonGroup from "./ButtonGroup";

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
                                    <BaseButton
                                        color="primary"
                                        onClick={() => console.log('clicked')}
                                        size={size}
                                    >
                                        Save Changes
                                    </BaseButton>
                                ), [size])}
                            </Grid2>

                            <Grid2>
                                {React.useMemo(() => (
                                    <BaseButton
                                        color="secondary"
                                        size={size}
                                    >
                                        <theme.icons.Search />
                                        Save File
                                    </BaseButton>
                                ), [size])}
                            </Grid2>

                            <Grid2>
                                {React.useMemo(() => (
                                    <BaseButton
                                        color="error"
                                        size={size}
                                        aria-label="Delete"
                                    >
                                        <theme.icons.Delete />
                                    </BaseButton>
                                ), [size])}
                            </Grid2>

                            <Grid2>
                                {React.useMemo(() => (
                                    <BaseButton
                                        loading="![](Loading) Saving..."
                                        size={size}
                                        color="warning"
                                        showLoadingIndicator={false}
                                    >
                                        <theme.icons.Clipboard />
                                        Save state
                                    </BaseButton>
                                ), [size])}
                            </Grid2>

                            <Grid2>
                                {React.useMemo(() => (
                                    <BaseButton
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
                                    </BaseButton>
                                ), [size])}
                            </Grid2>

                            <Grid2>
                                {React.useMemo(() => (
                                    <BaseButton
                                        color="success"
                                        values={[null, 'on']}
                                        size={size}
                                        sx={{ width: 70 }}
                                        ref={getButtonRef(size)}
                                        onChange={(value) => setButtonValues(prev => ({ ...prev, [size]: value }))}
                                    >
                                        {getButtonRef(size).current?.getValue() || 'Power'}
                                    </BaseButton>
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
                                <ButtonGroup orientation="horizontal" size={size} color="primary">
                                    <BaseButton values={[null, 'left']}>Left</BaseButton>
                                    <BaseButton values={[null, 'center']}>Center</BaseButton>
                                    <BaseButton values={[null, 'right']}>Right</BaseButton>
                                </ButtonGroup>
                            </Grid2>

                            {/* ButtonGroup z ikonami */}
                            <Grid2>
                                <ButtonGroup orientation="horizontal" size={size} color="secondary">
                                    <BaseButton><theme.icons.Search /></BaseButton>
                                    <BaseButton><theme.icons.Delete /></BaseButton>
                                    <BaseButton><theme.icons.Info /></BaseButton>
                                </ButtonGroup>
                            </Grid2>

                            {/* ButtonGroup z values (toggle buttons) */}
                            <Grid2>
                                <ButtonGroup orientation="horizontal" size={size} color="success">
                                    <BaseButton values={[null, 'bold']} sx={{ width: "2em" }} onChange={(v) => console.log('Bold:', v)}>
                                        <strong>B</strong>
                                    </BaseButton>
                                    <BaseButton values={[null, 'italic']} sx={{ width: "2em" }} onChange={(v) => console.log('Italic:', v)}>
                                        <em>I</em>
                                    </BaseButton>
                                    <BaseButton values={[null, 'underline']} sx={{ width: "2em" }} onChange={(v) => console.log('Underline:', v)}>
                                        <u>U</u>
                                    </BaseButton>
                                </ButtonGroup>
                            </Grid2>

                            {/* Vertical ButtonGroup */}
                            <Grid2>
                                <ButtonGroup orientation="vertical" size={size}>
                                    <BaseButton color="primary">Top</BaseButton>
                                    <BaseButton color="secondary">Middle</BaseButton>
                                    <BaseButton color="error">Bottom</BaseButton>
                                </ButtonGroup>
                            </Grid2>

                            {/* Single button w ButtonGroup */}
                            <Grid2>
                                <ButtonGroup size={size} color="info">
                                    <BaseButton>Single Button</BaseButton>
                                </ButtonGroup>
                            </Grid2>

                            {/* Disabled ButtonGroup */}
                            <Grid2>
                                <ButtonGroup orientation="horizontal" size={size} color="error" disabled>
                                    <BaseButton>Disabled</BaseButton>
                                    <BaseButton>Group</BaseButton>
                                </ButtonGroup>
                            </Grid2>

                        </Grid2>
                    </Stack>
                ))}
            </Stack>
        </TabPanelContent>
    );
};