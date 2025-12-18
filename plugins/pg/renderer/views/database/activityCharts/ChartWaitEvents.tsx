import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ActivityRecord } from "../activityTab";
import SnapshotTooltip from "../../Components/SnapshotTooltip";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import Legend from "../../Components/Legend";
import Tooltip from "../../Components/Tooltip";

export const ChartWaitEvents = ({ minimized, data }: { minimized: boolean, data: ActivityRecord[] }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ bottom: 20, top: 5, left: 0, right: 0 }}>
                <defs>
                    <linearGradient id="colorWaitLock" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorWaitLWLock" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorWaitIO" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.main.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.main.main} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorWaitIPC" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorWaitTimeout" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorWaitBufferPin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorWaitClient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} />
                    </linearGradient>
                </defs>
                {!minimized && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
                {!minimized && <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={v => v === -1 ? "-" : String(v)} />}
                {!minimized && <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} />}
                {!minimized && <Tooltip content={<SnapshotTooltip />} />}
                {!minimized && <Legend />}
                <Area type="monotone" dataKey="wait_lock" stroke={theme.palette.error.main} fillOpacity={1} fill="url(#colorWaitLock)" name={t("wait-lock", "Lock")} isAnimationActive={false} connectNulls dot={false} />
                <Area type="monotone" dataKey="wait_lwlock" stroke={theme.palette.warning.main} fillOpacity={1} fill="url(#colorWaitLWLock)" name={t("wait-lwlock", "LWLock")} isAnimationActive={false} connectNulls dot={false} />
                <Area type="monotone" dataKey="wait_bufferpin" stroke={theme.palette.primary.main} fillOpacity={1} fill="url(#colorWaitBufferPin)" name={t("wait-bufferpin", "BufferPin")} isAnimationActive={false} connectNulls dot={false} />
                <Area type="monotone" dataKey="wait_io" stroke={theme.palette.main.main} fillOpacity={1} fill="url(#colorWaitIO)" name={t("wait-io", "IO")} isAnimationActive={false} connectNulls dot={false} />
                <Area type="monotone" dataKey="wait_ipc" stroke={theme.palette.info.main} fillOpacity={1} fill="url(#colorWaitIPC)" name={t("wait-ipc", "IPC")} isAnimationActive={false} connectNulls dot={false} />
                <Area type="monotone" dataKey="wait_client" stroke={theme.palette.success.main} fillOpacity={1} fill="url(#colorWaitClient)" name={t("wait-client", "Client")} isAnimationActive={false} connectNulls dot={false} />
                <Area type="monotone" dataKey="wait_timeout" stroke={theme.palette.secondary.main} fillOpacity={1} fill="url(#colorWaitTimeout)" name={t("wait-timeout", "Timeout")} isAnimationActive={false} connectNulls dot={false} />
            </AreaChart>
        </ResponsiveContainer>
    );
};