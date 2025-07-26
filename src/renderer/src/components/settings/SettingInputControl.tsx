import { Alert, Box, Divider, FormControl, IconButton, Menu, MenuItem, Popover, Popper, Stack, styled, Tooltip, Typography, useTheme, useThemeProps } from "@mui/material";
import { SettingTypeBase, SettingTypeUnion } from "./SettingsTypes";
import { markdown } from "@renderer/components/useful/MarkdownTransform";
import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from "react";
import { BaseInputProps } from "./base/BaseInput";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import ToolButton from "../ToolButton";
import clsx from "@renderer/utils/clsx";

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
    const defaultTextWidth = 300; // Default width
    const defaultNumberWidth = 200;
    const maxWidth = 500; // Maximum width
    const minWidth = 150; // Minimum width
    const widthPerChar = 11; // Approximate width per character in pixels

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
        case "color":
            return defaultTextWidth;
    }
    return defaultTextWidth;
};

export const disabledControl = (
    setting: SettingTypeBase,
    values: Record<string, any> = {}
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
        if (setting.disabled(values)) {
            return true; // Wyłączone, jeśli disabled zwraca true
        }
    } else if (setting.disabled === true) {
        return true; // Wyłączone, jeśli disabled jest true
    }

    // Jeśli żaden warunek nie został spełniony, kontrolka nie jest wyłączona
    return false;
};

export interface SettingInputControlProps extends React.ComponentProps<typeof StyledSettingInputControlRoot> {
    slotProps?: {
        label?: React.ComponentProps<typeof StyledSettingInputControlLabel>;
        description?: React.ComponentProps<typeof StyledSettingInputControlDescription>;
        validity?: React.ComponentProps<typeof StyledSettingInputControlValidity>;
        effect?: React.ComponentProps<typeof StyledSettingInputControlEffect>;
        input?: React.ComponentProps<typeof StyledSettingInputControlInput>;
    }
}

export interface InputControlContext {
    value: any;
    valid: boolean;
    setValue: (value: any) => void;
}

interface SettingInputControlOwnProps extends SettingInputControlProps {
    path: string[];
    setting: SettingTypeBase;
    values: Record<string, any>;
    onChange: (value: any, valid?: boolean) => void;
    onClick?: () => void;
    validate?: (value: any) => string | boolean;
    selected?: boolean;
    description?: boolean;
    children?: React.ReactElement<BaseInputProps>;
    contextRef?: React.Ref<InputControlContext>;
    policy?: (() => React.ReactNode) | React.ReactNode;
}

const SettingInputControl: React.FC<SettingInputControlOwnProps> = (props) => {
    const {
        children, className, path, setting, values,
        onChange, onClick, validate, slotProps,
        selected, description, contextRef, policy, ...other
    } = useThemeProps({ name: 'SettingInputControl', props });
    const { t } = useTranslation();
    const theme = useTheme();
    const fullPath = [...path, setting.key].join('-');
    const [previousValue] = useState<any>(values[setting.key]);
    const [value, setValue] = useState(values[setting.key] ?? setting.defaultValue);
    const [validity, setValidity] = useState<string | undefined>(undefined);
    const [valid, setValid] = useState<boolean>(true);
    const anchorElRef = React.useRef<HTMLDivElement>(null);
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const isMenuOpen = Boolean(menuAnchorEl);
    const [popperVisibilityRef, isPopperVisible] = useVisibleState<HTMLDivElement>();
    const [policyContent, setPolicyContent] = useState<React.ReactNode>(undefined);

    React.useImperativeHandle(contextRef, () => ({
        value,
        valid,
        setValue: (newValue: any) => setValue(newValue),
    }));

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
    };

    const handleRestoreDefaults = () => {
        setValue(setting.defaultValue);
        handleMenuClose();
    };

    const handleResetSetting = () => {
        setValue(previousValue);
        handleMenuClose();
    };

    const handleCopyPath = () => {
        navigator.clipboard.writeText([...path, setting.key].join('.'));
        handleMenuClose();
    };

    const handleCopySetting = () => {
        navigator.clipboard.writeText(JSON.stringify({ [setting.key]: value }, null, 2));
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
                } else if (setting.type === "boolean" && typeof value !== "boolean") {
                    valid = false;
                    setValidity(t("invalid-type", "Invalid type, expected boolean"));
                } else if (setting.type === "array" && !Array.isArray(value)) {
                    valid = false;
                    setValidity(t("invalid-type", "Invalid type, expected array"));
                }
            }

            if (valid && typeof setting.validate === "function") {
                const result = setting.validate(value, values);
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

            setValid(valid);
            if (value !== values[setting.key]) {
                onChange(value, valid);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [value, setting, values, validate]);

    useEffect(() => {
        if (typeof policy === "function") {
            setPolicyContent(policy());
        } else if (typeof policy === "string") {
            setPolicyContent(policy);
        } else {
            setPolicyContent(undefined);
        }
    }, [value, policy]);

    const handleChange = (newValue: any) => {
        setValue(newValue);
    };

    const changed = JSON.stringify(previousValue) !== JSON.stringify(value);
    const isDefault = JSON.stringify(setting.defaultValue) === JSON.stringify(value);

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
                >
                    <theme.icons.MoreVert />
                </ToolButton>
                <Menu
                    anchorEl={menuAnchorEl}
                    open={isMenuOpen}
                    onClose={handleMenuClose}
                >
                    <MenuItem key="reset-setting" onClick={handleResetSetting}>
                        {t("reset-setting", "Reset setting")}
                    </MenuItem>
                    <MenuItem key="restore-defaults" onClick={handleRestoreDefaults} disabled={setting.defaultValue === undefined}>
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
                <StyledSettingInputControlLabel variant="label" className="SettingInputControl-label" {...slotProps?.label}>
                    {setting.group && (
                        <span key="group" className="group">
                            {setting.group}:
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
                    <StyledSettingInputControlDescription variant="description" className="SettingInputControl-description" {...slotProps?.description}>
                        {typeof setting.description === "string" ? markdown(setting.description, theme) : setting.description}
                    </StyledSettingInputControlDescription>
                )}
                <Stack direction="row" ref={popperVisibilityRef}>
                    <StyledSettingInputControlInput className="SettingInputControl-input" {...slotProps?.input}>
                        <div ref={anchorElRef}>
                            {children &&
                                React.isValidElement(children) &&
                                React.cloneElement(children, {
                                    id: fullPath,
                                    value: value ?? "",
                                    onChange: (e: any, value: any, ...args: any[]) => {
                                        handleChange(value);
                                        if (children.props.onChange) {
                                            children.props.onChange(e, value, ...args);
                                        }
                                    },
                                    disabled: disabledControl(setting, values),
                                    onClick: onClick,
                                })}
                        </div>
                        {policyContent && (<div key="policy" className="policy">{typeof policyContent === "string" ? markdown(policyContent, theme) : policyContent}</div>)}
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
                            {...slotProps?.validity}
                        >
                            {markdown(validity!, theme)}
                        </StyledSettingInputControlValidity>
                    </Popper>
                </Stack>
                {setting.effect && (() => {
                    const effect = setting.effect(values);
                    return (
                        <StyledSettingInputControlEffect variant="description" className="SettingInputControl-effect" {...slotProps?.effect}>
                            {typeof effect === "string" ? markdown(effect, theme) : effect}
                        </StyledSettingInputControlEffect>
                    )
                })()}
            </StyledSettingInputControlInternal>
        </StyledSettingInputControlRoot>
    );
};

export default SettingInputControl;
