import { ColumnDataType, resolvePrimitiveType, toBaseType, valueToString, ValueToStringOptions } from "../../../../src/api/db";

export type ExportFormat =
    | 'json' | 'csv' | 'tsv' | 'markdown' | 'html' | 'redmine' | 'xml'
    | 'sql' | 'yaml' | 'latex' | 'jira' | 'ascii' | 'rst' | 'bbcode' | 'excel-xml'
    | 'js' | 'ts' | 'java' | 'cpp' | 'php' | 'perl' | "pascal" | 'datatext';

export interface ExportFormatDescription {
    label: string;
    mimeType: string;
    fileExtension: string;
}

export const exportFormats: Record<ExportFormat, ExportFormatDescription> = {
    json: { label: 'JSON', mimeType: 'application/json', fileExtension: 'json' },
    csv: { label: 'CSV', mimeType: 'text/csv', fileExtension: 'csv' },
    tsv: { label: 'TSV', mimeType: 'text/tab-separated-values', fileExtension: 'tsv' },
    markdown: { label: 'Markdown Table', mimeType: 'text/markdown', fileExtension: 'md' },
    html: { label: 'HTML Table', mimeType: 'text/html', fileExtension: 'html' },
    redmine: { label: 'Redmine Wiki Table', mimeType: 'text/plain', fileExtension: 'txt' },
    xml: { label: 'XML', mimeType: 'application/xml', fileExtension: 'xml' },
    sql: { label: 'SQL INSERT Statements', mimeType: 'application/sql', fileExtension: 'sql' },
    yaml: { label: 'YAML', mimeType: 'application/x-yaml', fileExtension: 'yaml' },
    latex: { label: 'LaTeX Table', mimeType: 'application/x-latex', fileExtension: 'tex' },
    jira: { label: 'Jira Markup Table', mimeType: 'text/plain', fileExtension: 'txt' },
    ascii: { label: 'ASCII Table', mimeType: 'text/plain', fileExtension: 'txt' },
    datatext: { label: 'DataText Format', mimeType: 'text/plain', fileExtension: 'txt' },
    rst: { label: 'reStructuredText Table', mimeType: 'text/x-rst', fileExtension: 'rst' },
    bbcode: { label: 'BBCode Table', mimeType: 'text/plain', fileExtension: 'txt' },
    'excel-xml': { label: 'Excel XML', mimeType: 'application/vnd.ms-excel', fileExtension: 'xml' },
    js: { label: 'JavaScript Array', mimeType: 'application/javascript', fileExtension: 'js' },
    ts: { label: 'TypeScript Array', mimeType: 'application/typescript', fileExtension: 'ts' },
    java: { label: 'Java Array', mimeType: 'text/x-java-source', fileExtension: 'java' },
    cpp: { label: 'C++ Array', mimeType: 'text/x-c++src', fileExtension: 'cpp' },
    php: { label: 'PHP Array', mimeType: 'application/x-httpd-php', fileExtension: 'php' },
    perl: { label: 'Perl Array', mimeType: 'text/x-perl', fileExtension: 'pl' },
    pascal: { label: 'Pascal Array', mimeType: 'text/x-pascal', fileExtension: 'pas' },
};

export interface Column {
    key: string;
    dataType: ColumnDataType | "resolve";
}

// Bazowe opcje wspólne dla wszystkich formatów
interface BaseExportOptions {
    columns?: Column[];
    nullValue?: string;
    booleanFormat?: 'text' | 'number' | 'yesno';
}

// Opcje specyficzne dla JSON
interface JSONExportOptions extends BaseExportOptions {
    pretty?: boolean;
}

// Opcje specyficzne dla CSV
interface CSVExportOptions extends BaseExportOptions {
    includeHeaders?: boolean;
    delimiter?: string;
    quoteStrings?: boolean;
    quote?: string; // Znak cudzysłowu (domyślnie ")
    quoteAll?: boolean; // Czy cytować wszystkie wartości (domyślnie false - tylko gdy potrzebne)
}

interface TSVExportOptions extends BaseExportOptions {
    includeHeaders?: boolean;
}

// Opcje specyficzne dla tabel (Markdown, HTML, Redmine, Jira, BBCode)
interface TableExportOptions extends BaseExportOptions {
    includeHeaders?: boolean;
}

// Opcje specyficzne dla XML
interface XMLExportOptions extends BaseExportOptions {
    rootElement?: string;
    itemElement?: string;
}

// Opcje specyficzne dla SQL
interface SQLExportOptions extends BaseExportOptions {
    tableName?: string;
    identifierQuote?: string;
    includeCreateTable?: boolean;
    batchSize?: number;
}

// Opcje specyficzne dla YAML
interface YAMLExportOptions extends BaseExportOptions {
    indent?: number;
}

// Opcje specyficzne dla LaTeX
interface LaTeXExportOptions extends BaseExportOptions {
    includeHeaders?: boolean;
    tableStyle?: 'basic' | 'booktabs' | 'longtable';
}

// Opcje specyficzne dla ASCII Table
interface ASCIITableExportOptions extends BaseExportOptions {
    includeHeaders?: boolean;
    borderStyle?: 'single' | 'double' | 'rounded' | 'minimal';
}

interface DataTextExportOptions extends BaseExportOptions {
}

// Opcje specyficzne dla reStructuredText
interface RSTExportOptions extends BaseExportOptions {
    includeHeaders?: boolean;
    tableStyle?: 'grid' | 'simple';
}

// Opcje specyficzne dla Excel XML
interface ExcelXMLExportOptions extends BaseExportOptions {
    sheetName?: string;
    includeHeaders?: boolean;
}

// Opcje specyficzne dla JavaScript
interface JSExportOptions extends BaseExportOptions {
    variableName?: string;
}

// Opcje specyficzne dla TypeScript
interface TSExportOptions extends BaseExportOptions {
    variableName?: string;
    typeName?: string;
}

// Opcje specyficzne dla Java
interface JavaExportOptions extends BaseExportOptions {
    variableName?: string;
    className?: string;
}

// Opcje specyficzne dla C++
interface CPPExportOptions extends BaseExportOptions {
    variableName?: string;
    typeName?: string;
}

// Opcje specyficzne dla PHP
interface PHPExportOptions extends BaseExportOptions {
    variableName?: string;
}

// Opcje specyficzne dla Perl
interface PerlExportOptions extends BaseExportOptions {
    variableName?: string;
}

interface PascalExportOptions extends BaseExportOptions {
    variableName?: string;
    typeName?: string;
}

export interface ExportResult {
    content: string;
    mimeType: string | undefined;
    fileExtension: string | undefined;
}

const normalizeToStringOptions: ValueToStringOptions = {
    display: false,
    thousandsSeparator: false,
};

const normalizeToStringOptionsTSV: ValueToStringOptions = {
    display: true,
    thousandsSeparator: false,
};

/**
 * Normalizes a value for export
 */
const normalizeValue = (
    value: any,
    dataType: ColumnDataType | "resolve",
    options: BaseExportOptions
): string => {
    if (value === null || value === undefined) {
        return options.nullValue ?? '';
    }

    if (typeof value === 'boolean') {
        switch (options.booleanFormat) {
            case 'number':
                return value ? '1' : '0';
            case 'yesno':
                return value ? 'yes' : 'no';
            default:
                return value.toString();
        }
    }

    return valueToString(value, resolveValueType(value, dataType), normalizeToStringOptions);
};

/**
 * Escapes a value for CSV format
 */
const escapeCSV = (value: string, dataType: ColumnDataType, delimiter: string = ',', quote: string = '"', quoteAll: boolean = false, quoteStrings: boolean = false): string => {
    const baseType = toBaseType(dataType);
    const isString = baseType === "string" || baseType === "datetime";

    const needsQuoting = quoteAll ||
        (quoteStrings && isString) ||
        value.includes(delimiter) ||
        value.includes(quote) ||
        value.includes('\n') ||
        value.includes('\r');

    if (needsQuoting) {
        // Podwój znak cudzysłowu wewnątrz wartości
        const escaped = value.replace(new RegExp(quote, 'g'), quote + quote);
        return `${quote}${escaped}${quote}`;
    }
    return value;
};

const escapeTSV = (value: string, _dataType: ColumnDataType): string => {
    return value.replace(/\t/g, '    ').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
};

/**
 * Escapes HTML special characters
 */
const escapeHTML = (value: string): string => {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return value.replace(/[&<>"']/g, char => map[char]);
};

/**
 * Escapes XML special characters
 */
const escapeXML = (value: string): string => {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
    };
    return value.replace(/[&<>"']/g, char => map[char]);
};

/**
 * Escapes SQL string values
 */
const escapeSQL = (value: string): string => {
    return value.replace(/'/g, "''");
};

/**
 * Get columns from data
 */
const getColumns = (data: Record<string, any>[], options: BaseExportOptions): Column[] => {
    if (options.columns && options.columns.length > 0) {
        return options.columns;
    }

    const allKeys = new Set<string>();
    data.forEach(row => {
        Object.keys(row).forEach(key => allKeys.add(key));
    });
    return Array.from(allKeys).map(key => ({ key, dataType: "resolve" }));
};

const resolveValueType = (value: any, dataType: ColumnDataType | "resolve"): ColumnDataType => {
    if (dataType === "resolve") {
        const resolved = resolvePrimitiveType(value);
        return (resolved ?? "string") as ColumnDataType;
    }
    return dataType;
}

/**
 * Convert to JSON
 */
const toJSON = (data: Record<string, any>[], options: JSONExportOptions): string => {
    const columns = getColumns(data, options);
    const filtered = data.map(row => {
        const obj: Record<string, any> = {};
        columns.forEach(col => {
            obj[col.key] = row[col.key];
        });
        return obj;
    });

    return options.pretty
        ? JSON.stringify(filtered, null, 2)
        : JSON.stringify(filtered);
};

/**
 * Convert to CSV
 */
const toCSV = (data: Record<string, any>[], options: CSVExportOptions): string => {
    const delimiter = options.delimiter ?? ',';
    const quoteStrings = options.quoteStrings ?? false;
    const quote = options.quote ?? '"';
    const quoteAll = options.quoteAll ?? false;
    const columns = getColumns(data, options);
    const lines: string[] = [];

    if (options.includeHeaders !== false) {
        lines.push(columns.map(col => escapeCSV(col.key, "string", delimiter, quote, quoteAll, quoteStrings)).join(delimiter));
    }

    data.forEach(row => {
        const values = columns.map(col => {
            const rawValue = row[col.key]; // Nie normalizuj od razu, żeby zachować typ
            if (rawValue === null || rawValue === undefined) {
                return options.nullValue ?? '';
            }
            const value = normalizeValue(rawValue, col.dataType, options);
            return escapeCSV(value, resolveValueType(value, col.dataType), delimiter, quote, quoteAll, quoteStrings);
        });
        lines.push(values.join(delimiter));
    });

    return lines.join('\n');
};

/**
 * Convert to CSV
 */
const toTSV = (data: Record<string, any>[], options: TSVExportOptions): string => {
    const delimiter = '\t';
    const columns = getColumns(data, options);
    const lines: string[] = [];

    if (options.includeHeaders !== false) {
        lines.push(columns.map(col => escapeTSV(col.key, "string")).join(delimiter));
    }

    data.forEach(row => {
        const values = columns.map(col => {
            const rawValue = row[col.key]; // Nie normalizuj od razu, żeby zachować typ
            if (rawValue === null || rawValue === undefined) {
                return options.nullValue ?? '';
            }
            const value = normalizeValue(rawValue, col.dataType, options);
            return escapeTSV(value, resolveValueType(value, col.dataType));
        });
        lines.push(values.join(delimiter));
    });

    return lines.join('\n');
};

/**
 * Convert to Markdown table
 */
const toMarkdown = (data: Record<string, any>[], options: TableExportOptions): string => {
    const columns = getColumns(data, options);
    const lines: string[] = [];

    if (options.includeHeaders !== false) {
        lines.push('| ' + columns.join(' | ') + ' |');
        lines.push('| ' + columns.map(() => '---').join(' | ') + ' |');
    }

    data.forEach(row => {
        const values = columns.map(col => {
            const rawValue = row[col.key];
            if (rawValue === null || rawValue === undefined) {
                return (options.nullValue ?? '').replace(/\|/g, '\\|');
            }
            const value = normalizeValue(rawValue, col.dataType, options);
            return value.replace(/\|/g, '\\|');
        });
        lines.push('| ' + values.join(' | ') + ' |');
    });

    return lines.join('\n');
};

/**
 * Convert to HTML table
 */
const toHTML = (data: Record<string, any>[], options: TableExportOptions): string => {
    const columns = getColumns(data, options);
    let html = '<table border="1" cellpadding="5" cellspacing="0">\n';

    if (options.includeHeaders !== false) {
        html += '  <thead>\n    <tr>\n';
        columns.forEach(col => {
            html += `      <th>${escapeHTML(col.key)}</th>\n`;
        });
        html += '    </tr>\n  </thead>\n';
    }

    html += '  <tbody>\n';
    data.forEach(row => {
        html += '    <tr>\n';
        columns.forEach(col => {
            const rawValue = row[col.key];
            const value = rawValue === null || rawValue === undefined
                ? (options.nullValue ?? '')
                : normalizeValue(rawValue, resolveValueType(rawValue, col.dataType), options);
            html += `      <td>${escapeHTML(value)}</td>\n`;
        });
        html += '    </tr>\n';
    });
    html += '  </tbody>\n</table>';

    return html;
};

/**
 * Convert to Redmine wiki table
 */
const toRedmine = (data: Record<string, any>[], options: TableExportOptions): string => {
    const columns = getColumns(data, options);
    const lines: string[] = [];

    if (options.includeHeaders !== false) {
        lines.push('|_. ' + columns.map(col => col.key).join(' |_. ') + ' |');
    }

    data.forEach(row => {
        const values = columns.map(col => {
            const rawValue = row[col.key];
            if (rawValue === null || rawValue === undefined) {
                return (options.nullValue ?? '').replace(/\|/g, '\\|');
            }
            const value = normalizeValue(rawValue, resolveValueType(rawValue, col.dataType), options);
            return value.replace(/\|/g, '\\|');
        });
        lines.push('| ' + values.join(' | ') + ' |');
    });

    return lines.join('\n');
};

/**
 * Convert to Jira markup table
 */
const toJira = (data: Record<string, any>[], options: TableExportOptions): string => {
    const columns = getColumns(data, options);
    const lines: string[] = [];

    if (options.includeHeaders !== false) {
        lines.push('|| ' + columns.map(col => col.key).join(' || ') + ' ||');
    }

    data.forEach(row => {
        const values = columns.map(col => {
            const rawValue = row[col.key];
            if (rawValue === null || rawValue === undefined) {
                return (options.nullValue ?? '').replace(/\|/g, '\\|');
            }
            const value = normalizeValue(rawValue, resolveValueType(rawValue, col.dataType), options);
            return value.replace(/\|/g, '\\|');
        });
        lines.push('| ' + values.join(' | ') + ' |');
    });

    return lines.join('\n');
};

/**
 * Convert to BBCode table
 */
const toBBCode = (data: Record<string, any>[], options: TableExportOptions): string => {
    const columns = getColumns(data, options);
    let bbcode = '[table]\n';

    if (options.includeHeaders !== false) {
        bbcode += '[tr]';
        columns.forEach(col => {
            bbcode += `[th]${col.key}[/th]`;
        });
        bbcode += '[/tr]\n';
    }

    data.forEach(row => {
        bbcode += '[tr]';
        columns.forEach(col => {
            const rawValue = row[col.key];
            const value = rawValue === null || rawValue === undefined
                ? (options.nullValue ?? '')
                : normalizeValue(rawValue, resolveValueType(rawValue, col.dataType), options);
            bbcode += `[td]${value}[/td]`;
        });
        bbcode += '[/tr]\n';
    });

    bbcode += '[/table]';
    return bbcode;
};

/**
 * Convert to XML
 */
const toXML = (data: Record<string, any>[], options: XMLExportOptions): string => {
    const columns = getColumns(data, options);
    const rootElement = options.rootElement ?? 'root';
    const itemElement = options.itemElement ?? 'item';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}>\n`;

    data.forEach((row, index) => {
        xml += `  <${itemElement} index="${index}">\n`;
        columns.forEach(col => {
            const rawValue = row[col.key];
            const value = rawValue === null || rawValue === undefined
                ? (options.nullValue ?? '')
                : normalizeValue(rawValue, resolveValueType(rawValue, col.dataType), options);
            xml += `    <${escapeXML(col.key)}>${escapeXML(value)}</${escapeXML(col.key)}>\n`;
        });
        xml += `  </${itemElement}>\n`;
    });

    xml += `</${rootElement}>`;
    return xml;
};

function dataTypeToSqlType(dataType: ColumnDataType): string {
    switch (toBaseType(dataType)) {
        case 'string':
            return 'VARCHAR(255)';
        case 'number':
            return 'FLOAT';
        case 'boolean':
            return 'BOOLEAN';
        case 'datetime':
            return 'TIMESTAMP';
        case 'binary':
            return 'BLOB';
        case 'array':
            return 'TEXT';
        case 'object':
            return 'TEXT';
        default:
            return 'TEXT';
    }
}

/**
 * Convert to SQL INSERT statements
 */
const toSQL = (data: Record<string, any>[], options: SQLExportOptions): string => {
    const columns = getColumns(data, options);
    const tableName = options.tableName || 'table_name';
    const batchSize = options.batchSize || 100;
    const identifierQuote = options.identifierQuote ?? '"';
    const lines: string[] = [];

    if (options.includeCreateTable) {
        lines.push(`CREATE TABLE ${identifierQuote}${tableName}${identifierQuote} (`);
        columns.forEach((col, idx) => {
            const comma = idx < columns.length - 1 ? ',' : '';
            lines.push(`   ${identifierQuote}${col.key}${identifierQuote} ${dataTypeToSqlType(col.dataType === "resolve" ? "string" : col.dataType)}${comma}`);
        });
        lines.push(');\n');
    }

    const columnList = columns.map(c => `${identifierQuote}${c.key}${identifierQuote}`).join(', ');

    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const values = batch.map(row => {
            const vals = columns.map(col => {
                const value = row[col.key];
                if (value === null || value === undefined) {
                    return options.nullValue ?? 'NULL';
                }
                return `'${escapeSQL(normalizeValue(value, resolveValueType(value, col.dataType), options))}'`;
            });
            return `(${vals.join(', ')})`;
        });

        lines.push(`INSERT INTO ${identifierQuote}${tableName}${identifierQuote} (${columnList})`);
        lines.push(`VALUES ${values.join(',\n       ')};`);
        lines.push('');
    }

    return lines.join('\n');
};

/**
 * Convert to YAML
 */
const toYAML = (data: Record<string, any>[], options: YAMLExportOptions): string => {
    const columns = getColumns(data, options);
    const indent = options.indent || 2;
    const spaces = ' '.repeat(indent);
    const lines: string[] = [];

    data.forEach((row, index) => {
        lines.push(`- # Item ${index}`);
        columns.forEach(col => {
            const value = row[col.key];
            let yamlValue: string;

            if (value === null || value === undefined) {
                yamlValue = options.nullValue ?? 'null';
            } else if (typeof value === 'string') {
                yamlValue = value.includes('\n') || value.includes(':') || value.includes('#')
                    ? `"${value.replace(/"/g, '\\"')}"`
                    : value;
            } else if (typeof value === 'object') {
                yamlValue = JSON.stringify(value);
            } else {
                yamlValue = String(value);
            }

            lines.push(`${spaces}${col}: ${yamlValue}`);
        });
    });

    return lines.join('\n');
};

/**
 * Convert to LaTeX table
 */
const toLaTeX = (data: Record<string, any>[], options: LaTeXExportOptions): string => {
    const columns = getColumns(data, options);
    const style = options.tableStyle || 'basic';
    const lines: string[] = [];

    const escapeLatex = (str: string): string => {
        return str
            .replace(/\\/g, '\\textbackslash{}')
            .replace(/[&%$#_{}]/g, '\\$&')
            .replace(/~/g, '\\textasciitilde{}')
            .replace(/\^/g, '\\textasciicircum{}');
    };

    if (style === 'booktabs') {
        lines.push('\\begin{table}[h]');
        lines.push('\\centering');
        lines.push(`\\begin{tabular}{${'l'.repeat(columns.length)}}`);
        lines.push('\\toprule');
    } else if (style === 'longtable') {
        lines.push(`\\begin{longtable}{${'|l'.repeat(columns.length)}|}`);
        lines.push('\\hline');
    } else {
        lines.push(`\\begin{tabular}{${'|l'.repeat(columns.length)}|}`);
        lines.push('\\hline');
    }

    if (options.includeHeaders !== false) {
        const headers = columns.map(c => `\\textbf{${escapeLatex(c.key)}}`).join(' & ');
        lines.push(headers + ' \\\\');
        lines.push(style === 'booktabs' ? '\\midrule' : '\\hline');
    }

    data.forEach(row => {
        const values = columns.map(col => {
            const rawValue = row[col.key];
            const value = rawValue === null || rawValue === undefined
                ? (options.nullValue ?? '')
                : normalizeValue(rawValue, resolveValueType(rawValue, col.dataType), options);
            return escapeLatex(value);
        });
        lines.push(values.join(' & ') + ' \\\\');
        if (style !== 'booktabs') {
            lines.push('\\hline');
        }
    });

    if (style === 'booktabs') {
        lines.push('\\bottomrule');
        lines.push('\\end{tabular}');
        lines.push('\\caption{Table caption}');
        lines.push('\\label{tab:label}');
        lines.push('\\end{table}');
    } else if (style === 'longtable') {
        lines.push('\\end{longtable}');
    } else {
        lines.push('\\end{tabular}');
    }

    return lines.join('\n');
};

/**
 * Convert to ASCII table
 */
const toASCII = (data: Record<string, any>[], options: ASCIITableExportOptions): string => {
    const columns = getColumns(data, options);
    const borderStyle = options.borderStyle || 'single';

    const borders = {
        single: { tl: '┌', tr: '┐', bl: '└', br: '╯', h: '─', v: '│', cross: '┼', t: '┬', b: '┴', l: '├', r: '┤' },
        double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║', cross: '╬', t: '╦', b: '╩', l: '╠', r: '╣' },
        rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│', cross: '┼', t: '┬', b: '┴', l: '├', r: '┤' },
        minimal: { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|', cross: '+', t: '+', b: '+', l: '+', r: '+' }
    };

    const b = borders[borderStyle];

    // Calculate column widths
    const widths = columns.map(col => {
        let max = col.key.length;
        data.forEach(row => {
            const rawValue = row[col.key];
            const value = rawValue === null || rawValue === undefined
                ? (options.nullValue ?? '')
                : normalizeValue(rawValue, resolveValueType(rawValue, col.dataType), options);
            const len = value.length;
            if (len > max) max = len;
        });
        return max;
    });

    const lines: string[] = [];

    // Top border
    lines.push(
        b.tl +
        widths.map(w => b.h.repeat(w + 2)).join(b.t) +
        b.tr
    );

    // Header
    if (options.includeHeaders !== false) {
        const header = columns.map((col, i) => ' ' + col.key.padEnd(widths[i]) + ' ').join(b.v);
        lines.push(b.v + header + b.v);

        // Header separator
        lines.push(
            b.l +
            widths.map(w => b.h.repeat(w + 2)).join(b.cross) +
            b.r
        );
    }

    // Rows
    data.forEach(row => {
        const values = columns.map((col, i) => {
            const rawValue = row[col.key];
            const value = rawValue === null || rawValue === undefined
                ? (options.nullValue ?? '')
                : normalizeValue(rawValue, resolveValueType(rawValue, col.dataType), options);
            return ' ' + value.padEnd(widths[i]) + ' ';
        }).join(b.v);
        lines.push(b.v + values + b.v);
    });

    // Bottom border
    lines.push(
        b.bl +
        widths.map(w => b.h.repeat(w + 2)).join(b.b) +
        b.br
    );

    return lines.join('\n');
};

/**
 * Convert to DataText Format
 * @example
 * -id---name------age---
 *  1    Alice     30
 */
const toDataText = (data: Record<string, any>[], options: DataTextExportOptions): string => {
    const columns = getColumns(data, options);

    // Calculate column widths based on header and data
    const widths = columns.map(col => {
        let max = col.key.length;
        data.forEach(row => {
            const rawValue = row[col.key];
            const value = rawValue === null || rawValue === undefined
                ? (options.nullValue ?? '')
                : normalizeValue(rawValue, resolveValueType(rawValue, col.dataType), options);
            if (value.length > max) max = value.length;
        });
        return max;
    });

    const lines: string[] = [];

    // Header line with dashes
    const header = columns.map((col, i) => '-' + col.key.padEnd(widths[i], '-')).join('');
    lines.push(header);

    // Data lines with leading space
    data.forEach(row => {
        const values = columns.map((col, i) => {
            const rawValue = row[col.key];
            const value = rawValue === null || rawValue === undefined
                ? (options.nullValue ?? '')
                : normalizeValue(rawValue, resolveValueType(rawValue, col.dataType), options);
            return ' ' + value.padEnd(widths[i]);
        }).join('');
        lines.push(values);
    });

    return lines.join('\n');
};

/**
 * Convert to reStructuredText table
 */
const toRST = (data: Record<string, any>[], options: RSTExportOptions): string => {
    const columns = getColumns(data, options);
    const style = options.tableStyle || 'grid';

    if (style === 'simple') {
        // Calculate column widths
        const widths = columns.map(col => {
            let max = col.key.length;
            data.forEach(row => {
                const rawValue = row[col.key];
                const value = rawValue === null || rawValue === undefined
                    ? (options.nullValue ?? '')
                    : normalizeValue(rawValue, resolveValueType(rawValue, col.dataType), options);
                const len = value.length;
                if (len > max) max = len;
            });
            return max;
        });

        const lines: string[] = [];
        const separator = widths.map(w => '='.repeat(w)).join(' ');

        lines.push(separator);

        if (options.includeHeaders !== false) {
            const header = columns.map((col, i) => col.key.padEnd(widths[i])).join(' ');
            lines.push(header);
            lines.push(separator);
        }

        data.forEach(row => {
            const values = columns.map((col, i) => {
                const rawValue = row[col.key];
                const value = rawValue === null || rawValue === undefined
                    ? (options.nullValue ?? '')
                    : normalizeValue(rawValue, resolveValueType(rawValue, col.dataType), options);
                return value.padEnd(widths[i]);
            }).join(' ');
            lines.push(values);
        });

        lines.push(separator);
        return lines.join('\n');
    } else {
        // Grid style
        const widths = columns.map(col => {
            let max = col.key.length;
            data.forEach(row => {
                const rawValue = row[col.key];
                const value = rawValue === null || rawValue === undefined
                    ? (options.nullValue ?? '')
                    : normalizeValue(rawValue, resolveValueType(rawValue, col.dataType), options);
                const len = value.length;
                if (len > max) max = len;
            });
            return max;
        });

        const lines: string[] = [];
        const topBorder = '+' + widths.map(w => '-'.repeat(w + 2)).join('+') + '+';

        lines.push(topBorder);

        if (options.includeHeaders !== false) {
            const header = '| ' + columns.map((col, i) => col.key.padEnd(widths[i])).join(' | ') + ' |';
            lines.push(header);
            lines.push('+' + widths.map(w => '='.repeat(w + 2)).join('+') + '+');
        }

        data.forEach(row => {
            const values = '| ' + columns.map((col, i) => {
                const rawValue = row[col.key];
                const value = rawValue === null || rawValue === undefined
                    ? (options.nullValue ?? '')
                    : normalizeValue(rawValue, resolveValueType(rawValue, col.dataType), options);
                return value.padEnd(widths[i]);
            }).join(' | ') + ' |';
            lines.push(values);
            lines.push(topBorder);
        });

        return lines.join('\n');
    }
};

/**
 * Convert to Excel XML (SpreadsheetML)
 */
const toExcelXML = (data: Record<string, any>[], options: ExcelXMLExportOptions): string => {
    const columns = getColumns(data, options);
    const sheetName = options.sheetName || 'Sheet1';

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<?mso-application progid="Excel.Sheet"?>\n';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xml += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xml += `  <Worksheet ss:Name="${escapeXML(sheetName)}">\n`;
    xml += '    <Table>\n';

    // Header row
    if (options.includeHeaders !== false) {
        xml += '      <Row>\n';
        columns.forEach(col => {
            xml += '        <Cell>\n';
            xml += `          <Data ss:Type="String">${escapeXML(col.key)}</Data>\n`;
            xml += '        </Cell>\n';
        });
        xml += '      </Row>\n';
    }

    // Data rows
    data.forEach(row => {
        xml += '      <Row>\n';
        columns.forEach(col => {
            const value = row[col.key];
            let cellType = 'String';
            let cellValue = '';

            if (value === null || value === undefined) {
                cellValue = options.nullValue ?? '';
            } else if (typeof value === 'number') {
                cellType = 'Number';
                cellValue = value.toString();
            } else if (typeof value === 'boolean') {
                cellType = 'Boolean';
                cellValue = value ? '1' : '0';
            } else if (value instanceof Date) {
                cellType = 'DateTime';
                cellValue = value.toISOString();
            } else {
                cellValue = escapeXML(normalizeValue(value, resolveValueType(value, col.dataType), options));
            }

            xml += '        <Cell>\n';
            xml += `          <Data ss:Type="${cellType}">${cellValue}</Data>\n`;
            xml += '        </Cell>\n';
        });
        xml += '      </Row>\n';
    });

    xml += '    </Table>\n';
    xml += '  </Worksheet>\n';
    xml += '</Workbook>';

    return xml;
};

const toPascal = (data: Record<string, any>[], options: PascalExportOptions = {}): string => {
    const columns = getColumns(data, options);
    const varName = options.variableName || "Data";
    const typeName = options.typeName || "TRecord";
    // Definicja typu rekordu
    const typeDef = `type\n  ${typeName} = record\n` +
        columns.map(col => `    ${col.key}: string;`).join('\n') +
        `\n  end;\n`;
    // Dane
    const arr = data.map(row => {
        const fields = columns.map(col => {
            const value = row[col.key];
            const finalValue = value === null || value === undefined
                ? (options.nullValue ?? "")
                : value;
            return `${col.key}: ${JSON.stringify(finalValue)}`;
        }).join('; ');
        return `    (${fields})`;
    });
    return `${typeDef}\nvar\n  ${varName}: array[1..${arr.length}] of ${typeName} = (\n${arr.join(',\n')}\n  );`;
}

/**
 * Convert to JavaScript
 */
const toJS = (data: Record<string, any>[], options: JSExportOptions = {}): string => {
    const columns = getColumns(data, options);
    const arr = data.map(row => {
        const obj = columns.map(col => {
            const value = row[col.key];
            const finalValue = value === null || value === undefined
                ? (options.nullValue ?? null)
                : value;
            return `${JSON.stringify(col.key)}: ${JSON.stringify(finalValue)}`;
        }).join(', ');
        return `{ ${obj} }`;
    });
    const varName = options.variableName || "data";
    return `const ${varName} = [\n  ${arr.join(',\n  ')}\n];`;
};

/**
 * Convert to TypeScript
 */
const toTS = (data: Record<string, any>[], options: TSExportOptions = {}): string => {
    const columns = getColumns(data, options);
    const typeName = options.typeName || "Row";
    const varName = options.variableName || "data";
    const type = `type ${typeName} = { ${columns.map(col => `${col.key}: any`).join('; ')} };`;
    const arr = data.map(row => {
        const obj = columns.map(col => {
            const value = row[col.key];
            const finalValue = value === null || value === undefined
                ? (options.nullValue ?? null)
                : value;
            return `${JSON.stringify(col.key)}: ${JSON.stringify(finalValue)}`;
        }).join(', ');
        return `{ ${obj} }`;
    });
    return `${type}\nconst ${varName}: ${typeName}[] = [\n  ${arr.join(',\n  ')}\n];`;
};

/**
 * Convert to Java
 */
const toJava = (data: Record<string, any>[], options: JavaExportOptions = {}): string => {
    const columns = getColumns(data, options);
    const varName = options.variableName || "data";
    const className = options.className || "Row";
    const arr = data.map(row => {
        const vals = columns.map(col => {
            const value = row[col.key];
            const finalValue = value === null || value === undefined
                ? (options.nullValue ?? null)
                : value;
            return JSON.stringify(finalValue);
        }).join(", ");
        return `    new Object[]{ ${vals} }`;
    });
    return `// class ${className} { ... }\nObject[][] ${varName} = {\n${arr.join(",\n")}\n};`;
};

/**
 * Convert to C++
 */
const toCPP = (data: Record<string, any>[], options: CPPExportOptions = {}): string => {
    const columns = getColumns(data, options);
    const varName = options.variableName || "data";
    const typeName = options.typeName || "Row";
    const arr = data.map(row => {
        const vals = columns.map(col => {
            const value = row[col.key];
            const finalValue = value === null || value === undefined
                ? (options.nullValue ?? "")
                : value;
            return JSON.stringify(finalValue);
        }).join(", ");
        return `    { ${vals} }`;
    });
    return `// struct ${typeName} { ... }\nstd::vector<std::array<std::string, ${columns.length}>> ${varName} = {\n${arr.join(",\n")}\n};`;
};

/**
 * Convert to PHP
 */
const toPHP = (data: Record<string, any>[], options: PHPExportOptions = {}): string => {
    const columns = getColumns(data, options);
    const varName = options.variableName || "data";
    const arr = data.map(row => {
        const obj = columns.map(col => {
            const value = row[col.key];
            const finalValue = value === null || value === undefined
                ? (options.nullValue ?? null)
                : value;
            return `'${col.key}' => ${JSON.stringify(finalValue)}`;
        }).join(', ');
        return `    [${obj}]`;
    });
    return `$${varName} = [\n${arr.join(",\n")}\n];`;
};

/**
 * Convert to Perl
 */
const toPerl = (data: Record<string, any>[], options: PerlExportOptions = {}): string => {
    const columns = getColumns(data, options);
    const varName = options.variableName || "data";
    const arr = data.map(row => {
        const obj = columns.map(col => {
            const value = row[col.key];
            const finalValue = value === null || value === undefined
                ? (options.nullValue ?? null)
                : value;
            return `'${col.key}' => ${JSON.stringify(finalValue)}`;
        }).join(', ');
        return `    { ${obj} }`;
    });
    return `my @${varName} = (\n${arr.join(",\n")}\n);`;
};

/**
 * Convert array of objects to various formats
 */
export function arrayTo(data: Record<string, any>[], format: 'json', options?: JSONExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'csv', options?: CSVExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'tsv', options?: TSVExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'markdown' | 'html' | 'redmine' | 'jira' | 'bbcode', options?: TableExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'xml', options?: XMLExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'sql', options?: SQLExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'yaml', options?: YAMLExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'latex', options?: LaTeXExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'ascii', options?: ASCIITableExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'datatext', options?: DataTextExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'rst', options?: RSTExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'excel-xml', options?: ExcelXMLExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'js', options?: JSExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'ts', options?: TSExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'java', options?: JavaExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'cpp', options?: CPPExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'php', options?: PHPExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'perl', options?: PerlExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'pascal', options?: PascalExportOptions): ExportResult;
export function arrayTo(
    data: Record<string, any>[],
    format: ExportFormat,
    options: BaseExportOptions = {}
): ExportResult {
    if (!Array.isArray(data) || data.length === 0) {
        return {
            content: '',
            mimeType: 'text/plain',
            fileExtension: 'txt',
        };
    }

    let content: string;

    switch (format) {
        case 'json': content = toJSON(data, options as JSONExportOptions); break;
        case 'csv': content = toCSV(data, options as CSVExportOptions); break;
        case 'tsv': content = toTSV(data, options as CSVExportOptions); break;
        case 'markdown': content = toMarkdown(data, options as TableExportOptions); break;
        case 'html': content = toHTML(data, options as TableExportOptions); break;
        case 'redmine': content = toRedmine(data, options as TableExportOptions); break;
        case 'jira': content = toJira(data, options as TableExportOptions); break;
        case 'bbcode': content = toBBCode(data, options as TableExportOptions); break;
        case 'xml': content = toXML(data, options as XMLExportOptions); break;
        case 'sql': content = toSQL(data, options as SQLExportOptions); break;
        case 'yaml': content = toYAML(data, options as YAMLExportOptions); break;
        case 'latex': content = toLaTeX(data, options as LaTeXExportOptions); break;
        case 'ascii': content = toASCII(data, options as ASCIITableExportOptions); break;
        case 'datatext': content = toDataText(data, options as DataTextExportOptions); break;
        case 'rst': content = toRST(data, options as RSTExportOptions); break;
        case 'excel-xml': content = toExcelXML(data, options as ExcelXMLExportOptions); break;
        case 'js': content = toJS(data, options as JSExportOptions); break;
        case 'ts': content = toTS(data, options as TSExportOptions); break;
        case 'java': content = toJava(data, options as JavaExportOptions); break;
        case 'cpp': content = toCPP(data, options as CPPExportOptions); break;
        case 'php': content = toPHP(data, options as PHPExportOptions); break;
        case 'perl': content = toPerl(data, options as PerlExportOptions); break;
        case 'pascal': content = toPascal(data, options as PascalExportOptions); break;
        default:
            content = '';
    }

    return {
        content,
        mimeType: exportFormats[format].mimeType,
        fileExtension: exportFormats[format].fileExtension,
    };
}

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
};

/**
 * Export and copy to clipboard
 */
export async function exportToClipboard(data: Record<string, any>[], format: 'json', options?: JSONExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'csv', options?: CSVExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'tsv', options?: TSVExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'markdown' | 'html' | 'redmine' | 'jira' | 'bbcode', options?: TableExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'xml', options?: XMLExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'sql', options?: SQLExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'yaml', options?: YAMLExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'latex', options?: LaTeXExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'ascii', options?: ASCIITableExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'datatext', options?: DataTextExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'rst', options?: RSTExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'excel-xml', options?: ExcelXMLExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'js', options?: JSExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'ts', options?: TSExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'java', options?: JavaExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'cpp', options?: CPPExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'php', options?: PHPExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'perl', options?: PerlExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'pascal', options?: PascalExportOptions): Promise<boolean>;
export async function exportToClipboard(
    data: Record<string, any>[],
    format: ExportFormat,
    options: BaseExportOptions = {}
): Promise<boolean> {
    const result = arrayTo(data, format as any, options);
    return copyToClipboard(result.content);
}

/**
 * Export and download as file
 */
export function exportToFile(data: Record<string, any>[], format: 'json', options?: JSONExportOptions, filename?: string): void;
export function exportToFile(data: Record<string, any>[], format: 'csv' | 'tsv', options?: CSVExportOptions, filename?: string): void;
export function exportToFile(data: Record<string, any>[], format: 'markdown' | 'html' | 'redmine' | 'jira' | 'bbcode', options?: TableExportOptions, filename?: string): void;
export function exportToFile(data: Record<string, any>[], format: 'xml', options?: XMLExportOptions, filename?: string): void;
export function exportToFile(data: Record<string, any>[], format: 'sql', options?: SQLExportOptions, filename?: string): void;
export function exportToFile(data: Record<string, any>[], format: 'yaml', options?: YAMLExportOptions, filename?: string): void;
export function exportToFile(data: Record<string, any>[], format: 'latex', options?: LaTeXExportOptions, filename?: string): void;
export function exportToFile(data: Record<string, any>[], format: 'ascii', options?: ASCIITableExportOptions, filename?: string): void;
export function exportToFile(data: Record<string, any>[], format: 'datatext', options?: DataTextExportOptions, filename?: string): void;
export function exportToFile(data: Record<string, any>[], format: 'rst', options?: RSTExportOptions, filename?: string): void;
export function exportToFile(data: Record<string, any>[], format: 'excel-xml', options?: ExcelXMLExportOptions, filename?: string): void;
export function exportToFile(data: Record<string, any>[], format: 'js', options?: JSExportOptions, filename?: string): void;
export function exportToFile(data: Record<string, any>[], format: 'ts', options?: TSExportOptions, filename?: string): void;
export function exportToFile(data: Record<string, any>[], format: 'java', options?: JavaExportOptions, filename?: string): void;
export function exportToFile(data: Record<string, any>[], format: 'cpp', options?: CPPExportOptions, filename?: string): void;
export function exportToFile(data: Record<string, any>[], format: 'php', options?: PHPExportOptions, filename?: string): void;
export function exportToFile(data: Record<string, any>[], format: 'perl', options?: PerlExportOptions, filename?: string): void;
export function exportToFile(data: Record<string, any>[], format: 'pascal', options?: PascalExportOptions, filename?: string): void;
export function exportToFile(
    data: Record<string, any>[],
    format: ExportFormat,
    options: BaseExportOptions = {},
    filename?: string
): void {
    const result = arrayTo(data, format as any, options);
    const finalFilename = filename || `export.${result.fileExtension}`;

    const blob = new Blob([result.content], { type: result.mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
