import { Box, StackProps, styled, useThemeProps } from "@mui/material";
import TabPanel from "@renderer/components/TabsPanel/TabPanel";
import TabsPanel from "@renderer/components/TabsPanel/TabsPanel";
import React from "react";
import { ConnectionButtons, ConnectionContent, ConnectionLabel } from "./Connection";
import { useSessions } from "@renderer/contexts/ApplicationContext";
import { useProfiles } from "@renderer/contexts/ProfilesContext";

const ConnectionsRoot = styled(Box, {
    name: 'Connections', // The component name
    slot: 'root', // The slot name
})(() => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
}));


export interface ConnectionsProps extends StackProps {

}

interface ConnectionsOwnProps extends ConnectionsProps {
    // Add any additional props you need here
    children?: React.ReactNode;
}

const Connections: React.FC<ConnectionsOwnProps> = (props) => {
    const { className, children, ...other } = useThemeProps({ name: 'Connections', props });
    const { sessions } = useSessions();

    return (
        <ConnectionsRoot
            {...other}
            className={(className ?? "") + " Connections-root"}
        >
            <TabsPanel itemID="connections-tabs-panel" className="connections-tabs-panel" tabPosition="bottom">
                {sessions?.map(session => {
                    return (
                        <TabPanel
                            key={session.info.uniqueId}
                            itemID={session.info.uniqueId}
                            label={<ConnectionLabel key={session.info.uniqueId} session={session} />} // Przekazanie listeners do ConnectionLabel
                            content={<ConnectionContent key={session.info.uniqueId} session={session}>{children}</ConnectionContent>} // Przekazanie listeners do ConnectionContent
                            buttons={<ConnectionButtons key={session.info.uniqueId} session={session} />} // Przekazanie listeners do ConnectionButtons
                        />
                    );
                })}
            </TabsPanel>
        </ConnectionsRoot>
    );
}

export default Connections;