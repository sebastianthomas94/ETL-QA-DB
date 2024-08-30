module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
        sourceType: "module",
        extraFileExtensions: [".json"],
    },
    plugins: ["@typescript-eslint/eslint-plugin", "max-params-no-constructor"],
    extends: ["plugin:@typescript-eslint/recommended"],
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
                prefix: ["is", "has"],
                selector: "variable",
                types: ["boolean"],
            },

            {
                selector: "typeLike",
                format: ["PascalCase"],
            },
        ],
        "max-params-no-constructor/max-params-no-constructor": "error",
    },
};
