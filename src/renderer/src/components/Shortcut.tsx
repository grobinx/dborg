import { styled, SxProps } from "@mui/material";
import clsx from "@renderer/utils/clsx";
import { splitKeybinding } from "./CommandPalette/KeyBinding";
import React from "react";
import { Size } from "@renderer/types/sizes";

const ShortcutKeyStyled = styled('kbd', {
    name: "Shortcut",
    slot: "key",
})<{}>(({ }) => ({
    transition: "all 0.2s ease-in-out",
    display: "inline-block",
    padding: "2px 4px",
    background: "#f5f5f5",
    border: "1px solid #ccc",
    borderRadius: "3px",
    color: "#333",
    verticalAlign: "middle",
    userSelect: "none",
    boxShadow: "inset 0 -1px 0 #bbb",
}));

const ShortcutChordStyled = styled('span', {
    name: "Shortcut",
    slot: "chord",
})<{}>(({ }) => ({
}));

const ShortcutRootStyled = styled('span', {
    name: "Shortcut",
    slot: "root",
})<{}>(({ }) => ({
}));

interface ShortcutChordProps {
    keybinding: string;
    active?: boolean;
    hidden?: boolean;
    sx?: SxProps;
    style?: React.CSSProperties;
}

function ShortcutChord({ keybinding, active = true, hidden = false, sx, style }: ShortcutChordProps) {
    return (
        <ShortcutChordStyled
            className={clsx(
                "Shortcut-chord",
                active && "active",
                hidden && "hidden"
            )}
            sx={sx}
            style={style}
        >
            {splitKeybinding(keybinding).map((key, idx, array) => (
                <React.Fragment key={idx}>
                    <ShortcutKeyStyled
                        className={clsx(
                            "Shortcut-key",
                            active && "active",
                            hidden && "hidden"
                        )}
                    >
                        {key}
                    </ShortcutKeyStyled>
                    {idx < array.length - 1 && "+"}
                </React.Fragment>
            ))}
        </ShortcutChordStyled>
    );
}

interface ShortcutProps {
    keybindings: string[] | string;
    active?: boolean;
    hidden?: boolean;
    size?: Size;
    sx?: SxProps;
    style?: React.CSSProperties;
}

export function Shortcut({
    keybindings,
    active = true,
    hidden = false,
    sx,
    style,
    size = "small"
}: ShortcutProps) {
    return (
        <ShortcutRootStyled
            className={clsx(
                "Shortcut-root",
                active && "active",
                hidden && "hidden",
                `size-${size}`
            )}
            sx={sx}
            style={style}
        >
            {Array.isArray(keybindings) ?
                keybindings.filter(Boolean).map((keybinding, idx, array) => (
                    <React.Fragment key={idx}>
                        <ShortcutChord keybinding={keybinding} active={active} hidden={hidden} />
                        {idx < array.length - 1 && "→"}
                    </React.Fragment>
                )) :
                <ShortcutChord keybinding={keybindings} active={active} hidden={hidden} />
            }
        </ShortcutRootStyled>
    );
}
