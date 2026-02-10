import React from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { DataGrid, DataGridChangeRow, DataGridRow } from "@renderer/components/DataGrid/DataGrid";
import { ColumnDefinition, DataGridActionContext, DataGridContext, DataGridStatus, TableCellPosition } from "@renderer/components/DataGrid/DataGridTypes";
import RefreshGridAction from "./actions/RefreshGridAction";
import {
    IGridSlot,
    IGridStatusButton,
    isGridStatusButton,
    resolveActionFactory,
    resolveActionGroupFactory,
    resolveBooleanFactory,
    resolveColumnDefinitionsFactory,
    resolveRecordsAsyncFactory,
    resolveRecordsChangeFactory,
    resolveStringFactory,
    SlotRuntimeContext,
} from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { useToast } from "@renderer/contexts/ToastContext";
import { useTranslation } from "react-i18next";
import { useRefSlot } from "./RefSlotContext";
import DataGridStatusBar, { DataGridStatusPart } from "@renderer/components/DataGrid/DataGridStatusBar";
import debounce from "@renderer/utils/debounce";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { StatusBarButton } from "@renderer/app/StatusBar";
import { resolveIcon } from "@renderer/themes/icons";
import { createProgressBarContent } from "./helpers";
import { uuidv7 } from "uuidv7";
import { useDialogs } from "@toolpad/core";

interface GridSlotProps {
    slot: IGridSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const GridSlot: React.FC<GridSlotProps> = ({
    slot, ref
}) => {
    const theme = useTheme();
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const addToast = useToast();
    const { confirm } = useDialogs();
    const { registerRefresh, refreshSlot, openDialog } = useViewSlot();
    const { registerRefSlot } = useRefSlot();
    const { t } = useTranslation();
    const runtimeContext: SlotRuntimeContext = React.useMemo(() => ({
        theme, refresh: refreshSlot, openDialog,
        showNotification: ({ message, severity = "info" }) => {
            addToast(severity, message);
        },
        showConfirmDialog: async ({ message, title, severity, cancelLabel, confirmLabel }) => {
            return confirm(message, { title, severity, okText: confirmLabel, cancelText: cancelLabel });
        },
    }), [theme, refreshSlot, openDialog, addToast, confirm]);
    const dataGridRef = React.useRef<DataGridActionContext<any> | null>(null);
    const [rows, setRows] = React.useState<Record<string, any>[]>([]);
    const [changes, setChanges] = React.useState<DataGridChangeRow<Record<string, any>>[] | undefined>(undefined);
    const [columns, setColumns] = React.useState<ColumnDefinition[]>([]);
    const [pivotColumns, setPivotColumns] = React.useState<ColumnDefinition[] | undefined>(undefined);
    const [loading, setLoading] = React.useState(false);
    const loadingRef = React.useRef(false);
    const [message, setMessage] = React.useState<string | undefined>(undefined);
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [pivot, setPivot] = React.useState(resolveBooleanFactory(slot.pivot, runtimeContext) ?? false);
    const [dataGridStatus, setDataGridStatus] = React.useState<DataGridStatus | undefined>(undefined);
    const [dataGridStatuses, setDataGridStatuses] = React.useState<DataGridStatusPart[] | undefined>(undefined);
    const [dataGridStatusesFunctions, setDataGridStatusesFunctions] = React.useState<IGridStatusButton[] | undefined>(undefined);
    const statusBarRef = React.useRef<HTMLDivElement>(null);
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();
    const [, reRender] = React.useState<bigint>(0n);
    const [rebuildDisplayData, setRebuildDisplayData] = React.useState<bigint>(0n);
    const [progressBar, setProgressBar] = React.useState<{
        ref: React.Ref<HTMLDivElement>,
        node: React.ReactNode
    }>({ ref: React.createRef<HTMLDivElement>(), node: null });

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slotId, (redraw) => {
            if (loadingRef.current) return;

            if (redraw === "only") {
                reRender(prev => prev + 1n);
            } else if (redraw === "compute") {
                setRebuildDisplayData(prev => prev + 1n);
            } else {
                setPendingRefresh(true);
            }
        });
        const unregisterRefSlot = registerRefSlot(slotId, "datagrid", dataGridRef);
        slot?.onMount?.(runtimeContext);
        return () => {
            unregisterRefresh();
            unregisterRefSlot();
            slot?.onUnmount?.(runtimeContext);
        };
    }, [slotId]);

    React.useEffect(() => {
        if (rootVisible && pendingRefresh) {
            setRefresh(prev => prev + 1n);
            setPendingRefresh(false);
        }
    }, [rootVisible, pendingRefresh]);

    React.useEffect(() => {
        if (rootVisible) {
            slot?.onShow?.(runtimeContext);
        } else {
            slot?.onHide?.(runtimeContext);
        }
    }, [rootVisible]);

    React.useEffect(() => {
        const fetchRows = async () => {
            setLoading(true);
            loadingRef.current = true;
            try {
                const result = await resolveRecordsAsyncFactory(slot.rows, runtimeContext);
                if (Array.isArray(result)) {
                    setMessage(undefined);
                    setRows(result ?? []);
                    setColumns(resolveColumnDefinitionsFactory(slot.columns, runtimeContext) ?? []);
                    setPivotColumns(resolveColumnDefinitionsFactory(slot.pivotColumns, runtimeContext));
                    setPivot(resolveBooleanFactory(slot.pivot, runtimeContext) ?? false);
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
                const changesResult = resolveRecordsChangeFactory(slot.changes, runtimeContext);
                setChanges(changesResult);
            } catch (error) {
                addToast("error", t("refresh-failed", "Refresh failed"), { reason: error, source: "GridSlot", });
            } finally {
                setTimeout(() => {
                    setLoading(false);
                    loadingRef.current = false;
                }, 0);
            }
        };
        setProgressBar(prev => ({
            ...prev,
            node: slot.progress ? createProgressBarContent(slot.progress, runtimeContext, prev.ref, true) : null,
        }));
        if (!loadingRef.current) {
            fetchRows();
        }
    }, [slot.columns, slot.rows, refresh]);

    // Debounced click handler
    const rowClick = React.useMemo(
        () =>
            debounce((row: Record<string, any> | undefined) => {
                slot.onRowSelect?.(row, runtimeContext);
            }, 250),
        [slotId, runtimeContext]
    );

    React.useEffect(() => {
        return () => rowClick.cancel();
    }, [rowClick]);

    React.useEffect(() => {
        if (slot.statuses && slot.statuses.length > 0) {
            const funcs: IGridStatusButton[] = [];
            const parts: DataGridStatusPart[] = [];
            slot.statuses.forEach(status => {
                if (isGridStatusButton(status)) {
                    funcs.push(status);
                } else {
                    parts.push(status);
                }
            });
            setDataGridStatusesFunctions(funcs);
            setDataGridStatuses(parts);
        } else {
            setDataGridStatusesFunctions(undefined);
            setDataGridStatuses(undefined);
        }
    }, [slot.statuses, dataGridStatus]);

    function dataGridMountHandler(context: DataGridContext<any>): void {
        const actionGroups = resolveActionGroupFactory(slot.actionGroups, runtimeContext) ?? [];
        if (actionGroups.length) {
            context.addActionGroup(...actionGroups);
        }
        const actions = resolveActionFactory(slot.actions, runtimeContext) ?? [];
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

    return (
        <Stack
            direction="column"
            sx={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                position: "relative",
            }}
            ref={rootRef}
        >
            {progressBar.node}
            <Box
                key={slotId}
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
                    changes={changes}
                    loading={loading ? t("loading---", "Loading...") : undefined}
                    onRowSelect={handleRowSelect}
                    ref={dataGridRef}
                    onMount={dataGridMountHandler}
                    autoSaveId={slot.autoSaveId ?? slotId}
                    mode={slot.mode ?? "defined"}
                    onChange={(status) => setDataGridStatus(status)}
                    pivot={pivot}
                    pivotColumns={pivotColumns}
                    uniqueField={slot.uniqueField}
                    getRowStyle={slot.getRowStyle !== undefined ? (row, index) => slot.getRowStyle?.(row, index, theme) ?? {} : undefined}
                    onCancelLoading={slot.onCancel ? () => slot.onCancel!(runtimeContext) : undefined}
                    overlayMode={slot.overlayMode ?? "small"}
                    searchText={resolveStringFactory(slot.searchText, runtimeContext)}
                    rebuildDisplayData={rebuildDisplayData}
                    columnRowNumber={resolveBooleanFactory(slot.canSelectRows, runtimeContext)}
                />
                )}
            </Box>
            {slot.statuses && slot.statuses.length > 0 && (
                <DataGridStatusBar
                    ref={statusBarRef}
                    status={dataGridStatus}
                    statuses={dataGridStatuses}
                    buttons={dataGridStatusesFunctions && dataGridStatusesFunctions.length > 0 ? {
                        last: dataGridStatusesFunctions.map((button, index) => {
                            const toolTip = resolveStringFactory(button.tooltip, runtimeContext);
                            const icon = resolveIcon(theme, button.icon);
                            const label = resolveStringFactory(button.label, runtimeContext);
                            return (
                                <StatusBarButton
                                    key={index}
                                    toolTip={toolTip}
                                    onClick={button.onClick ? () => button.onClick?.(runtimeContext) : undefined}
                                >
                                    {icon}
                                    {label}
                                </StatusBarButton>
                            );
                        }),
                    } : undefined}
                />)
            }
        </Stack >
    );
};

export default GridSlot;