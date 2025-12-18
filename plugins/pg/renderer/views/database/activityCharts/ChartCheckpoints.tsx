import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ActivityRecord } from "../activityTab";
import SnapshotTooltip from "../../Components/SnapshotTooltip";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import Legend from "../../Components/Legend";
import Tooltip from "../../Components/Tooltip";

export const ChartCheckpoints = ({ minimized, data }: { minimized: boolean, data: ActivityRecord[] }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ bottom: 20, top: 5, left: 0, right: 0 }}>
                <defs>
                    <linearGradient id="colorCkptTimed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCkptReq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0} />
                    </linearGradient>
                </defs>
                {!minimized && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
                {!minimized && <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={v => v === -1 ? "-" : String(v)} />}
                {!minimized && <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} />}
                {!minimized && <Tooltip content={<SnapshotTooltip />} />}
                {!minimized && <Legend />}
                <Area type="monotone" dataKey="checkpoints_timed" stroke={theme.palette.info.main} fillOpacity={1} fill="url(#colorCkptTimed)" name={t("checkpoints-timed", "Timed")} isAnimationActive={false} connectNulls dot={false} />
                <Area type="monotone" dataKey="checkpoints_req" stroke={theme.palette.error.main} fillOpacity={1} fill="url(#colorCkptReq)" name={t("checkpoints-req", "Requested")} isAnimationActive={false} connectNulls dot={false} />
            </AreaChart>
        </ResponsiveContainer>
    );
};