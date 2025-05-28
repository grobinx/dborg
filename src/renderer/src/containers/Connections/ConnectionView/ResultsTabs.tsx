import React, { useState, useEffect, useCallback, useMemo } from "react";
import { TabsPanel } from "@renderer/components/TabsPanel/TabsPanel";
import { Tooltip, useTheme } from "@mui/material";
import ToolButton from "@renderer/components/ToolButton";
import { SqlResultContent, SqlResultLabel, SqlResultButtons } from "./SqlResultPanel";
import { UseListenersType } from "@renderer/hooks/useListeners";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import TabPanel, { TabPanelOwnProps } from "@renderer/components/TabsPanel/TabPanel";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import { uuidv7 } from "uuidv7";
import { useMessages } from "@renderer/contexts/MessageContext";

export const SQL_RESULT_CLOSE = "sql-result:close";

interface ResultsTabsProps {
    session: IDatabaseSession;
    additionalTabs?: React.ReactElement<TabPanelOwnProps>[];
}

export function resultsTabsId(session: IDatabaseSession): string {
    return session.schema.sch_id + ":" + session.info.uniqueId + ":results-tabs";
}

const ResultsTabs: React.FC<ResultsTabsProps> = ({ session, additionalTabs }) => {
    const theme = useTheme();
    const [resultsTabs, setResultsTabs] = useState<React.ReactElement<TabPanelOwnProps>[]>([]);
    const { subscribe, unsubscribe, sendMessage } = useMessages();

    const tabsItemID = useMemo(() => resultsTabsId(session), [session]);

    const handleAddSqlResult = useCallback(() => {
        const newResultId = uuidv7();
        const newResultTab = (
            <TabPanel
                key={newResultId}
                itemID={newResultId}
                label={<SqlResultLabel session={session} />}
                content={<SqlResultContent session={session} />}
                buttons={<SqlResultButtons session={session} />}
            />
        );
        setResultsTabs((prevTabs) => [...prevTabs, newResultTab]);
    }, [session]);

    useEffect(() => {
        const newResultId = uuidv7();
        setResultsTabs([
            <TabPanel
                key={newResultId}
                itemID={newResultId}
                label={<SqlResultLabel session={session} />}
                content={<SqlResultContent session={session} />}
                buttons={<SqlResultButtons session={session} />}
            />,
        ]);
    }, []);

    useEffect(() => {
        const handleCloseSqlResult = (itemID: string) => {
            setResultsTabs((prevTabs) =>
                prevTabs.filter(
                    (tab) =>
                        React.isValidElement(tab) &&
                        tab.props.itemID !== itemID
                )
            );
        };

        subscribe(SQL_RESULT_CLOSE, handleCloseSqlResult);
        return () => {
            unsubscribe(SQL_RESULT_CLOSE, handleCloseSqlResult);
        };
    }, []);

    const renderAddResultButton = () => (
        <TabPanelButtons>
            <Tooltip title="Add SQL Result Tab">
                <span>
                    <ToolButton
                        color="success"
                        onClick={handleAddSqlResult}
                    >
                        <theme.icons.AddTab />
                    </ToolButton>
                </span>
            </Tooltip>
        </TabPanelButtons>
    );

    return (
        <TabsPanel
            itemID={tabsItemID}
            className="ResultsTabs-root"
            buttons={renderAddResultButton()}
        >
            {resultsTabs}
            {additionalTabs}
        </TabsPanel>
    );
};

export default ResultsTabs;