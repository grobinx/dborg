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

export function createKey(setting: SettingTypeUnion) {
    return `${setting.storageGroup}-${setting.storageKey}`;
}

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

const StringSetting: React.FC<{
    setting: Extract<SettingTypeUnion, { type: "string" }>,
    selected?: boolean;
    onSelect?: () => void;
}> = ({ setting, selected, onSelect }) => {
    const [value, onChange, onChanged] = useSettingBinding(setting);

    return (
        <SettingDecorator setting={setting} value={value} setValue={onChange} selected={selected} data-setting-key={createKey(setting)}>
            <TextField
                id={createKey(setting)}
                value={value}
                onChange={onChange}
                onChanged={onChanged}
                width={calculateWidth(setting)}
                required={setting.required}
                onValidate={setting.validate}
                maxLength={setting.maxLength}
                minLength={setting.minLength}
                onFocus={onSelect}
            />
        </SettingDecorator>
    );
};

const NumberSetting: React.FC<{
    setting: Extract<SettingTypeUnion, { type: "number" }>,
    selected?: boolean;
    onSelect?: () => void;
}> = ({ setting, selected, onSelect }) => {
    const [value, onChange, onChanged] = useSettingBinding(setting);
    return (
        <SettingDecorator setting={setting} value={value} setValue={onChange} selected={selected} data-setting-key={createKey(setting)}>
            <NumberField
                id={createKey(setting)}
                value={value}
                onChange={onChange}
                onChanged={onChanged}
                width={calculateWidth(setting)}
                required={setting.required}
                onValidate={setting.validate}
                min={setting.min}
                max={setting.max}
                step={setting.step}
                onFocus={onSelect}
            />
        </SettingDecorator>
    );
};

const SelectSetting: React.FC<{
    setting: Extract<SettingTypeUnion, { type: "select" }>,
    selected?: boolean;
    onSelect?: () => void;
}> = ({ setting, selected, onSelect }) => {
    const [value, onChange, onChanged] = useSettingBinding(setting);
    return (
        <SettingDecorator setting={setting} value={value} setValue={onChange} selected={selected} data-setting-key={createKey(setting)}>
            <SelectField
                id={createKey(setting)}
                value={value}
                onChange={onChange}
                onChanged={onChanged}
                width={calculateWidth(setting)}
                onValidate={setting.validate}
                required={setting.required}
                options={setting.options}
                onFocus={onSelect}
            />
        </SettingDecorator>
    );
};

const BooleanSetting: React.FC<{
    setting: Extract<SettingTypeUnion, { type: "boolean" }>,
    selected?: boolean;
    onSelect?: () => void;
}> = ({ setting, selected, onSelect }) => {
    const [value, onChange, onChanged] = useSettingBinding(setting);
    return (
        <SettingDecorator setting={setting} value={value} setValue={onChange} showDescription={false} selected={selected} data-setting-key={createKey(setting)}>
            <BooleanField
                id={createKey(setting)}
                value={value}
                onChange={onChange}
                onChanged={onChanged}
                width={calculateWidth(setting)}
                required={setting.required}
                onValidate={setting.validate}
                label={setting.description || setting.label}
                indeterminate={setting.indeterminate}
                onFocus={onSelect}
            />
        </SettingDecorator>
    );
};

const registry: Partial<Record<SettingType, React.FC<{
    setting: any,
    selected?: boolean,
    onSelect?: () => void,
}>>> = {
    string: ({ setting, selected, onSelect }) => <StringSetting setting={setting} selected={selected} onSelect={onSelect} />,
    number: ({ setting, selected, onSelect }) => <NumberSetting setting={setting} selected={selected} onSelect={onSelect} />,
    select: ({ setting, selected, onSelect }) => <SelectSetting setting={setting} selected={selected} onSelect={onSelect} />,
    boolean: ({ setting, selected, onSelect }) => <BooleanSetting setting={setting} selected={selected} onSelect={onSelect} />,
};

export const SettingItem: React.FC<{
    setting: SettingTypeUnion,
    selected?: boolean,
    onSelect?: () => void,
}> = ({ setting, selected, onSelect }) => {
    const Renderer = registry[setting.type];

    if (!Renderer) {
        return <>Unsupported setting type: {setting.type}</>;
    }

    return <Renderer setting={setting} selected={selected} onSelect={onSelect} />;
};

export const SettingsList: React.FC<{
    settings: SettingTypeUnion[] | undefined,
    selected?: string,
    onSelect?: (key: string) => void,
}> = ({ settings, selected, onSelect }) => {
    if (!settings || settings.length === 0) {
        return null;
    }

    return (
        <Stack
            gap={4}
            width="100%"
        >
            {settings.map((setting) => (
                <SettingItem
                    key={createKey(setting)}
                    setting={setting}
                    selected={createKey(setting) === selected}
                    onSelect={() => onSelect?.(createKey(setting))}
                />)
            )}
        </Stack>
    );
};

const SettingGroupForm: React.FC<{
    group: SettingsGroup;
    groupLevel?: number;
    titleHeight?: number;
    titleText?: string[];
    selected?: string;
    onSelect?: (key: string) => void;
    onPinned?: (pinned: string[]) => void;
}> = ({ group, groupLevel, titleHeight, titleText, selected, onSelect, onPinned }) => {
    const groupRef = React.useRef<HTMLDivElement>(null);
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
        if (!sentinelRef.current || !groupRef.current) return;

        let parentVisible = false;
        let sentinelPinned = false;

        const sentinelObserver = new IntersectionObserver(
            ([entry]) => {
                setIsPinned(!entry.isIntersecting && parentVisible);
                sentinelPinned = !entry.isIntersecting;
            },
            { threshold: [0] }
        );
        sentinelObserver.observe(sentinelRef.current);

        const groupObserver = new IntersectionObserver(
            ([entry]) => {
                setIsPinned(sentinelPinned && entry.isIntersecting);
                parentVisible = entry.isIntersecting;
            },
            { threshold: [0, 1] }
        );
        groupObserver.observe(groupRef.current);

        return () => {
            sentinelObserver.disconnect();
            groupObserver.disconnect();
        };
    }, [group.title]);

    React.useEffect(() => {
        if (onPinned) {
            onPinned(isPinned ? [...(titleText ?? []), group.title] : [...(titleText ?? [])]);
        }
    }, [onPinned, isPinned]);

    return (
        <Stack ref={groupRef} direction={"column"}>
            {/* Sentinel przed nagłówkiem */}
            <div ref={sentinelRef} style={{ height: 1, margin: 0, padding: 0 }} />
            <Typography
                variant="h6"
                sx={{
                    position: 'sticky',
                    top: titleHeight,
                    backgroundColor: theme.palette.background.paper,
                    zIndex: 99 - (groupLevel ?? 1),
                    // '&.pinned': {
                    //     visibility: 'hidden',
                    // }
                }}
                ref={groupTitleRef}
                className={isPinned ? "pinned" : ""}
            >
                {group.title}
                {/* - {isPinned ? "pinned" : "not pinned"} */}
            </Typography>

            {group.description && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    {group.description}
                </Typography>
            )}

            <SettingsList settings={group.settings} selected={selected} onSelect={onSelect} />

            <SettingsGroupList
                groups={group.groups}
                groupLevel={(groupLevel ?? 0) + 1}
                titleHeight={(titleHeight ?? 0) + (groupTitleHeight ?? 0) - 1}
                selected={selected}
                onSelect={onSelect}
                onPinned={onPinned}
                titleText={[...(titleText ?? []), group.title]}
            />
        </Stack>
    )
};

const SettingsGroupList: React.FC<{
    groups?: SettingsGroup[];
    groupLevel?: number;
    titleHeight?: number;
    titleText?: string[];
    selected?: string;
    onSelect?: (key: string) => void;
    onPinned?: (pinned: string[]) => void;
}> = ({ groups, groupLevel, titleHeight, titleText, selected, onSelect, onPinned }) => {
    if (!groups || groups.length === 0) {
        return null;
    }
    return (
        groups.map((grp, idx) => (
            <SettingGroupForm
                key={`${grp.key}-group-${idx}`}
                group={grp}
                groupLevel={groupLevel}
                titleHeight={titleHeight}
                selected={selected}
                onSelect={onSelect}
                onPinned={onPinned}
                titleText={titleText}
            />
        ))
    );
};

export const SettingsCollectionForm: React.FC<{
    contentRef?: React.RefObject<HTMLDivElement | null>;
    collection: SettingsCollection;
    selected?: string;
    onSelect?: (key: string) => void;
    onPinned?: (pinned: string[]) => void;
}> = ({ contentRef, collection, selected, onSelect, onPinned }) => {
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

    React.useLayoutEffect(() => {
        if (contentRef?.current && selected) {
            const selectedElement = contentRef.current.querySelector(`[data-setting-key="${selected}"]`);
            if (selectedElement) {
                selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [selected]);

    React.useEffect(() => {
        if (!sentinelRef.current || !collectionRef.current) return;

        let parentVisible = false;
        let sentinelPinned = false;

        const sentinelObserver = new IntersectionObserver(
            ([entry]) => {
                setIsPinned(!entry.isIntersecting && parentVisible);
                sentinelPinned = !entry.isIntersecting;
            },
            { threshold: [0] }
        );
        sentinelObserver.observe(sentinelRef.current);

        const collectionObserver = new IntersectionObserver(
            ([entry]) => {
                setIsPinned(sentinelPinned && entry.isIntersecting);
                parentVisible = entry.isIntersecting;
            },
            { threshold: [0, 1] }
        );
        collectionObserver.observe(collectionRef.current);

        return () => {
            sentinelObserver.disconnect();
            collectionObserver.disconnect();
        };
    }, [collection.title]);

    React.useEffect(() => {
        if (onPinned) {
            onPinned(isPinned ? [collection.title] : []);
        }
    }, [onPinned, isPinned]);

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
                    zIndex: 100,
                    transition: 'box-shadow 0.2s',
                }}
                ref={titleRef}
                className={isPinned ? "pinned" : ""}
            >
                {collection.title}
                {/* - {isPinned ? "pinned" : "not pinned"} */}
            </Typography>

            {collection?.description && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    {collection.description}
                </Typography>
            )}

            <SettingsList settings={collection.settings} selected={selected} onSelect={onSelect} />

            <SettingsGroupList
                groups={collection.groups}
                groupLevel={1}
                titleHeight={titleHeight}
                selected={selected}
                onSelect={onSelect}
                onPinned={onPinned}
                titleText={[collection.title]}
            />
        </Stack>
    );
};
