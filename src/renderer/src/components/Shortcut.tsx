import { styled, SxProps } from "@mui/material";
import clsx from "@renderer/utils/clsx";
import { splitKeybinding } from "./CommandPalette/KeyBinding";
import React from "react";
import { Size } from "@renderer/types/sizes";

const ShortcutKeyStyled = styled('kbd', {
    name: "Shortcut",
    slot: "key",
})<{}>(({ }) => ({
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
    dense?: boolean;
    sx?: SxProps;
    style?: React.CSSProperties;
}

function denseKey(key: string, dense: boolean): string {
    if (!dense) return key;

    const replacements: Record<string, string> = {
        "Control": "Ct",
        "Ctrl": "Ctr",
        "Alt": "Alt",
        "Shift": "Shf",
        "Meta": "Cmd",
        "Command": "Cmd",
        "Escape": "Esc",
        "Enter": "↵",
        "Tab": "Tab",
        "ArrowLeft": "←",
        "ArrowRight": "→",
        "ArrowUp": "↑",
        "ArrowDown": "↓",
        "Backspace": "⌫",
        "Delete": "Del",
        "Space": "␣",
    };

    return replacements[key.trim()] ?? key.trim();
}

function ShortcutChord({ keybinding, active = true, hidden = false, dense = false, sx, style }: ShortcutChordProps) {
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
                        {denseKey(key, dense)}
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
    dense?: boolean;
    sx?: SxProps;
    style?: React.CSSProperties;
}

export function Shortcut({
    keybindings,
    active = true,
    hidden = false,
    sx,
    style,
    size = "small",
    dense = false,
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
                        <ShortcutChord keybinding={keybinding} active={active} hidden={hidden} dense={dense} />
                        {idx < array.length - 1 && "→"}
                    </React.Fragment>
                )) :
                <ShortcutChord keybinding={keybindings} active={active} hidden={hidden} dense={dense} />
            }
        </ShortcutRootStyled>
    );
}
