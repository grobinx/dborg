import { Dialog, DialogTitle, DialogContent, DialogActions, useThemeProps } from '@mui/material';
import { DialogProps } from '@toolpad/core';
import { useTranslation } from 'react-i18next';
import { DriverInfo } from 'src/api/db';
import { DefaultDialogProps } from './DefaultDialogProps';
import { Button } from '@renderer/components/buttons/Button';
import { IRichText, RichContainer } from '@renderer/components/RichContent';

export interface DriverInfoDialogProps extends DefaultDialogProps {
    driver: DriverInfo;
}

function DriverInfoDialog({ open, onClose, payload }: DialogProps<DriverInfoDialogProps>) {
    const { driver } = useThemeProps({ name: "Dialog", props: payload });
    const { t } = useTranslation();

    const yesNo = (val?: boolean): IRichText => ({
        type: "text" as const,
        text: val ? t("yes", "Yes") : t("no", "No"),
        severity: val ? "success" as const : "error" as const,
        decoration: ["bold"],
    });

    return (
        <Dialog open={open} onClose={() => onClose()} maxWidth="md" fullWidth>
            <DialogTitle>{t("driver-info", "Driver Information")}</DialogTitle>

            <DialogContent>
                <RichContainer node={{
                    style: { padding: 0 },
                    items: [
                        {
                            type: "section",
                            title: { type: "text", text: t("general-info", "General Information"), variant: "title-sm" },
                            items: [
                                { type: "row", layout: "grid", gridTemplateColumns: "1fr 3fr", items: [{ type: "text", text: `${t("name", "Name")}:` }, { type: "text", text: driver.name, decoration: ["bold"] }] },
                                { type: "row", layout: "grid", gridTemplateColumns: "1fr 3fr", items: [{ type: "text", text: `${t("description", "Description")}:` }, { type: "text", text: driver.description || t("not-available", "N/A"), decoration: ["bold"] }] },
                                { type: "row", layout: "grid", gridTemplateColumns: "1fr 3fr", items: [{ type: "text", text: `${t("version", "Version")}:` }, { type: "text", text: `${driver.version.major}.${driver.version.minor}.${driver.version.release}.${driver.version.build}`, decoration: ["bold"] }] },
                            ]
                        },
                        {
                            type: "section",
                            title: { type: "text", text: t("supported-features", "Supported Features"), variant: "title-sm" },
                            items: [
                                { type: "row", layout: "grid", gridTemplateColumns: "1fr 3fr", items: [{ type: "text", text: `${t("transactions", "Transactions")}:` }, yesNo(driver.supports.transactions)] },
                                { type: "row", layout: "grid", gridTemplateColumns: "1fr 3fr", items: [{ type: "text", text: `${t("prepared-statements", "Prepared Statements")}:` }, yesNo(driver.supports.preparedStatements)] },
                                { type: "row", layout: "grid", gridTemplateColumns: "1fr 3fr", items: [{ type: "text", text: `${t("cursors", "Cursors")}:` }, yesNo(driver.supports.cursors)] },
                                { type: "row", layout: "grid", gridTemplateColumns: "1fr 3fr", items: [{ type: "text", text: `${t("batch-operations", "Batch Operations")}:` }, yesNo(driver.supports.batchOperations)] },
                                { type: "row", layout: "grid", gridTemplateColumns: "1fr 3fr", items: [{ type: "text", text: `${t("encryption", "Encryption")}:` }, yesNo(driver.supports.encryption)] },
                                { type: "row", layout: "grid", gridTemplateColumns: "1fr 3fr", items: [{ type: "text", text: `${t("pooling", "Pooling")}:` }, yesNo(driver.supports.pooling)] },
                                { type: "row", layout: "grid", gridTemplateColumns: "1fr 3fr", items: [{ type: "text", text: `${t("paremetrized-queries", "Parametrized queries")}:` }, yesNo(driver.supports.parameterizedQueries)] },
                            ]
                        },
                        {
                            type: "section",
                            title: { type: "text", text: t("supported-database-objects", "Supported Database Objects"), variant: "title-sm" },
                            items: [
                                { type: "row", layout: "grid", gridTemplateColumns: "1fr 3fr", items: [{ type: "text", text: `${t("objects", "Objects")}:` }, { type: "text", text: driver.supports.objects.join(", "), decoration: ["bold"] }] },
                                { type: "row", layout: "grid", gridTemplateColumns: "1fr 3fr", items: [{ type: "text", text: `${t("source-objects", "Source Objects")}:` }, { type: "text", text: driver.supports.sourceObjects.join(", "), decoration: ["bold"] }] },
                            ]
                        },
                        {
                            type: "section",
                            title: { type: "text", text: t("implemented-methods", "Implemented Methods"), variant: "title-sm" },
                            items: [
                                { type: "row", layout: "grid", gridTemplateColumns: "1fr 3fr", items: [{ type: "text", text: `${t("methods", "Methods")}:` }, { type: "text", text: driver.implements.join(", "), decoration: ["bold"] }] },
                                { type: "row", layout: "grid", gridTemplateColumns: "1fr 3fr", items: [{ type: "text", text: `${t("parameter-placeholder", "Parameter placeholder")}:` }, { type: "text", text: driver.supports.parameterPlaceholder, decoration: ["bold"] }] },
                            ]
                        }
                    ]
                }} />
            </DialogContent>

            <DialogActions>
                <Button onClick={() => onClose()} color="primary">
                    {t("close", "Close")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default DriverInfoDialog;
