import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, useThemeProps } from '@mui/material';
import { DialogProps } from '@toolpad/core';
import { useTranslation } from 'react-i18next';
import { DefaultDialogProps } from './DefaultDialogProps';
import { Button } from '@renderer/components/buttons/Button';

export interface PasswordDialogProps extends DefaultDialogProps {
}

function PasswordDialog({ open, onClose, payload }: DialogProps<PasswordDialogProps, string | null>) {
    const { slotProps } = useThemeProps({ name: "Dialog", props: payload });
    const [password, setPassword] = React.useState('');
    const { t } = useTranslation();
    const textFieldRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (open) {
            const timeout = setTimeout(() => {
                if (textFieldRef.current) {
                    textFieldRef.current.focus();
                }
            }, 0); // Opóźnienie na pełne zamontowanie dialogu
            return () => clearTimeout(timeout);
        }
        return;
    }, [open]);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Enter" && password !== "") {
            onClose(password);
        }
    };

    return (
        <Dialog open={open} onClose={() => onClose(null)}>
            <DialogTitle>{t("enter-password", "Enter Password")}</DialogTitle>

            <DialogContent>
                <TextField
                    inputRef={textFieldRef}
                    label={t("password", "Password")}
                    type="password"
                    fullWidth
                    value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                    onKeyDown={handleKeyDown} // Obsługa klawisza Enter
                    {...slotProps?.textField}
                />
            </DialogContent>

            <DialogActions>
                <Button onClick={() => onClose(null)} {...slotProps?.button}>
                    {t("cancel", "Cancel")}
                </Button>
                <Button color="success" onClick={() => onClose(password)} disabled={password === ""} {...slotProps?.button}>
                    {t("ok", "Ok")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PasswordDialog;
