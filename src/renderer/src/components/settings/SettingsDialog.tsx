import React, { useState, useCallback, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    styled,
} from '@mui/material';
import { SettingsCollection } from './SettingsTypes';
import { useTranslation } from 'react-i18next';
import { SettingsViewCollection } from './SettingsForm';
import { Button } from '../buttons/Button';

const StyledDialogContent = styled(DialogContent)(({ }) => ({
    padding: 8,
    overflowY: 'auto',
    minWidth: 500,
    minHeight: 400,
    display: 'flex',
    flexDirection: 'column',
}));

export interface LocalSettingsDialogProps {
    open: boolean;
    onClose: () => void;
    collection: SettingsCollection;
    initialValues?: Record<string, any>;
    onSave?: (values: Record<string, any>) => void;
    title?: string;
}

export const LocalSettingsDialog: React.FC<LocalSettingsDialogProps> = ({
    open,
    onClose,
    collection,
    initialValues = {},
    onSave,
    title,
}) => {
    const { t } = useTranslation();

    // Local state for edited values
    const [localValues, setLocalValues] = useState<Record<string, any>>(() => ({ ...initialValues }));
    const [selectedKey, setSelectedKey] = useState<string | null>(null);

    // Reset local values when dialog opens
    React.useEffect(() => {
        if (open) {
            setLocalValues({ ...initialValues });
        }
    }, [open, initialValues]);

    const handleSave = useCallback(() => {
        onSave?.(localValues);
        onClose();
    }, [localValues, onSave, onClose]);

    const handleCancel = useCallback(() => {
        setLocalValues({ ...initialValues });
        onClose();
    }, [initialValues, onClose]);

    // Create mutable proxy for SettingsViewCollection
    const mutableValues = useMemo(() => {
        return new Proxy(localValues, {
            set(_target, prop: string, value) {
                setLocalValues((prev) => ({ ...prev, [prop]: value }));
                return true;
            },
        });
    }, [localValues]);

    return (
        <Dialog
            open={open}
            onClose={handleCancel}
            maxWidth="md"
            fullWidth
        >
            {title && (
                <DialogTitle>
                    {title}
                </DialogTitle>
            )}

            <StyledDialogContent>
                <SettingsViewCollection
                    collection={collection}
                    values={mutableValues}
                    selected={selectedKey}
                    onSelect={setSelectedKey}
                />
            </StyledDialogContent>

            <DialogActions>
                <Button onClick={handleCancel}>
                    {t('cancel', 'Cancel')}
                </Button>
                <Button onClick={handleSave} color="primary">
                    {t('save', 'Save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};