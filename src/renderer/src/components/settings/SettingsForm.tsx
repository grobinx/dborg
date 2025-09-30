import React from "react";
import { SettingsCollection, SettingsGroup, SettingType, SettingTypeUnion } from "./SettingsTypes";
import { useSetting } from "@renderer/contexts/SettingsContext";
import { SettingDecorator } from "./SettingDecorator";
import { TextField } from "../inputs/TextField";
import { calculateWidth } from "./SettingInputControl";
import { NumberField } from "../inputs/NumberField";
import { SelectField } from "../inputs/SelectField";
import { BooleanField } from "../inputs/BooleanField";
import { Paper, Stack, Typography } from "@mui/material";
import { useVisibleState } from "@renderer/hooks/useVisibleState";

function useSettingBinding(setting: SettingTypeUnion) {
    const [settingValue, setSettingValue, defaultValue] = useSetting(setting.storageGroup, setting.key, setting.defaultValue);
    const [value, setValue] = React.useState<any>(settingValue);

    React.useEffect(() => {
        setValue(settingValue);
    }, [setting.storageGroup, setting.key, settingValue]);

    const fieldSetValue = React.useCallback((value: any) => {
        setValue(value);
    }, [setting]);

    const fieldValueChanged = React.useCallback((value: any) => {
        setSettingValue(value);
        setting.changed?.(value);
    }, [setting, setSettingValue]);

    return [value, fieldSetValue, fieldValueChanged, defaultValue] as const;
}

const StringSetting: React.FC<{ setting: Extract<SettingTypeUnion, { type: "string" }> }> = ({ setting }) => {
    const [value, onChange, onChanged] = useSettingBinding(setting);

    return (
        <SettingDecorator setting={setting} value={value} setValue={onChange}>
            <TextField
                value={value}
                onChange={onChange}
                onChanged={onChanged}
                width={calculateWidth(setting)}
                required={setting.required}
                onValidate={setting.validate}
                maxLength={setting.maxLength}
                minLength={setting.minLength}
            />
        </SettingDecorator>
    );
};

const NumberSetting: React.FC<{ setting: Extract<SettingTypeUnion, { type: "number" }> }> = ({ setting }) => {
    const [value, onChange, onChanged] = useSettingBinding(setting);
    return (
        <SettingDecorator setting={setting} value={value} setValue={onChange}>
            <NumberField
                value={value}
                onChange={onChange}
                onChanged={onChanged}
                width={calculateWidth(setting)}
                required={setting.required}
                onValidate={setting.validate}
                min={setting.min}
                max={setting.max}
                step={setting.step}
            />
        </SettingDecorator>
    );
};

const SelectSetting: React.FC<{ setting: Extract<SettingTypeUnion, { type: "select" }> }> = ({ setting }) => {
    const [value, onChange, onChanged] = useSettingBinding(setting);
    return (
        <SettingDecorator setting={setting} value={value} setValue={onChange}>
            <SelectField
                value={value}
                onChange={onChange}
                onChanged={onChanged}
                width={calculateWidth(setting)}
                onValidate={setting.validate}
                required={setting.required}
                options={setting.options}
            />
        </SettingDecorator>
    );
};

const BooleanSetting: React.FC<{ setting: Extract<SettingTypeUnion, { type: "boolean" }> }> = ({ setting }) => {
    const [value, onChange, onChanged] = useSettingBinding(setting);
    return (
        <SettingDecorator setting={setting} value={value} setValue={onChange} showDescription={false}>
            <BooleanField
                value={value}
                onChange={onChange}
                onChanged={onChanged}
                width={calculateWidth(setting)}
                required={setting.required}
                onValidate={setting.validate}
                label={setting.description || setting.label}
                indeterminate={setting.indeterminate}
            />
        </SettingDecorator>
    );
};

const registry: Partial<Record<SettingType, React.FC<{ setting: any }>>> = {
    string: ({ setting }) => <StringSetting setting={setting} />,
    number: ({ setting }) => <NumberSetting setting={setting} />,
    select: ({ setting }) => <SelectSetting setting={setting} />,
    boolean: ({ setting }) => <BooleanSetting setting={setting} />,
};

export const SettingItem: React.FC<{ setting: SettingTypeUnion }> = ({ setting }) => {
    const Renderer = registry[setting.type];

    if (!Renderer) {
        return <>Unsupported setting type: {setting.type}</>;
    }

    return <Renderer setting={setting} />;
};

export const SettingsList: React.FC<{ settings: SettingTypeUnion[] | undefined }> = ({ settings }) => {
    if (!settings || settings.length === 0) return null;
    return (
        <Stack
            gap={8}
            width="100%"
        >
            {settings.map((s, i) => (
                <SettingItem key={`${s.storageGroup}/${s.key}/${i}`} setting={s} />
            ))}
        </Stack>
    );
};

export const SettingsGroupForm: React.FC<{ collection?: SettingsCollection; groups?: SettingsGroup[]; settings?: SettingTypeUnion[]; title?: React.ReactNode }> = ({ collection, groups, settings, title }) => {
    const g = groups ?? collection?.groups ?? [];
    const s = settings ?? collection?.settings ?? [];
    const [collectionRef, isCollectionVisible] = useVisibleState<HTMLDivElement>({ threshold: 0.1 });
    const [groupRef, isGroupVisible] = useVisibleState<HTMLDivElement>({ threshold: 0.1 });

    return (
        <Paper
            style={{ display: "flex", flexDirection: "column", padding: "8px 16px", gap: 8 }}
            elevation={1}
            ref={collectionRef}
        >
            <Stack>
                {(title ?? collection?.title) && (
                    <Typography
                        variant="h5"
                    >
                        {title ?? collection?.title}
                    </Typography>
                )}
                {collection?.description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        {collection.description}
                    </Typography>
                )}
            </Stack>

            <SettingsList settings={s} />

            {g.map((grp, idx) => (
                <Stack key={grp.key ?? idx} sx={{ gap: 8 }} ref={groupRef}>
                    <Stack>
                        <Typography
                            variant="h6"
                        >
                            {grp.title}
                        </Typography>
                        {grp.description && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                {grp.description}
                            </Typography>
                        )}
                    </Stack>

                    <SettingsList settings={grp.settings} />
                    
                    {grp.groups && grp.groups.length > 0 && (
                        <SettingsGroupForm groups={grp.groups} />
                    )}
                </Stack>
            ))}
        </Paper>
    );
};
