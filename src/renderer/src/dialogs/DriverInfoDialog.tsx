import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, useThemeProps } from '@mui/material';
import { DialogProps } from '@toolpad/core';
import { useTranslation } from 'react-i18next';
import { DriverInfo } from 'src/api/db';
import { DefaultDialogProps } from './DefaultDialogProps';

export interface DriverInfoDialogProps extends DefaultDialogProps {
    driver: DriverInfo;
}

// Stałe dla Yes i No z kolorami
const YES_TEXT = <Typography component="span" sx={{ color: 'success.main', fontWeight: 'bold' }}>Yes</Typography>;
const NO_TEXT = <Typography component="span" sx={{ color: 'error.main', fontWeight: 'bold' }}>No</Typography>;

function DriverInfoDialog({ open, onClose, payload }: DialogProps<DriverInfoDialogProps>) {
    const { driver, slotProps } = useThemeProps({ name: "Dialog", props: payload });
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={() => onClose()} maxWidth="md" fullWidth>
            {/* Tytuł dialogu */}
            <DialogTitle>{t("driver-info", "Driver Information")}</DialogTitle>

            {/* Zawartość dialogu */}
            <DialogContent>
                {/* Sekcja podstawowych informacji */}
                <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {t("general-info", "General Information")}
                    </Typography>
                    <Typography variant="body2">
                        <strong>{t("name", "Name")}:</strong> {driver.name}
                    </Typography>
                    <Typography variant="body2">
                        <strong>{t("description", "Description")}:</strong> {driver.description || t("not-available", "N/A")}
                    </Typography>
                    <Typography variant="body2">
                        <strong>{t("version", "Version")}:</strong> {`${driver.version.major}.${driver.version.minor}.${driver.version.release}.${driver.version.build}`}
                    </Typography>
                </Box>

                {/* Sekcja obsługiwanych funkcji */}
                <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {t("supported-features", "Supported Features")}
                    </Typography>
                    <Typography variant="body2">
                        <strong>{t("transactions", "Transactions")}:</strong> {driver.supports.supports.transactions ? YES_TEXT : NO_TEXT}
                    </Typography>
                    <Typography variant="body2">
                        <strong>{t("prepared-statements", "Prepared Statements")}:</strong> {driver.supports.supports.preparedStatements ? YES_TEXT : NO_TEXT}
                    </Typography>
                    <Typography variant="body2">
                        <strong>{t("cursors", "Cursors")}:</strong> {driver.supports.supports.cursors ? YES_TEXT : NO_TEXT}
                    </Typography>
                    <Typography variant="body2">
                        <strong>{t("batch-operations", "Batch Operations")}:</strong> {driver.supports.supports.batchs ? YES_TEXT : NO_TEXT}
                    </Typography>
                    <Typography variant="body2">
                        <strong>{t("encryption", "Encryption")}:</strong> {driver.supports.supports.encryption ? YES_TEXT : NO_TEXT}
                    </Typography>
                    <Typography variant="body2">
                        <strong>{t("pooling", "Pooling")}:</strong> {driver.supports.supports.pooling ? YES_TEXT : NO_TEXT}
                    </Typography>
                    <Typography variant="body2">
                        <strong>{t("paremetrized-queries", "Parametrized queries")}:</strong> {driver.supports.supports.parameterizedQueries ? YES_TEXT : NO_TEXT}
                    </Typography>
                </Box>

                {/* Sekcja obsługiwanych obiektów */}
                <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {t("supported-database-objects", "Supported Database Objects")}
                    </Typography>
                    <Typography variant="body2">
                        <strong>{t("objects", "Objects")}:</strong> {driver.supports.objects.join(", ")}
                    </Typography>
                    <Typography variant="body2">
                        <strong>{t("source-objects", "Source Objects")}:</strong> {driver.supports.sourceObjects.join(", ")}
                    </Typography>
                </Box>

                {/* Sekcja implementacji */}
                <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {t("implemented-methods", "Implemented Methods")}
                    </Typography>
                    <Typography variant="body2">
                        <strong>{t("methods", "Methods")}:</strong> {driver.implements.join(", ")}
                    </Typography>
                </Box>

                {/* Pozostałe */}
                <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {t("remaining", "Remaining")}
                    </Typography>
                    <Typography variant="body2">
                        <strong>{t("parameter-placeholder", "Parameter placeholder")}:</strong> {driver.supports.parameterPlaceholder}
                    </Typography>
                </Box>
            </DialogContent>

            {/* Akcje dialogu */}
            <DialogActions>
                <Button onClick={() => onClose()} variant="contained" color="primary" {...slotProps?.button}>
                    {t("close", "Close")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default DriverInfoDialog;
