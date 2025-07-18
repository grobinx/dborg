import { Duration, DurationUnits } from "luxon";

export function durationToHuman(duration: Duration, options?: { unitDisplay?: "narrow" | "short" | "long" }): string {
    const parts: DurationUnits = ["seconds"];
    if (duration.milliseconds > 3600 * 1000) parts.push("hour");
    if (duration.milliseconds > 60 * 1000) parts.push("minutes");
    return duration
        .shiftTo(...parts)
        .normalize()
        .toHuman({ unitDisplay: options?.unitDisplay ?? "narrow" });
}