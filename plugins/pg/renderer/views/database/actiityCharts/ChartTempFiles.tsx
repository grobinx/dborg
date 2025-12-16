import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import prettySize from "@renderer/utils/prettySize";
import { ActivityRecord } from "../activityTab";
import { CustomTooltip } from "./CustomTooltip";

export const ChartTempFiles = ({ minimized, data }: { minimized: boolean, data: ActivityRecord[] }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={minimized ? { bottom: 0, top: 0, left: 0, right: 0 } : { bottom: 30, top: 5, left: 0, right: 0 }}>
                <defs>
                    <linearGradient id="colorTempFiles" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTempBytes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} />
                    </linearGradient>
                </defs>
                {!minimized && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
                {!minimized && <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={v => v === -1 ? "-" : String(v)} />}
                {!minimized && <YAxis yAxisId="left" stroke={theme.palette.info.main} style={{ fontSize: "0.75rem" }} tickFormatter={prettySize} label={{ value: t("temp-files", "Temp Files"), angle: -90, position: "insideLeft", fill: theme.palette.info.main, fontSize: 12 }} />}
                {!minimized && <YAxis yAxisId="right" orientation="right" stroke={theme.palette.success.main} style={{ fontSize: "0.75rem" }} tickFormatter={prettySize} label={{ value: t("temp-bytes", "Temp Bytes"), angle: -90, position: "insideRight", fill: theme.palette.success.main, fontSize: 12 }} />}
                {!minimized && <Tooltip content={<CustomTooltip />} />}
                {!minimized && <Legend wrapperStyle={{ fontSize: "0.7rem" }} iconSize={10} />}
                <Area type="monotone" dataKey="temp_files" yAxisId={minimized ? undefined : "left"} stroke={theme.palette.info.main} fillOpacity={1} fill="url(#colorTempFiles)" name={t("temp-files", "Temp Files")} isAnimationActive={false} connectNulls dot={false} />
                <Area type="monotone" dataKey="temp_bytes" yAxisId={minimized ? undefined : "right"} stroke={theme.palette.success.main} fillOpacity={1} fill="url(#colorTempBytes)" name={t("temp-bytes", "Temp Bytes")} isAnimationActive={false} connectNulls dot={false} />
            </AreaChart>
        </ResponsiveContainer>
    );
};