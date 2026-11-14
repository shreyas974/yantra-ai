/**
 * Neutralizes CSV formula injection attacks by prepending a single quote
 * to any cell whose first character is =, +, -, @, \t, or \r.
 */
export function sanitizeCsvValue(val: any): string {
    if (val === null || val === undefined)
        return '""';
    let str = String(val);
    // Neutralize formula injection
    if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
    }
    // Escape double quotes
    str = str.replace(/"/g, '""');
    return `"${str}"`;
}
export function generateCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
    const headerLine = headers.map(sanitizeCsvValue).join(",");
    const rowLines = rows.map((row) => row.map(sanitizeCsvValue).join(","));
    return [headerLine, ...rowLines].join("\r\n");
}
