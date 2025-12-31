import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import auto from "eslint-config-canonical/auto";
import { defineConfig, globalIgnores } from "eslint/config";
import {
    baseEslintConfig,
    baseJsonConfig,
    basePrettierConfig,
} from "route-generator-util/eslint/eslint.base";

export default defineConfig([
    globalIgnores(["dist", "package-lock.json"]),
    ...auto,
    ...baseEslintConfig,
    {
        languageOptions: {
            parserOptions: {
                project: ["tsconfig.json", "tsconfig.eslint.json"],
            },
        },
        plugins: {
            "@typescript-eslint": typescriptPlugin,
        },
        rules: {
            "@typescript-eslint/no-extraneous-class": ["error", { allowEmpty: true }],
        },
    },
    ...baseJsonConfig,
    ...basePrettierConfig,
    // Stub JSONs are already pretty bloated, so we disable some rules to keep their size reasonable.
    {
        files: ["**/stub/*.json"],
        rules: {
            "jsonc/array-bracket-newline": "off",
            "jsonc/array-bracket-spacing": "off",
            "jsonc/array-element-newline": "off",
        },
    },
]);
