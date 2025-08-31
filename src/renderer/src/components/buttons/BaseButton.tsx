import React from 'react';
import { styled, SxProps, Theme } from '@mui/material';
import { BaseButtonContentProps, BaseButtonLoadingProps, BaseButtonProps } from './BaseButtonProps';
import clsx from '../../utils/clsx';
import { FormattedText } from '../useful/FormattedText';
import { on } from 'node:events';

type FocusSource = "keyboard" | "mouse" | "program" | null;

interface BaseButtonSlots {
    content?: React.ComponentType<BaseButtonContentProps>;
    loading?: React.ComponentType<BaseButtonLoadingProps>;
}

const createStyledBaseButton = (componentName: string) => {
    return styled('button', {
        name: componentName,
        slot: "root",
    })(() => ({
    }));
};

const createStyledBaseButtonLoading = (componentName: string) => {
    return styled('div', {
        name: componentName,
        slot: "loading",
    })(() => ({
    }));
};

const createStyledBaseButtonLoadingIndicator = (componentName: string) => {
    return styled('div', {
        name: componentName,
        slot: "loadingIndicator",
    })(() => ({
    }));
};

const createStyledBaseButtonLoadingContent = (componentName: string) => {
    return styled('span', {
        name: componentName,
        slot: "loadingContent",
    })(() => ({
    }));
};

const createStyledBaseButtonContent = (componentName: string) => {
    return styled('span', {
        name: componentName,
        slot: "content",
    })(() => ({
    }));
};

interface BaseButtonOwnProps extends BaseButtonProps {
    slots?: BaseButtonSlots;
}

// Helper function do normalizacji toggle
const normalizeToggle = (toggle: string | (string | null)[] | undefined): (string | null)[] => {
    if (!toggle) return [];

    if (typeof toggle === 'string') {
        // Jeśli toggle to string, stwórz przełącznik [null, string]
        return [null, toggle];
    }

    if (Array.isArray(toggle)) {
        return toggle;
    }

    return [];
};

export const BaseButtonLoading: React.FC<BaseButtonLoadingProps> = (props) => {
    const { componentName, className, loading, showLoadingIndicator } = props;

    const shouldShowIndicator = React.useMemo(() => {
        if (typeof showLoadingIndicator === 'boolean') {
            return showLoadingIndicator;
        }

        if (loading === true) {
            return true;
        }

        return false;

    }, [loading, showLoadingIndicator]);

    const StyledBaseButtonLoading = React.useMemo(() => createStyledBaseButtonLoading(componentName), [componentName]);
    const StyledBaseButtonLoadingIndicator = React.useMemo(() => createStyledBaseButtonLoadingIndicator(componentName), [componentName]);
    const StyledBaseButtonLoadingContent = React.useMemo(() => createStyledBaseButtonLoadingContent(componentName), [componentName]);

    return (
        <StyledBaseButtonLoading
            className={`${componentName}-loading ${className}`}
        >
            {shouldShowIndicator &&
                <StyledBaseButtonLoadingIndicator
                    className={`${componentName}-loadingIndicator`}
                />
            }

            {(loading && typeof loading !== 'boolean') && (
                <StyledBaseButtonLoadingContent
                    className={`${componentName}-loadingContent`}
                >
                    <FormattedText text={loading} />
                </StyledBaseButtonLoadingContent>
            )}
        </StyledBaseButtonLoading>
    );
};

export const BaseButtonContent: React.FC<BaseButtonContentProps> = (props) => {
    const { componentName, className, children } = props;

    const StyledBaseButtonContent = React.useMemo(() => createStyledBaseButtonContent(componentName), [componentName]);

    return (
        <StyledBaseButtonContent
            className={`${componentName}-content ${className}`}
        >
            {children}
        </StyledBaseButtonContent>
    );
};

export const BaseButton: React.FC<BaseButtonOwnProps> = (props) => {
    const {
        ref, slots, componentName, className, component, 
        disabled, loading,
        type = 'button',
        selected,
        size = 'medium',
        color = 'main',
        value, toggle, defaultValue, showLoadingIndicator, dense,
        onFocus, onBlur, onClick, onMouseDown, onMouseUp, onMouseEnter, onMouseLeave, onKeyDown, onKeyUp, onChange,
        ...otherProps
    } = props;

    const [focused, setFocused] = React.useState(false);
    const [active, setActive] = React.useState(false);
    const [hover, setHover] = React.useState(false);
    const [focusedSource, setFocusedSource] = React.useState<FocusSource>(null);
    const toggleValues = React.useMemo(() => normalizeToggle(toggle), [toggle]);
    const [currentValue, setCurrentValue] = React.useState<string | null | undefined>(defaultValue);
    const isInteractable = !disabled && !loading;
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    const ContentComponent = slots?.content || BaseButtonContent;
    const LoadingComponent = slots?.loading || BaseButtonLoading;

    const StyledBaseButton = React.useMemo(() => createStyledBaseButton(componentName ?? "BaseButton"), [componentName]);

    React.useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement);

    const classes = React.useMemo(() => {
        return clsx([
            `size-${size}`,
            `color-${color}`,
            `type-${type}`,
            dense && 'dense',
            disabled && 'disabled',
            loading && 'loading',
            selected && 'selected',
            focused && 'focused',
            active && 'active',
            hover && 'hover',
            focusedSource && `focused-${focusedSource}`,
            (value ?? currentValue) && `value-${(value ?? currentValue)}`,
            (value ?? currentValue) && 'has-value',
            className,
        ]);
    }, [size, color, disabled, loading, selected, focused, active, hover, type, value, currentValue, focusedSource, className]);

    const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
        if (isInteractable) {
            setFocused(true);
            setFocusedSource(focusedSource ?? 'keyboard');
            onFocus?.(e);
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
        if (isInteractable) {
            setActive(false);
            setFocused(false);
            setFocusedSource(null);
            onBlur?.(e);
        }
    };

    const cycleValue = () => {
        if (!toggleValues || !toggleValues.length) return;

        const currentIndex = toggleValues.indexOf(currentValue ?? null);
        const nextIndex = (currentIndex + 1) % toggleValues.length;
        setCurrentValue(toggleValues[nextIndex]);
    };

    const click = () => {
        if (isInteractable) {
            if (toggleValues.length) {
                cycleValue();
            }
        }
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isInteractable) {
            e.preventDefault();
            click();
            onClick?.(e);
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isInteractable) {
            setActive(true);
            setFocusedSource(focusedSource ?? 'mouse');
            onMouseDown?.(e);
        }
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isInteractable) {
            setActive(false);
            onMouseUp?.(e);
        }
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isInteractable) {
            setHover(true);
            onMouseEnter?.(e);
        }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isInteractable) {
            setHover(false);
            setActive(false);
            onMouseLeave?.(e);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (isInteractable) {
            if ((e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                setActive(true);

                if (e.key === 'Enter') {
                    click();
                    buttonRef.current?.click();
                }
            }
            onKeyDown?.(e);
        }
    };

    const handleKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (isInteractable) {
            if ((e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                setActive(false);

                if (e.key === ' ') {
                    click();
                    buttonRef.current?.click();
                }
            }
            onKeyUp?.(e);
        }
    };

    React.useEffect(() => {
        if (currentValue !== undefined && currentValue !== value) {
            onChange?.(currentValue);
        }
    }, [currentValue]);

    React.useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    React.useEffect(() => {
        if (disabled || !!loading) {
            setFocused(false);
        }
    }, [disabled, loading]);

    return (
        <StyledBaseButton
            as={component}
            {...otherProps}
            ref={buttonRef}
            className={clsx(
                `${componentName}-root`,
                classes,
            )}
            disabled={disabled || !!loading}
            type={type}
            onClick={handleClick}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled || !!loading}
            aria-pressed={selected}
        >
            {!!loading &&
                <LoadingComponent
                    componentName={componentName ?? "BaseButton"}
                    className={classes}
                    loading={loading}
                    showLoadingIndicator={showLoadingIndicator}
                />
            }

            <ContentComponent
                componentName={componentName ?? "BaseButton"}
                className={classes}
            >
                {props.children}
            </ContentComponent>
        </StyledBaseButton>
    );
};

BaseButton.displayName = 'BaseButton';
