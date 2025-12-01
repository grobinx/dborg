import React from "react";
import { SettingsCollection, SettingsGroup, SettingType, SettingTypeUnion } from "./SettingsTypes";
import { getSetting, useSetting } from "@renderer/contexts/SettingsContext";
import { SettingDecorator } from "./SettingDecorator";
import { TextField } from "../inputs/TextField";
import { NumberField } from "../inputs/NumberField";
import { BooleanField } from "../inputs/BooleanField";
import { alpha, styled, Typography, useTheme } from "@mui/material";
import createKey from "./createKey";
import clsx from "@renderer/utils/clsx";
import { useTranslation } from "react-i18next";
import { useScrollIntoView } from "@renderer/hooks/useScrollIntoView";
import { SelectField } from "../inputs/SelectField";
import { FilePathField } from "../inputs/FileField";

const StyledSettingsView = styled('div', {
    name: 'SettingsView',
    slot: 'root',
})(() => ({
    width: "100%",
    height: "100%",
    flexGrow: 1,
    overflowY: "auto",
    overflowX: "hidden",
    display: 'flex',
    flexDirection: 'column',
}));

const StyledSettingsViewContent = styled('div', {
    name: 'SettingsView',
    slot: 'content',
})(() => ({
    display: "flex",
    flexDirection: "column",
    paddingTop: 8,
    paddingLeft: 8,
    paddingRight: 8,
    gap: 8,
}));

const StyledSettingsViewCollection = styled('div', {
    name: 'SettingsView',
    slot: 'collection',
})(() => ({
    display: "flex",
    flexDirection: "column",
    gap: 4,
}));

const StyledSettingsViewList = styled('div', {
    name: 'SettingsView',
    slot: 'list',
})(() => ({
    display: "flex",
    flexDirection: "column",
    gap: 4,
}));

const StyledSettingsViewGroup = styled('div', {
    name: 'SettingsView',
    slot: 'group',
})(() => ({
    display: "flex",
    flexDirection: "column",
    gap: 4,
}));

const StyledSettingsViewHeader = styled('div', {
    name: 'SettingsView',
    slot: 'header',
})(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    padding: 8,
    borderBottom: `1px solid ${theme.palette.divider}`,
    boxShadow: "0 4px 8px -4px rgba(0,0,0,0.2)",
    backgroundColor: alpha(theme.palette.main.main, 0.1),
    '&.selected': {
        backgroundColor: alpha(theme.palette.success.main, 0.3),
    },
}));

const StyledSettingsViewItem = styled('div', {
    name: 'SettingsView',
    slot: 'item',
})(() => ({
}));

const StyledSettingsViewEmpty = styled('div', {
    name: 'SettingsView',
    slot: 'empty',
})(() => ({
    margin: "auto",
    opacity: 0.5,
    alignItems: "center",
    padding: 16,
}));

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
        case "filePath":
            return "100%";
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

const FilePathSetting: React.FC<{
    setting: Extract<SettingTypeUnion, { type: "filePath" }>,
    selected?: boolean;
    onSelect?: () => void;
}> = ({ setting, selected, onSelect }) => {
    const [value, onChange, onChanged] = useSettingBinding(setting);
    return (
        <SettingDecorator setting={setting} value={value} setValue={onChange} selected={selected}>
            <FilePathField
                id={createKey(setting)}
                value={value}
                onChange={onChange}
                onChanged={onChanged}
                width={calculateWidth(setting)}
                required={setting.required}
                onValidate={setting.validate}
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
    filePath: ({ setting, selected, onSelect }) => <FilePathSetting setting={setting} selected={selected} onSelect={onSelect} />,
};

export const SettingsViewItem: React.FC<{
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
            { threshold: [0.1], rootMargin: '-5% 0px -20% 0px' }
        );
        itemObserver.observe(itemRef.current);

        return () => {
            itemObserver.disconnect();
        };
    }, []);

    return (
        <StyledSettingsViewItem
            id={createKey(setting)}
            className="SettingsView-item"
            ref={itemRef}
        >
            <Renderer setting={setting} selected={selected} onSelect={onSelect} />
        </StyledSettingsViewItem>
    );
};

export const SettingsViewList: React.FC<{
    settings: SettingTypeUnion[] | undefined,
    selected?: string,
    onSelect?: (key: string) => void,
    onPinned?: (operation: 'add' | 'remove', key: string) => void;
}> = ({ settings, selected, onSelect, onPinned }) => {
    if (!settings || settings.length === 0) {
        return null;
    }

    return (
        <StyledSettingsViewList className={"SettingsView-list"}>
            {settings.map((setting) => (
                <SettingsViewItem
                    key={createKey(setting)}
                    setting={setting}
                    selected={createKey(setting) === selected}
                    onSelect={() => onSelect?.(createKey(setting))}
                    onPinned={onPinned}
                />)
            )}
        </StyledSettingsViewList>
    );
};

const SettingsViewGroup: React.FC<{
    group: SettingsGroup;
    selected?: string;
    selectedGroup?: string;
    onSelect?: (key: string) => void;
    onPinned?: (operation: 'add' | 'remove', key: string) => void;
}> = ({ group, selected, selectedGroup, onSelect, onPinned }) => {
    const theme = useTheme();

    if (!group) {
        return null;
    }

    return (
        <StyledSettingsViewGroup className={"SettingsView-group"}>
            <StyledSettingsViewHeader
                id={group.key}
                className={clsx(
                    "SettingsView-header",
                    selectedGroup === group.key && "selected",
                    'group'
                )}
            >
                <Typography variant="h6">{group.title}</Typography>
                {group.description && (
                    <Typography variant="description">{group.description}</Typography>
                )}
            </StyledSettingsViewHeader>

            <SettingsViewList
                settings={group.settings}
                selected={selected}
                onSelect={onSelect}
                onPinned={onPinned}
            />

            <SettingsViewGroupList
                groups={group.groups}
                selected={selected}
                selectedGroup={selectedGroup}
                onSelect={onSelect}
                onPinned={onPinned}
            />
        </StyledSettingsViewGroup>
    )
};

const SettingsViewGroupList: React.FC<{
    groups?: SettingsGroup[];
    selected?: string;
    selectedGroup?: string;
    onSelect?: (key: string) => void;
    onPinned?: (operation: 'add' | 'remove', key: string) => void;
}> = ({ groups, selected, selectedGroup, onSelect, onPinned }) => {
    if (!groups || groups.length === 0) {
        return null;
    }
    return (
        groups.map((grp, idx) => (
            <SettingsViewGroup
                key={`${grp.key}-group-${idx}`}
                group={grp}
                selected={selected}
                selectedGroup={selectedGroup}
                onSelect={onSelect}
                onPinned={onPinned}
            />
        ))
    );
};

const SettingsViewCollection: React.FC<{
    collection: SettingsCollection;
    selected?: string;
    selectedGroup?: string;
    onSelect?: (key: string) => void;
    onPinned?: (operation: 'add' | 'remove', key: string) => void;
}> = ({ collection, selected, selectedGroup, onSelect, onPinned }) => {
    const theme = useTheme();

    return (
        <StyledSettingsViewCollection className="SettingsView-collection">
            <StyledSettingsViewHeader
                id={collection.key}
                className={clsx(
                    "SettingsView-header",
                    selectedGroup === collection.key && "selected",
                    'collection'
                )}
            >
                <Typography variant="h5">{collection.title}</Typography>
                {collection?.description && (
                    <Typography variant="description">{collection.description}</Typography>
                )}
            </StyledSettingsViewHeader>

            <SettingsViewList
                settings={collection.settings}
                selected={selected}
                onSelect={onSelect}
                onPinned={onPinned}
            />

            <SettingsViewGroupList
                groups={collection.groups}
                selected={selected}
                selectedGroup={selectedGroup}
                onSelect={onSelect}
                onPinned={onPinned}
            />
        </StyledSettingsViewCollection>
    );
};

export interface SettingsViewProps {
    collections: SettingsCollection[];
    selected?: string;
    selectedGroup?: string;
    ref?: React.RefObject<HTMLDivElement | null>;
    onSelect: (key: string) => void;
    onPinned: (operation: 'add' | 'remove', key: string) => void;
    className?: string;
}

const SettingsView: React.FC<SettingsViewProps> = ({
    collections,
    selected,
    selectedGroup,
    ref,
    onSelect,
    onPinned,
    className,
}) => {
    const { t } = useTranslation();
    console.count("SettingsView Render");

    useScrollIntoView({ 
        containerRef: ref, 
        targetId: selectedGroup ?? selected, 
        scrollOptions: { block: selectedGroup ? 'start' : 'nearest' } 
    });

    return (
        <StyledSettingsView
            className={clsx("SettingsView-root", className)}
            ref={ref}
        >
            <StyledSettingsViewContent className="SettingsView-content">
                {collections.length === 0 && (
                    <StyledSettingsViewEmpty className="SettingsView-empty">
                        {t("no-setting-results", "No settings found")}
                    </StyledSettingsViewEmpty>
                )}
                {collections.map((collection) => (
                    <SettingsViewCollection
                        key={collection.key}
                        collection={collection}
                        selected={selected}
                        selectedGroup={selectedGroup}
                        onSelect={onSelect}
                        onPinned={onPinned}
                    />
                ))}
            </StyledSettingsViewContent>
        </StyledSettingsView>
    );
};

export default SettingsView;