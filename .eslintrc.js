module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
        sourceType: "module",
        extraFileExtensions: [".json"],
    },
    plugins: ["@typescript-eslint/eslint-plugin", "max-params-no-constructor", "@darraghor/nestjs-typed"],
    extends: ["plugin:@typescript-eslint/recommended", "plugin:@darraghor/nestjs-typed/recommended"],
    root: true,
    env: {
        node: true,
        jest: true,
    },
    ignorePatterns: [".eslintrc.js", "*.md"],
    rules: {
        "@typescript-eslint/require-await": "error",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-unnecessary-condition": "error",
        "no-shadow": "off",
        "@typescript-eslint/no-shadow": "error",
        "@typescript-eslint/naming-convention": [
            "error",
            {
                custom: {
                    match: true,
                    regex: "^I[A-Z]",
                },
                format: ["PascalCase"],
                selector: "interface",
            },
            {
                format: ["PascalCase"],
                leadingUnderscore: "allow",
                prefix: ["is", "has", "should", "can", "did", "will"],
                selector: "variable",
                types: ["boolean"],
            },

            {
                selector: "typeLike",
                format: ["PascalCase"],
            },
        ],
        "max-params-no-constructor/max-params-no-constructor": "error",
        "@darraghor/nestjs-typed/api-method-should-specify-api-response": "off",
        "@darraghor/nestjs-typed/injectable-should-be-provided": [
            "error",
            {
                src: ["src/**/*.ts"],
                filterFromPaths: ["node_modules", ".test.", ".spec."],
            },
        ],
    },
};
