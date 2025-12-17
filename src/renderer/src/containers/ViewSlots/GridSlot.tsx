import React from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { DataGrid } from "@renderer/components/DataGrid/DataGrid";
import { ColumnDefinition, DataGridActionContext, DataGridContext, DataGridStatus, TableCellPosition } from "@renderer/components/DataGrid/DataGridTypes";
import RefreshGridAction from "./actions/RefreshGridAction";
import {
    IGridSlot,
    resolveActionFactory,
    resolveActionGroupFactory,
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
    const theme = useTheme();
    const addToast = useToast();
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const { registerRefSlot } = useRefSlot();
    const { t } = useTranslation();
    const dataGridRef = React.useRef<DataGridActionContext<any> | null>(null);
    const [rows, setRows] = React.useState<Record<string, any>[]>([]);
    const [columns, setColumns] = React.useState<ColumnDefinition[]>([]);
    const [pivotColumns, setPivotColumns] = React.useState<ColumnDefinition[] | undefined>(undefined);
    const [loading, setLoading] = React.useState(false);
    const [message, setMessage] = React.useState<string | undefined>(undefined);
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [pivot, setPivot] = React.useState(resolveBooleanFactory(slot.pivot, refreshSlot) ?? false);
    const [dataGridStatus, setDataGridStatus] = React.useState<DataGridStatus | undefined>(undefined);
    const statusBarRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, () => {
            setRefresh(prev => prev + 1n);
        });
        const unregisterRefSlot = registerRefSlot(slot.id, "datagrid", dataGridRef);
        slot?.onMount?.(refreshSlot);
        return () => {
            unregisterRefresh();
            unregisterRefSlot();
            slot?.onUnmount?.(refreshSlot);
        };
    }, [slot.id]);

    React.useEffect(() => {
        const fetchRows = async () => {
            setLoading(true);
            try {
                console.debug("GridSlot fetching rows for slot:", slot.id);
                const result = await resolveRecordsFactory(slot.rows, refreshSlot);
                if (Array.isArray(result)) {
                    setMessage(undefined);
                    setRows(result ?? []);
                    setColumns(resolveColumnDefinitionsFactory(slot.columns, refreshSlot) ?? []);
                    setPivotColumns(resolveColumnDefinitionsFactory(slot.pivotColumns, refreshSlot));
                    setPivot(resolveBooleanFactory(slot.pivot, refreshSlot) ?? false);
                    console.debug("GridSlot fetched rows for slot:", slot.id, result.length);
                } else if (result && typeof result === "object") {
                    setMessage(undefined);
                    setRows(Object.entries(result).map(([key, value]) => ({
                        name: key,
                        value: value,
                    })));
                    setColumns([
                        { key: "name", label: t("name", "Name"), dataType: "string", width: 250 },
                        { key: "value", label: t("value", "Value"), dataType: "string", width: 300 },
                    ]);
                    setPivotColumns(undefined);
                    setPivot(false);
                } else if (typeof result === "string") {
                    setMessage(result);
                    setRows([]);
                    setColumns([]);
                    setPivotColumns(undefined);
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

    // Debounced click handler
    const rowClick = React.useMemo(
        () =>
            debounce((row: Record<string, any> | undefined) => {
                slot.onRowSelect?.(row, refreshSlot);
            }, 250),
        [slot.id, refreshSlot]
    );

    React.useEffect(() => {
        return () => rowClick.cancel();
    }, [rowClick]);

    function dataGridMountHandler(context: DataGridContext<any>): void {
        console.debug("GridSlot mounted for slot:", slot.id);
        const actionGroups = resolveActionGroupFactory(slot.actionGroups, refreshSlot) ?? [];
        if (actionGroups.length) {
            context.addActionGroup(...actionGroups);
        }
        const actions = resolveActionFactory(slot.actions, refreshSlot) ?? [];
        if (actions.length) {
            context.addAction(...actions);
        }
        context.addAction(RefreshGridAction(() => {
            setRefresh(prev => prev + 1n);
        }));
    }

    function handleRowSelect(row: Record<string, any> | undefined) {
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
                {message ? (<Box
                    sx={{
                        padding: 8,
                        color: theme.palette.text.disabled,
                        textAlign: "center",
                        alignContent: "center",
                        height: "100%",
                    }}
                >
                    <Typography>
                        {message}
                    </Typography>
                </Box>
                ) : (<DataGrid
                    columns={columns}
                    data={rows}
                    loading={loading ? t("loading---", "Loading...") : undefined}
                    onRowSelect={handleRowSelect}
                    ref={dataGridRef}
                    onMount={dataGridMountHandler}
                    autoSaveId={slot.autoSaveId ?? slot.id}
                    mode={slot.mode}
                    onChange={(status) => setDataGridStatus(status)}
                    pivot={pivot}
                    pivotColumns={pivotColumns}
                    uniqueField={slot.uniqueField}
                    getRowStyle={slot.getRowStyle !== undefined ? (row, index) => slot.getRowStyle?.(row, index, theme) ?? {} : undefined}
                />
                )}
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