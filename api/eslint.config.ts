import eslint from "@eslint/js";
import { type Linter } from "eslint";
import auto from "eslint-config-canonical/auto";
import { recommended as prettier } from "eslint-config-canonical/prettier";
import { recommended as react } from "eslint-config-canonical/react";
import { recommended as typescript } from "eslint-config-canonical/typescript";
import { recommended as vitest } from "eslint-config-canonical/vitest";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";

export default defineConfig([
    globalIgnores(["dist"]),
    {
        extends: [
            eslint.configs.recommended,
            ...auto,
            ...typescript,
            ...react,
            ...vitest,
            ...prettier,
        ] as Linter.Config[],
        files: ["**/*.{js,jsx}", "**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2_020,
            globals: globals.browser,
            parserOptions: {
                project: ["tsconfig.json", "tsconfig.eslint.json"],
            },
        },
        rules: {
            "@typescript-eslint/no-extraneous-class": [
                "error",
                {
                    allowEmpty: true,
                },
            ],
            "canonical/filename-match-regex": "off",
            "import/no-unassigned-import": "off",
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
            "unicorn/filename-case": [
                "error",
                {
                    case: "kebabCase",
                },
            ],
            "unicorn/prevent-abbreviations": "off",
        },
        settings: {
            "import-x/resolver-next": [
                createTypeScriptImportResolver({
                    alwaysTryTypes: true,
                }),
            ],
        },
    },
]);
