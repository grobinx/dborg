import React, { useEffect } from "react";
import { DataGridConnectionViewSlot } from "plugins/manager/renderer/Plugin";
import { Box, Typography, IconButton, Stack } from "@mui/material";
import { DataGrid } from "@renderer/components/DataGrid/DataGrid";
import { use } from "i18next";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { DataGridActionContext, DataGridContext, TableCellPosition } from "@renderer/components/DataGrid/DataGridTypes";
import { RefreshConnectionDataGrid } from "./actions/RefreshConnectionDataGrid";
import { useTranslation } from "react-i18next";

interface ConnectionDataGridViewSlotProps {
    slot: DataGridConnectionViewSlot;
    session: IDatabaseSession;
    ref?: React.Ref<HTMLDivElement>;
    dataGridRef?: React.RefObject<DataGridActionContext<any> | null>;
    onRowClick?: (row: any) => void;
}

export const ConnectionDataGridViewSlot: React.FC<ConnectionDataGridViewSlotProps> = ({
    slot, session, ref, dataGridRef, onRowClick
}) => {
    const [rows, setRows] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [refresh, setRefresh] = React.useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchData = async () => {
            let position: TableCellPosition | null = null;
            try {
                if (dataGridRef?.current) {
                    position = dataGridRef.current.getPosition();
                }
                setLoading(true);
                const parameters = typeof slot.parameters === "function" ? slot.parameters(dataGridRef?.current ?? undefined) : slot.parameters;
                const { rows } = await session.query(slot.sql, parameters);
                setRows(rows);
                setTimeout(() => {
                    if (dataGridRef?.current) {
                        dataGridRef.current.setPosition(position ?? { column: 0, row: 0 });
                        dataGridRef.current.focus();
                    }
                }, 10);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }

        if (session && slot.sql) {
            fetchData();
        }
    }, [session, slot.sql, refresh]);

    function dataGridMountHandler(context: DataGridContext<any>): void {
        if (slot.actionGroups?.length) {
            context.addActionGroup(...slot.actionGroups);
        }
        if (slot.actions?.length) {
            context.addAction(...slot.actions);
        }
        context.addAction(RefreshConnectionDataGrid((_context) => {
            setRefresh(r => !r);
        }));
    }

    return (
        <Box
            sx={{
                width: "100%",
                height: "calc(100%)",
            }}
            ref={ref}
        >
            <DataGrid
                columns={slot.columns}
                data={rows}
                loading={loading ? "Loading..." : undefined}
                onRowClick={onRowClick}
                ref={dataGridRef}
                onMount={dataGridMountHandler}
                uniqueId={session.schema.sch_id}
            />
        </Box>
    );
};

export default ConnectionDataGridViewSlot;