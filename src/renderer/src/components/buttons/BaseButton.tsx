import React from 'react';
import { alpha, lighten, styled, SxProps, Theme } from '@mui/material';
import { ButtonProvider, useButtonContext } from './ButtonContext';
import { BaseButtonProps } from './BaseButtonProps';
import clsx from '../../utils/clsx';
import { FormattedText } from '../useful/FormattedText';
import { borderRadius, rootSizeProperties } from '@renderer/themes/layouts/default/consts';
import { themeColors } from '@renderer/types/colors';

const StyledBaseButton = styled('button', {
    name: "BaseButton",
    slot: "root",
    shouldForwardProp: (prop) => prop !== 'componentName',
})<{ componentName?: string }>(({ theme, componentName = 'BaseButton' }) => ({
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
    transition: "all 0.1s ease-in-out",
    borderRadius: borderRadius,
    ...rootSizeProperties.medium,
    backgroundColor: "transparent",
    color: "inherit",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    whiteSpace: "nowrap",

    "&.focused": {
        borderColor: "transparent",
        outline: "2px solid #468",
        outlineOffset: "-2px",
    },

    "&.disabled": {
        cursor: "not-allowed",
        opacity: 0.6,
        pointerEvents: "none",
    },

    "&.selected": {
        // Style dla stanu wybranego
    },

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
                position: "relative",
                transform: "scale(0.98)",
                overflow: "hidden",
                backgroundColor: alpha(theme.palette[color].dark, 0.3),

                // "&::before": {
                //     content: '""',
                //     position: "absolute",
                //     top: "50%",
                //     left: "50%",
                //     width: "0",
                //     height: "0",
                //     borderRadius: "50%",
                //     background: `radial-gradient(circle, 
                //         ${alpha(lighten(theme.palette[color].main, 0.4), 0.6)} 0%, 
                //         transparent 70%
                //     )`,
                //     transform: "translate(-50%, -50%)",
                //     animation: "radialBurst 0.4s ease-out",
                //     pointerEvents: "none",
                // },
            },

            "&.focused, &.selected": {
                outlineOffset: "-2px",
                outline: `2px solid ${theme.palette[color].main}`,
                backgroundColor: alpha(theme.palette[color].main, 0.4),
            },

            // Style dla różnych pressed states
            "&.has-value": {
                backgroundColor: alpha(theme.palette[color].main, 0.3),
                //boxShadow: `inset 0 0 4px 2px ${theme.palette[color].main}`,
            },
        };
        return acc;
    }, {}),

    "&.loading": {
        cursor: "wait",
        pointerEvents: "none",
        color: theme.palette.text.disabled,
        outline: `1px solid ${theme.palette.text.disabled}`,
        outlineOffset: -1,
    },

    // Animacja dla efektu naciśnięcia
    "@keyframes radialBurst": {
        "0%": {
            width: "0",
            height: "0",
            opacity: 1,
        },
        "50%": {
            width: "200%",
            height: "200%",
            opacity: 0.8,
        },
        "100%": {
            width: "300%",
            height: "300%",
            opacity: 0,
        },
    },
}));

const StyledBaseButtonLoading = styled('div', {
    name: "BaseButton",
    slot: "loading",
})(() => ({
    display: "flex",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
}));

const StyledBaseButtonLoadingIndicator = styled('div', {
    name: "BaseButton",
    slot: "loadingIndicator",
})(() => ({
    width: "1em",
    height: "1em",
    border: "2px solid transparent",
    borderTop: "2px solid currentColor",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",

    "@keyframes spin": {
        "0%": { transform: "rotate(0deg)" },
        "100%": { transform: "rotate(360deg)" },
    },
}));

const StyledBaseButtonLoadingContent = styled('span', {
    name: "BaseButton",
    slot: "loadingContent",
})(() => ({
    fontSize: "0.875em",
    opacity: 0.8,
}));

const StyledBaseButtonContent = styled('span', {
    name: "BaseButton",
    slot: "content",
})(() => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.2s ease-in-out",
    padding: "0 0.2em",
    '&.loading': {
        opacity: 0,
    }
}));

// Komponent Loading z kontekstem
const BaseButtonLoading: React.FC = () => {
    const { config, classes } = useButtonContext();

    const shouldShowIndicator = React.useMemo(() => {
        if (typeof config.showLoadingIndicator === 'boolean') {
            return config.showLoadingIndicator;
        }

        if (config.loading === true) {
            return true;
        }

        return false;

    }, [config.loading, config.showLoadingIndicator]);

    return (
        <StyledBaseButtonLoading
            className={`${config.componentName}-loading ${classes}`}
        >
            {shouldShowIndicator &&
                <StyledBaseButtonLoadingIndicator
                    className={`${config.componentName}-loadingIndicator`}
                />
            }

            {(config.loading && typeof config.loading !== 'boolean') && (
                <StyledBaseButtonLoadingContent
                    className={`${config.componentName}-loadingContent`}
                >
                    <FormattedText text={config.loading} />
                </StyledBaseButtonLoadingContent>
            )}
        </StyledBaseButtonLoading>
    );
};

// Komponent Content z kontekstem
const BaseButtonContent: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const { config, classes } = useButtonContext();

    return (
        <StyledBaseButtonContent
            className={`${config.componentName}-content ${classes}`}
        >
            {children}
        </StyledBaseButtonContent>
    );
};

// Wewnętrzny komponent przycisku
const BaseButtonInner: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode, sx?: SxProps<Theme> }> = (props) => {
    const {
        actions,
        config,
        classes,
        shouldShowLoading,
    } = useButtonContext();

    return (
        <StyledBaseButton
            {...props}
            componentName={config.componentName}
            className={clsx(
                `${config.componentName}-root`,
                classes,
                props.className
            )}
            disabled={config.disabled || !!config.loading}
            type={config.type}
            onClick={actions.handleClick}
            onFocus={actions.handleFocus}
            onBlur={actions.handleBlur}
            onMouseDown={actions.handleMouseDown}
            onMouseUp={actions.handleMouseUp}
            onMouseEnter={actions.handleMouseEnter}
            onMouseLeave={actions.handleMouseLeave}
            onKeyDown={actions.handleKeyDown}
            onKeyUp={actions.handleKeyUp}
            role="button"
            tabIndex={config.disabled ? -1 : 0}
            aria-disabled={config.disabled || !!config.loading}
            aria-pressed={config.selected}
        >
            {/* Loading zawsze na wierzchu */}
            {shouldShowLoading && <BaseButtonLoading />}

            {/* Zawartość przycisku - programista sam decyduje co wrzucić */}
            <BaseButtonContent>
                {props.children}
            </BaseButtonContent>
        </StyledBaseButton>
    );
};

// Główny komponent BaseButton z providerem
export const BaseButton: React.FC<BaseButtonProps> = (props) => {
    const {
        // Props specyficzne dla BaseButton
        componentName = "BaseButton",

        // Event handlers
        onClick,
        onFocus,
        onBlur,
        onMouseDown,
        onMouseUp,
        onMouseEnter,
        onMouseLeave,
        onKeyDown,
        onKeyUp,

        // Content props
        children,

        // HTML button props
        className,
        id,
        tabIndex,
        'aria-label': ariaLabel,
        'aria-describedby': ariaDescribedBy,

        sx,
        style,

        // Pozostałe props dla config
        ...configProps
    } = props;

    return (
        <ButtonProvider
            config={{
                componentName,
                ...configProps
            }}
            onClick={onClick}
            onFocus={onFocus}
            onBlur={onBlur}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onChange={configProps.onChange}
        >
            <BaseButtonInner
                id={id}
                className={className}
                tabIndex={tabIndex}
                aria-label={ariaLabel}
                aria-describedby={ariaDescribedBy}
                sx={sx}
                style={style}
            >
                {children}
            </BaseButtonInner>
        </ButtonProvider>
    );
};

BaseButton.displayName = 'BaseButton';

// Export również wewnętrznych komponentów dla użycia w dziedziczących buttonach
export { BaseButtonLoading as ButtonLoading, BaseButtonContent as ButtonContent, BaseButtonInner };

