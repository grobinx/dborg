import React from "react";
import { Box, TableCellProps } from "@mui/material";
import DataPresentationGrid, { DataPresentationGridColumn } from "@renderer/components/DataGrid/DataPresentationGrid";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";
import { IRichEnvironment, IRichTable, IRichTableRow, RichNode } from "../types";
import RichRenderer, { resolveRichValue, resolveRichValueFromFunction, RichProp } from "..";
import Tooltip from "@renderer/components/Tooltip";

interface RichTableProps extends RichProp {
    node: Optional<IRichTable, "type">;
    environment?: IRichEnvironment;
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

const renderRichValue = (value: RichNode | undefined, environment?: IRichEnvironment): React.ReactNode => {
    if (value === null || value === undefined) return null;
    if (Array.isArray(value)) {
        return <RichRenderer node={{ type: "row", items: value }} environment={environment} />;
    }
    return <RichRenderer node={value} environment={environment} textVariant="body" />;
};

const RichTable: React.FC<RichTableProps> = ({ node, environment, refreshId }) => {
    const [rows, setRows] = React.useState<IRichTableRow[] | null>(resolveRichValue(node.rows));

    React.useEffect(() => {
        resolveRichValueFromFunction(node.rows, setRows, node);
    }, [node.rows, refreshId]);

    const columns = React.useMemo<DataPresentationGridColumn<IRichTableRow>[]>(() => {
        return node.columns.map((column) => ({
            key: column.key,
            label: renderRichValue(column.header ?? column.key, environment),
            align: toTableAlign(column.align),
            width: column.width,
            sortable: false,
            formatter: (value) => renderRichValue(value as RichNode, environment),
        }));
    }, [node.columns, environment]);

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
                gap: environment?.theme?.gap ?? 4,
                padding: environment?.theme?.padding ?? 4,
            }}
        >
            {node.title && <RichRenderer node={node.title} environment={environment} textVariant="title-sm" />}

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
                            padding: environment?.theme ? `${environment.theme.padding} !important` : undefined,
                        }
                    },
                    td: {
                        sx: {
                            fontWeight: "inherit",
                            fontSize: "inherit",
                            fontFamily: "inherit",
                            lineHeight: "inherit",
                            padding: environment?.theme ? `${environment.theme.padding} !important` : undefined,
                        }
                    },
                }}
            />
        </Box>
    );

    if (node.tooltip) {
        return (
            <Tooltip title={<RichRenderer node={node.tooltip} environment={environment} />}>
                {result}
            </Tooltip>
        );
    }

    return result;

};

export default RichTable;