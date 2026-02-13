import React, { useMemo, useState } from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { ColumnDataType, resolveDataTypeFromString, resolvePrimitiveType, valueToString } from "../../../../api/db";
import { useSetting } from "@renderer/contexts/SettingsContext";
import ButtonGroup from "../buttons/ButtonGroup";
import { ToolButton } from "../buttons/ToolButton";

export type PreviewMode = 'auto' | 'text' | 'json' | 'xml' | 'html' | 'hex' | 'image' | 'formatted';

export interface ValuePreviewDetectedInfo {
    dataType: ColumnDataType | null;
    primitiveType: ReturnType<typeof resolvePrimitiveType> | null;
    canShowAs: PreviewMode[];
}

export const detectValuePreviewInfo = (
    value: any,
    explicitDataType?: ColumnDataType | null
): ValuePreviewDetectedInfo => {
    if (value === null || value === undefined) {
        return { dataType: null, primitiveType: null, canShowAs: ['text'] };
    }

    const primitiveType = resolvePrimitiveType(value);
    let dataType = explicitDataType ?? null;

    if (!dataType) {
        if (primitiveType === 'string') dataType = resolveDataTypeFromString(value);
        else if (primitiveType === 'number') dataType = 'number';
        else if (primitiveType === 'bigint') dataType = 'bigint';
        else if (primitiveType === 'boolean') dataType = 'boolean';
        else if (primitiveType === 'array') dataType = ['string'];
        else if (primitiveType === 'object') dataType = 'json';
    }

    const canShowAs: PreviewMode[] = ['text', 'formatted'];

    if (primitiveType === 'string') {
        const strValue = value as string;

        if (dataType === 'json' || strValue.trim().startsWith('{') || strValue.trim().startsWith('[')) {
            try {
                JSON.parse(strValue);
                canShowAs.push('json');
            } catch {}
        }

        if (dataType === 'xml' || strValue.trim().startsWith('<')) canShowAs.push('xml');
        if (strValue.includes('<!DOCTYPE') || strValue.includes('<html') || strValue.includes('<div')) canShowAs.push('html');
        if (strValue.length > 100 || /[\x00-\x1F\x7F-\x9F]/.test(strValue)) canShowAs.push('hex');
    }

    if (primitiveType === 'object' || primitiveType === 'array') canShowAs.push('json');

    if (dataType === 'binary' || dataType === 'blob' || dataType === 'image') {
        canShowAs.push('hex');
        if (dataType === 'image' || (typeof Blob !== 'undefined' && value instanceof Blob && value.type.startsWith('image/'))) {
            canShowAs.push('image');
        }
    }

    return { dataType, primitiveType, canShowAs };
};

export const resolveEffectivePreviewMode = (
    mode: PreviewMode,
    detectedInfo: ValuePreviewDetectedInfo
): Exclude<PreviewMode, 'auto'> => {
    if (mode !== 'auto') return mode;
    if (detectedInfo.canShowAs.includes('json')) return 'json';
    if (detectedInfo.canShowAs.includes('xml')) return 'xml';
    if (detectedInfo.canShowAs.includes('html')) return 'html';
    if (detectedInfo.canShowAs.includes('image')) return 'image';
    return 'formatted';
};

interface ValuePreviewProps {
    value: any;
    dataType?: ColumnDataType | null;
    mode?: PreviewMode;
    onModeChange?: (mode: PreviewMode) => void;
    showToolbar?: boolean;
    detectedInfo?: ValuePreviewDetectedInfo; // <- można przekazać z zewnątrz
}

export const ValuePreview: React.FC<ValuePreviewProps> = ({
    value,
    dataType: explicitDataType,
    mode = 'auto',
    onModeChange,
    showToolbar = true,
    detectedInfo: detectedInfoProp,
}) => {
    const theme = useTheme();
    const [localMode, setLocalMode] = useState<PreviewMode>(mode);
    const [fontSize] = useSetting("dborg", "data_grid.data.font_size");
    const [fontFamily] = useSetting("ui", "monospaceFontFamily");

    const computedDetectedInfo = useMemo(
        () => detectValuePreviewInfo(value, explicitDataType),
        [value, explicitDataType]
    );

    const detectedInfo = detectedInfoProp ?? computedDetectedInfo;

    const effectiveMode = useMemo(
        () => resolveEffectivePreviewMode(localMode, detectedInfo),
        [localMode, detectedInfo]
    );

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
                        <ButtonGroup
                            value={effectiveMode}
                            exclusive
                            onChange={(value) => handleModeChange(value as PreviewMode)}
                            size="small"
                        >
                            {detectedInfo.canShowAs.includes('formatted') && (
                                <ToolButton value="formatted" toggle="formatted">
                                    <theme.icons.Formatted />
                                </ToolButton>
                            )}
                            {detectedInfo.canShowAs.includes('text') && (
                                <ToolButton value="text" toggle="text">
                                    <theme.icons.TextField />
                                </ToolButton>
                            )}
                            {detectedInfo.canShowAs.includes('json') && (
                                <ToolButton value="json" toggle="json">
                                    <theme.icons.JsonEditor />
                                </ToolButton>
                            )}
                            {detectedInfo.canShowAs.includes('xml') && (
                                <ToolButton value="xml" toggle="xml">
                                    <theme.icons.XmlEditor />
                                </ToolButton>
                            )}
                            {detectedInfo.canShowAs.includes('html') && (
                                <ToolButton value="html" toggle="html">
                                    <theme.icons.HtmlEditor />
                                </ToolButton>
                            )}
                            {detectedInfo.canShowAs.includes('hex') && (
                                <ToolButton value="hex" toggle="hex">
                                    <theme.icons.Hexagon />
                                </ToolButton>
                            )}
                            {detectedInfo.canShowAs.includes('image') && (
                                <ToolButton value="image" toggle="image">
                                    <theme.icons.Image />
                                </ToolButton>
                            )}
                        </ButtonGroup>
                    </Stack>
                </Box>
            )}
            <Box
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: 2,
                    fontFamily: fontFamily,
                    fontSize: fontSize,
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