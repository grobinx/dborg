import React, { useState, useCallback, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    styled,
    Typography,
} from '@mui/material';
import { isSettingsCollection, isSettingsGroup, SettingsCollection, SettingsGroup } from './SettingsTypes';
import { useTranslation } from 'react-i18next';
import { SettingsViewCollection, SettingsViewGroup } from './SettingsForm';
import { Button } from '../buttons/Button';

const StyledDialogContent = styled(DialogContent)(({ }) => ({
    padding: 8,
    overflowY: 'auto',
    minWidth: 500,
    minHeight: 400,
    maxHeight: '75vh',
    display: 'flex',
    flexDirection: 'column',
}));

export interface LocalSettingsDialogProps {
    open: boolean;
    onClose: () => void;
    settings: SettingsCollection | SettingsGroup;
    defaultValues?: Record<string, any>;
    onSave?: (values: Record<string, any>) => void;
    title?: string;
}

export const LocalSettingsDialog: React.FC<LocalSettingsDialogProps> = ({
    open,
    onClose,
    settings,
    defaultValues,
    onSave,
    title,
}) => {
    const { t } = useTranslation();

    // Local state for edited values
    const [localValues, setLocalValues] = useState<Record<string, any>>(() => ({ ...defaultValues }));
    const [selectedKey, setSelectedKey] = useState<string | null>(null);

    // Reset local values when dialog opens
    React.useEffect(() => {
        if (open && defaultValues) {
            setLocalValues({ ...defaultValues });
        }
    }, [open, defaultValues]);

    const handleSave = useCallback(() => {
        onSave?.(localValues);
        onClose();
    }, [localValues, onSave, onClose]);

    const handleCancel = useCallback(() => {
        if (defaultValues) {
            setLocalValues({ ...defaultValues });
        }
        onClose();
    }, [defaultValues, onClose]);

    // Create mutable proxy for SettingsViewCollection
    const mutableValues = useMemo(() => {
        if (!defaultValues) return undefined;
        return new Proxy(localValues, {
            set(_target, prop: string, value) {
                setLocalValues((prev) => ({ ...prev, [prop]: value }));
                return true;
            },
        });
    }, [localValues, defaultValues]);

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
                {isSettingsCollection(settings) ? (
                    <SettingsViewCollection
                        collection={settings}
                        values={mutableValues}
                        selected={selectedKey}
                        onSelect={setSelectedKey}
                    />
                ) : isSettingsGroup(settings) ? (
                    <SettingsViewGroup
                        group={settings}
                        values={mutableValues}
                        selected={selectedKey}
                        onSelect={setSelectedKey}
                    />
                ) : <Typography color="error">{t('invalid-settings-structure', 'Invalid settings structure')}</Typography>}
            </StyledDialogContent>

            <DialogActions>
                {defaultValues !== undefined ? (
                    <>
                        <Button onClick={handleCancel}>
                            {t('cancel', 'Cancel')}
                        </Button>
                        <Button onClick={handleSave} color="primary">
                            {t('save', 'Save')}
                        </Button>
                    </>
                ) : (
                    <Button onClick={onClose} color="primary">
                        {t('close', 'Close')}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};