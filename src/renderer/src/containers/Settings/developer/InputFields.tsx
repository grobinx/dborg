import { Box, Stack, Tab, useTheme } from "@mui/material";
import { Adornment } from "@renderer/components/inputs/base/BaseTextField";
import { Size, Sizes } from "@renderer/components/inputs/base/types";
import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import { NumberField } from "@renderer/components/inputs/NumberField";
import { RangeField, SliderField } from "@renderer/components/inputs/SliderField";
import { TextField } from "@renderer/components/inputs/TextField";
import TabPanelContent, { TabPanelContentOwnProps } from "@renderer/components/TabsPanel/TabPanelContent";
import React from "react";

export const InputFieldsContent: React.FC<TabPanelContentOwnProps> = (props) => {
    const theme = useTheme(); // Pobierz motyw, aby uzyskać dostęp do ikon

    const [selected, setSelected] = React.useState<string | undefined>(undefined);
    const [textValues, setTextValues] = React.useState<Record<string, any>>({
        small: "a",
        medium: "b",
        large: "c",
    });
    const [numberValues, setNumberValues] = React.useState<Record<string, any>>({
        small: 1,
        medium: 2,
        large: 3,
    });
    const [sliderValues, setSliderValues] = React.useState<Record<string, any>>({
        small: 10,
        medium: 20,
        large: 30,
    });
    const [rangeValues, setRangeValues] = React.useState<Record<string, [number, number] | undefined>>({
        small: [0, 10],
        medium: [0, 20],
        large: [0, 30],
    });

    const handleValueTextChange = (size: string, value: string) => {
        setTextValues((prev) => ({
            ...prev,
            [size]: value, // Aktualizuj wartość dla danego rozmiaru
        }));
    };
    const handleValueNumberChange = (size: string, value: number | undefined) => {
        setNumberValues((prev) => ({
            ...prev,
            [size]: value, // Aktualizuj wartość dla danego rozmiaru
        }));
    };
    const handleValueSliderChange = (size: string, value: number | undefined) => {
        setSliderValues((prev) => ({
            ...prev,
            [size]: value, // Aktualizuj wartość dla danego rozmiaru
        }));
    };
    const handleValueRangeChange = (size: string, value: [number, number] | undefined) => {
        setRangeValues((prev) => ({
            ...prev,
            [size]: value, // Aktualizuj wartość dla danego rozmiaru
        }));
    };

    return (
        <TabPanelContent {...props} sx={{ width: "100%", height: "100%", overflow: "auto", padding: 8, }}>
            <Stack key="textFields" direction="row" width="100%" gap={8}>
                {Sizes.map((size) => (
                    <Stack key={size} direction={"column"} width="100%">
                        TextField, size: {size}
                        <InputDecorator
                            key={size}
                            selected={selected === size}
                            onClick={() => setSelected(size)}
                            label={"Label for " + size.charAt(0).toUpperCase() + size.slice(1)}
                            description={"This is Long Description for " + size.charAt(0).toUpperCase() + size.slice(1)}
                        >
                            <TextField
                                size={size}
                                placeholder={"Placeholder for " + size.charAt(0).toUpperCase() + size.slice(1)}
                                maxLength={50}
                                value={textValues[size]} // Pobierz wartość dla danego rozmiaru
                                onChange={(value) => handleValueTextChange(size, value)} // Aktualizuj wartość dla danego rozmiaru
                                adornments={[
                                    <Adornment key="connected" position="end">
                                        <theme.icons.Connected />
                                    </Adornment>,
                                    <Adornment key="clipboard" position="end">
                                        <theme.icons.Clipboard />
                                    </Adornment>

                                ]}
                                color="main"
                                required={true}
                                defaultValue={1}
                            />
                        </InputDecorator>
                    </Stack>
                ))}
            </Stack>
            <Stack key="numberFields" direction="row" width="100%" gap={8}>
                {Sizes.map((size) => (
                    <Stack key={size} direction={"column"} width="100%">
                        NumberField, size: {size}
                        <InputDecorator
                            key={size}
                            selected={selected === size}
                            onClick={() => setSelected(size)}
                            label={"Label for " + size.charAt(0).toUpperCase() + size.slice(1)}
                            description={"This is Long Description for " + size.charAt(0).toUpperCase() + size.slice(1)}
                        >
                            <NumberField
                                size={size}
                                placeholder={"Placeholder for " + size.charAt(0).toUpperCase() + size.slice(1)}
                                max={50}
                                min={1}
                                value={numberValues[size]} // Pobierz wartość dla danego rozmiaru
                                onChange={(value) => handleValueNumberChange(size, value)} // Aktualizuj wartość dla danego rozmiaru
                                adornments={[
                                    <Adornment key="connected" position="end">
                                        <theme.icons.Connected />
                                    </Adornment>,
                                    <Adornment key="clipboard" position="end">
                                        <theme.icons.Clipboard />
                                    </Adornment>

                                ]}
                                color="primary"
                                required={true}
                                defaultValue={1}
                            />
                        </InputDecorator>
                    </Stack>
                ))}
            </Stack>
            <Stack key="sliderFields" direction="row" width="100%" gap={8}>
                {Sizes.map((size) => (
                    <Stack key={size} direction={"column"} width="100%">
                        SliderField, size: {size}
                        <InputDecorator
                            key={size}
                            selected={selected === size}
                            onClick={() => setSelected(size)}
                            label={"Label for " + size.charAt(0).toUpperCase() + size.slice(1)}
                            description={"This is Long Description for " + size.charAt(0).toUpperCase() + size.slice(1)}
                        >
                            <SliderField
                                size={size}
                                max={1000}
                                step={10}
                                value={sliderValues[size]} // Pobierz wartość dla danego rozmiaru
                                onChange={(value) => handleValueSliderChange(size, value)} // Aktualizuj wartość dla danego rozmiaru
                                adornments={[
                                    <Adornment key="connected" position="end">
                                        <theme.icons.Connected />
                                    </Adornment>,
                                    <Adornment key="clipboard" position="end">
                                        <theme.icons.Clipboard />
                                    </Adornment>
                                ]}
                                color="secondary"
                                required={true}
                                defaultValue={1}
                                legend={["safe", "low", "medium", "high", "critical"]}
                            />
                        </InputDecorator>
                    </Stack>
                ))}
            </Stack>
            <Stack key="rangeFields" direction="row" width="100%" gap={8}>
                {Sizes.map((size) => (
                    <Stack key={size} direction={"column"} width="100%">
                        SliderField, size: {size}
                        <InputDecorator
                            key={size}
                            selected={selected === size}
                            onClick={() => setSelected(size)}
                            label={"Label for " + size.charAt(0).toUpperCase() + size.slice(1)}
                            description={"This is Long Description for " + size.charAt(0).toUpperCase() + size.slice(1)}
                        >
                            <RangeField
                                size={size}
                                max={1000}
                                step={10}
                                distance={1}
                                value={rangeValues[size]} // Pobierz wartość dla danego rozmiaru
                                onChange={(value) => handleValueRangeChange(size, value)} // Aktualizuj wartość dla danego rozmiaru
                                // adornments={[
                                //     <Adornment key="connected" position="end">
                                //         <theme.icons.Connected />
                                //     </Adornment>,
                                //     <Adornment key="clipboard" position="end">
                                //         <theme.icons.Clipboard />
                                //     </Adornment>
                                // ]}
                                color="error"
                                required={true}
                                defaultValue={[1, 5]}
                                legend={["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth"]}
                            />
                        </InputDecorator>
                    </Stack>
                ))}
            </Stack>
        </TabPanelContent>
    );
}