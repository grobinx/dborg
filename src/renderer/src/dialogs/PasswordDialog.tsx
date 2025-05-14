import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, useThemeProps } from '@mui/material';
import { DialogProps } from '@toolpad/core';
import { useTranslation } from 'react-i18next';
import { DefaultDialogProps } from './DefaultDialogProps';

export interface PasswordDialogProps extends DefaultDialogProps {
}

function PasswordDialog({ open, onClose, payload }: DialogProps<PasswordDialogProps, string | null>) {
    const { slotProps } = useThemeProps({ name: "Dialog", props: payload });
    const [password, setPassword] = React.useState('');
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={() => onClose(null)}>
            <DialogTitle>{t("enter-password", "Enter Password")}</DialogTitle>

            <DialogContent>
                <TextField
                    autoFocus
                    label={t("password", "Password")}
                    type="password"
                    fullWidth
                    value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                    {...slotProps?.textField}
                />
            </DialogContent>

            <DialogActions>  {/* Added slotProps for actions */}
                <Button onClick={() => onClose(null)} {...slotProps?.button}>
                    {t("cancel", "Cancel")}
                </Button>
                <Button onClick={() => onClose(password)} disabled={password === ""} {...slotProps?.button}>
                    {t("ok", "Ok")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PasswordDialog;
