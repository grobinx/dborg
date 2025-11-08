import React from 'react';
import { Paper, Box, ClickAwayListener, Popper, PopperPlacementType } from '@mui/material';
import { Options } from '@popperjs/core';

interface PopoverProps {
    open: boolean;
    anchorEl: HTMLElement | null;
    placement?: PopperPlacementType;
    onClose?: (event: Event) => void;
    onChangePlacement?: (placement: PopperPlacementType) => void;
    modifiers?: Options['modifiers']; // Popper.js modifiers
    children: React.ReactNode;
    slotProps?: {
        popper?: React.ComponentProps<typeof Popper>;
        paper?: React.ComponentProps<typeof Paper>;
        awayListener?: React.ComponentProps<typeof ClickAwayListener>;
    }
}

export function Popover({
    open,
    anchorEl,
    placement,
    onClose,
    onChangePlacement,
    modifiers,
    children,
    slotProps,
}: PopoverProps) {
    const { popper, paper, awayListener } = slotProps || {};
    
    const placementModifier = React.useMemo(() => ({
        name: "updatePlacementState",
        enabled: true,
        phase: 'afterWrite' as const,
        fn({ state }: any) {
            onChangePlacement?.(state.placement);
        },
    }), []);

    return (
        <Popper
            open={open}
            anchorEl={anchorEl}
            placement={placement}
            modifiers={modifiers ?? [placementModifier]}
            style={{
                zIndex: 1300,
            }}
            {...popper}
        >
            <Paper sx={{ margin: 1 }} {...paper}>
                <ClickAwayListener
                    onClickAway={(event) => {
                        event.stopPropagation();
                        onClose?.(event);
                    }}
                    {...awayListener}
                >
                    <Box>
                        {children}
                    </Box>
                </ClickAwayListener>
            </Paper>
        </Popper>
    );
}