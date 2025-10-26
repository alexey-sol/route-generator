import js from "@eslint/js";
import auto from "eslint-config-canonical/auto";
import { recommended as prettier } from "eslint-config-canonical/prettier";
import { recommended as react } from "eslint-config-canonical/react";
import { recommended as typescript } from "eslint-config-canonical/typescript";
import { recommended as vitest } from "eslint-config-canonical/vitest";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
    globalIgnores(["dist"]),
    {
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactRefresh.configs.vite,
            auto,
            typescript,
            react,
            vitest,
            prettier,
        ],
        files: ["**/*.{js,jsx}", "**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2_020,
            globals: globals.browser,
            parserOptions: {
                project: ["tsconfig.app.json", "tsconfig.node.json", "tsconfig.eslint.json"],
            },
        },

        rules: {
            "prettier/prettier": [
                2,
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
        settings: {
            "import-x/resolver-next": [
                createTypeScriptImportResolver({
                    alwaysTryTypes: true,
                }),
            ],
        },
    },
]);
