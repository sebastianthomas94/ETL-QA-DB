import { faker } from "@faker-js/faker";

/**
 * Generate fake data based on the field key
 */
export function generateFakeValue(key: string): string {
    const lowerKey = key.toLowerCase().replace(/[_\s-]/g, ""); // Normalize key by removing separators

    // Find matching field type based on patterns
    for (const fieldType of Object.values(FIELD_TYPE_MAPPING)) {
        if (fieldType.patterns.some((pattern) => lowerKey.includes(pattern))) {
            return fieldType.generator();
        }
    }

    return "REDACTED";
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

const FIELD_TYPE_MAPPING = {
    // Name fields
    names: {
        patterns: ["name", "fullname", "accountname"],
        generator: () => faker.person.fullName(),
    },
    firstName: {
        patterns: ["firstname"],
        generator: () => faker.person.firstName(),
    },
    lastName: {
        patterns: ["lastname"],
        generator: () => faker.person.lastName(),
    },

    // Contact fields
    email: {
        patterns: ["email"],
        generator: () => faker.internet.email(),
    },
    phone: {
        patterns: ["phone", "phoneNumber", "mobile", "contact", "contactNumber"],
        generator: () => faker.phone.number(),
    },

    // Address fields
    address: {
        patterns: ["address", "street"],
        generator: () => faker.location.streetAddress(),
    },
    city: {
        patterns: ["city"],
        generator: () => faker.location.city(),
    },
    state: {
        patterns: ["state"],
        generator: () => faker.location.state(),
    },
    zipCode: {
        patterns: ["zip", "postal", "zipcode", "postalcode"],
        generator: () => faker.location.zipCode(),
    },

    // Financial/Identity fields
    ssn: {
        patterns: ["ssn", "social", "socialsecuritynumber"],
        generator: () =>
            `${faker.number.int({ min: 100, max: 999 })}-${faker.number.int({ min: 10, max: 99 })}-${faker.number.int({ min: 1000, max: 9999 })}`,
    },
    bankAccount: {
        patterns: ["bank", "account", "bankaccount", "accountnumber", "accountidentifier"],
        generator: () => faker.finance.accountNumber(),
    },
    creditCard: {
        patterns: ["credit", "creditcard"],
        generator: () => faker.finance.creditCardNumber(),
    },
};
