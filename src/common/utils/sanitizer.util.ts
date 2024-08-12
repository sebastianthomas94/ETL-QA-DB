export function sanitizeInput(input: string) {
    if (typeof input !== "string") {
        return "";
    }

    // Remove HTML tags
    let sanitized = input.replace(/<[^>]*>/g, "");

    // Convert special characters to HTML entities
    sanitized = sanitized.replace(/[&<>"']/g, (match) => {
        return (
            {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            }[match] || match
        );
    });

    // Trim whitespace from both ends of the string
    sanitized = sanitized.trim();

    // Remove or encode potentially harmful characters
    sanitized = sanitized.replace(/[^\w\s.,!?-]/gi, (match) => {
        return "&#" + match.charCodeAt(0) + ";";
    });

    return sanitized;
}
