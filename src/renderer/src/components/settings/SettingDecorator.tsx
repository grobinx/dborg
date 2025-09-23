import { Alert, Divider, Menu, MenuItem, Popper, styled, SxProps, Tooltip, useTheme } from "@mui/material";
import React from "react";
import { FormattedContent, FormattedContentItem, FormattedText } from "@renderer/components/useful/FormattedText";
import { SettingTypeUnion } from "@renderer/components/settings/SettingsTypes";
import { ToolButton } from "@renderer/components/buttons/ToolButton";
import { useTranslation } from "react-i18next";
import { getSetting, getSettingDefault } from "@renderer/contexts/SettingsContext";
import { calculateWidth, disabledControl } from "@renderer/components/settings/SettingInputControl";
import { BaseInputProps } from "../inputs/base/BaseInputProps";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { InputDecoratorContext, InputDecoratorContextType } from "../inputs/decorators/InputDecoratorContext";
import clsx from "@renderer/utils/clsx";
import { themeColors } from "@renderer/types/colors";
import { Height } from "@mui/icons-material";

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
    restrictions?: React.ReactNode;
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
    display: "flex",
    flexDirection: "row",
    width: "100%",
    margin: props.theme.spacing(1),
    gap: 4,
    padding: 8,
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
})(() => ({
    display: "flex",
    minWidth: 4,
    cursor: "pointer",
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
}));

const StyledSettingDecoratorLabelText = styled('span', {
    name: "SettingDecorator",
    slot: "labelText",
})(({ theme }) => ({
    flexGrow: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    ...themeColors.reduce((acc, color) => {
        acc[`&.color-${color}`] = {
            color: theme.palette[color].main,
        };
        return acc;
    }, {}),
}));

const StyledSettingDecoratorCategory = styled('span', {
    name: "SettingDecorator",
    slot: "category",
})(() => ({
    fontWeight: 600,
    marginRight: 4,
}));

const StyledSettingDecoratorRequired = styled('span', {
    name: "SettingDecorator",
    slot: "required",
})(({ theme }) => ({
    color: theme.palette.error.main,
    marginLeft: 2,
}));

const StyledSettingDecoratorFlags = styled('span', {
    name: "SettingDecorator",
    slot: "flags",
})(({ theme }) => ({
    display: "flex",
    gap: theme.spacing(0.5),
    marginLeft: theme.spacing(1),
    '& .flag': {
        fontSize: '0.875em',
        fontStyle: 'italic',
        opacity: 0.7,
    },
}));

const StyledSettingDecoratorTags = styled('span', {
    name: "SettingDecorator",
    slot: "tags",
})(({ theme }) => ({
    display: "flex",
    gap: 4,
    '& .tag': {
        fontSize: '0.75em',
        paddingLeft: 4,
        paddingRight: 4,
        Height: '100%',
        backgroundColor: theme.palette.action.hover,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
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
}));

const StyledSettingDecoratorRestrictions = styled('div', {
    name: "SettingDecorator",
    slot: "restrictions",
})(({ theme }) => ({
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
}));

const StyledSettingDecoratorEffect = styled('div', {
    name: "SettingDecorator",
    slot: "effect",
})(({ theme }) => ({
    ...theme.typography.description,
    color: theme.palette.info.main,
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
    } = props;

    const theme = useTheme();
    const { t } = useTranslation();
    const [inputRestrictions, setInputRestrictions] = React.useState<React.ReactNode>(null);
    const [invalid, setInvalid] = React.useState<FormattedContent>(undefined);
    const [visibleInputRef, isPopperVisible] = useVisibleState<HTMLDivElement>();
    const [focused, setFocused] = React.useState<boolean>(false);
    const [hover, setHover] = React.useState<boolean>(false);
    const [type, setType] = React.useState<string>(setting.type);
    const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
    const [effectContent, setEffectContent] = React.useState<React.ReactNode>(undefined);

    const isMenuOpen = Boolean(menuAnchorEl);
    const [previousValue] = React.useState<any>(value);
    const defaultValue = getSettingDefault(setting.storageGroup, setting.key, setting.defaultValue);

    const contextValue = React.useMemo<InputDecoratorContextType>(() => ({
        setRestrictions: (restrictions) => {
            setInputRestrictions(restrictions);
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
                color: children.props.color ?? "primary",
            };
        }
        return {
            required: setting.required ?? false,
            disabled: disabledControl(setting),
            size: "medium",
            color: "primary",
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
        navigator.clipboard.writeText(`${setting.storageGroup}/${setting.key}`);
        handleMenuClose();
    }, [setting]);

    const handleCopySetting = React.useCallback(() => {
        navigator.clipboard.writeText(JSON.stringify({ [setting.key]: value }, null, 2));
        handleMenuClose();
    }, [setting, value]);

    // Effect content
    React.useEffect(() => {
        const effect = setting.effect?.();
        if (effect) {
            setEffectContent(<FormattedText text={effect} />);
        } else {
            setEffectContent(undefined);
        }
    }, [value, setting]);

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
                            {setting.label}
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
                                    <em className="flag advanced">{t('advanced', "Advanced")}</em>
                                )}
                                {setting.experimental && (
                                    <em className="flag experimental">{t('experimental', "Experimental")}</em>
                                )}
                                {setting.administrated && (
                                    <em className="flag administrated">{t('administrated', "Administrated")}</em>
                                )}
                            </StyledSettingDecoratorFlags>
                        )}

                        <span style={{ flexGrow: 1 }} />

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
                        style={{
                            width: calculateWidth(setting),
                        }}
                    >
                        {clonedChildren}

                        {restrictions && inputRestrictions && (
                            <StyledSettingDecoratorRestrictions className="SettingDecorator-restrictions">
                                {restrictions}
                                {inputRestrictions}
                            </StyledSettingDecoratorRestrictions>
                        )}
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