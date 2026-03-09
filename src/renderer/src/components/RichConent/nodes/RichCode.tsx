import React from "react";
import { Box, Paper, useTheme, Typography } from "@mui/material";
import { IRichCode } from "../types";

interface RichCodeProps {
    node: IRichCode;
}

const RichCode: React.FC<RichCodeProps> = ({ node }) => {
    const theme = useTheme();

    return (
        <Paper
            sx={{
                backgroundColor: theme.palette.mode === "dark" ? theme.palette.grey[900] : theme.palette.grey[100],
                padding: "12px",
                borderRadius: "4px",
                overflow: "auto",
                border: `1px solid ${theme.palette.divider}`,
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {node.lineNumbers && (
                    <Box
                        sx={{
                            display: "inline-flex",
                            flexDirection: "column",
                            paddingRight: "12px",
                            color: theme.palette.text.secondary,
                            fontSize: "12px",
                            fontFamily: "monospace",
                            lineHeight: "1.5",
                            userSelect: "none",
                        }}
                    >
                        {node.code.split("\n").map((_, i) => (
                            <span key={i}>{i + 1}</span>
                        ))}
                    </Box>
                )}
                <Typography
                    component="pre"
                    sx={{
                        margin: 0,
                        fontFamily: "monospace",
                        fontSize: "12px",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        lineHeight: "1.5",
                        color: theme.palette.mode === "dark" ? theme.palette.grey[300] : theme.palette.grey[800],
                    }}
                >
                    {node.code}
                </Typography>
            </Box>
        </Paper>
    );
};

export default RichCode;
