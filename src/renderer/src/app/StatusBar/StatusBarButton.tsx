import { Button, ButtonProps, Menu, MenuItem, styled, Tooltip, useThemeProps } from "@mui/material";
import React, { useState } from "react";

export interface StatusBarButtonProps extends ButtonProps {
}

type StatusBarOption = {
    label: React.ReactNode; // Element React, który będzie wyświetlany jako etykieta opcji
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
     */
    onOptionSelect?: (value: any) => void; // Funkcja wywoływana po wyborze opcji
}

function optionIsComposite(options: any): options is StatusBarOption {
    return typeof options === "object" && options !== null && "label" in options && "value" in options;
}

const StatusBarButtonRoot = styled(Button, {
    name: "StatusBarButton", // The component name
    slot: "root", // The slot name
})(({ theme }) => ({
    color: theme.palette.statusBar.contrastText,
    "& .IconWrapper-root": {
        //color: theme.palette.statusBar.icon,
    },
}));

const StatusBarButton: React.FC<StatusBarButtonOwnProps> = (props) => {
    const { toolTip, className, options, optionSelected, onOptionSelect, ...other } = useThemeProps({ name: "StatusBarButton", props });
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (options && options.length > 0) {
            setAnchorEl(event.currentTarget);
        }
        else {
            other.onClick?.(event);
        }
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleOptionSelect = (value: any) => {
        if (onOptionSelect) {
            onOptionSelect(value); // Wywołanie funkcji przekazanej z góry
        }
        handleCloseMenu();
    };

    return (
        <>
            <Tooltip title={toolTip}>
                <StatusBarButtonRoot
                    {...other}
                    className={(className ?? "") + " StatusBarButton-root"}
                    onClick={handleOpenMenu} // Otwórz menu po kliknięciu
                >
                    {other.children}
                </StatusBarButtonRoot>
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
                                optionIsComposite(option) ? option.value : option
                            )}
                            selected={optionIsComposite(option) ? option.value === optionSelected : option === optionSelected}
                        >
                            {optionIsComposite(option) ? option.label : option}
                        </MenuItem>
                    ))}
                </Menu>
            )}
        </>
    );
};

export default StatusBarButton;
