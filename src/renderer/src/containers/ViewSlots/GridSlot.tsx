import React from "react";
import { Box, Stack } from "@mui/material";
import { DataGrid } from "@renderer/components/DataGrid/DataGrid";
import { ColumnDefinition, DataGridActionContext, DataGridContext, DataGridStatus, TableCellPosition } from "@renderer/components/DataGrid/DataGridTypes";
import RefreshGridAction from "./actions/RefreshGridAction";
import {
    IGridSlot,
    resolveActionDescriptorsFactory,
    resolveActionGroupDescriptorsFactory,
    resolveColumnDefinitionsFactory,
    resolveRecordsFactory
} from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import { useToast } from "@renderer/contexts/ToastContext";
import { useTranslation } from "react-i18next";
import { useRefSlot } from "./RefSlotContext";
import DataGridStatusBar from "@renderer/components/DataGrid/DataGridStatusBar";
import debounce from "@renderer/utils/debounce";

interface GridSlotProps {
    slot: IGridSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const GridSlot: React.FC<GridSlotProps> = ({
    slot, ref
}) => {
    const dataGridRef = React.useRef<DataGridActionContext<any> | null>(null);
    const [rows, setRows] = React.useState<Record<string, any>[]>([]);
    const [columns, setColumns] = React.useState<ColumnDefinition[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [refresh, setRefresh] = React.useState(false);
    const { addToast } = useToast();
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const { registerRefSlot } = useRefSlot();
    const { t } = useTranslation();
    const [dataGridStatus, setDataGridStatus] = React.useState<DataGridStatus | undefined>(undefined);
    const statusBarRef = React.useRef<HTMLDivElement>(null);
    const [boxHeight, setBoxHeight] = React.useState<string>("100%");

    React.useEffect(() => {
        const fetchRows = async () => {
            setLoading(true);
            try {
                setRows(await resolveRecordsFactory(slot.rows, refreshSlot) ?? []);
                setColumns(resolveColumnDefinitionsFactory(slot.columns, refreshSlot) ?? []);
            } catch (error) {
                addToast("error", t("refresh-failed", "Refresh failed"), {
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
        const unregisterRefresh = registerRefresh(slot.id, () => {
            setRefresh(prev => !prev);
        });
        const unregisterRefSlot = registerRefSlot(slot.id, "datagrid", dataGridRef);
        return () => {
            unregisterRefresh();
            unregisterRefSlot();
        };
    }, [slot.id]);

    // Debounced click handler
    const rowClick = React.useMemo(
        () =>
            debounce((row: Record<string, any> | undefined) => {
                slot.onRowClick?.(row, refreshSlot);
            }, 250),
        [slot.id, refreshSlot]
    );

    React.useEffect(() => {
        return () => rowClick.cancel();
    }, [rowClick]);

    // Debounced height recalculation
    const updateHeight = React.useMemo(
        () =>
            debounce(() => {
                if (statusBarRef.current) {
                    const statusBarHeight = statusBarRef.current.offsetHeight;
                    setBoxHeight(`calc(100% - ${statusBarHeight}px)`);
                } else {
                    setBoxHeight("100%");
                }
            }, 50),
        []
    );

    React.useEffect(() => {
        const observer = new ResizeObserver(() => {
            updateHeight();
        });

        if (statusBarRef.current) {
            observer.observe(statusBarRef.current);
        }
        // initial
        updateHeight();

        return () => {
            if (statusBarRef.current) {
                observer.unobserve(statusBarRef.current);
            }
            observer.disconnect();
            updateHeight.cancel();
        };
    }, [updateHeight]);

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

    function handleRowClick(row: Record<string, any> | undefined) {
        rowClick(row);
    }

    return (
        <Stack
            direction="column"
            sx={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
        >
            <Box
                key={slot.id}
                sx={{
                    width: "100%",
                    height: boxHeight,
                }}
                ref={ref}
            >
                <DataGrid
                    columns={columns}
                    data={rows}
                    loading={loading ? t("loading---", "Loading...") : undefined}
                    onRowClick={handleRowClick}
                    ref={dataGridRef}
                    onMount={dataGridMountHandler}
                    autoSaveId={slot.autoSaveId ?? slot.id}
                    mode={slot.mode}
                    onChange={(status) => setDataGridStatus(status)}
                />
            </Box>
            {slot.status && slot.status.length > 0 && (
                <DataGridStatusBar
                    ref={statusBarRef}
                    status={dataGridStatus}
                    statuses={slot.status}
                />)
            }
        </Stack>
    );
};

export default GridSlot;