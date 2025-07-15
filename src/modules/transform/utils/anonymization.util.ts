import { faker } from "@faker-js/faker";

/**
 * Generate fake data based on the field key
 */
export function generateFakeValue(key: string): string {
    const lowerKey = key.toLowerCase();

    switch (true) {
        case lowerKey.includes("name") || lowerKey.includes("fullname"):
            return faker.person.fullName();
        case lowerKey.includes("firstname"):
            return faker.person.firstName();
        case lowerKey.includes("lastname"):
            return faker.person.lastName();
        case lowerKey.includes("email"):
            return faker.internet.email();
        case lowerKey.includes("phone") || lowerKey.includes("mobile") || lowerKey.includes("contact"):
            return faker.phone.number();
        case lowerKey.includes("address") || lowerKey.includes("street"):
            return faker.location.streetAddress();
        case lowerKey.includes("city"):
            return faker.location.city();
        case lowerKey.includes("state"):
            return faker.location.state();
        case lowerKey.includes("zip") || lowerKey.includes("postal"):
            return faker.location.zipCode();
        case lowerKey.includes("ssn") || lowerKey.includes("social"):
            return `${faker.number.int({ min: 100, max: 999 })}-${faker.number.int({ min: 10, max: 99 })}-${faker.number.int({ min: 1000, max: 9999 })}`;
        case lowerKey.includes("bank") || lowerKey.includes("account"):
            return faker.finance.accountNumber();
        case lowerKey.includes("credit"):
            return faker.finance.creditCardNumber();
        default:
            return "REDACTED";
    }
}

/**
 * Check if a key should be preserved (not anonymized)
 */
export function shouldPreserveKey(key: string, preserveKeys: string[]): boolean {
    const lowerKey = key.toLowerCase();
    return preserveKeys.some(
        (preserveKey) => lowerKey === preserveKey.toLowerCase() || lowerKey.includes(preserveKey.toLowerCase()),
    );
}

/**
 * Check if a key is sensitive and should be anonymized
 */
export function isSensitiveKey(key: string, sensitiveKeys: string[]): boolean {
    const lowerKey = key.toLowerCase();
    return sensitiveKeys.some((sensitiveKey) => lowerKey.includes(sensitiveKey.toLowerCase()));
}

/**
 * Recursively anonymize data object
 */
export function anonymizeData(data: unknown, sensitiveKeys: string[], preserveKeys: string[]): unknown {
    if (Array.isArray(data)) {
        return data.map((item) => anonymizeData(item, sensitiveKeys, preserveKeys));
    }

    if (data !== null && typeof data === "object") {
        const newObj: Record<string, unknown> = {};

        for (const key in data as Record<string, unknown>) {
            if (shouldPreserveKey(key, preserveKeys)) {
                // Preserve important keys as-is
                newObj[key] = (data as Record<string, unknown>)[key];
            } else if (isSensitiveKey(key, sensitiveKeys)) {
                // Anonymize sensitive keys
                newObj[key] = generateFakeValue(key);
            } else {
                // Recursively process other objects
                newObj[key] = anonymizeData((data as Record<string, unknown>)[key], sensitiveKeys, preserveKeys);
            }
        }

        return newObj;
    }

    return data;
}
