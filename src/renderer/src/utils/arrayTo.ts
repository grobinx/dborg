export type ExportFormat = 
    | 'json' | 'csv' | 'tsv' | 'markdown' | 'html' | 'redmine' | 'xml'
    | 'sql' | 'yaml' | 'latex' | 'jira' | 'ascii' | 'rst' | 'bbcode' | 'excel-xml';

// Bazowe opcje wspólne dla wszystkich formatów
interface BaseExportOptions {
    columns?: string[];
    nullValue?: string;
    booleanFormat?: 'text' | 'number' | 'yesno';
    dateFormat?: (date: Date) => string;
    numberFormat?: (num: number) => string;
}

// Opcje specyficzne dla JSON
interface JSONExportOptions extends BaseExportOptions {
    pretty?: boolean;
}

// Opcje specyficzne dla CSV/TSV
interface CSVExportOptions extends BaseExportOptions {
    includeHeaders?: boolean;
    delimiter?: string;
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

export interface ExportResult {
    content: string;
    mimeType: string;
    fileExtension: string;
}

/**
 * Normalizes a value for export
 */
const normalizeValue = (
    value: any,
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

    if (value instanceof Date) {
        return options.dateFormat ? options.dateFormat(value) : value.toISOString();
    }

    if (typeof value === 'number') {
        return options.numberFormat ? options.numberFormat(value) : value.toString();
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
};

/**
 * Escapes a value for CSV format
 */
const escapeCSV = (value: string, delimiter: string = ','): string => {
    if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
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
const getColumns = (data: Record<string, any>[], options: BaseExportOptions): string[] => {
    if (options.columns && options.columns.length > 0) {
        return options.columns;
    }

    const allKeys = new Set<string>();
    data.forEach(row => {
        Object.keys(row).forEach(key => allKeys.add(key));
    });
    return Array.from(allKeys);
};

/**
 * Convert to JSON
 */
const toJSON = (data: Record<string, any>[], options: JSONExportOptions): string => {
    const columns = getColumns(data, options);
    const filtered = data.map(row => {
        const obj: Record<string, any> = {};
        columns.forEach(col => {
            obj[col] = row[col];
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
const toCSV = (data: Record<string, any>[], format: 'csv' | 'tsv', options: CSVExportOptions): string => {
    const delimiter = format === 'tsv' ? '\t' : (options.delimiter ?? ',');
    const columns = getColumns(data, options);
    const lines: string[] = [];

    if (options.includeHeaders !== false) {
        lines.push(columns.map(col => escapeCSV(col, delimiter)).join(delimiter));
    }

    data.forEach(row => {
        const values = columns.map(col => {
            const value = normalizeValue(row[col], options);
            return escapeCSV(value, delimiter);
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
            const value = normalizeValue(row[col], options);
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
            html += `      <th>${escapeHTML(col)}</th>\n`;
        });
        html += '    </tr>\n  </thead>\n';
    }

    html += '  <tbody>\n';
    data.forEach(row => {
        html += '    <tr>\n';
        columns.forEach(col => {
            const value = normalizeValue(row[col], options);
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
        lines.push('|_. ' + columns.join(' |_. ') + ' |');
    }

    data.forEach(row => {
        const values = columns.map(col => {
            const value = normalizeValue(row[col], options);
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
        lines.push('|| ' + columns.join(' || ') + ' ||');
    }

    data.forEach(row => {
        const values = columns.map(col => {
            const value = normalizeValue(row[col], options);
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
            bbcode += `[th]${col}[/th]`;
        });
        bbcode += '[/tr]\n';
    }

    data.forEach(row => {
        bbcode += '[tr]';
        columns.forEach(col => {
            const value = normalizeValue(row[col], options);
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
            const value = normalizeValue(row[col], options);
            xml += `    <${escapeXML(col)}>${escapeXML(value)}</${escapeXML(col)}>\n`;
        });
        xml += `  </${itemElement}>\n`;
    });

    xml += `</${rootElement}>`;
    return xml;
};

/**
 * Convert to SQL INSERT statements
 */
const toSQL = (data: Record<string, any>[], options: SQLExportOptions): string => {
    const columns = getColumns(data, options);
    const tableName = options.tableName || 'table_name';
    const batchSize = options.batchSize || 100;
    const lines: string[] = [];

    if (options.includeCreateTable) {
        lines.push(`-- CREATE TABLE ${tableName} (`);
        columns.forEach((col, idx) => {
            const comma = idx < columns.length - 1 ? ',' : '';
            lines.push(`--   ${col} VARCHAR(255)${comma}`);
        });
        lines.push('-- );\n');
    }

    const columnList = columns.map(c => `\`${c}\``).join(', ');

    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const values = batch.map(row => {
            const vals = columns.map(col => {
                const value = row[col];
                if (value === null || value === undefined) {
                    return 'NULL';
                }
                if (typeof value === 'number') {
                    return value.toString();
                }
                if (typeof value === 'boolean') {
                    return value ? '1' : '0';
                }
                return `'${escapeSQL(normalizeValue(value, options))}'`;
            });
            return `(${vals.join(', ')})`;
        });

        lines.push(`INSERT INTO \`${tableName}\` (${columnList})`);
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
            const value = row[col];
            let yamlValue: string;

            if (value === null || value === undefined) {
                yamlValue = 'null';
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
        const headers = columns.map(c => `\\textbf{${escapeLatex(c)}}`).join(' & ');
        lines.push(headers + ' \\\\');
        lines.push(style === 'booktabs' ? '\\midrule' : '\\hline');
    }

    data.forEach(row => {
        const values = columns.map(col => escapeLatex(normalizeValue(row[col], options)));
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
        single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│', cross: '┼', t: '┬', b: '┴', l: '├', r: '┤' },
        double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║', cross: '╬', t: '╦', b: '╩', l: '╠', r: '╣' },
        rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│', cross: '┼', t: '┬', b: '┴', l: '├', r: '┤' },
        minimal: { tl: ' ', tr: ' ', bl: ' ', br: ' ', h: '-', v: '|', cross: '+', t: '+', b: '+', l: '+', r: '+' }
    };

    const b = borders[borderStyle];

    // Calculate column widths
    const widths = columns.map(col => {
        let max = col.length;
        data.forEach(row => {
            const len = normalizeValue(row[col], options).length;
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
        const header = columns.map((col, i) => ' ' + col.padEnd(widths[i]) + ' ').join(b.v);
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
            const value = normalizeValue(row[col], options);
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
 * Convert to reStructuredText table
 */
const toRST = (data: Record<string, any>[], options: RSTExportOptions): string => {
    const columns = getColumns(data, options);
    const style = options.tableStyle || 'grid';

    if (style === 'simple') {
        // Calculate column widths
        const widths = columns.map(col => {
            let max = col.length;
            data.forEach(row => {
                const len = normalizeValue(row[col], options).length;
                if (len > max) max = len;
            });
            return max;
        });

        const lines: string[] = [];
        const separator = widths.map(w => '='.repeat(w)).join(' ');

        lines.push(separator);

        if (options.includeHeaders !== false) {
            const header = columns.map((col, i) => col.padEnd(widths[i])).join(' ');
            lines.push(header);
            lines.push(separator);
        }

        data.forEach(row => {
            const values = columns.map((col, i) => {
                return normalizeValue(row[col], options).padEnd(widths[i]);
            }).join(' ');
            lines.push(values);
        });

        lines.push(separator);
        return lines.join('\n');
    } else {
        // Grid style
        const widths = columns.map(col => {
            let max = col.length;
            data.forEach(row => {
                const len = normalizeValue(row[col], options).length;
                if (len > max) max = len;
            });
            return max;
        });

        const lines: string[] = [];
        const topBorder = '+' + widths.map(w => '-'.repeat(w + 2)).join('+') + '+';

        lines.push(topBorder);

        if (options.includeHeaders !== false) {
            const header = '| ' + columns.map((col, i) => col.padEnd(widths[i])).join(' | ') + ' |';
            lines.push(header);
            lines.push('+' + widths.map(w => '='.repeat(w + 2)).join('+') + '+');
        }

        data.forEach(row => {
            const values = '| ' + columns.map((col, i) => {
                return normalizeValue(row[col], options).padEnd(widths[i]);
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
            xml += `          <Data ss:Type="String">${escapeXML(col)}</Data>\n`;
            xml += '        </Cell>\n';
        });
        xml += '      </Row>\n';
    }

    // Data rows
    data.forEach(row => {
        xml += '      <Row>\n';
        columns.forEach(col => {
            const value = row[col];
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
                cellValue = escapeXML(normalizeValue(value, options));
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

/**
 * Convert array of objects to various formats
 */
export function arrayTo(data: Record<string, any>[], format: 'json', options?: JSONExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'csv' | 'tsv', options?: CSVExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'markdown' | 'html' | 'redmine' | 'jira' | 'bbcode', options?: TableExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'xml', options?: XMLExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'sql', options?: SQLExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'yaml', options?: YAMLExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'latex', options?: LaTeXExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'ascii', options?: ASCIITableExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'rst', options?: RSTExportOptions): ExportResult;
export function arrayTo(data: Record<string, any>[], format: 'excel-xml', options?: ExcelXMLExportOptions): ExportResult;
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
    let mimeType: string;
    let fileExtension: string;

    switch (format) {
        case 'json':
            content = toJSON(data, options as JSONExportOptions);
            mimeType = 'application/json';
            fileExtension = 'json';
            break;

        case 'csv':
        case 'tsv':
            content = toCSV(data, format, options as CSVExportOptions);
            mimeType = format === 'tsv' ? 'text/tab-separated-values' : 'text/csv';
            fileExtension = format;
            break;

        case 'markdown':
            content = toMarkdown(data, options as TableExportOptions);
            mimeType = 'text/markdown';
            fileExtension = 'md';
            break;

        case 'html':
            content = toHTML(data, options as TableExportOptions);
            mimeType = 'text/html';
            fileExtension = 'html';
            break;

        case 'redmine':
            content = toRedmine(data, options as TableExportOptions);
            mimeType = 'text/plain';
            fileExtension = 'txt';
            break;

        case 'jira':
            content = toJira(data, options as TableExportOptions);
            mimeType = 'text/plain';
            fileExtension = 'txt';
            break;

        case 'bbcode':
            content = toBBCode(data, options as TableExportOptions);
            mimeType = 'text/plain';
            fileExtension = 'txt';
            break;

        case 'xml':
            content = toXML(data, options as XMLExportOptions);
            mimeType = 'application/xml';
            fileExtension = 'xml';
            break;

        case 'sql':
            content = toSQL(data, options as SQLExportOptions);
            mimeType = 'application/sql';
            fileExtension = 'sql';
            break;

        case 'yaml':
            content = toYAML(data, options as YAMLExportOptions);
            mimeType = 'text/yaml';
            fileExtension = 'yaml';
            break;

        case 'latex':
            content = toLaTeX(data, options as LaTeXExportOptions);
            mimeType = 'application/x-latex';
            fileExtension = 'tex';
            break;

        case 'ascii':
            content = toASCII(data, options as ASCIITableExportOptions);
            mimeType = 'text/plain';
            fileExtension = 'txt';
            break;

        case 'rst':
            content = toRST(data, options as RSTExportOptions);
            mimeType = 'text/x-rst';
            fileExtension = 'rst';
            break;

        case 'excel-xml':
            content = toExcelXML(data, options as ExcelXMLExportOptions);
            mimeType = 'application/vnd.ms-excel';
            fileExtension = 'xml';
            break;

        default:
            content = '';
            mimeType = 'text/plain';
            fileExtension = 'txt';
    }

    return {
        content,
        mimeType,
        fileExtension,
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
export async function exportToClipboard(data: Record<string, any>[], format: 'csv' | 'tsv', options?: CSVExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'markdown' | 'html' | 'redmine' | 'jira' | 'bbcode', options?: TableExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'xml', options?: XMLExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'sql', options?: SQLExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'yaml', options?: YAMLExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'latex', options?: LaTeXExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'ascii', options?: ASCIITableExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'rst', options?: RSTExportOptions): Promise<boolean>;
export async function exportToClipboard(data: Record<string, any>[], format: 'excel-xml', options?: ExcelXMLExportOptions): Promise<boolean>;
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
export function exportToFile(data: Record<string, any>[], format: 'rst', options?: RSTExportOptions, filename?: string): void;
export function exportToFile(data: Record<string, any>[], format: 'excel-xml', options?: ExcelXMLExportOptions, filename?: string): void;
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