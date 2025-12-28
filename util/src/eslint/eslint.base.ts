import eslint from "@eslint/js";
import { json, prettier, typescript } from "eslint-config-canonical";
import { defineConfig } from "eslint/config";
import { resolve } from "path";

const ESLINT_FILES = ["**/*.{js,mjs,jsx,ts,mts,tsx}"];
const ESLINT_EXTENSIONS = [".js", ".mjs", ".jsx", ".ts", ".mts", ".tsx"];

const cwd = process.cwd();

export const baseEslintConfig = defineConfig({
    ...eslint.configs.recommended,
    extends: [...typescript.recommended],
    files: ESLINT_FILES,
    rules: {
        "canonical/filename-match-exported": "off",
        "canonical/filename-match-regex": "off",
        "import/no-extraneous-dependencies": [
            "error",
            {
                devDependencies: true,
                packageDir: [resolve(cwd, ".."), resolve(cwd, ".")],
            },
        ],
        "import/no-unassigned-import": "off",
        "no-console": ["error", { allow: ["error"] }],
        "no-implicit-coercion": ["error", { allow: ["!!"] }],
        "unicorn/filename-case": ["error", { case: "kebabCase" }],
        "unicorn/prevent-abbreviations": "off",
    },
    settings: {
        "import/resolver": {
            node: {
                extensions: ESLINT_EXTENSIONS,
            },
        },
    },
});

export const baseJsonConfig = defineConfig([
    ...json.recommended,
    {
        files: ["**/*.json"],
        rules: {
            "jsonc/indent": ["error", 4],
            "jsonc/object-curly-spacing": ["error", "always"],
        },
    },
    {
        files: ["package.json", "tsconfig.json", "tsconfig.*.json"],
        rules: {
            "jsonc/sort-keys": "off",
        },
    },
    {
        files: ["tsconfig.json", "tsconfig.*.json"],
        rules: {
            "jsonc/no-comments": "off",
        },
    },
]);

export const basePrettierConfig = defineConfig({
    extends: [...prettier.recommended],
    files: ESLINT_FILES,
    rules: {
        "prettier/prettier": [
            "error",
            {
                arrowParens: "always",
                bracketSameLine: false,
                bracketSpacing: true,
                endOfLine: "lf",
                printWidth: 100,
                proseWrap: "preserve",
                quoteProps: "as-needed",
                semi: true,
                singleAttributePerLine: true,
                singleQuote: false,
                tabWidth: 4,
                trailingComma: "all",
                useTabs: false,
            },
            { usePrettierrc: false },
        ],
    },
});
