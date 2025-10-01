import React from "react";
import { SettingsCollection, SettingsGroup, SettingType, SettingTypeUnion } from "./SettingsTypes";
import { useSetting } from "@renderer/contexts/SettingsContext";
import { SettingDecorator } from "./SettingDecorator";
import { TextField } from "../inputs/TextField";
import { calculateWidth } from "./SettingInputControl";
import { NumberField } from "../inputs/NumberField";
import { SelectField } from "../inputs/SelectField";
import { BooleanField } from "../inputs/BooleanField";
import { Box, Paper, Stack, Typography, useTheme } from "@mui/material";
import { useVisibleState } from "@renderer/hooks/useVisibleState";

function useSettingBinding(setting: SettingTypeUnion) {
    const [settingValue, setSettingValue, defaultValue] = useSetting(setting.storageGroup, setting.storageKey, setting.defaultValue);
    const [value, setValue] = React.useState<any>(settingValue);

    React.useEffect(() => {
        setValue(settingValue);
    }, [setting.storageGroup, setting.storageKey, settingValue]);

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
    if (!settings || settings.length === 0) {
        return null;
    }

    return (
        <Stack
            gap={4}
            width="100%"
        >
            {settings.map((s, i) => (
                <SettingItem key={`${s.storageGroup}/${s.storageKey}/${i}`} setting={s} />
            ))}
        </Stack>
    );
};

const SettingGroupForm: React.FC<{
    group: SettingsGroup;
    titleHeight?: number;
}> = ({ group, titleHeight }) => {
    const groupTitleRef = React.useRef<HTMLDivElement>(null);
    const [groupTitleHeight, setGroupTitleHeight] = React.useState(0);
    const sentinelRef = React.useRef<HTMLDivElement>(null);
    const [isPinned, setIsPinned] = React.useState(false);
    const theme = useTheme();

    if (!group) {
        return null;
    }

    React.useLayoutEffect(() => {
        if (groupTitleRef.current) {
            setGroupTitleHeight(groupTitleRef?.current?.clientHeight ?? 0);
        }
    }, [group.title, isPinned]);

    React.useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            ([entry]) => setIsPinned(!entry.isIntersecting),
            { threshold: [0] }
        );
        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [group.title]);

    return (
        <>
            {/* Sentinel przed nagłówkiem */}
            <div ref={sentinelRef} style={{ height: 1, margin: 0, padding: 0 }} />
            <Typography
                variant="h6"
                sx={{
                    position: 'sticky',
                    top: titleHeight,
                    backgroundColor: theme.palette.background.paper,
                    zIndex: 5,
                    padding: 4,
                }}
                ref={groupTitleRef}
            >
                {group.title}
            </Typography>

            {group.description && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    {group.description}
                </Typography>
            )}

            <SettingsList settings={group.settings} />

            <SettingsGroupList
                groups={group.groups}
                titleHeight={(titleHeight ?? 0) + (groupTitleHeight ?? 0)}
            />
        </>
    )
};

const SettingsGroupList: React.FC<{
    groups?: SettingsGroup[];
    titleHeight?: number;
}> = ({ groups, titleHeight }) => {
    if (!groups || groups.length === 0) {
        return null;
    }
    return (
        groups.map((grp, idx) => (
            <SettingGroupForm
                key={`${grp.key}-group-${idx}`}
                group={grp}
                titleHeight={titleHeight}
            />
        ))
    );
};

export const SettingsCollectionForm: React.FC<{
    collection: SettingsCollection;
}> = ({ collection }) => {
    const titleRef = React.useRef<HTMLDivElement>(null);
    const collectionRef = React.useRef<HTMLDivElement>(null);
    const [titleHeight, setTitleHeight] = React.useState(0);
    const sentinelRef = React.useRef<HTMLDivElement>(null);
    const [isPinned, setIsPinned] = React.useState(false);
    const theme = useTheme();

    React.useLayoutEffect(() => {
        if (titleRef.current) {
            setTitleHeight(titleRef.current?.clientHeight ?? 0);
        }
    }, [collection.title, isPinned]);

    React.useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            ([entry]) => setIsPinned(!entry.isIntersecting),
            { threshold: [0] }
        );
        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [collection.title]);

    return (
        <Stack
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
            ref={collectionRef}
        >
            {/* Sentinel przed nagłówkiem */}
            <div ref={sentinelRef} style={{ height: 1, margin: 0, padding: 0 }} />
            <Typography
                variant="h5"
                sx={{
                    position: 'sticky',
                    top: 0,
                    backgroundColor: theme.palette.background.paper,
                    zIndex: 10,
                    transition: 'box-shadow 0.2s',
                    padding: 4,
                }}
                ref={titleRef}
                className={isPinned ? "is-pinned" : ""}
            >
                {collection.title}
            </Typography>

            {collection?.description && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    {collection.description}
                </Typography>
            )}

            <SettingsList settings={collection.settings} />

            <SettingsGroupList groups={collection.groups} titleHeight={titleHeight} />
        </Stack>
    );
};
