/**
 * Split a CSV line into an array of values while respecting quoted segments.
 *
 * @param line - Raw CSV line.
 * @returns Array of parsed values.
 */
export function parseCSVString(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let isInQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (isInQuotes) {
            if (char === '"' && line[i + 1] === '"') {
                // Handle escaped double quote within quoted string
                current += '"';
                i++; // Skip the next quote
            } else if (char === '"') {
                // End of quoted string
                isInQuotes = false;
            } else {
                // Normal character within quotes
                current += char;
            }
        } else {
            if (char === ",") {
                // End of value
                result.push(current.trim());
                current = "";
            } else if (char === '"') {
                // Start of quoted string
                isInQuotes = true;
            } else {
                // Normal character outside quotes
                current += char;
            }
        }
    }

    result.push(current.trim());

    return result;
}
