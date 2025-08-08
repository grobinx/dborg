import React from 'react';
import { styled } from '@mui/material';
import { BaseButtonProps } from './BaseButtonProps';
import clsx from '../../utils/clsx';

const StyledBaseButton = styled('button', {
    name: "Button",
    slot: "root",
})<{}>(({ theme }) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    border: "none",
    outline: "none",
    cursor: "pointer",
    userSelect: "none",
    textDecoration: "none",
    fontFamily: "inherit",
    fontSize: "inherit",
    lineHeight: 1,
    transition: "all 0.3s ease-in-out",
    
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
        padding: "4px 8px",
        fontSize: "0.875rem",
        minHeight: "28px",
    },
    
    "&.size-medium": {
        padding: "8px 16px",
        fontSize: "1rem",
        minHeight: "36px",
    },
    
    "&.size-large": {
        padding: "12px 24px",
        fontSize: "1.125rem",
        minHeight: "44px",
    },
    
    // Color variants
    "&.color-primary": {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        
        "&:hover:not(.disabled):not(.loading)": {
            backgroundColor: theme.palette.primary.dark,
        },

        "&:active:not(.disabled):not(.loading)": {
            backgroundColor: theme.palette.primary.light,
        },
    },
    
    "&.color-secondary": {
        backgroundColor: theme.palette.secondary.main,
        color: theme.palette.secondary.contrastText,

        "&:hover:not(.disabled):not(.loading)": {
            backgroundColor: theme.palette.secondary.dark,
        },
    },
    
    "&.color-success": {
        backgroundColor: theme.palette.success.main,
        color: theme.palette.success.contrastText,

        "&:hover:not(.disabled):not(.loading)": {
            backgroundColor: theme.palette.success.dark,
        },
    },
    
    "&.color-error": {
        backgroundColor: theme.palette.error.main,
        color: theme.palette.error.contrastText,

        "&:hover:not(.disabled):not(.loading)": {
            backgroundColor: theme.palette.error.dark,
        },
    },
    
    "&.color-warning": {
        backgroundColor: theme.palette.warning.main,
        color: theme.palette.warning.contrastText,

        "&:hover:not(.disabled):not(.loading)": {
            backgroundColor: theme.palette.warning.dark,
        },
    },
    
    "&.color-info": {
        backgroundColor: theme.palette.info.main,
        color: theme.palette.info.contrastText,

        "&:hover:not(.disabled):not(.loading)": {
            backgroundColor: theme.palette.info.dark,
        },
    },
}));

const StyledLoadingIndicator = styled('div', {
    name: "Button",
    slot: "loadingIndicator",
})(() => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "16px",
    height: "16px",
    border: "2px solid transparent",
    borderTop: "2px solid currentColor",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    
    "@keyframes spin": {
        "0%": { transform: "translate(-50%, -50%) rotate(0deg)" },
        "100%": { transform: "translate(-50%, -50%) rotate(360deg)" },
    },
}));

const StyledButtonContent = styled('span', {
    name: "Button",
    slot: "content",
})<{ loading?: boolean }>(({ loading }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    opacity: loading ? 0 : 1,
    transition: "opacity 0.2s ease-in-out",
}));

export const BaseButton = React.memo<BaseButtonProps>((props) => {
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
                "Button-root",
                classes,
                className,
            )}
            disabled={disabled || loading}
            type={type}
            onClick={handleClick}
            onFocus={(e) => {
                setFocused(true);
                onFocus?.();
            }}
            onBlur={(e) => {
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
            aria-disabled={disabled || loading}
            {...other}
        >
            {loading && (
                <StyledLoadingIndicator
                    className={clsx(
                        "Button-loadingIndicator",
                        classes,
                    )}
                />
            )}
            <StyledButtonContent
                className={clsx(
                    "Button-content",
                    classes,
                )}
                loading={loading}
            >
                {children}
            </StyledButtonContent>
        </StyledBaseButton>
    );
});

BaseButton.displayName = 'BaseButton';

