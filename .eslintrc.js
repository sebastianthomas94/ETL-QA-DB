const e = require("express");

module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        // project: 'tsconfig.json',
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
};
