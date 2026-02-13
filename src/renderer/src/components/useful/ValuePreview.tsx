import React, { useMemo, useState } from "react";
import { Box, Stack, ToggleButton, ToggleButtonGroup, Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import Tooltip from "../Tooltip";
import { ColumnDataType, resolveDataTypeFromString, resolvePrimitiveType, valueToString } from "../../../../api/db";

export type PreviewMode = 'auto' | 'text' | 'json' | 'xml' | 'html' | 'hex' | 'image' | 'formatted';

interface ValuePreviewProps {
    value: any;
    dataType?: ColumnDataType | null; // Opcjonalny jawny typ
    mode?: PreviewMode; // Tryb podglądu
    onModeChange?: (mode: PreviewMode) => void;
    maxHeight?: number | string;
    showToolbar?: boolean;
}

export const ValuePreview: React.FC<ValuePreviewProps> = ({
    value,
    dataType: explicitDataType,
    mode = 'auto',
    onModeChange,
    maxHeight = 400,
    showToolbar = true,
}) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const [localMode, setLocalMode] = useState<PreviewMode>(mode);

    const detectedInfo = useMemo(() => {
        if (value === null || value === undefined) {
            return { dataType: null, primitiveType: null, canShowAs: ['text'] as PreviewMode[] };
        }

        const primitiveType = resolvePrimitiveType(value);
        let dataType = explicitDataType ?? null;

        // Jeśli nie mamy jawnego typu, spróbuj wykryć
        if (!dataType) {
            if (primitiveType === 'string') {
                dataType = resolveDataTypeFromString(value);
            } else if (primitiveType === 'number') {
                dataType = 'number';
            } else if (primitiveType === 'bigint') {
                dataType = 'bigint';
            } else if (primitiveType === 'boolean') {
                dataType = 'boolean';
            } else if (primitiveType === 'array') {
                dataType = ['string']; // domyślnie array of strings
            } else if (primitiveType === 'object') {
                // Sprawdź czy to JSON
                try {
                    if (value && typeof value === 'object') {
                        dataType = 'json';
                    }
                } catch {
                    dataType = 'object';
                }
            }
        }

        // Określ dostępne tryby podglądu
        const canShowAs: PreviewMode[] = ['text', 'formatted'];

        if (primitiveType === 'string') {
            const strValue = value as string;

            // JSON
            if (dataType === 'json' || (strValue.trim().startsWith('{') || strValue.trim().startsWith('['))) {
                try {
                    JSON.parse(strValue);
                    canShowAs.push('json');
                } catch { }
            }

            // XML
            if (dataType === 'xml' || strValue.trim().startsWith('<')) {
                canShowAs.push('xml');
            }

            // HTML
            if (strValue.includes('<!DOCTYPE') || strValue.includes('<html') || strValue.includes('<div')) {
                canShowAs.push('html');
            }

            // Hex dla długich stringów lub binarnych
            if (strValue.length > 100 || /[\x00-\x1F\x7F-\x9F]/.test(strValue)) {
                canShowAs.push('hex');
            }
        }

        if (primitiveType === 'object') {
            canShowAs.push('json');
        }

        // Binary/image
        if (dataType === 'binary' || dataType === 'blob' || dataType === 'image') {
            canShowAs.push('hex');
            if (dataType === 'image' || (typeof Blob !== 'undefined' && value instanceof Blob && value.type.startsWith('image/'))) {
                canShowAs.push('image');
            }
        }

        return { dataType, primitiveType, canShowAs };
    }, [value, explicitDataType]);

    const effectiveMode = useMemo(() => {
        if (localMode === 'auto') {
            // Wybierz najlepszy domyślny tryb
            if (detectedInfo.canShowAs.includes('json')) return 'json';
            if (detectedInfo.canShowAs.includes('xml')) return 'xml';
            if (detectedInfo.canShowAs.includes('html')) return 'html';
            if (detectedInfo.canShowAs.includes('image')) return 'image';
            return 'formatted';
        }
        return localMode;
    }, [localMode, detectedInfo]);

    const handleModeChange = (newMode: PreviewMode | null) => {
        if (newMode) {
            setLocalMode(newMode);
            onModeChange?.(newMode);
        }
    };

    const renderContent = () => {
        if (value === null) {
            return (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    NULL
                </Typography>
            );
        }

        if (value === undefined) {
            return (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    UNDEFINED
                </Typography>
            );
        }

        switch (effectiveMode) {
            case 'json':
                return <JsonPreview value={value} />;
            case 'xml':
                return <XmlPreview value={value} />;
            case 'html':
                return <HtmlPreview value={value} />;
            case 'hex':
                return <HexPreview value={value} />;
            case 'image':
                return <ImagePreview value={value} />;
            case 'formatted':
                return <FormattedPreview value={value} dataType={detectedInfo.dataType} />;
            case 'text':
            default:
                return <TextPreview value={value} />;
        }
    };

    return (
        <Stack direction="column" sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            {showToolbar && (
                <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <ToggleButtonGroup
                            value={effectiveMode}
                            exclusive
                            onChange={(_, value) => handleModeChange(value)}
                            size="small"
                        >
                            {detectedInfo.canShowAs.includes('formatted') && (
                                <ToggleButton value="formatted">
                                    <theme.icons.Add />
                                </ToggleButton>
                            )}
                            {detectedInfo.canShowAs.includes('text') && (
                                <ToggleButton value="text">
                                    <theme.icons.Delete />
                                </ToggleButton>
                            )}
                            {detectedInfo.canShowAs.includes('json') && (
                                <ToggleButton value="json">
                                    <theme.icons.AddRow />
                                </ToggleButton>
                            )}
                            {detectedInfo.canShowAs.includes('xml') && (
                                <ToggleButton value="xml">
                                    <theme.icons.Analyze />
                                </ToggleButton>
                            )}
                            {detectedInfo.canShowAs.includes('html') && (
                                <ToggleButton value="html">
                                    <theme.icons.Check />
                                </ToggleButton>
                            )}
                            {detectedInfo.canShowAs.includes('hex') && (
                                <ToggleButton value="hex">
                                    <theme.icons.AutoRefresh />
                                </ToggleButton>
                            )}
                            {detectedInfo.canShowAs.includes('image') && (
                                <ToggleButton value="image">
                                    <theme.icons.CheckBoxBlank />
                                </ToggleButton>
                            )}
                        </ToggleButtonGroup>
                        <Typography variant="caption" color="text.secondary">
                            {detectedInfo.dataType ? `[${detectedInfo.dataType}]` : ''}
                        </Typography>
                    </Stack>
                </Box>
            )}
            <Box
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: 2,
                    maxHeight,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                }}
            >
                {renderContent()}
            </Box>
        </Stack>
    );
};

// Komponenty pomocnicze dla różnych trybów podglądu

const TextPreview: React.FC<{ value: any }> = ({ value }) => (
    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {String(value)}
    </pre>
);

const FormattedPreview: React.FC<{ value: any; dataType: ColumnDataType | null }> = ({ value, dataType }) => {
    const formatted = dataType ? valueToString(value, dataType, { display: true }) : String(value);
    return (
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {formatted}
        </pre>
    );
};

const JsonPreview: React.FC<{ value: any }> = ({ value }) => {
    const jsonString = useMemo(() => {
        try {
            const obj = typeof value === 'string' ? JSON.parse(value) : value;
            return JSON.stringify(obj, null, 2);
        } catch {
            return String(value);
        }
    }, [value]);

    return (
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {jsonString}
        </pre>
    );
};

const XmlPreview: React.FC<{ value: any }> = ({ value }) => {
    const formattedXml = useMemo(() => {
        try {
            const xml = String(value);
            // Podstawowe formatowanie XML
            return xml.replace(/></g, '>\n<');
        } catch {
            return String(value);
        }
    }, [value]);

    return (
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {formattedXml}
        </pre>
    );
};

const HtmlPreview: React.FC<{ value: any }> = ({ value }) => {
    const htmlString = String(value);

    return (
        <Box>
            <Typography variant="subtitle2" gutterBottom>Preview:</Typography>
            <Box
                sx={{
                    border: 1,
                    borderColor: 'divider',
                    p: 1,
                    mb: 2,
                    backgroundColor: 'background.paper',
                }}
                dangerouslySetInnerHTML={{ __html: htmlString }}
            />
            <Typography variant="subtitle2" gutterBottom>Source:</Typography>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {htmlString}
            </pre>
        </Box>
    );
};

const HexPreview: React.FC<{ value: any }> = ({ value }) => {
    const hexString = useMemo(() => {
        let bytes: Uint8Array;

        if (typeof value === 'string') {
            bytes = new TextEncoder().encode(value);
        } else if (value instanceof Uint8Array) {
            bytes = value;
        } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
            bytes = new Uint8Array(value);
        } else {
            bytes = new TextEncoder().encode(String(value));
        }

        const lines: string[] = [];
        for (let i = 0; i < Math.min(bytes.length, 1000); i += 16) {
            const offset = i.toString(16).padStart(8, '0');
            const hex = Array.from(bytes.slice(i, i + 16))
                .map(b => b.toString(16).padStart(2, '0'))
                .join(' ');
            const ascii = Array.from(bytes.slice(i, i + 16))
                .map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
                .join('');
            lines.push(`${offset}  ${hex.padEnd(48, ' ')}  ${ascii}`);
        }

        if (bytes.length > 1000) {
            lines.push(`... (${bytes.length - 1000} more bytes)`);
        }

        return lines.join('\n');
    }, [value]);

    return (
        <pre style={{ margin: 0, whiteSpace: 'pre', overflow: 'auto' }}>
            {hexString}
        </pre>
    );
};

const ImagePreview: React.FC<{ value: any }> = ({ value }) => {
    const imageUrl = useMemo(() => {
        if (typeof Blob !== 'undefined' && value instanceof Blob) {
            return URL.createObjectURL(value);
        }
        if (typeof value === 'string' && value.startsWith('data:image/')) {
            return value;
        }
        return null;
    }, [value]);

    React.useEffect(() => {
        return () => {
            if (imageUrl && imageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [imageUrl]);

    if (!imageUrl) {
        return <Typography color="error">Cannot display image</Typography>;
    }

    return (
        <Box sx={{ textAlign: 'center' }}>
            <img
                src={imageUrl}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
        </Box>
    );
};