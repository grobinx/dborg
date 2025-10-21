import React from "react";
import { SettingsCollection, SettingsGroup, SettingType, SettingTypeUnion } from "./SettingsTypes";
import { getSetting, useSetting } from "@renderer/contexts/SettingsContext";
import { SettingDecorator } from "./SettingDecorator";
import { TextField } from "../inputs/TextField";
import { NumberField } from "../inputs/NumberField";
import { SelectField } from "../inputs/SelectField";
import { BooleanField } from "../inputs/BooleanField";
import { Box, Stack, styled, Typography } from "@mui/material";
import createKey from "./createKey";

const calculateWidth = (setting: SettingTypeUnion) => {
    const widthPerChar = getSetting("ui", "fontSize") * 0.8; // Approximate width per character in pixels
    const defaultTextWidth = 30 * widthPerChar; // Default width
    const defaultNumberWidth = 20 * widthPerChar; // Default width for number inputs
    const maxWidth = 50 * widthPerChar; // Maximum width
    const minWidth = 8 * widthPerChar; // Minimum width

    if (setting.width) {
        if (typeof setting.width === "number") {
            return Math.max(Math.min(setting.width, maxWidth), minWidth);
        }
        return setting.width;
    }

    switch (setting.type) {
        case "string":
            if (setting.maxLength) {
                // Każdy znak zajmuje około 11px, dodajemy margines
                return Math.max(Math.min(Math.floor(setting.maxLength / 10) * 10 * widthPerChar + 16, maxWidth), minWidth); // Maksymalna szerokość 600px
            }
            return defaultTextWidth;
        case "text":
            if (setting.maxLength) {
                const rows = setting.maxRows || 4; // Jeśli `maxRows` nie jest zdefiniowane, ustaw na 4
                return Math.max(Math.min(Math.floor((setting.maxLength / rows / 10) * 10 * widthPerChar + 16) * 1.25, maxWidth), minWidth); // Oblicz szerokość na podstawie `maxLength` i `rows`
            }
            return defaultTextWidth;
        case "password":
            if (setting.maxLength) {
                // Każdy znak zajmuje około 11px, dodajemy margines
                return Math.max(Math.min(Math.floor(setting.maxLength / 10) * 10 * widthPerChar + 16, maxWidth), minWidth); // Maksymalna szerokość 600px
            }
            return defaultTextWidth;
        case "pattern":
            if (setting.mask) {
                // Każdy znak maski zajmuje około 11px, dodajemy margines
                return Math.max(Math.min(setting.mask.length * widthPerChar + 16, maxWidth), minWidth); // Maksymalna szerokość 600px
            }
            return defaultTextWidth;
        case "range":
            return maxWidth;
        case "number":
            if (setting.max) {
                return Math.max(Math.min((setting.max.toString().length) * widthPerChar + 16, maxWidth), minWidth);
            }
            return defaultNumberWidth;
        case "boolean":
            return "80%";
        case "color":
            return defaultTextWidth;
    }
    return defaultTextWidth;
};

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
        <SettingDecorator setting={setting} value={value} setValue={onChange} selected={selected}>
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
        <SettingDecorator setting={setting} value={value} setValue={onChange} selected={selected}>
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
        <SettingDecorator setting={setting} value={value} setValue={onChange} selected={selected}>
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
        <SettingDecorator setting={setting} value={value} setValue={onChange} showDescription={false} selected={selected}>
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
    onPinned?: (operation: 'add' | 'remove', key: string) => void;
}> = ({ setting, selected, onSelect, onPinned }) => {
    const Renderer = registry[setting.type];
    if (!Renderer) {
        return <>Unsupported setting type: {setting.type}</>;
    }

    const itemRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!itemRef.current) return;

        const itemObserver = new IntersectionObserver(enteries => {
            for (const entry of enteries) {
                if (entry.isIntersecting) {
                    onPinned?.('add', createKey(setting));
                }
                else {
                    onPinned?.('remove', createKey(setting));
                }
            }
        },
            { threshold: [0.1], rootMargin: '0px 0px -50% 0px' }
        );
        itemObserver.observe(itemRef.current);

        return () => {
            itemObserver.disconnect();
        };
    }, []);

    return (
        <div ref={itemRef} data-setting-key={createKey(setting)}>
            <Renderer setting={setting} selected={selected} onSelect={onSelect} />
        </div>
    );
};

export const SettingsList: React.FC<{
    settings: SettingTypeUnion[] | undefined,
    selected?: string,
    onSelect?: (key: string) => void,
    onPinned?: (operation: 'add' | 'remove', key: string) => void;
}> = ({ settings, selected, onSelect, onPinned }) => {
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
                    onPinned={onPinned}
                />)
            )}
        </Stack>
    );
};

const SettingGroupForm: React.FC<{
    group: SettingsGroup;
    selected?: string;
    onSelect?: (key: string) => void;
    onPinned?: (operation: 'add' | 'remove', key: string) => void;
}> = ({ group, selected, onSelect, onPinned }) => {
    if (!group) {
        return null;
    }

    return (
        <Stack direction={"column"}>
            <Box data-setting-group-key={group.key}>
                <Typography variant="h6">{group.title}</Typography>
                {group.description && (
                    <Typography variant="description">{group.description}</Typography>
                )}
            </Box>

            <SettingsList
                settings={group.settings}
                selected={selected}
                onSelect={onSelect}
                onPinned={onPinned}
            />

            <SettingsGroupList
                groups={group.groups}
                selected={selected}
                onSelect={onSelect}
                onPinned={onPinned}
            />
        </Stack>
    )
};

const SettingsGroupList: React.FC<{
    groups?: SettingsGroup[];
    selected?: string;
    onSelect?: (key: string) => void;
    onPinned?: (operation: 'add' | 'remove', key: string) => void;
}> = ({ groups, selected, onSelect, onPinned }) => {
    if (!groups || groups.length === 0) {
        return null;
    }
    return (
        groups.map((grp, idx) => (
            <SettingGroupForm
                key={`${grp.key}-group-${idx}`}
                group={grp}
                selected={selected}
                onSelect={onSelect}
                onPinned={onPinned}
            />
        ))
    );
};

export const SettingsCollectionForm: React.FC<{
    collection: SettingsCollection;
    selected?: string;
    onSelect?: (key: string) => void;
    onPinned?: (operation: 'add' | 'remove', key: string) => void;
}> = ({ collection, selected, onSelect, onPinned }) => {

    return (
        <Stack
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
        >
            <Box data-setting-group-key={collection.key}>
                <Typography variant="h5">{collection.title}</Typography>
                {collection?.description && (
                    <Typography variant="description">{collection.description}</Typography>
                )}
            </Box>

            <SettingsList
                settings={collection.settings}
                selected={selected}
                onSelect={onSelect}
                onPinned={onPinned}
            />

            <SettingsGroupList
                groups={collection.groups}
                selected={selected}
                onSelect={onSelect}
                onPinned={onPinned}
            />
        </Stack>
    );
};

const StyledSettingsForm = styled(Stack, {
    name: 'SettingsForm',
    slot: 'list',
})(() => ({
    flexDirection: "column",
    paddingLeft: 8,
    paddingRight: 8,
    gap: 8,
}));

export interface SettingsFormProps {
    collections: SettingsCollection[];
    selected?: string;
    selectedGroup?: string;
    contentRef?: React.RefObject<HTMLDivElement | null>;
    onSelect: (key: string) => void;
    onPinned: (operation: 'add' | 'remove', key: string) => void;
    className?: string;
}

const SettingsForm: React.FC<SettingsFormProps> = ({
    collections,
    selected,
    selectedGroup,
    contentRef,
    onSelect,
    onPinned,
    className,
}) => {
    console.count("SettingsForm Render");

    React.useEffect(() => {
        if (contentRef?.current && selected) {
            const selectedElement = contentRef.current.querySelector(`[data-setting-key="${selected}"]`);
            if (selectedElement) {
                selectedElement.scrollIntoView({ behavior: 'auto', block: 'nearest' });
            }
        }
    }, [selected]);

    React.useEffect(() => {
        if (contentRef?.current && selectedGroup) {
            const selectedElement = contentRef.current.querySelector(`[data-setting-group-key="${selectedGroup}"]`);
            if (selectedElement) {
                selectedElement.scrollIntoView({ behavior: 'auto', block: 'start' });
            }
        }
    }, [selectedGroup]);

    return (
        <StyledSettingsForm className={className}>
            {collections.map((collection) => (
                <SettingsCollectionForm
                    key={collection.key}
                    collection={collection}
                    selected={selected}
                    onSelect={onSelect}
                    onPinned={onPinned}
                />
            ))}
        </StyledSettingsForm>
    );
};

export default SettingsForm;