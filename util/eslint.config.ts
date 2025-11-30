import { baseEslintConfig, baseJsonConfig, basePrettierConfig } from "./src/eslint/eslint.base";
import auto from "eslint-config-canonical/auto";
import { defineConfig, globalIgnores } from "eslint/config";

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
    },
    ...baseJsonConfig,
    ...basePrettierConfig,
]);
