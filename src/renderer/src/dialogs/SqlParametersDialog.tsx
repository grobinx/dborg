import React, { useEffect, useMemo, useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableBody, TableCell, TableHead, TableRow,
    Box, Typography
} from "@mui/material";
import { SqlParameterInfo, ParamType, SqlParameterValue, SqlParametersValue } from "../../../api/db/SqlParameters";
import {
    ColumnBaseType,
    columnBaseTypes,
    resolvePrimitiveType,
    resolveDataTypeFromString,
    toBaseType
} from "../../../api/db/DataType";
import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import { SelectField } from "@renderer/components/inputs/SelectField";
import { TextField } from "@renderer/components/inputs/TextField";
import { NumberField } from "@renderer/components/inputs/NumberField";
import { DateTimeField } from "@renderer/components/inputs/DateTimeField";
import { BooleanField } from "@renderer/components/inputs/BooleanField";
import { Button } from "@renderer/components/buttons/Button";
import { useTranslation } from "react-i18next";

const STORAGE_NAMESPACE = "dborg.sqlParams";
const getProfileKey = (profileId: string) => `${STORAGE_NAMESPACE}.${profileId}`;

function loadProfileParams(profileId?: string): SqlParametersValue | undefined {
    if (!profileId) return undefined;
    try {
        const raw = localStorage.getItem(getProfileKey(profileId));
        if (!raw) return undefined;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
    } catch { /* ignore */ }
    return undefined;
}

function saveProfileParams(profileId: string | undefined, values: SqlParametersValue) {
    if (!profileId) return;
    try {
        // załaduj wcześniej zapisane wartości
        const raw = localStorage.getItem(getProfileKey(profileId));
        let prev: SqlParametersValue = {};
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") prev = parsed;
        }
        
        // połącz: zachowaj stare, nadpisz nowymi
        const merged = { ...prev, ...values };
        localStorage.setItem(getProfileKey(profileId), JSON.stringify(merged));
    } catch { /* ignore */ }
}

function clearProfileParams(profileId?: string) {
    if (!profileId) return;
    try {
        localStorage.removeItem(getProfileKey(profileId));
    } catch { /* ignore */ }
}

export interface SqlParametersDialogProps {
    profileId?: string;
    open: boolean;
    parameters: SqlParameterInfo[];
    initialValues?: SqlParametersValue;
    onClose: () => void;
    onSubmit: (values: SqlParametersValue) => void;
}

type Group = {
    key: string;             // "id" | "$1" | "?"
    label: string;           // wyświetlane
    paramType: ParamType;
    count: number;
    firstPos: number;
};

type RowModel = {
    key: string;
    label: string;
    paramType: ParamType;
    count: number;
    type: ColumnBaseType;
    rawInput: string;
    value: any;
    isNull: boolean;
};

function groupParams(params: SqlParameterInfo[]): Group[] {
    const map = new Map<string, Group>();

    const toKey = (p: SqlParameterInfo): string => {
        if (p.paramType === "named") return String(p.name);
        if (p.paramType === "positional") return String(p.name);
        return `?${String(p.index)}`; // wszystkie '?' scalone
    };

    for (const p of params) {
        const key = toKey(p);
        const g = map.get(key);
        if (g) {
            g.count += 1;
            if (p.position < g.firstPos) g.firstPos = p.position;
        } else {
            map.set(key, {
                key,
                label: key,
                paramType: p.paramType,
                count: 1,
                firstPos: p.position
            });
        }
    }
    return Array.from(map.values()).sort((a, b) => a.firstPos - b.firstPos);
}

function guessBaseTypeFromValue(v: any): ColumnBaseType {
    if (v === null || v === undefined) return "string";
    const prim = resolvePrimitiveType(v);
    if (prim === "boolean") return "boolean";
    if (prim === "number" || prim === "bigint") return "number";
    if (Array.isArray(v)) return "array";
    if (typeof v === "object") {
        if (v instanceof Date) return "datetime";
        if ((typeof Buffer !== "undefined" && (Buffer as any).isBuffer?.(v)) || v instanceof Uint8Array) return "binary";
        return "object";
    }
    if (typeof v === "string") {
        const dt = resolveDataTypeFromString(v);
        if (dt) return toBaseType(dt);
        return "string";
    }
    return "string";
}

function parseByType(input: string, type: ColumnBaseType): any {
    if (input === "") return "";
    if (input.trim().toLowerCase() === "null") return null;

    switch (type) {
        case "string":
            return input;
        case "number": {
            const n = Number(input);
            return Number.isNaN(n) ? input : n;
        }
        case "boolean": {
            const s = input.trim().toLowerCase();
            if (s === "true" || s === "1" || s === "yes") return true;
            if (s === "false" || s === "0" || s === "no") return false;
            return Boolean(input);
        }
        case "datetime":
            return input; // pozostaw w string/ISO
        case "array":
        case "object":
            try { return JSON.parse(input); } catch { return input; }
        case "binary":
            return input; // base64/hex jako string
        default:
            return input;
    }
}

export const SqlParametersDialog: React.FC<SqlParametersDialogProps> = ({
    profileId,
    open,
    parameters,
    initialValues,
    onClose,
    onSubmit
}) => {
    const { t } = useTranslation();
    const groups = useMemo(() => groupParams(parameters), [parameters]);
    const [rows, setRows] = useState<RowModel[]>([]);

    const buildRows = (saved?: SqlParametersValue) => {
        const next: RowModel[] = groups.map(g => {
            // initialValues ma priorytet nad zapisanymi
            const init = (initialValues?.[g.key] ?? saved?.[g.key]) as (SqlParameterValue | any | undefined);
            const initType = (typeof init === "object" && init && "type" in init)
                ? (init.type as ColumnBaseType | undefined)
                : undefined;
            const initVal = (typeof init === "object" && init && "value" in init)
                ? (init as any).value
                : init;

            const type = initType ?? guessBaseTypeFromValue(initVal);
            const rawInput =
                initVal == null
                    ? ""
                    : typeof initVal === "string"
                        ? initVal
                        : JSON.stringify(initVal);

            return {
                key: g.key,
                label: g.label,
                paramType: g.paramType,
                count: g.count,
                type,
                rawInput,
                value: initVal,
                isNull: initVal === null
            };
        });
        setRows(next);
    };

    useEffect(() => {
        const saved = loadProfileParams(profileId);
        buildRows(saved);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groups, initialValues, profileId]);

    const patchRow = (key: string, patch: Partial<RowModel>) =>
        setRows(prev => prev.map(r => (r.key === key ? { ...r, ...patch } : r)));

    const onTypeChange = (key: string, nextType: ColumnBaseType) => {
        const row = rows.find(r => r.key === key)!;
        const nextValue = row.isNull ? null : parseByType(row.rawInput, nextType);
        patchRow(key, { type: nextType, value: nextValue });
    };

    const onValueChange = (key: string, input: string) => {
        const row = rows.find(r => r.key === key)!;
        const nextValue = row.isNull ? null : parseByType(input, row.type);
        patchRow(key, { rawInput: input, value: nextValue });
    };

    const onNullToggle = (key: string, checked: boolean) => {
        const row = rows.find(r => r.key === key)!;
        patchRow(key, { isNull: checked, value: checked ? null : parseByType(row.rawInput, row.type) });
    };

    const handleSubmit = (event?: React.FormEvent) => {
        if (event) event.preventDefault(); // Zapobiega przeładowaniu strony
        const out: SqlParametersValue = {};
        for (const r of rows) out[r.key] = { type: r.type, value: r.isNull ? null : r.value };
        
        // zapisz (funkcja sama dołącza wcześniejsze wartości)
        saveProfileParams(profileId, out);
        
        onSubmit(out);
    };

    const handleClearSaved = () => {
        clearProfileParams(profileId);
        // odbuduj z samych initialValues (bez zapisanych)
        buildRows(undefined);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>{t("sqlParametersDialog.title", "Parametry zapytania SQL")}</DialogTitle>
                <DialogContent dividers>
                    <Box mb={1}>
                        <Typography variant="body2" color="text.secondary">
                            {t("sqlParametersDialog.note", "Parameters with the same name are merged. The set value will be applied to all their occurrences.")}
                        </Typography>
                    </Box>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>{t("sqlParametersDialog.parameter", "Parametr")}</TableCell>
                                <TableCell>{t("sqlParametersDialog.type", "Type")}</TableCell>
                                <TableCell>{t("sqlParametersDialog.value", "Value")}</TableCell>
                                <TableCell>{t("sqlParametersDialog.null", "NULL")}</TableCell>
                                <TableCell align="right">{t("sqlParametersDialog.occurrences", "Occur.")}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((parameter, index) => (
                                <TableRow key={parameter.key}>
                                    <TableCell sx={{ whiteSpace: "nowrap", fontFamily: "monospace" }}>
                                        {parameter.label}
                                    </TableCell>
                                    <TableCell width={160}>
                                        <InputDecorator indicator={false}>
                                            <SelectField
                                                value={parameter.type}
                                                onChange={value => onTypeChange(parameter.key, value as ColumnBaseType)}
                                                options={columnBaseTypes.map(t => ({ label: t, value: t }))}
                                            />
                                        </InputDecorator>
                                    </TableCell>
                                    <TableCell width={420}>
                                        {parameter.type === "boolean" ? (
                                            <InputDecorator indicator={false}>
                                                <SelectField
                                                    value={String(parameter.value ?? false)}
                                                    onChange={value => onValueChange(parameter.key, value)}
                                                    options={[
                                                        { label: "true", value: "true" },
                                                        { label: "false", value: "false" }
                                                    ]}
                                                    disabled={parameter.isNull}
                                                    autoFocus={index === 0}
                                                />
                                            </InputDecorator>
                                        ) : parameter.type === "object" || parameter.type === "array" ? (
                                            <InputDecorator indicator={false}>
                                                <TextField
                                                    disabled={parameter.isNull}
                                                    value={parameter.rawInput}
                                                    onChange={value => onValueChange(parameter.key, value)}
                                                    placeholder={parameter.type === "array" ? "[1, 2, 3]" : '{"a": 1}'}
                                                    autoFocus={index === 0}
                                                />
                                            </InputDecorator>
                                        ) : parameter.type === "number" ? (
                                            <InputDecorator indicator={false}>
                                                <NumberField
                                                    disabled={parameter.isNull}
                                                    value={Number.isNaN(Number(parameter.rawInput)) ? null : Number(parameter.rawInput)}
                                                    onChange={value => onValueChange(parameter.key, value !== null ? String(value) : "")}
                                                    autoFocus={index === 0}
                                                />
                                            </InputDecorator>
                                        ) : parameter.type === "datetime" ? (
                                            <InputDecorator indicator={false}>
                                                <TextField
                                                    disabled={parameter.isNull}
                                                    value={parameter.rawInput}
                                                    onChange={value => onValueChange(parameter.key, value)}
                                                    placeholder={t("sqlParametersDialog.datetime.placeholder", "eg. {{date}}", { date: new Date().toLocaleDateString() })}
                                                    autoFocus={index === 0}
                                                />
                                            </InputDecorator>
                                        ) : parameter.type === "binary" ? (
                                            <InputDecorator indicator={false}>
                                                <TextField
                                                    disabled={parameter.isNull}
                                                    value={parameter.rawInput}
                                                    onChange={value => onValueChange(parameter.key, value)}
                                                    placeholder={t("sqlParametersDialog.binary.placeholder", "eg. base64-encoded data")}
                                                    autoFocus={index === 0}
                                                />
                                            </InputDecorator>
                                        ) : (
                                            <InputDecorator indicator={false}>
                                                <TextField
                                                    disabled={parameter.isNull}
                                                    value={parameter.rawInput ?? ""}
                                                    onChange={value => onValueChange(parameter.key, value)}
                                                    placeholder={t("sqlParametersDialog.text.placeholder", "Enter text")}
                                                    autoFocus={index === 0}
                                                />
                                            </InputDecorator>
                                        )}
                                    </TableCell>
                                    <TableCell width={90}>
                                        <InputDecorator indicator={false}>
                                            <BooleanField
                                                value={parameter.isNull}
                                                onChange={value => onNullToggle(parameter.key, value ?? false)}
                                                label="NULL"
                                            />
                                        </InputDecorator>
                                    </TableCell>
                                    <TableCell align="right">{parameter.count}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Anuluj</Button>
                    <Button type="submit" color="success">Zastosuj</Button>
                </DialogActions>
            </form>
        </Dialog >
    );
};

export default SqlParametersDialog;