import { Box, StackProps, styled, useThemeProps } from "@mui/material";
import TabPanel from "@renderer/components/TabsPanel/TabPanel";
import TabsPanel from "@renderer/components/TabsPanel/TabsPanel";
import React from "react";
import { ConnectionButtons, ConnectionContent, ConnectionLabel } from "./Connection";
import { useSessions } from "@renderer/contexts/ApplicationContext";

const ConnectionsRoot = styled(Box, {
    name: 'Connections', 
    slot: 'root', 
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
            <TabsPanel 
                itemID="connections-tabs-panel" 
                className="connections-tabs-panel" 
                tabPosition="bottom"
            >
                {sessions?.map(session => {
                    return (
                        <TabPanel
                            key={session.info.connectionId}
                            itemID={session.info.connectionId}
                            label={<ConnectionLabel key={session.info.connectionId} session={session} />} 
                            content={<ConnectionContent key={session.info.connectionId} session={session}>{children}</ConnectionContent>} 
                            buttons={<ConnectionButtons key={session.info.connectionId} session={session} />} 
                        />
                    );
                })}
            </TabsPanel>
        </ConnectionsRoot>
    );
}

export default Connections;