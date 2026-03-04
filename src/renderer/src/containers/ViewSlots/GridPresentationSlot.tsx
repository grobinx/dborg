import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { uuidv7 } from "uuidv7";

import DataPresentationGrid, { DataPresentationGridColumn } from "@renderer/components/DataGrid/DataPresentationGrid";
import {
    IGridPresentationSlot,
    resolveDataPresentationGridColumnsFactory,
    resolveRecordsAsyncFactory,
    resolveSortStateOptionsFactory,
} from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { useToast } from "@renderer/contexts/ToastContext";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { useSlotRuntimeContext } from "./hooks/useSlotRuntimeContext";

interface GridPresentationSlotProps {
    slot: IGridPresentationSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const GridPresentationSlot: React.FC<GridPresentationSlotProps> = ({ slot, ref }) => {
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const runtimeContext = useSlotRuntimeContext({});
    const { registerRefresh } = useViewSlot();
    const addToast = useToast();
    const { t } = useTranslation();

    const [rows, setRows] = React.useState<Record<string, any>[]>([]);
    const [columns, setColumns] = React.useState<DataPresentationGridColumn<Record<string, any>>[] | undefined>(undefined);
    const [message, setMessage] = React.useState<string | undefined>(undefined);
    const [loading, setLoading] = React.useState(false);
    const loadingRef = React.useRef(false);

    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slotId, () => {
            if (loadingRef.current) return;
            setPendingRefresh(true);
        });

        slot?.onMount?.(runtimeContext);

        return () => {
            unregisterRefresh();
            slot?.onUnmount?.(runtimeContext);
        };
    }, [slotId]);

    React.useEffect(() => {
        if (rootVisible && pendingRefresh) {
            setRefresh((prev) => prev + 1n);
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
                    setColumns(resolveDataPresentationGridColumnsFactory(slot.columns, runtimeContext));
                } else if (result && typeof result === "object") {
                    setMessage(undefined);
                    setRows(
                        Object.entries(result).map(([key, value]) => ({
                            name: key,
                            value,
                        }))
                    );
                    setColumns(undefined);
                } else if (typeof result === "string") {
                    setMessage(result);
                    setRows([]);
                    setColumns(undefined);
                } else {
                    setMessage(undefined);
                    setRows([]);
                    setColumns(undefined);
                }
            } catch (error) {
                addToast("error", t("refresh-failed", "Refresh failed"), { reason: error, source: "GridPresentationSlot" });
            } finally {
                setTimeout(() => {
                    setLoading(false);
                    loadingRef.current = false;
                }, 0);
            }
        };

        if (!loadingRef.current) {
            fetchRows();
        }
    }, [slot.rows, refresh]);

    return (
        <Stack
            direction="column"
            sx={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                position: "relative",
                minHeight: 0,
            }}
            ref={rootRef}
        >
            <Box
                key={slotId}
                ref={ref}
                sx={{
                    flex: 1,
                    minHeight: 0,
                    height: slot.height ?? "100%",
                    overflow: "hidden",
                }}
            >
                {message ? (
                    <Box
                        sx={{
                            p: 2,
                            color: "text.disabled",
                            textAlign: "center",
                            alignContent: "center",
                            height: "100%",
                        }}
                    >
                        <Typography>{message}</Typography>
                    </Box>
                ) : (
                    <DataPresentationGrid
                        data={rows}
                        columns={columns}
                        initialSort={resolveSortStateOptionsFactory(slot.initialSort, runtimeContext)}
                        loading={loading}
                        slotProps={{
                            container: {
                                sx: { height: "100%" },
                            },
                            table: {
                                sx: { tableLayout: "fixed" },
                            },
                        }}
                    />
                )}
            </Box>
        </Stack>
    );
};

export default GridPresentationSlot;