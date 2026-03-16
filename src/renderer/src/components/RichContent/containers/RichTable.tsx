import React from "react";
import { Box, TableCellProps } from "@mui/material";
import DataPresentationGrid, { DataPresentationGridColumn } from "@renderer/components/DataGrid/DataPresentationGrid";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";
import { IRichContainerDefaults, IRichTable, IRichTableRow, RichNode } from "../types";
import RichRenderer, { resolveRichValue, resolveRichValueFromFunction } from "..";
import Tooltip from "@renderer/components/Tooltip";

interface RichTableProps {
    node: Optional<IRichTable, "type">;
    defaults?: IRichContainerDefaults;
}

const toTableAlign = (align?: "start" | "center" | "end"): TableCellProps["align"] => {
    switch (align) {
        case "center":
            return "center";
        case "end":
            return "right";
        case "start":
        default:
            return "left";
    }
};

const renderRichValue = (value: RichNode | undefined, defaults?: IRichContainerDefaults): React.ReactNode => {
    if (value === null || value === undefined) return null;
    if (Array.isArray(value)) {
        return <RichRenderer node={{ type: "row", items: value }} defaults={defaults} />;
    }
    return <RichRenderer node={value} defaults={defaults} textVariant="body" />;
};

const RichTable: React.FC<RichTableProps> = ({ node, defaults }) => {
    const [rows, setRows] = React.useState<IRichTableRow[] | null>(resolveRichValue(node.rows));

    React.useEffect(() => {
        resolveRichValueFromFunction(node.rows, setRows);
    }, [node.rows]);

    const columns = React.useMemo<DataPresentationGridColumn<IRichTableRow>[]>(() => {
        return node.columns.map((column) => ({
            key: column.key,
            label: renderRichValue(column.header ?? column.key, defaults),
            align: toTableAlign(column.align),
            width: column.width,
            sortable: false,
            formatter: (value) => renderRichValue(value as RichNode, defaults),
        }));
    }, [node.columns, defaults]);

    if (node.excluded) {
        return null;
    }

    const result = (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-table", node.className)}
            style={node.style}
            sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: defaults?.gap ?? 4,
                padding: defaults?.padding ?? 4,
            }}
        >
            {node.title && <RichRenderer node={node.title} defaults={defaults} textVariant="title-sm" />}

            <DataPresentationGrid<IRichTableRow>
                data={rows ?? []}
                columns={columns}
                showHeader={node.showHeader}
                loading={rows === null}
                slotProps={{
                    container: {
                        sx: {
                            maxHeight: node.height ?? undefined
                        }
                    },
                    table: {
                        sx: {
                            tableLayout: "fixed",
                        },
                    },
                    th: {
                        sx: {
                            fontWeight: "inherit",
                            fontSize: "inherit",
                            fontFamily: "inherit",
                            lineHeight: "inherit",
                        }
                    },
                    td: {
                        sx: {
                            fontWeight: "inherit",
                            fontSize: "inherit",
                            fontFamily: "inherit",
                            lineHeight: "inherit",
                        }
                    },
                }}
            />
        </Box>
    );

    if (node.tooltip) {
        return (
            <Tooltip title={<RichRenderer node={node.tooltip} defaults={defaults} />}>
                {result}
            </Tooltip>
        );
    }

    return result;

};

export default RichTable;