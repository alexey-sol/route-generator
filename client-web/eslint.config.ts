import css from "@eslint/css";
import { react, vitest } from "eslint-config-canonical";
import auto from "eslint-config-canonical/auto";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import {
    baseEslintConfig,
    baseJsonConfig,
    basePrettierConfig,
} from "route-generator-util/eslint/eslint.base";

export default defineConfig([
    globalIgnores(["dist", "package-lock.json"]),
    ...auto,
    ...vitest.recommended,
    reactRefresh.configs.vite,
    ...baseEslintConfig,
    {
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                project: ["tsconfig.app.json", "tsconfig.node.json", "tsconfig.eslint.json"],
            },
        },
    },
    {
        extends: [...react.recommended],
        files: ["**/*.{jsx,tsx}"],
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        settings: {
            react: {
                version: "detect",
            },
        },
    },
    {
        extends: [css.configs.recommended],
        files: ["**/*.css"],
        language: "css/css",
        plugins: {
            css,
        },
    },
    ...baseJsonConfig,
    {
        files: ["vite.config.ts"],
        rules: {
            "import/no-cycle": "off", // this rule mysteriously breaks linter in vite.config.ts
        },
    },
    ...basePrettierConfig,
]);
