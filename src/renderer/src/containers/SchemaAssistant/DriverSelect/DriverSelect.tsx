import { Button, ButtonProps, Stack, StackProps, styled, useThemeProps } from "@mui/material";
import { useDatabase } from "@renderer/contexts/DatabaseContext";
import * as React from 'react';
import DriverSummary from "./DriverSummary";
//import { useTranslation } from "react-i18next";

export interface DriverSelectProps extends StackProps {
    slotProps?: {
        button?: ButtonProps,
    }
}

interface DriverSelectOwnProps extends DriverSelectProps {
    onSelected?: (driverUniqueID: string) => void,
}

const DriverSelectRoot = styled(Stack, {
    name: 'DriverSelect', // The component name
    slot: 'root', // The slot name
})(() => ({
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
}));

const DriverSelectButton = styled(Button, {
    name: 'DriverSelect', // The component name
    slot: 'button', // The slot name
})();

const DriverSelect: React.FC<DriverSelectOwnProps> = (props) => {
    const { className, onSelected, slotProps, ...other } = useThemeProps({ name: 'DriverSelect', props });
    const { drivers } = useDatabase();
    //const { t } = useTranslation();

    return (
        <DriverSelectRoot
            {...other}
            className={(className ?? "") + " DriverSelect-root"}
        >
            {drivers.list.map((driver): React.ReactNode => {
                return (
                    <DriverSelectButton
                        style={{ flexGrow: 1 }}
                        key={driver.uniqueId}
                        onClick={onSelected ? () => { 
                            onSelected(driver.uniqueId) 
                        } : undefined}
                        className="DriverSelect-buttons"
                        {...slotProps?.button}
                    >
                        <DriverSummary driver={driver} />
                    </DriverSelectButton>
                );
            })}
        </DriverSelectRoot>
    )
}

export default DriverSelect;