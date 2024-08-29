module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
        sourceType: "module",
        extraFileExtensions: [".json"],
    },
    plugins: ["@typescript-eslint/eslint-plugin"],
    extends: ["plugin:@typescript-eslint/recommended"],
    root: true,
    env: {
        node: true,
        jest: true,
    },
    ignorePatterns: [".eslintrc.js", "*.md"],
    rules: {
        "@typescript-eslint/require-await": "error",
    },
};
