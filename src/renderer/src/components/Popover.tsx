import React from 'react';
import { Paper, Box, ClickAwayListener, Popper } from '@mui/material';
import { Options } from '@popperjs/core';

interface PopoverProps {
    open: boolean;
    anchorEl: HTMLElement | null;
    placement?: 'bottom' | 'top' | 'right' | 'left';
    onClose?: (event: Event) => void;
    onChangePlacement?: (placement: string) => void;
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
}: PopoverProps) {
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
        >
            <Paper sx={{ margin: 1 }}>
                <ClickAwayListener
                    onClickAway={(event) => {
                        event.stopPropagation();
                        onClose?.(event);
                    }}
                >
                    <Box>
                        {children}
                    </Box>
                </ClickAwayListener>
            </Paper>
        </Popper>
    );
}