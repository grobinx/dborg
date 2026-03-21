import React from "react";
import { Box, SxProps, Theme } from "@mui/material";
import { IRichEnvironment, IRichMetadata, RichNode, RichSeverity, RichTextVariant, RichValue } from "./types";

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
    IRichSection,
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
    IRichContainerTheme as IRichContainerDefaults,
    IRichBadge,
    IRichStat,
    IRichSwitch,
    IRichTimeline,
    IRichTable,
    IRichSkeleton,
    IRichMetric,
    IRichBullet,
    IRichRefresh,
    IRichSparkline,
    IRichCallout,
    IRichTree,
    IRichWidget,
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
import RichBullet from "./nodes/RichBullet";
import RichRefresh from "./nodes/RichRefresh";
import RichSparkline from "./nodes/RichSparkline";
import RichCallout from "./nodes/RichCallout";
import RichWidget from "./nodes/RichWidget";
import RichCounter from "./nodes/RichCounter";

// Containers (import second)
import RichRow from "./containers/RichRow";
import RichColumn from "./containers/RichColumn";
import RichSection from "./containers/RichSection";
import RichList from "./containers/RichList";
import RichTable from "./containers/RichTable";
import RichGroup from "./containers/RichGroup";
import RichTree from "./containers/RichTree";
import { Optional } from "@renderer/types/universal";

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
export { default as RichBullet } from "./nodes/RichBullet";
export { default as RichRefresh } from "./nodes/RichRefresh";
export { default as RichSparkline } from "./nodes/RichSparkline";
export { default as RichCallout } from "./nodes/RichCallout";
export { default as RichWidget } from "./nodes/RichWidget";
export { default as RichCounter } from "./nodes/RichCounter";

// Export containers
export { default as RichRow } from "./containers/RichRow";
export { default as RichColumn } from "./containers/RichColumn";
export { default as RichSection } from "./containers/RichSection";
export { default as RichList } from "./containers/RichList";
export { default as RichContainer } from "./containers/RichContainer";
export { default as RichTable } from "./containers/RichTable";
export { default as RichGroup } from "./containers/RichGroup";
export { default as RichTree } from "./containers/RichTree";

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

export async function resolveRichValueFromFunction<V = any>(
    resolvable: RichValue<V>, 
    set: React.Dispatch<React.SetStateAction<V | null>>,
    node: IRichMetadata,
): Promise<V | null | undefined> {
    if (typeof resolvable === "function") {
        if (node.data === undefined) {
            node.data = {};
        }
        const value = await (resolvable as (data: Record<string, any>) => Promise<V>)(node.data);
        set(value);
        return value;
    }
    set(resolvable);
    return resolvable;
}

/**
 * Bazowy interfejs dla wszystkich węzłów Rich Content, zawierający wspólne właściwości,
 */
export interface RichProp {
    /**
     * Zwiększany licznik odświerzania dla potrzeb niektórych węzłów
     */
    refreshId?: bigint;
    /**
     * Dodatkowe style MUI dla węzła
     */
    sx?: SxProps;
}

/**
 * Główny komponent renderujący węzły Rich Content.
 * Robi dispatch do odpowiedniego komponentu na podstawie typu węzła.
 */
const RichRenderer: React.FC<{
    node: RichNode;
    environment?: IRichEnvironment;
    /**
     * Opcjonalny wariant tekstu dla prostych stringów/numberów. Domyślnie "body".
     */
    textVariant?: RichTextVariant;
    /**
     * Opcjonalny poziom ważności wpływający na kolor tekstu dla prostych stringów/numberów.
     */
    textSeverity?: RichSeverity;

    refreshId?: bigint;
}> = ({ node, environment, textVariant, textSeverity, refreshId }) => {
    if (node === null || node === undefined || node === false) {
        return null;
    }

    if (Array.isArray(node)) {
        return <RichRow node={{ items: node }} environment={environment} refreshId={refreshId} />;
    } else if (typeof node === "string" || typeof node === "number") {
        return <RichText node={{ text: String(node), variant: textVariant, severity: textSeverity }} environment={environment} refreshId={refreshId} />;
    }

    switch (node.type) {
        case "text":
            return <RichText node={node} environment={environment} refreshId={refreshId} />;
        case "divider":
            return <RichDividerNode node={node} environment={environment} refreshId={refreshId} />;
        case "spacer":
            return <RichSpacer node={node} environment={environment} refreshId={refreshId} />;
        case "icon":
            return <RichIcon node={node} environment={environment} refreshId={refreshId} />;
        case "link":
            return <RichLink node={node} environment={environment} refreshId={refreshId} />;
        case "chip":
            return <RichChip node={node} environment={environment} refreshId={refreshId} />;
        case "kbd":
            return <RichKbd node={node} environment={environment} refreshId={refreshId} />;
        case "progress":
            return <RichProgress node={node} environment={environment} refreshId={refreshId} />;
        case "code":
            return <RichCode node={node} environment={environment} refreshId={refreshId} />;
        case "image":
            return <RichImage node={node} environment={environment} refreshId={refreshId} />;
        case "stat":
            return <RichStat node={node} environment={environment} refreshId={refreshId} />;
        case "alert":
            return <RichAlert node={node} environment={environment} refreshId={refreshId} />;
        case "action":
            return <RichAction node={node} environment={environment} refreshId={refreshId} />;
        case "row":
            return <RichRow node={node} environment={environment} refreshId={refreshId} />;
        case "column":
            return <RichColumn node={node} environment={environment} refreshId={refreshId} />;
        case "section":
            return <RichSection node={node} environment={environment} refreshId={refreshId} />;
        case "group":
            return <RichGroup node={node} environment={environment} refreshId={refreshId} />;
        case "list":
            return <RichList node={node} environment={environment} refreshId={refreshId} />;
        case "switch":
            return <RichSwitch node={node} environment={environment} refreshId={refreshId} />;
        case "timeline":
            return <RichTimeline node={node} environment={environment} refreshId={refreshId} />;
        case "table":
            return <RichTable node={node} environment={environment} refreshId={refreshId} />;
        case "skeleton":
            return <RichSkeleton node={node} environment={environment} refreshId={refreshId} />;
        case "metric":
            return <RichMetric node={node} environment={environment} refreshId={refreshId} />;
        case "bullet":
            return <RichBullet node={node} environment={environment} refreshId={refreshId} />;
        case "refresh":
            return <RichRefresh node={node} environment={environment} refreshId={refreshId} />;
        case "sparkline":
            return <RichSparkline node={node} environment={environment} refreshId={refreshId} />;
        case "callout":
            return <RichCallout node={node} environment={environment} refreshId={refreshId} />;
        case "tree":
            return <RichTree node={node} environment={environment} refreshId={refreshId} />;
        case "widget":
            return <RichWidget node={node} environment={environment} refreshId={refreshId} />;
        case "counter":
            return <RichCounter node={node} environment={environment} refreshId={refreshId} />;
        default:
            return <Box>Unknown node type: {(node as any).type}</Box>;
    }
};

// Export main renderer
export { RichRenderer };
export default RichRenderer;
