import { Alert, Box, Divider, Menu, MenuItem, Popper, Stack, styled, Tooltip, Typography, useTheme, useThemeProps } from "@mui/material";
import { SettingTypeBase, SettingTypeUnion } from "./SettingsTypes";
import { FormattedText } from "@renderer/components/useful/FormattedText";
import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from "react";
import { BaseInputProps } from "./base/BaseInput";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import clsx from "@renderer/utils/clsx";
import { get } from "http";
import { getSetting, getSettingDefault } from "@renderer/contexts/SettingsContext";
import { ToolButton } from "../buttons/ToolButton";

const StyledSettingInputControlRoot = styled(Box, {
    name: "SettingInputControl", // The component name
    slot: "root", // The slot name
})(({ theme }) => ({
    margin: theme.spacing(1),
    width: "100%",
    display: "flex",
    flexDirection: "row",
}));

const StyledSettingInputControlInternal = styled(Box, {
    name: 'SettingInputControl', // The component name
    slot: 'internal', // The slot name
})(() => ({
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    marginLeft: 8,
}));

const StyledSettingInputControlLabel = styled(Typography, {
    name: "SettingInputControl", // The component name
    slot: "label", // The slot name
})(() => ({
    display: "flex",
}));

const StyledSettingInputControlDescription = styled(Typography, {
    name: "SettingInputControl", // The component name
    slot: "description", // The slot name
})(() => ({
    display: "flex",
}));

const StyledSettingInputControlValidity = styled(Alert, {
    name: "SettingInputControl", // The component name
    slot: "validity", // The slot name
})(() => ({
    display: "flex",
}));

const StyledSettingInputControlEffect = styled(Typography, {
    name: "SettingInputControl", // The component name
    slot: "effect", // The slot name
})(() => ({
    display: "flex",
}));

const StyledSettingInputControlInput = styled(Stack, {
    name: "SettingInputControl", // The component name
    slot: "input", // The slot name
})(() => ({
    flexDirection: "row",
    alignItems: "center",
}));

export const calculateWidth = (setting: SettingTypeUnion) => {
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

export const disabledControl = (
    setting: SettingTypeBase
): boolean => {
    // Sprawdź, czy `administrated` jest ustawione i zwraca `true`
    if (typeof setting.administrated === "function") {
        if (setting.administrated()) {
            return true; // Wyłączone, jeśli administrated zwraca true
        }
    } else if (setting.administrated === true) {
        return true; // Wyłączone, jeśli administrated jest true
    }

    // Sprawdź, czy `disabled` jest ustawione i zwraca `true`
    if (typeof setting.disabled === "function") {
        if (setting.disabled()) {
            return true; // Wyłączone, jeśli disabled zwraca true
        }
    } else if (setting.disabled === true) {
        return true; // Wyłączone, jeśli disabled jest true
    }

    // Jeśli żaden warunek nie został spełniony, kontrolka nie jest wyłączona
    return false;
};

export const SettingInputControlDescription: React.FC<React.ComponentProps<typeof Typography> & { description: React.ReactNode }> = (props) => {
    const { description, ...other } = props;
    return (
        <StyledSettingInputControlDescription variant="description" {...other} className="SettingInputControl-description">
            {props.children}
            <FormattedText text={description} />
        </StyledSettingInputControlDescription>
    );
};

export interface SettingInputControlProps extends React.ComponentProps<typeof Box> {
}

interface SettingInputControlOwnProps extends SettingInputControlProps {
    setting: SettingTypeUnion;
    value?: any;
    setValue?: (value: any) => void;
    onStore?: (value: any) => void;
    onClick?: () => void;
    validate?: (value?: any) => string | boolean;
    selected?: boolean;
    description?: boolean;
    children?: React.ReactElement<BaseInputProps>;
    policy?: (() => React.ReactNode) | React.ReactNode;
}

const SettingInputControl: React.FC<SettingInputControlOwnProps> = (props) => {
    const {
        children, className, setting, value, setValue,
        onStore, onClick, validate,
        selected, description, policy, ...other
    } = useThemeProps({ name: 'SettingInputControl', props });
    const { t } = useTranslation();
    const theme = useTheme();
    const [previousValue] = useState<any>(value);
    const [validity, setValidity] = useState<string | undefined>(undefined);
    const anchorElRef = React.useRef<HTMLDivElement>(null);
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const isMenuOpen = Boolean(menuAnchorEl);
    const [popperVisibilityRef, isPopperVisible] = useVisibleState<HTMLDivElement>();
    const [policyContent, setPolicyContent] = useState<React.ReactNode>(undefined);
    const [refresh, setRefresh] = useState<boolean>(false);
    const defaultValue = getSettingDefault(setting.storageGroup, setting.storageKey, setting.defaultValue);

    const getEffectContent = () => {
        const effect = setting.effect?.();
        if (effect) {
            return <FormattedText text={effect} />;
        }
        return undefined;
    };
    const [effectContent, setEffectContent] = useState<React.ReactNode>(getEffectContent());

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleRestoreDefaults = () => {
        setValue?.(defaultValue);
        handleMenuClose();
    };

    const handleResetSetting = () => {
        setValue?.(previousValue);
        handleMenuClose();
    };

    const handleCopyPath = () => {
        navigator.clipboard.writeText(`${setting.storageGroup}/${setting.storageKey}`);
        handleMenuClose();
    };

    const handleCopySetting = () => {
        navigator.clipboard.writeText(JSON.stringify({ [setting.storageKey]: value }, null, 2));
        handleMenuClose();
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            let valid = true;
            const isEmpty = value === undefined || value === null || value === "";

            if (setting.required && isEmpty) {
                valid = false;
                setValidity(t("required-field", "This field is required"));
            } else if (!isEmpty) {
                if ((setting.type === "string" || setting.type === "text") && typeof value !== "string") {
                    valid = false;
                    setValidity(t("invalid-type", "Invalid type, expected string"));
                } else if (setting.type === "number" && typeof value !== "number") {
                    valid = false;
                    setValidity(t("invalid-type", "Invalid type, expected number"));
                // } else if (setting.type === "boolean") {
                //     if (typeof value !== "boolean" && typeof value !== "string" && typeof value !== "number") {
                //         valid = false;
                //         setValidity(t("invalid-type", "Invalid type, expected boolean, string or number"));
                //     } else if (
                //         setting.values &&
                //         !([setting.values.true, setting.values.false] as Array<string | number | null>).includes(value as string | number | null)
                //     ) {
                //         valid = false;
                //         setValidity(t("invalid-value", "Invalid value, expected true/false values"));
                //     }
                } else if (setting.type === "array" && !Array.isArray(value)) {
                    valid = false;
                    setValidity(t("invalid-type", "Invalid type, expected array"));
                }
            }

            if (valid && typeof setting.validate === "function") {
                const result = setting.validate(value);
                if (result === false) {
                    valid = false;
                    setValidity(t("invalid-value", "Invalid value"));
                } else if (typeof result === "string") {
                    valid = false;
                    setValidity(result);
                } else {
                    setValidity(undefined);
                }
            }

            // Jeśli valid jest true i validate zostało przekazane z góry, wywołaj je
            if (valid && typeof validate === "function") {
                const validateResult = validate(value);

                if (validateResult === false) {
                    valid = false;
                    setValidity(t("invalid-value", "Invalid value"));
                } else if (typeof validateResult === "string") {
                    valid = false;
                    setValidity(validateResult);
                } else {
                    setValidity(undefined);
                }
            }

            if (valid) {
                setValidity(undefined);
            }

            setting.changed?.(value);
            let storeValue = value;
            if (!valid) {
                switch (setting.storeInvalid ?? "previous") {
                    case "previous":
                        storeValue = previousValue;
                        break;
                    case "default":
                        storeValue = defaultValue;
                        break;
                }
            }
            if (!setting.storeDefault && JSON.stringify(defaultValue) === JSON.stringify(storeValue)) {
                storeValue = undefined;
            }
            onStore?.(storeValue);
            setRefresh((prev) => !prev);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [value, setting, validate]);

    useEffect(() => {
        setEffectContent(getEffectContent());
    }, [refresh]);

    useEffect(() => {
        if (typeof policy === "function") {
            setPolicyContent(policy());
        } else if (typeof policy === "string") {
            setPolicyContent(policy);
        } else {
            setPolicyContent(undefined);
        }
    }, [value, policy]);

    const changed = JSON.stringify(previousValue) !== JSON.stringify(value);
    const isDefault = JSON.stringify(defaultValue) === JSON.stringify(value);
    const isDisabled = disabledControl(setting);

    console.count(`SettingInputControl render: ${setting.storageKey}`);
    return (
        <StyledSettingInputControlRoot
            className={clsx(
                'SettingInputControl-root',
                `${setting.type}-setting`,
                className,
                selected && 'Mui-selected',
                changed && 'changed',
                isDefault && 'default',
            )}
            onClick={onClick}
            {...other}
        >
            <Tooltip
                title={[
                    isDefault ? t("default-value", "Value is default") : undefined,
                    changed ? t("value-changed", "Value has changed") : undefined
                ].filter(Boolean).join(` ${t("and", "and")} `)}
                placement="top"
            >
                <div className={[
                    "indicator",
                ].filter(Boolean).join(' ')}></div>
            </Tooltip>
            <div className={[
                'menu',
                isMenuOpen ? 'open' : undefined,
            ].filter(Boolean).join(' ')}>
                <ToolButton
                    onClick={handleMenuOpen}
                    dense
                >
                    <theme.icons.MoreVert />
                </ToolButton>
                <Menu
                    anchorEl={menuAnchorEl}
                    open={isMenuOpen}
                    onClose={handleMenuClose}
                >
                    <MenuItem key="reset-setting"
                        onClick={handleResetSetting}
                        disabled={isDisabled}
                    >
                        {t("reset-setting", "Reset setting")}
                    </MenuItem>
                    <MenuItem key="restore-defaults"
                        onClick={handleRestoreDefaults}
                        disabled={defaultValue === undefined || isDisabled}
                    >
                        {t("restore-setting-defaults", "Restore defaults")}
                    </MenuItem>
                    <Divider />
                    <MenuItem key="copy-path" onClick={handleCopyPath}>
                        {t("copy-setting-path", "Copy path ID")}
                    </MenuItem>
                    <MenuItem key="copy-setting" onClick={handleCopySetting}>
                        {t("copy-setting", "Copy setting")}
                    </MenuItem>
                </Menu>
            </div>
            <StyledSettingInputControlInternal className="SettingInputControl-internal">
                <StyledSettingInputControlLabel variant="label" className="SettingInputControl-label">
                    {setting.category && (
                        <span key="group" className="group">
                            {setting.category}:
                        </span>
                    )}
                    {<span key="title" className="title">{setting.label}</span>}
                    {setting.required && (<span className="required" style={{ color: theme.palette.error.main }}>*</span>)}
                    <span key="flags" className="flags">
                        {setting.advanced && (<em className="flag advanced">{t('advanced', "Advanced")}</em>)}
                        {setting.experimental && (<em className="flag experimental">{t('experimental', "Experimental")}</em>)}
                        {setting.administrated && (<em className="flag administrated">{t('administrated', "Administrated")}</em>)}
                    </span>
                    <span key="spacer" style={{ flexGrow: 1 }} />
                    {setting.tags && setting.tags.length > 0 && (
                        <span key="tags" className="tags">
                            {setting.tags.map((tag, index) => (
                                <span key={index} className="tag">
                                    {tag}
                                </span>
                            ))}
                        </span>
                    )}
                </StyledSettingInputControlLabel>
                {setting.description && (description ?? true) && (
                    <SettingInputControlDescription description={setting.description} />
                )}
                <Stack direction="row" ref={popperVisibilityRef}>
                    <StyledSettingInputControlInput className="SettingInputControl-input">
                        <div ref={anchorElRef}>
                            {children}
                        </div>
                        {policyContent && (
                            <div key="policy" className="policy">
                                <FormattedText text={policyContent} />
                            </div>
                        )}
                    </StyledSettingInputControlInput>
                    <Popper
                        disablePortal={true}
                        open={!!validity && isPopperVisible}
                        anchorEl={anchorElRef.current || undefined}
                        placement="bottom-start"
                        sx={{
                            width: anchorElRef.current ? `${anchorElRef.current.offsetWidth}px` : undefined,
                            minWidth: 200,
                        }}
                    >
                        <StyledSettingInputControlValidity
                            className="SettingInputControl-validity"
                            severity="error"
                        >
                            {!!validity && <FormattedText text={validity} />}
                        </StyledSettingInputControlValidity>
                    </Popper>
                </Stack>
                {effectContent && (
                    <StyledSettingInputControlEffect variant="description" className="SettingInputControl-effect">
                        {effectContent}
                    </StyledSettingInputControlEffect>
                )}
            </StyledSettingInputControlInternal>
        </StyledSettingInputControlRoot>
    );
};

export default SettingInputControl;
