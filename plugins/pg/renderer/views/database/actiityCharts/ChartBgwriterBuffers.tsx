import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ActivityRecord } from "../activityTab";
import { CustomTooltip } from "./CustomTooltip";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import prettySize from "@renderer/utils/prettySize";

export const ChartBgwriterBuffers = ({ minimized, data }: { minimized: boolean, data: ActivityRecord[] }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={minimized ? { bottom: 20, top: 5, left: 0, right: 0 } : { bottom: 20, top: 5, left: 0, right: 0 }}>
                <defs>
                    <linearGradient id="colorBufCkpt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBufClean" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBufBackend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBufAlloc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0} />
                    </linearGradient>
                </defs>
                {!minimized && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
                {!minimized && <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={v => v === -1 ? "-" : String(v)} />}
                {!minimized && <YAxis yAxisId="left" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={prettySize} label={{ value: t("buffers-checkpoint-clean-backend", "Ckpt/Clean/Backend"), angle: -90, position: "insideLeft", fill: theme.palette.text.secondary, fontSize: 11 }} />}
                {!minimized && <YAxis yAxisId="right" orientation="right" stroke={theme.palette.secondary.main} style={{ fontSize: "0.75rem" }} tickFormatter={prettySize} label={{ value: t("buffers-alloc", "Buffers Alloc"), angle: -90, position: "insideRight", fill: theme.palette.secondary.main, fontSize: 11 }} />}
                {!minimized && <Tooltip content={<CustomTooltip />} />}
                {!minimized && <Legend wrapperStyle={{ fontSize: "0.7rem", marginBottom: 10 }} iconSize={10} />}
                <Area type="monotone" dataKey="buffers_checkpoint" yAxisId={minimized ? undefined : "left"} stroke={theme.palette.primary.main} fillOpacity={1} fill="url(#colorBufCkpt)" name={t("buffers-checkpoint", "Buffers Checkpoint")} isAnimationActive={false} connectNulls dot={false} />
                <Area type="monotone" dataKey="buffers_clean" yAxisId={minimized ? undefined : "left"} stroke={theme.palette.success.main} fillOpacity={1} fill="url(#colorBufClean)" name={t("buffers-clean", "Buffers Clean")} isAnimationActive={false} connectNulls dot={false} />
                <Area type="monotone" dataKey="buffers_backend" yAxisId={minimized ? undefined : "left"} stroke={theme.palette.warning.main} fillOpacity={1} fill="url(#colorBufBackend)" name={t("buffers-backend", "Buffers Backend")} isAnimationActive={false} connectNulls dot={false} />
                <Area type="monotone" dataKey="buffers_alloc" yAxisId={minimized ? undefined : "right"} stroke={theme.palette.secondary.main} fillOpacity={1} fill="url(#colorBufAlloc)" name={t("buffers-alloc", "Buffers Alloc")} isAnimationActive={false} connectNulls dot={false} />
            </AreaChart>
        </ResponsiveContainer>
    );
};