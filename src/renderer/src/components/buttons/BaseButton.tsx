import React from 'react';
import { styled, SxProps, Theme } from '@mui/material';
import { ButtonProvider, useButtonContext } from './ButtonContext';
import { BaseButtonProps } from './BaseButtonProps';
import clsx from '../../utils/clsx';
import { FormattedText } from '../useful/FormattedText';

interface BaseButtonSlots {
    content?: React.ComponentType<{ children?: React.ReactNode }>;
    loading?: React.ComponentType;
}

const createDynamicBaseButton = (componentName: string) => {
    return styled('button', {
        name: componentName,
        slot: "root",
    })(() => ({
    }));
};

const createDynamicBaseButtonLoading = (componentName: string) => {
    return styled('div', {
        name: componentName,
        slot: "loading",
    })(() => ({
    }));
};

const createDynamicBaseButtonLoadingIndicator = (componentName: string) => {
    return styled('div', {
        name: componentName,
        slot: "loadingIndicator",
    })(() => ({
    }));
};

const createDynamicBaseButtonLoadingContent = (componentName: string) => {
    return styled('span', {
        name: componentName,
        slot: "loadingContent",
    })(() => ({
    }));
};

const createDynamicBaseButtonContent = (componentName: string) => {
    return styled('span', {
        name: componentName,
        slot: "content",
    })(() => ({
    }));
};

// Komponent Loading z kontekstem
export const BaseButtonLoading: React.FC = () => {
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

    const DynamicBaseButtonLoading = React.useMemo(() => createDynamicBaseButtonLoading(config.componentName), [config.componentName]);
    const DynamicBaseButtonLoadingIndicator = React.useMemo(() => createDynamicBaseButtonLoadingIndicator(config.componentName), [config.componentName]);
    const DynamicBaseButtonLoadingContent = React.useMemo(() => createDynamicBaseButtonLoadingContent(config.componentName), [config.componentName]);

    return (
        <DynamicBaseButtonLoading
            className={`${config.componentName}-loading ${classes}`}
        >
            {shouldShowIndicator &&
                <DynamicBaseButtonLoadingIndicator
                    className={`${config.componentName}-loadingIndicator`}
                />
            }

            {(config.loading && typeof config.loading !== 'boolean') && (
                <DynamicBaseButtonLoadingContent
                    className={`${config.componentName}-loadingContent`}
                >
                    <FormattedText text={config.loading} />
                </DynamicBaseButtonLoadingContent>
            )}
        </DynamicBaseButtonLoading>
    );
};

// Komponent Content z kontekstem
export const BaseButtonContent: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const { config, classes } = useButtonContext();

    const DynamicBaseButtonContent = React.useMemo(() => createDynamicBaseButtonContent(config.componentName), [config.componentName]);

    return (
        <DynamicBaseButtonContent
            className={`${config.componentName}-content ${classes}`}
        >
            {children}
        </DynamicBaseButtonContent>
    );
};

// Wewnętrzny komponent przycisku
const BaseButtonInner: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children?: React.ReactNode;
    sx?: SxProps<Theme>;
    ref?: React.Ref<HTMLButtonElement>;
    slots?: BaseButtonSlots
}> = (props) => {
    const {
        actions,
        config,
        classes,
        shouldShowLoading,
    } = useButtonContext();

    const { ref, slots, ...otherProps } = props;
    const ContentComponent = slots?.content || BaseButtonContent;
    const LoadingComponent = slots?.loading || BaseButtonLoading;

    const DynamicBaseButton = React.useMemo(() => createDynamicBaseButton(config.componentName), [config.componentName]);
    
    return (
        <DynamicBaseButton
            {...otherProps}
            ref={ref}
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
            {shouldShowLoading && <LoadingComponent />}

            <ContentComponent>
                {props.children}
            </ContentComponent>
        </DynamicBaseButton>
    );
};

interface BaseButtonOwnProps extends BaseButtonProps {
    slots?: BaseButtonSlots;
}

// Główny komponent BaseButton z ref support
export const BaseButton: React.FC<BaseButtonOwnProps> = (props) => {
    const {
        // Props specyficzne dla BaseButton
        componentName = "BaseButton",
        ref,

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

        slots,

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
                ref={ref}
                slots={slots}
            >
                {children}
            </BaseButtonInner>
        </ButtonProvider>
    );
};

BaseButton.displayName = 'BaseButton';
