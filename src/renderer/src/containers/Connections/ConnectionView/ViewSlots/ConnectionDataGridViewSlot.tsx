import React, { useEffect } from "react";
import { DataGridConnectionViewSlot } from "plugins/manager/renderer/Plugin";
import { Box, Typography, IconButton, Stack } from "@mui/material";
import { DataGrid } from "@renderer/components/DataGrid/DataGrid";
import { use } from "i18next";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
// Załóżmy, że masz komponent DataGrid, np. z MUI X lub własny
// import { DataGrid } from "@mui/x-data-grid";

interface ConnectionDataGridViewSlotProps {
    slot: DataGridConnectionViewSlot;
    session: IDatabaseSession;
    ref?: React.Ref<HTMLDivElement>;
    onRowClick?: (row: any) => void;
}

export const ConnectionDataGridViewSlot: React.FC<ConnectionDataGridViewSlotProps> = ({
    slot, session, ref, onRowClick
}) => {
    const [rows, setRows] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const { rows } = await session.query(slot.sql);
                setRows(rows);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }

        if (session && slot.sql) {
            fetchData();
        }
    }, [session, slot.sql]);

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
            />
        </Box>
    );
};

export default ConnectionDataGridViewSlot;