import React from "react";
import { Box, Theme } from "@mui/material";
import { IRichContainerDefaults, RichNode, RichSeverity, RichTextVariant, RichValue } from "./types";

// Types
export type {
    RichSeverity,
    RichTextVariant,
    RichNodeType,
    RichNode,
} from "./types";
export type {
    IRichNode,
    IRichDivider,
    IRichChip,
    IRichText,
    IRichLink,
    IRichCode,
    IRichProgress,
    IRichIcon,
    IRichGroup,
    IRichRow,
    IRichColumn,
    IRichSpacer,
    IRichAlert,
    IRichKbd,
    IRichAction,
    IRichImage,
    IRichList,
    IRichListItem,
    IRichContainer,
    IRichContainerDefaults,
    IRichBadge,
} from "./types";
export { RichDivider } from "./types";

// Nodes (import first)
import RichText from "./nodes/RichText";
import RichDividerNode from "./nodes/RichDivider";
import RichSpacer from "./nodes/RichSpacer";
import RichIcon from "./nodes/RichIcon";
import RichLink from "./nodes/RichLink";
import RichChip from "./nodes/RichChip";
import RichKbd from "./nodes/RichKbd";
import RichProgress from "./nodes/RichProgress";
import RichCode from "./nodes/RichCode";
import RichImage from "./nodes/RichImage";
import RichAlert from "./nodes/RichAlert";
import RichAction from "./nodes/RichAction";
import RichStat from "./nodes/RichStat";
import RichSwitch from "./nodes/RichSwitch";
import RichTimeline from "./nodes/RichTimeline";
import RichSkeleton from "./nodes/RichSkeleton";
import RichMetric from "./nodes/RichMetric";

// Containers (import second)
import RichRow from "./containers/RichRow";
import RichColumn from "./containers/RichColumn";
import RichGroup from "./containers/RichGroup";
import RichList from "./containers/RichList";
import RichTable from "./containers/RichTable";

// Export not typed components
export { default as RichBadge } from "./nodes/RichBadge";

// Export nodes
export { default as RichText } from "./nodes/RichText";
export { default as RichSpacer } from "./nodes/RichSpacer";
export { default as RichDividerComponent } from "./nodes/RichDivider";
export { default as RichIcon } from "./nodes/RichIcon";
export { default as RichLink } from "./nodes/RichLink";
export { default as RichChip } from "./nodes/RichChip";
export { default as RichKbd } from "./nodes/RichKbd";
export { default as RichProgress } from "./nodes/RichProgress";
export { default as RichCode } from "./nodes/RichCode";
export { default as RichImage } from "./nodes/RichImage";
export { default as RichAlert } from "./nodes/RichAlert";
export { default as RichAction } from "./nodes/RichAction";
export { default as RichStat } from "./nodes/RichStat";
export { default as RichSwitch } from "./nodes/RichSwitch";
export { default as RichTimeline } from "./nodes/RichTimeline";
export { default as RichSkeleton } from "./nodes/RichSkeleton";
export { default as RichMetric } from "./nodes/RichMetric";

// Export containers
export { default as RichRow } from "./containers/RichRow";
export { default as RichColumn } from "./containers/RichColumn";
export { default as RichGroup } from "./containers/RichGroup";
export { default as RichList } from "./containers/RichList";
export { default as RichContainer } from "./containers/RichContainer";
export { default as RichTable } from "./containers/RichTable";

export const getSeverityColor = (severity: RichSeverity | undefined, theme: Theme, contrastText: boolean = false): string => {
    switch (severity) {
        case "error":
            return contrastText ? theme.palette.error.contrastText : theme.palette.error.main;
        case "warning":
            return contrastText ? theme.palette.warning.contrastText : theme.palette.warning.main;
        case "success":
            return contrastText ? theme.palette.success.contrastText : theme.palette.success.main;
        case "info":
            return contrastText ? theme.palette.info.contrastText : theme.palette.info.main;
        default:
            return "inherit";
    }
};


export function resolveRichValue<V = any>(resolvable: RichValue<V>): V | null {
    if (resolvable !== null && typeof resolvable !== "function") {
        return resolvable;
    }
    return null;
}

export async function resolveRichValueFromFunction<V = any>(resolvable: RichValue<V>, set: React.Dispatch<React.SetStateAction<V | null>>) {
    if (typeof resolvable === "function") {
        const value = await (resolvable as () => Promise<V>)();
        set(value);
    }
}

/**
 * Główny komponent renderujący węzły Rich Content.
 * Robi dispatch do odpowiedniego komponentu na podstawie typu węzła.
 */
const RichRenderer: React.FC<{
    node: RichNode;
    defaults?: IRichContainerDefaults;
    /**
     * Opcjonalny wariant tekstu dla prostych stringów/numberów. Domyślnie "body".
     */
    textVariant?: RichTextVariant;
    /**
     * Opcjonalny poziom ważności wpływający na kolor tekstu dla prostych stringów/numberów.
     */
    textSeverity?: RichSeverity;
}> = ({ node, defaults, textVariant, textSeverity }) => {
    if (node === null) {
        return null;
    }

    if (Array.isArray(node)) {
        return <RichRow node={{ items: node }} defaults={defaults} />;
    } else if (typeof node === "string" || typeof node === "number") {
        return <RichText node={{ text: String(node), variant: textVariant, severity: textSeverity }} defaults={defaults} />;
    }
    
    switch (node.type) {
        case "text":
            return <RichText node={node} defaults={defaults} />;
        case "divider":
            return <RichDividerNode node={node} defaults={defaults} />;
        case "spacer":
            return <RichSpacer node={node} defaults={defaults} />;
        case "icon":
            return <RichIcon node={node} defaults={defaults} />;
        case "link":
            return <RichLink node={node} defaults={defaults} />;
        case "chip":
            return <RichChip node={node} defaults={defaults} />;
        case "kbd":
            return <RichKbd node={node} defaults={defaults} />;
        case "progress":
            return <RichProgress node={node} defaults={defaults} />;
        case "code":
            return <RichCode node={node} defaults={defaults} />;
        case "image":
            return <RichImage node={node} defaults={defaults} />;
        case "stat":
            return <RichStat node={node} defaults={defaults} />;
        case "alert":
            return <RichAlert node={node} defaults={defaults} />;
        case "action":
            return <RichAction node={node} defaults={defaults} />;
        case "row":
            return <RichRow node={node} defaults={defaults} />;
        case "column":
            return <RichColumn node={node} defaults={defaults} />;
        case "group":
            return <RichGroup node={node} defaults={defaults} />;
        case "list":
            return <RichList node={node} defaults={defaults} />;
        case "switch":
            return <RichSwitch node={node} defaults={defaults} />;
        case "timeline":
            return <RichTimeline node={node} defaults={defaults} />;
        case "table":
            return <RichTable node={node} defaults={defaults} />;
        case "skeleton":
            return <RichSkeleton node={node} defaults={defaults} />;
        case "metric":
            return <RichMetric node={node} defaults={defaults} />;
        default:
            return <Box>Unknown node type: {(node as any).type}</Box>;
    }
};

// Export main renderer
export { RichRenderer };
export default RichRenderer;
