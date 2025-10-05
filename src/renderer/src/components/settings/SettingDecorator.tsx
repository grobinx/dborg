import { Alert, alpha, darken, Divider, lighten, Menu, MenuItem, Popper, styled, SxProps, Tooltip, useTheme } from "@mui/material";
import React from "react";
import { FormattedContent, FormattedContentItem, FormattedText } from "@renderer/components/useful/FormattedText";
import { SettingTypeUnion } from "@renderer/components/settings/SettingsTypes";
import { ToolButton } from "@renderer/components/buttons/ToolButton";
import { useTranslation } from "react-i18next";
import { getSetting, getSettingDefault, useSetting } from "@renderer/contexts/SettingsContext";
import { calculateWidth, disabledControl } from "@renderer/components/settings/SettingInputControl";
import { BaseInputProps } from "../inputs/base/BaseInputProps";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { InputDecoratorContext, InputDecoratorContextType } from "../inputs/decorators/InputDecoratorContext";
import clsx from "@renderer/utils/clsx";
import { themeColors } from "@renderer/types/colors";
import { borderRadius } from "@renderer/themes/layouts/default/consts";

export interface SettingDecoratorProps {
    children?: React.ReactElement<BaseInputProps>;
    id?: string;
    className?: string;
    /**
     * Czy element jest zaznaczony
     * Zostanie ustawiona odpowiednia klasa CSS "selected"
     * @default false
     */
    selected?: boolean;
    /**
     * Czy widoczny ma być opis ograniczeń, jak np. "Wymagane", "Maksymalnie 100 znaków"
     * Można zdefiniować funkcję, która zwróci informację o ograniczeniach
     * @default true
     */
    restrictions?: FormattedContentItem[];
    /**
     * Funkcja wywoływana po kliknięciu w dowolną część pola
     */
    onClick?: () => void;
    /** 
     * Czy pokazywać komunikat o błędzie pod polem, jeśli występuje błąd walidacji
     * @default true
     */
    showValidity?: boolean;
    /**
     * Definicja ustawienia z metadanymi
     */
    setting: SettingTypeUnion;
    /**
     * Wartość ustawienia
     */
    value?: any;
    /**
     * Funkcja do ustawiania wartości
     */
    setValue?: (value: any) => void;
    /**
     * Czy pokazywać opis ustawienia
     * @default true
     */
    showDescription?: boolean;
    /**
     * Czy pokazywać menu kontekstowe
     * @default true
     */
    showMenu?: boolean;
    sx?: SxProps;
}

const StyledSettingDecorator = styled('div', {
    name: "SettingDecorator",
    slot: "root",
})<{}>((props) => ({
    transition: "all 0.2s ease-in-out",
    display: "flex",
    flexDirection: "row",
    width: "100%",
    margin: props.theme.spacing(1),
    gap: 8,
    padding: 8,
    ...themeColors.reduce((acc, color) => {
        acc[`&.color-${color}`] = {
            backgroundColor: alpha(props.theme.palette[color].main, 0.03),
        };
        return acc;
    }, {}),
    '&.hover': {
        backgroundColor: props.theme.palette.action.hover,
    },
    '&.focused': {
        backgroundColor: props.theme.palette.action.focus,
    },
    '&.selected': {
        backgroundColor: props.theme.palette.action.selected,
    },
    '&.disabled': {
        opacity: 0.5,
        pointerEvents: "none",
    },
}));

const StyledSettingDecoratorIndicator = styled('div', {
    name: "SettingDecorator",
    slot: "indicator",
})(({ theme }) => ({
    display: "flex",
    minWidth: 4,
    borderRadius: borderRadius,
    '&.changed': {
        backgroundColor: alpha(theme.palette.warning.main, 0.3),
    },
    '&.default': {
        backgroundColor: alpha(theme.palette.primary.main, 0.3),
    },
}));

const StyledSettingDecoratorMenu = styled('div', {
    name: "SettingDecorator",
    slot: "menu",
})(() => ({
    display: "flex",
    alignItems: "flex-start",
    order: 2,
    visibility: "hidden",
    '.hover &, .focused &': {
        visibility: "visible",
    },
}));

const StyledSettingDecoratorContainer = styled('div', {
    name: "SettingDecorator",
    slot: "container",
})(() => ({
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    minWidth: 0,
    width: "100%",
    gap: 4,
}));

const StyledSettingDecoratorLabel = styled('div', {
    name: "SettingDecorator",
    slot: "label",
})(({ theme }) => ({
    ...theme.typography.label,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    minWidth: 0,
    width: "100%",
    paddingBottom: 4,
    gap: 4,
}));

const StyledSettingDecoratorGrow = styled('div', {
    name: "SettingDecorator",
    slot: "grow",
})(({ }) => ({
    display: "flex",
    flexGrow: 1,
}));

const StyledSettingDecoratorLabelText = styled('span', {
    name: "SettingDecorator",
    slot: "labelText",
})(({ theme }) => ({
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    ...themeColors.reduce((acc, color) => {
        acc[`&.color-${color}`] = {
            color: theme.palette.mode === 'dark' ? lighten(theme.palette[color].main, 0.8) : darken(theme.palette[color].main, 0.5),
        };
        return acc;
    }, {}),
}));

const StyledSettingDecoratorCategory = styled('span', {
    name: "SettingDecorator",
    slot: "category",
})(({ theme }) => ({
    fontWeight: 600,
    ...themeColors.reduce((acc, color) => {
        acc[`&.color-${color}`] = {
            color: theme.palette[color].main,
        };
        return acc;
    }, {}),
}));

const StyledSettingDecoratorRequired = styled('span', {
    name: "SettingDecorator",
    slot: "required",
})(({ theme }) => ({
    color: theme.palette.error.main,
}));

const StyledSettingDecoratorFlags = styled('span', {
    name: "SettingDecorator",
    slot: "flags",
})(({ theme }) => ({
    display: "flex",
    marginLeft: 8,
    '& :not(:last-child)::after': {
        content: '"·"',
        margin: '0 4px',
        color: theme.palette.text.secondary,
    },
}));

const StyledSettingDecoratorFlag = styled('em', {
    name: "SettingDecorator",
    slot: "flag",
})(({ }) => ({
    fontSize: '0.875em',
    opacity: 0.8,
}));

const StyledSettingDecoratorTags = styled('span', {
    name: "SettingDecorator",
    slot: "tags",
})(({ theme }) => ({
    display: "flex",
    gap: 4,
    height: '100%',
    '& .tag': {
        fontSize: '0.75em',
        fontWeight: 500,
        paddingLeft: 8,
        paddingRight: 8,
        height: '100%',
        backgroundColor: theme.palette.action.hover,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
        alignContent: "center",
        textTransform: "uppercase",
    },
}));

const StyledSettingDecoratorDescription = styled('div', {
    name: "SettingDecorator",
    slot: "description",
})(({ theme }) => ({
    ...theme.typography.description,
    display: "flex",
    flexDirection: "row",
    flexGrow: 1,
    minWidth: 0,
    width: "100%",
}));

const StyledSettingDecoratorInput = styled('div', {
    name: "SettingDecorator",
    slot: "input",
})(() => ({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    minWidth: 0,
    width: "100%",
    gap: 8,
}));

const StyledSettingDecoratorRestrictions = styled('div', {
    name: "SettingDecorator",
    slot: "restrictions",
})(({  }) => ({
    display: "flex",
    flexDirection: "row",
    alignItems: "end",
    height: "100%",
    gap: 4,
    flexWrap: "wrap",
}));

const StyledSettingDecoratorRestriction = styled('span', {
    name: "SettingDecorator",
    slot: "restriction",
})(({ theme }) => ({
    fontSize: '0.65em',
    color: theme.palette.text.secondary,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    paddingLeft: 4,
    paddingRight: 4,
}));

const StyledSettingDecoratorEffect = styled('div', {
    name: "SettingDecorator",
    slot: "effect",
})(({ theme }) => ({
    ...theme.typography.description,
}));

const StyledSettingDecoratorValidity = styled(Popper, {
    name: "SettingDecorator",
    slot: "validity",
})(() => ({}));

export const SettingDecorator = (props: SettingDecoratorProps): React.ReactElement => {
    const {
        children,
        className,
        restrictions,
        onClick,
        selected = false,
        sx,
        showValidity = true,
        setting,
        value,
        setValue,
        showDescription = true,
        showMenu = true,
        ...other
    } = props;

    const theme = useTheme();
    const { t } = useTranslation();
    const [inputRestrictions, setInputRestrictions] = React.useState<FormattedContentItem[]>([]);
    const [invalid, setInvalid] = React.useState<FormattedContent>(undefined);
    const [visibleInputRef, isPopperVisible] = useVisibleState<HTMLDivElement>();
    const [focused, setFocused] = React.useState<boolean>(false);
    const [hover, setHover] = React.useState<boolean>(false);
    const [type, setType] = React.useState<string>(setting.type);
    const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
    const [effectContent, setEffectContent] = React.useState<React.ReactNode>(undefined);

    const isMenuOpen = Boolean(menuAnchorEl);
    const [previousValue] = React.useState<any>(value);
    const defaultValue = getSettingDefault(setting.storageGroup, setting.storageKey, setting.defaultValue);
    const [settingValue] = useSetting(setting.storageGroup, setting.storageKey, setting.defaultValue);

    const contextValue = React.useMemo<InputDecoratorContextType>(() => ({
        setRestrictions: (restrictions) => {
            setInputRestrictions(restrictions ?? []);
        },
        invalid: invalid,
        setInvalid: (invalid) => {
            if (typeof invalid === 'boolean') {
                setInvalid(invalid ? "Nieprawidłowa wartość" : undefined);
            } else {
                setInvalid(invalid);
            }
        },
        focused: focused,
        setFocused: (focused) => {
            setFocused(focused);
        },
        type: type,
        setType: (type) => {
            setType(type);
        },
    }), [invalid, focused, type]);

    // Pobieranie właściwości bez klonowania
    const { required, disabled, size, color } = React.useMemo(() => {
        if (React.isValidElement(children)) {
            return {
                required: children.props.required ?? setting.required ?? false,
                disabled: children.props.disabled ?? disabledControl(setting),
                size: children.props.size ?? "medium",
                color: children.props.color ?? "main",
            };
        }
        return {
            required: setting.required ?? false,
            disabled: disabledControl(setting),
            size: "medium",
            color: "main",
        };
    }, [children, setting]);

    // Obsługa menu
    const handleMenuOpen = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
    }, []);

    const handleMenuClose = React.useCallback(() => {
        setMenuAnchorEl(null);
    }, []);

    const handleResetSetting = React.useCallback(() => {
        setValue?.(previousValue);
        handleMenuClose();
    }, [setValue, previousValue]);

    const handleRestoreDefaults = React.useCallback(() => {
        setValue?.(defaultValue);
        handleMenuClose();
    }, [setValue, defaultValue]);

    const handleCopyPath = React.useCallback(() => {
        navigator.clipboard.writeText(`${setting.storageGroup}/${setting.storageKey}`);
        handleMenuClose();
    }, [setting]);

    const handleCopySetting = React.useCallback(() => {
        navigator.clipboard.writeText(JSON.stringify({ [setting.storageKey]: value }, null, 2));
        handleMenuClose();
    }, [setting, value]);

    // Effect content
    React.useEffect(() => {
        const effect = setting.effect?.(settingValue);
        if (effect) {
            setEffectContent(<FormattedText text={effect} />);
        } else {
            setEffectContent(undefined);
        }
    }, [settingValue]);

    const classes = clsx(
        `size-${size}`,
        disabled && "disabled",
        required && "required",
        invalid && "invalid",
        selected && "selected",
        focused && "focused",
        hover && "hover",
        `type-${type}`,
        `color-${color}`,
        `${setting.type}-setting`,
    );

    const changed = JSON.stringify(previousValue) !== JSON.stringify(value);
    const isDefaultValue = JSON.stringify(defaultValue) === JSON.stringify(value);

    const clonedChildren = React.useMemo(() => {
        if (!React.isValidElement(children)) {
            return children;
        }
        return children;
    }, [children]);

    const handleMouseEnter = React.useCallback(() => setHover(true), []);
    const handleMouseLeave = React.useCallback(() => setHover(false), []);
    const handleClick = React.useCallback(() => onClick?.(), [onClick]);

    return (
        <InputDecoratorContext.Provider value={contextValue}>
            <StyledSettingDecorator
                className={clsx(
                    "SettingDecorator-root",
                    classes,
                    className,
                )}
                onMouseDown={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                sx={sx}
                data-focus-container={true}
                {...other}
            >
                <StyledSettingDecoratorIndicator
                    className={clsx(
                        "SettingDecorator-indicator",
                        changed && "changed",
                        isDefaultValue && "default",
                        classes,
                    )}
                />

                {showMenu && (
                    <StyledSettingDecoratorMenu
                        className={clsx(
                            "SettingDecorator-menu",
                            isMenuOpen && "open",
                            classes,
                        )}
                    >
                        <ToolButton
                            onClick={handleMenuOpen}
                            dense
                            data-no-auto-focus={true}
                            aria-label={t("open-setting-menu", "Open setting menu")}
                        >
                            <theme.icons.MoreVert />
                        </ToolButton>
                        <Menu
                            anchorEl={menuAnchorEl}
                            open={isMenuOpen}
                            onClose={handleMenuClose}
                        >
                            <MenuItem
                                onClick={handleResetSetting}
                                disabled={disabled}
                            >
                                {t("reset-setting", "Reset setting")}
                            </MenuItem>
                            <MenuItem
                                onClick={handleRestoreDefaults}
                                disabled={defaultValue === undefined || disabled}
                            >
                                {t("restore-setting-defaults", "Restore defaults")}
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handleCopyPath}>
                                {t("copy-setting-path", "Copy path ID")}
                            </MenuItem>
                            <MenuItem onClick={handleCopySetting}>
                                {t("copy-setting", "Copy setting")}
                            </MenuItem>
                        </Menu>
                    </StyledSettingDecoratorMenu>
                )}

                <StyledSettingDecoratorContainer
                    className={clsx(
                        "SettingDecorator-container",
                        classes,
                    )}
                >
                    <StyledSettingDecoratorLabel
                        className={clsx(
                            "SettingDecorator-label",
                            classes,
                        )}
                    >
                        {setting.category && (
                            <StyledSettingDecoratorCategory
                                className={clsx("SettingDecorator-category", classes)}>
                                {setting.category}:
                            </StyledSettingDecoratorCategory>
                        )}

                        <StyledSettingDecoratorLabelText
                            className={clsx("SettingDecorator-labelText", classes)}
                        >
                            <FormattedText text={setting.label} />
                        </StyledSettingDecoratorLabelText>

                        {required && (
                            <StyledSettingDecoratorRequired
                                className={clsx("SettingDecorator-required", classes)}
                            >
                                *
                            </StyledSettingDecoratorRequired>
                        )}

                        {(setting.advanced || setting.experimental || setting.administrated) && (
                            <StyledSettingDecoratorFlags
                                className={clsx("SettingDecorator-flags", classes)}
                            >
                                {setting.advanced && (
                                    <StyledSettingDecoratorFlag
                                        className={clsx("SettingDecorator-flag", "advanced", classes)}
                                    >
                                        {t('advanced', "Advanced")}
                                    </StyledSettingDecoratorFlag>
                                )}
                                {setting.experimental && (
                                    <StyledSettingDecoratorFlag
                                        className={clsx("SettingDecorator-flag", "experimental", classes)}
                                    >
                                        {t('experimental', "Experimental")}
                                    </StyledSettingDecoratorFlag>
                                )}
                                {setting.administrated && (
                                    <StyledSettingDecoratorFlag
                                        className={clsx("SettingDecorator-flag", "administrated", classes)}
                                    >
                                        {t('administrated', "Administrated")}
                                    </StyledSettingDecoratorFlag>
                                )}
                            </StyledSettingDecoratorFlags>
                        )}

                        <StyledSettingDecoratorGrow />

                        {setting.tags && setting.tags.length > 0 && (
                            <StyledSettingDecoratorTags
                                className={clsx("SettingDecorator-tags", classes)}
                            >
                                {setting.tags.map((tag, index) => (
                                    <span key={index} className="tag">
                                        {tag}
                                    </span>
                                ))}
                            </StyledSettingDecoratorTags>
                        )}
                    </StyledSettingDecoratorLabel>

                    {setting.description && showDescription && (
                        <StyledSettingDecoratorDescription
                            className={clsx(
                                "SettingDecorator-description",
                                classes,
                            )}
                        >
                            <FormattedText text={setting.description} />
                        </StyledSettingDecoratorDescription>
                    )}

                    <StyledSettingDecoratorInput
                        className={clsx(
                            "SettingDecorator-input",
                            classes,
                        )}
                        ref={visibleInputRef}
                    >
                        {clonedChildren}

                        {((restrictions ?? []).length > 0 || inputRestrictions.length > 0) && (
                            <StyledSettingDecoratorRestrictions
                                className={clsx("SettingDecorator-restrictions", classes)}
                            >
                                {[...(restrictions ?? []), ...inputRestrictions].map((item, index) => (
                                    <StyledSettingDecoratorRestriction
                                        key={index}
                                        className={clsx("SettingDecorator-restriction", classes)}
                                    >
                                        <FormattedText text={item} />
                                    </StyledSettingDecoratorRestriction>
                                ))}
                            </StyledSettingDecoratorRestrictions>
                        )}

                        <StyledSettingDecoratorGrow />
                    </StyledSettingDecoratorInput>

                    {effectContent && (
                        <StyledSettingDecoratorEffect
                            className={clsx(
                                "SettingDecorator-effect",
                                classes,
                            )}
                        >
                            {effectContent}
                        </StyledSettingDecoratorEffect>
                    )}

                    {showValidity && (
                        <StyledSettingDecoratorValidity
                            disablePortal={true}
                            open={!!invalid && isPopperVisible}
                            anchorEl={visibleInputRef.current || undefined}
                            placement="bottom-start"
                            sx={{
                                width: visibleInputRef.current ? `${visibleInputRef.current.offsetWidth}px` : undefined,
                                minWidth: 200,
                            }}
                            className={clsx(
                                "SettingDecorator-validity",
                                classes,
                            )}
                        >
                            <Alert severity="error">
                                {!!invalid && <FormattedText text={invalid} />}
                            </Alert>
                        </StyledSettingDecoratorValidity>
                    )}
                </StyledSettingDecoratorContainer>
            </StyledSettingDecorator>
        </InputDecoratorContext.Provider>
    );
};

SettingDecorator.displayName = "SettingDecorator";