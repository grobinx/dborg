import { Grid2, Stack, useTheme } from "@mui/material";
import { BaseButton } from "@renderer/components/buttons/BaseButton";
import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import { EmailField } from "@renderer/components/inputs/EmailField";
import { NumberField } from "@renderer/components/inputs/NumberField";
import { PatternField } from "@renderer/components/inputs/PatternField";
import { SearchField } from "@renderer/components/inputs/SearchField";
import { RangeField, SliderField } from "@renderer/components/inputs/SliderField";
import { TextField } from "@renderer/components/inputs/TextField";
import TabPanelContent, { TabPanelContentOwnProps } from "@renderer/components/TabsPanel/TabPanelContent";
import { Sizes } from "@renderer/types/sizes";
import React from "react";
import Logo from "../../../../../../resources/dborg.png";
import { Adornment } from "@renderer/components/inputs/base/BaseInputField";
import { Button } from "@renderer/components/buttons/Button";
import { IconButton } from "@renderer/components/buttons/IconButton";

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
    const [emailValues, setEmailValues] = React.useState<Record<string, string | undefined>>({
        small: "small@example.com",
        medium: "medium@example.com",
        large: "large@example.com",
    });
    const [searchValues, setSearchValues] = React.useState<Record<string, string | undefined>>({
        small: "search1",
        medium: "search2",
        large: "search3",
    });
    const [patternValues, setPatternValues] = React.useState<Record<string, string | undefined>>({
        small: "+48 123 456 789",
        medium: "+48 234 567 890",
        large: "+48 345 678 901",
    });

    const handleValueTextChange = (size: string, value: string) => {
        setTextValues((prev) => ({
            ...prev,
            [size]: value, // Aktualizuj wartość dla danego rozmiaru
        }));
    };
    const handleValueNumberChange = (size: string, value: number | null | undefined) => {
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
    const handleValueEmailChange = (size: string, value: string | undefined) => {
        setEmailValues((prev) => ({
            ...prev,
            [size]: value, // Aktualizuj wartość dla danego rozmiaru
        }));
    };
    const handleValueSearchChange = (size: string, value: string | undefined) => {
        setSearchValues((prev) => ({
            ...prev,
            [size]: value, // Aktualizuj wartość dla danego rozmiaru
        }));
    };
    const handleValuePatternChange = (size: string, value: string | undefined) => {
        setPatternValues((prev) => ({
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
                        {React.useMemo(() => (
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
                                    color="main"
                                    required={true}
                                    defaultValue={1}
                                />
                            </InputDecorator>
                        ), [size, textValues[size], selected])}
                    </Stack>
                ))}
            </Stack>
            <Stack key="numberFields" direction="row" width="100%" gap={8}>
                {Sizes.map((size) => (
                    <Stack key={size} direction={"column"} width="100%">
                        NumberField, size: {size}
                        {React.useMemo(() => (
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
                                    color="primary"
                                    required={true}
                                    defaultValue={1}
                                />
                            </InputDecorator>
                        ), [size, numberValues[size], selected])}
                    </Stack>
                ))}
            </Stack>
            <Stack key="sliderFields" direction="row" width="100%" gap={8}>
                {Sizes.map((size) => (
                    <Stack key={size} direction={"column"} width="100%">
                        SliderField, size: {size}
                        {React.useMemo(() => (
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
                                    color="secondary"
                                    required={true}
                                    defaultValue={1}
                                    legend={["safe", "low", "medium", "high", "critical"]}
                                />
                            </InputDecorator>
                        ), [size, sliderValues[size], selected])}
                    </Stack>
                ))}
            </Stack>
            <Stack key="rangeFields" direction="row" width="100%" gap={8}>
                {Sizes.map((size) => (
                    <Stack key={size} direction={"column"} width="100%">
                        RangeField, size: {size}
                        {React.useMemo(() => (
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
                                    color="error"
                                    required={true}
                                    defaultValue={[1, 5]}
                                    legend={["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth"]}
                                />
                            </InputDecorator>
                        ), [size, rangeValues[size], selected])}
                    </Stack>
                ))}
            </Stack>
            <Stack key="emailFields" direction="row" width="100%" gap={8}>
                {Sizes.map((size) => (
                    <Stack key={size} direction={"column"} width="100%">
                        EmailField, size: {size}
                        {React.useMemo(() => (
                            <InputDecorator
                                key={size}
                                selected={selected === size}
                                onClick={() => setSelected(size)}
                                label={"Label for " + size.charAt(0).toUpperCase() + size.slice(1)}
                                description={"This is Long Description for " + size.charAt(0).toUpperCase() + size.slice(1)}
                            >
                                <EmailField
                                    key={size}
                                    size={size}
                                    value={emailValues[size]} // Pobierz wartość dla danego rozmiaru
                                    onChange={(value) => handleValueEmailChange(size, value)} // Aktualizuj wartość dla danego rozmiaru
                                    color="warning"
                                    required={true}
                                />
                            </InputDecorator>
                        ), [size, emailValues[size], selected])}
                    </Stack>
                ))}
            </Stack>
            <Stack key="searchFields" direction="row" width="100%" gap={8}>
                {Sizes.map((size) => (
                    <Stack key={size} direction={"column"} width="100%">
                        SearchField, size: {size}
                        {React.useMemo(() => (
                            <InputDecorator
                                key={size}
                                selected={selected === size}
                                onClick={() => setSelected(size)}
                                label={"Label for " + size.charAt(0).toUpperCase() + size.slice(1)}
                                description={"This is Long Description for " + size.charAt(0).toUpperCase() + size.slice(1)}
                            >
                                <SearchField
                                    key={size}
                                    placeholder={"Search..."}
                                    size={size}
                                    value={searchValues[size]} // Pobierz wartość dla danego rozmiaru
                                    onChange={(value) => handleValueSearchChange(size, value)} // Aktualizuj wartość dla danego rozmiaru
                                    color="info"
                                    required={false}
                                    adornments={
                                        <Adornment position="start">
                                            <IconButton size={size} dense>
                                                <theme.icons.AddTab />
                                            </IconButton>
                                        </Adornment>
                                    }
                                />
                            </InputDecorator>
                        ), [size, searchValues[size], selected])}
                    </Stack>
                ))}
            </Stack>
            <Stack key="patternFields" direction="row" width="100%" gap={8}>
                {Sizes.map((size) => (
                    <Stack key={size} direction={"column"} width="100%">
                        PatternField, size: {size}
                        {React.useMemo(() => (
                            <InputDecorator
                                key={size}
                                selected={selected === size}
                                onClick={() => setSelected(size)}
                                label={"Label for " + size.charAt(0).toUpperCase() + size.slice(1)}
                                description={"This is Long Description for " + size.charAt(0).toUpperCase() + size.slice(1)}
                            >
                                <PatternField
                                    key={size}
                                    size={size}
                                    value={patternValues[size]} // Pobierz wartość dla danego rozmiaru
                                    onChange={(value) => handleValuePatternChange(size, value)} // Aktualizuj wartość dla danego rozmiaru
                                    mask="+48 ___ ___ ___"
                                    replacement={{ "_": /\d/ }}
                                    color="success"
                                    required={true}
                                />
                            </InputDecorator>
                        ), [size, patternValues[size], selected])}
                    </Stack>
                ))}
            </Stack>
        </TabPanelContent>
    );
}