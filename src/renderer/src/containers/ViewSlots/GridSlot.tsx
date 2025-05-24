import React from "react";
import { Box } from "@mui/material";
import { DataGrid } from "@renderer/components/DataGrid/DataGrid";
import { ColumnDefinition, DataGridActionContext, DataGridContext } from "@renderer/components/DataGrid/DataGridTypes";
import RefreshGridAction from "./actions/RefreshGridAction";
import {
    IGridSlot,
    resolveActionDescriptorsFactory,
    resolveActionGroupDescriptorsFactory,
    resolveColumnDefinitionsFactory,
    resolveRecordsFactory
} from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";

interface GridSlotProps {
    slot: IGridSlot;
    ref?: React.Ref<HTMLDivElement>;
    dataGridRef?: React.RefObject<DataGridActionContext<any> | null>;
}

const GridSlot: React.FC<GridSlotProps> = ({
    slot, ref, dataGridRef
}) => {
    const [rows, setRows] = React.useState<Record<string, any>[]>([]);
    const [columns, setColumns] = React.useState<ColumnDefinition[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [refresh, setRefresh] = React.useState(false);
    const { registerRefresh, refreshSlot } = useRefreshSlot();

    React.useEffect(() => {
        const fetchRows = async () => {
            setLoading(true);
            try {
                setRows(await resolveRecordsFactory(slot.rows, refreshSlot) ?? []);
                setColumns(resolveColumnDefinitionsFactory(slot.columns, refreshSlot) ?? []);
            } catch (error) {
                console.error("Error fetching rows:", error);
            } finally {
                setLoading(false);
            }
        };
        console.log("grid rows refresh");
        fetchRows();
    }, [slot.columns, slot.rows, refresh]);


    React.useEffect(() => {
        const unregister = registerRefresh(slot.id, () => {
            setTimeout(() => {
                setRefresh(prev => !prev);
            }, 0);
        });
        return unregister;
    }, [slot.id]);

    function dataGridMountHandler(context: DataGridContext<any>): void {
        const actionGroups = resolveActionGroupDescriptorsFactory(slot.actionGroups, refreshSlot) ?? [];
        if (actionGroups.length) {
            context.addActionGroup(...actionGroups);
        }
        const actions = resolveActionDescriptorsFactory(slot.actions, refreshSlot) ?? [];
        if (actions.length) {
            context.addAction(...actions);
        }
        context.addAction(RefreshGridAction(() => {
            setRefresh(r => !r);
        }));
    }

    return (
        <Box
            key={slot.id}
            sx={{
                width: "100%",
                height: "100%",
            }}
            ref={ref}
        >
            <DataGrid
                columns={columns}
                data={rows}
                loading={loading ? "Loading..." : undefined}
                onRowClick={(row) => slot.onRowClick?.(row, refreshSlot)}
                ref={dataGridRef}
                onMount={dataGridMountHandler}
                uniqueId={slot.storeLayoutId ?? slot.id}
                mode={slot.mode}
            />
        </Box>
    );
};

export default GridSlot;