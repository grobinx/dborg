import React from 'react';
import { alpha, darken, lighten, styled } from '@mui/material';
import { BaseButtonProps } from './BaseButtonProps';
import clsx from '../../utils/clsx';
import { FormattedText } from '../useful/FormattedText';
import { borderRadius, rootSizeProperties } from '@renderer/themes/layouts/default/consts';
import { themeColors } from '@renderer/types/colors';
import { dark, light } from '@mui/material/styles/createPalette';

const StyledBaseButton = styled('button', {
    name: "BaseButton",
    slot: "root",
})(({ theme }) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    outline: "none",
    border: "none",
    cursor: "pointer",
    userSelect: "none",
    textDecoration: "none",
    fontFamily: "inherit",
    fontSize: "inherit",
    fontWeight: 600,
    lineHeight: 1,
    transition: "all 0.2s ease-in-out",
    borderRadius: borderRadius,
    ...rootSizeProperties.medium,

    // Podstawowe style
    backgroundColor: "transparent",
    color: "inherit",

    // Usuwa domyślne style przeglądarki
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",

    // Zapobiega zawijaniu tekstu
    whiteSpace: "nowrap",

    "&.focused": {
        borderColor: "transparent",
        outline: "2px solid #468",
        outlineOffset: "-2px",
    },

    // Disabled styles
    "&.disabled": {
        cursor: "not-allowed",
        opacity: 0.6,
        pointerEvents: "none",
    },

    // Loading styles
    "&.loading": {
        cursor: "wait",
        pointerEvents: "none",
    },

    // Selected styles
    "&.selected": {
        // Dodaj style dla stanu wybranego
    },

    // Size variants
    "&.size-small": {
        ...rootSizeProperties.small
    },

    "&.size-medium": {
        ...rootSizeProperties.medium
    },

    "&.size-large": {
        ...rootSizeProperties.large
    },

    ...themeColors.reduce((acc, color) => {
        acc[`&.color-${color}`] = {
            backgroundColor: alpha(theme.palette[color].main, 0.1),
            color: theme.palette.text.primary,
            outline: `1px solid ${theme.palette[color].main}`,
            outlineOffset: "-1px",

            "&.hover:not(.disabled):not(.loading)": {
                backgroundColor: alpha(theme.palette[color].main, 0.2),
                '&.focused, &.selected': {
                    backgroundColor: alpha(theme.palette[color].main, 0.3),
                },
            },

            "&.active:not(.disabled):not(.loading)": {
                backgroundColor: alpha(theme.palette[color].main, 0.3),
            },

            "&.focused, &.selected": {
                outlineOffset: "-2px",
                outline: `2px solid ${theme.palette[color].main}`,
                backgroundColor: alpha(theme.palette[color].main, 0.4),
            },
        };
        return acc;
    }, {}),
}));

const StyledBaseButtonLoadingIndicator = styled('div', {
    name: "Button",
    slot: "loadingIndicator",
})(() => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "1em",
    height: "1em",
    border: "2px solid transparent",
    borderTop: "2px solid currentColor",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",

    "@keyframes spin": {
        "0%": { transform: "translate(-50%, -50%) rotate(0deg)" },
        "100%": { transform: "translate(-50%, -50%) rotate(360deg)" },
    },
}));

const StyledBaseButtonContent = styled('span', {
    name: "Button",
    slot: "content",
})(({ }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    transition: "opacity 0.2s ease-in-out",
    padding: "0 8px",
    '&.loading': {
        opacity: 0,
    }
}));

const StyledBaseButtonLoadingContent = styled('span', {
    name: "Button",
    slot: "loadingContent",
})(({ }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    transition: "opacity 0.2s ease-in-out",
}));

export const BaseButton: React.FC<BaseButtonProps> = (props) => {
    const {
        id,
        component = 'button',
        children,
        className,
        disabled = false,
        loading = false,
        selected = false,
        size = "medium",
        color = "primary",
        type = "button",
        onClick,
        onFocus,
        onBlur,
        tabIndex,
        ref,
        ...other
    } = props;

    const [focused, setFocused] = React.useState(false);
    const [active, setActive] = React.useState(false);
    const [hover, setHover] = React.useState(false);

    const classes = clsx(
        `size-${size}`,
        `color-${color}`,
        `type-${type}`,
        disabled && "disabled",
        loading && "loading",
        selected && "selected",
        focused && "focused",
        active && "active",
        hover && "hover",
    );

    const handleClick = () => {
        if (!disabled && !loading && onClick) {
            onClick();
        }
    };

    return (
        <StyledBaseButton
            //as={component}
            id={id}
            ref={ref}
            className={clsx(
                "BaseButton-root",
                classes,
                className,
            )}
            disabled={disabled || !!loading}
            type={type}
            onClick={handleClick}
            onFocus={(_e) => {
                setFocused(true);
                onFocus?.();
            }}
            onBlur={(_e) => {
                setFocused(false);
                onBlur?.();
            }}
            onMouseDown={() => setActive(true)}
            onMouseUp={() => setActive(false)}
            onMouseLeave={() => {
                setActive(false);
                setHover(false);
            }}
            onMouseEnter={() => setHover(true)}
            role="button"
            tabIndex={disabled ? -1 : (tabIndex ?? 0)}
            aria-disabled={disabled || !!loading}
            {...other}
        >
            {loading === true && (
                <StyledBaseButtonLoadingIndicator
                    className={clsx(
                        "Button-loadingIndicator",
                        classes,
                    )}
                />
            )}
            {loading && typeof loading !== 'boolean' && (
                <StyledBaseButtonLoadingContent
                    className={clsx(
                        "Button-loadingContent",
                        classes,
                    )}
                >
                    <FormattedText text={loading} />
                </StyledBaseButtonLoadingContent>
            )}
            <StyledBaseButtonContent
                className={clsx(
                    "Button-content",
                    classes,
                )}
            >
                {children}
            </StyledBaseButtonContent>
        </StyledBaseButton>
    );
};

BaseButton.displayName = 'BaseButton';

