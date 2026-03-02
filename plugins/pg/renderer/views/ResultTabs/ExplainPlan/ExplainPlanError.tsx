import { useTranslation } from "react-i18next";
import { ErrorResult } from "./ExplainTypes";
import { Box, Paper, Typography } from "@mui/material";

export const ExplainPlanError: React.FC<{ error: ErrorResult }> = ({ error }) => {
    const { t } = useTranslation();
    return (
        <Box sx={{ px: 8, py: 4, height: '100%', overflow: 'auto' }}>
            <Paper sx={{ px: 8, py: 4, backgroundColor: 'error.main', color: 'error.contrastText' }}>
                <Typography variant="h6" gutterBottom>
                    {t("error-executing-explain", "Error executing EXPLAIN")}
                </Typography>
                <Typography sx={{ fontFamily: 'monospace', }}>
                    {t("error-message", "Error Message")}: {error.error.message}
                </Typography>
                {error.error.stack && (
                    <Typography sx={{ fontFamily: 'monospace', }}>
                        {t("error-stack", "Error Stack")}: {error.error.stack}
                    </Typography>
                )}
            </Paper>
        </Box>
    );
}

