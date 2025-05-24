import React from "react";
import { Box } from "@mui/material";
import { DataGrid } from "@renderer/components/DataGrid/DataGrid";
import { ColumnDefinition, DataGridActionContext, DataGridContext, TableCellPosition } from "@renderer/components/DataGrid/DataGridTypes";
import RefreshGridAction from "./actions/RefreshGridAction";
import {
    IGridSlot,
    resolveActionDescriptorsFactory,
    resolveActionGroupDescriptorsFactory,
    resolveColumnDefinitionsFactory,
    resolveRecordsFactory
} from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import { useNotification } from "@renderer/contexts/NotificationContext";
import { useTranslation } from "react-i18next";

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
    const { addNotification } = useNotification();
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const { t } = useTranslation();
    const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
        const fetchRows = async () => {
            setLoading(true);
            try {
                let position: TableCellPosition | null = null;
                if (dataGridRef && dataGridRef.current) {
                    position = dataGridRef.current.getPosition();
                }
                setRows(await resolveRecordsFactory(slot.rows, refreshSlot) ?? []);
                setColumns(resolveColumnDefinitionsFactory(slot.columns, refreshSlot) ?? []);
                if (position) {
                    setTimeout(() => {
                        dataGridRef!.current!.setPosition(position);
                        dataGridRef!.current!.focus();
                    }, 10);
                }
            } catch (error) {
                addNotification("error", t("refresh-failed", "Refresh failed"), {
                    reason: error,
                    source: "GridSlot",
                });
            } finally {
                setLoading(false);
            }
        };
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

    function handleRowClick(row: Record<string, any>) {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            if (slot.onRowClick) {
                slot.onRowClick(row, refreshSlot);
            }
        }, 250);
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
                onRowClick={handleRowClick}
                ref={dataGridRef}
                onMount={dataGridMountHandler}
                uniqueId={slot.storeLayoutId ?? slot.id}
                mode={slot.mode}
            />
        </Box>
    );
};

export default GridSlot;