import { Button, Menu, MenuItem, styled, useThemeProps } from "@mui/material";
import { BaseButton } from "@renderer/components/buttons/BaseButton";
import { BaseButtonProps } from "@renderer/components/buttons/BaseButtonProps";
import Tooltip from "@renderer/components/Tooltip";
import React, { useState } from "react";

export interface StatusBarButtonProps extends Omit<BaseButtonProps, 'size'> {
}

type StatusBarOption = {
    /**
     * Label of the option.
     */
    label: React.ReactNode; // Element React, który będzie wyświetlany jako etykieta opcji
    /**
     * Value of the option.
     * This value will be passed to the onOptionSelect function when the option is selected.
     */
    value: number | string | boolean | bigint; // Wartość opcji, która będzie przekazywana do funkcji onOptionSelect
}

interface StatusBarButtonOwnProps extends StatusBarButtonProps {
    toolTip?: string;
    /**
     * List of options to choose from.
     * Each option can be a simple value or an object with label and value.
     */
    options?: (StatusBarOption | number | string | boolean | bigint)[]; // Lista opcji do wyboru
    /**
     * Currently selected option value.
     * If options are provided, this should match one of the option values.
     */
    optionSelected?: number | string | boolean | bigint; // Opcjonalnie wybrana opcja
    /**
     * This function is called when an option is selected from the menu.
     * @param value Value of the selected option.
     * @return Return false to prevent the menu from closing after selection.
     */
    onOptionSelect?: (value: any) => boolean | void;
    /**
     * This function is called when the options menu is closed.
     * @returns 
     */
    onOptionsClose?: () => void;
}

function isStatusBarOption(options: any): options is StatusBarOption {
    return typeof options === "object" && options !== null && "label" in options && "value" in options;
}

/**
 * StatusBarButton component for the status bar.
 * @param props Props for the button.
 * @returns StatusBarButton component.
 */
const StatusBarButton: React.FC<StatusBarButtonOwnProps> = (props) => {
    const { toolTip, className, options, optionSelected, onOptionSelect, onOptionsClose, ...other } = useThemeProps({ name: "StatusBarButton", props });
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (options && options.length > 0) {
            setAnchorEl(event.currentTarget);
        }
        other.onClick?.(event);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        onOptionsClose?.();
    };

    const handleOptionSelect = (value: any) => {
        if (onOptionSelect) {
            const result = onOptionSelect(value);
            if (result === false) {
                return;
            }
        }
        handleCloseMenu();
    };

    return (
        <>
            <Tooltip title={toolTip}>
                <BaseButton
                    componentName="StatusBarButton"
                    {...other}
                    onClick={handleOpenMenu} // Otwórz menu po kliknięciu
                >
                    {other.children}
                </BaseButton>
            </Tooltip>
            {options && (
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleCloseMenu}
                    anchorOrigin={{ vertical: "top", horizontal: "left" }}
                    transformOrigin={{ vertical: "bottom", horizontal: "left" }}
                >
                    {options.map((option, index) => (
                        <MenuItem
                            key={index}
                            onClick={() => handleOptionSelect(
                                isStatusBarOption(option) ? option.value : option
                            )}
                            selected={isStatusBarOption(option) ? option.value === optionSelected : option === optionSelected}
                            style={{ fontSize: '0.875em', }}
                        >
                            {isStatusBarOption(option) ? option.label : option}
                        </MenuItem>
                    ))}
                </Menu>
            )}
        </>
    );
};

export default StatusBarButton;
