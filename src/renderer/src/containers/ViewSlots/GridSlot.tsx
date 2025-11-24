import React from "react";
import { Box, Stack } from "@mui/material";
import { DataGrid } from "@renderer/components/DataGrid/DataGrid";
import { ColumnDefinition, DataGridActionContext, DataGridContext, DataGridStatus, TableCellPosition } from "@renderer/components/DataGrid/DataGridTypes";
import RefreshGridAction from "./actions/RefreshGridAction";
import {
    IGridSlot,
    resolveActionDescriptorsFactory,
    resolveActionGroupDescriptorsFactory,
    resolveBooleanFactory,
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
    const [pivot, setPivot] = React.useState(false);
    const addToast = useToast();
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const { registerRefSlot } = useRefSlot();
    const { t } = useTranslation();
    const [dataGridStatus, setDataGridStatus] = React.useState<DataGridStatus | undefined>(undefined);
    const statusBarRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const fetchRows = async () => {
            setLoading(true);
            try {
                console.debug("GridSlot fetching rows for slot:", slot.id);
                const result = await resolveRecordsFactory(slot.rows, refreshSlot);
                if (Array.isArray(result)) {
                    setRows(result ?? []);
                    setColumns(resolveColumnDefinitionsFactory(slot.columns, refreshSlot) ?? []);
                    setPivot(resolveBooleanFactory(slot.pivot, refreshSlot) ?? false);
                    console.debug("GridSlot fetched rows for slot:", slot.id, result.length);
                } else if (result && typeof result === "object") {
                    setRows(Object.entries(result).map(([key, value]) => ({
                        name: key,
                        value: value,
                    })));
                    setColumns([
                        { key: "name", label: t("name", "Name"), dataType: "string", width: 250 },
                        { key: "value", label: t("value", "Value"), dataType: "string", width: 300 },
                    ]);
                    setPivot(false);
                }
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
        console.debug("GridSlot updating content for slot:", slot.id, refresh);
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

    function dataGridMountHandler(context: DataGridContext<any>): void {
        console.debug("GridSlot mounted for slot:", slot.id);
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

    //console.debug("GridSlot rendering slot:", slot.id);

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
                    flex: 1,
                    overflow: "hidden",
                    minHeight: 0,
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
                    pivot={pivot}
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